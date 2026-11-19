"""
薪资模型 - 微信云数据库版本
通过HTTP API访问微信云数据库
"""
from datetime import datetime
from app.utils.wx_cloud_db import get_wx_cloud_db


class SalaryCloud:
    """薪资模型 - 微信云数据库版"""

    COLLECTION = 'salary_records'

    STATUS_MAP = {
        'paid': '已发放',
        'unpaid': '待发放'
    }

    @classmethod
    def _wx_db(cls):
        return get_wx_cloud_db()

    @classmethod
    def find_by_id(cls, record_id):
        """通过ID查找记录"""
        wx_db = cls._wx_db()
        # 先尝试 _id
        records = wx_db.database_query(cls.COLLECTION, {'_id': record_id}, limit=1)
        if records:
            return records[0]
        # 再尝试 recordId 字段
        records = wx_db.database_query(cls.COLLECTION, {'recordId': record_id}, limit=1)
        return records[0] if records else None

    @classmethod
    def find_by_student(cls, student_id, month=None, page=1, page_size=10):
        """查找学生的薪资记录"""
        wx_db = cls._wx_db()
        query = {'studentId': student_id}
        if month:
            query['month'] = month

        # 云数据库HTTP API不支持skip/sort/aggregate，取足够大的limit后客户端处理
        limit = min(page * page_size, 100)
        all_records = wx_db.database_query(cls.COLLECTION, query, limit=limit)

        # 客户端按workDate降序排序
        all_records.sort(key=lambda x: str(x.get('workDate', '')), reverse=True)

        total = len(all_records)

        # 客户端计算统计（替代MongoDB aggregate）
        total_amount = sum(r.get('amount', 0) for r in all_records)
        total_hours = sum(r.get('workHours', 0) for r in all_records)
        stats_data = {'totalAmount': total_amount, 'totalHours': total_hours}

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_records = all_records[start:end]

        return page_records, total, stats_data

    @classmethod
    def find_list(cls, filters=None, page=1, page_size=10):
        """查找薪资列表（管理员）"""
        wx_db = cls._wx_db()
        filters = filters or {}

        # 构建查询条件
        query = {}
        if filters.get('month'):
            query['month'] = filters['month']
        if filters.get('studentId'):
            query['studentId'] = filters['studentId']
        if filters.get('payStatus'):
            query['payStatus'] = filters['payStatus']

        # 云数据库HTTP API单次最多返回20条，取足够大的limit
        limit = min(page * page_size, 100)
        all_records = wx_db.database_query(cls.COLLECTION, query if query else None, limit=limit)

        # 客户端按createTime降序排序
        all_records.sort(key=lambda x: str(x.get('createTime', '')), reverse=True)

        total = len(all_records)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_records = all_records[start:end]

        return page_records, total

    @classmethod
    def create(cls, record_data):
        """创建薪资记录"""
        wx_db = cls._wx_db()
        now = datetime.now().isoformat()
        record_data.setdefault('createTime', now)
        record_data.setdefault('payStatus', 'unpaid')
        record_data.setdefault('payStatusText', '待发放')

        # 自动计算金额
        if 'workHours' in record_data and 'hourlyRate' in record_data:
            record_data['amount'] = record_data['workHours'] * record_data['hourlyRate']

        return wx_db.database_add(cls.COLLECTION, record_data)

    @classmethod
    def update(cls, record_id, update_data):
        """更新薪资记录（白名单模式）"""
        wx_db = cls._wx_db()
        allowed = {'workDate', 'workHours', 'hourlyRate', 'jobName', 'remark'}
        safe_data = {k: v for k, v in update_data.items() if k in allowed}
        if not safe_data:
            return None
        # 查找记录以获取精确 _id
        record = cls.find_by_id(record_id)
        if not record:
            return None
        # 重算金额和月份
        hours = float(safe_data.get('workHours', record.get('workHours', 0)))
        rate = float(safe_data.get('hourlyRate', record.get('hourlyRate', 0)))
        safe_data['amount'] = round(hours * rate, 2)
        safe_data['workHours'] = hours
        safe_data['hourlyRate'] = rate
        if 'workDate' in safe_data:
            safe_data['month'] = safe_data['workDate'][:7]
        safe_data['updateTime'] = datetime.now().isoformat()
        return wx_db.database_update(cls.COLLECTION, {'_id': record.get('_id')}, safe_data)

    @classmethod
    def delete(cls, record_id):
        """删除薪资记录"""
        wx_db = cls._wx_db()
        return wx_db.database_delete(cls.COLLECTION, {'_id': record_id})

    @classmethod
    def pay(cls, record_ids, month=None):
        """发放薪资"""
        wx_db = cls._wx_db()
        paid_time = datetime.now().isoformat()

        if record_ids:
            # 按记录ID逐个更新
            updated = 0
            for rid in record_ids:
                record = cls.find_by_id(rid)
                if record:
                    result = wx_db.database_update(
                        cls.COLLECTION,
                        {'_id': record.get('_id')},
                        {
                            'payStatus': 'paid',
                            'payStatusText': '已发放',
                            'payDate': paid_time
                        }
                    )
                    if result:
                        updated += 1
            return {'modified_count': updated}
        elif month:
            # 按月份查找并逐个更新
            records, _, _ = cls.find_by_student_all(month)
            updated = 0
            for record in records:
                if record.get('payStatus') != 'paid':
                    result = wx_db.database_update(
                        cls.COLLECTION,
                        {'_id': record.get('_id')},
                        {
                            'payStatus': 'paid',
                            'payStatusText': '已发放',
                            'payDate': paid_time
                        }
                    )
                    if result:
                        updated += 1
            return {'modified_count': updated}
        return {'modified_count': 0}

    @classmethod
    def find_by_student_all(cls, month=None):
        """查找所有薪资记录（按月份，不分页）"""
        wx_db = cls._wx_db()
        query = {}
        if month:
            query['month'] = month

        all_records = wx_db.database_query(cls.COLLECTION, query if query else None, limit=100)
        all_records.sort(key=lambda x: str(x.get('createTime', '')), reverse=True)

        total = len(all_records)
        return all_records, total, {}

    @classmethod
    def get_month_summary(cls, student_id, month):
        """获取月度汇总"""
        wx_db = cls._wx_db()
        query = {'studentId': student_id, 'month': month}

        # 查询该学生该月所有记录
        all_records = wx_db.database_query(cls.COLLECTION, query, limit=100)

        if not all_records:
            return {
                'shouldPay': 0,
                'actualPay': 0,
                'workHours': 0,
                'payStatus': 'unpaid',
                'payStatusText': '待发放'
            }

        # 客户端计算汇总（替代MongoDB aggregate）
        should_pay = sum(r.get('amount', 0) for r in all_records)
        work_hours = sum(r.get('workHours', 0) for r in all_records)
        paid_count = sum(1 for r in all_records if r.get('payStatus') == 'paid')
        total_count = len(all_records)

        # 计算实际发放金额
        actual_pay = sum(r.get('amount', 0) for r in all_records if r.get('payStatus') == 'paid')

        all_paid = paid_count == total_count and total_count > 0

        return {
            'shouldPay': should_pay,
            'actualPay': actual_pay,
            'workHours': work_hours,
            'payStatus': 'paid' if all_paid else 'unpaid',
            'payStatusText': '已发放' if all_paid else '待发放'
        }

    @classmethod
    def query_summary(cls, student_id):
        """获取薪资汇总（总薪资、总时长、月数）"""
        wx_db = cls._wx_db()
        all_records = wx_db.database_query(cls.COLLECTION, {'studentId': student_id}, limit=100)

        total_amount = sum(r.get('amount', 0) for r in all_records)
        total_hours = sum(r.get('workHours', 0) for r in all_records)
        months = set(r.get('month', '') for r in all_records if r.get('month'))

        return {
            'totalAmount': total_amount,
            'totalHours': total_hours,
            'monthCount': len(months)
        }

    @classmethod
    def to_dict(cls, record):
        """转换为字典"""
        if not record:
            return None

        return {
            '_id': str(record.get('_id', '')),
            'recordId': record.get('recordId'),
            'studentId': record.get('studentId'),
            'jobId': record.get('jobId'),
            'jobName': record.get('jobName'),
            'workDate': record.get('workDate'),
            'workHours': record.get('workHours'),
            'hourlyRate': record.get('hourlyRate'),
            'amount': record.get('amount'),
            'month': record.get('month'),
            'payStatus': record.get('payStatus'),
            'payStatusText': record.get('payStatusText'),
            'payDate': record.get('payDate'),
            'remark': record.get('remark'),
            'createTime': record.get('createTime')
        }
