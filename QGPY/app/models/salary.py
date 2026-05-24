"""
薪资模型
"""
from datetime import datetime
from bson import ObjectId
from .database import db


class Salary:
    """薪资模型"""
    
    COLLECTION = 'salary_records'
    
    STATUS_MAP = {
        'paid': '已发放',
        'unpaid': '待发放'
    }
    
    @classmethod
    def find_by_id(cls, record_id):
        """通过ID查找记录"""
        if isinstance(record_id, str):
            try:
                record_id = ObjectId(record_id)
            except:
                pass
        return db.salary_records.find_one({'_id': record_id})
    
    @classmethod
    def find_by_student(cls, student_id, month=None, page=1, page_size=10):
        """查找学生的薪资记录"""
        query = {'studentId': student_id}
        if month:
            query['month'] = month
        
        skip = (page - 1) * page_size
        cursor = db.salary_records.find(query).sort('workDate', -1).skip(skip).limit(page_size)
        total = db.salary_records.count_documents(query)
        
        # 计算统计
        pipeline = [
            {'$match': query},
            {'$group': {
                '_id': None,
                'totalAmount': {'$sum': '$amount'},
                'totalHours': {'$sum': '$workHours'}
            }}
        ]
        stats = list(db.salary_records.aggregate(pipeline))
        
        stats_data = stats[0] if stats else {'totalAmount': 0, 'totalHours': 0}
        
        return list(cursor), total, stats_data
    
    @classmethod
    def find_list(cls, filters=None, page=1, page_size=10):
        """查找薪资列表（管理员）"""
        query = filters or {}
        
        skip = (page - 1) * page_size
        cursor = db.salary_records.find(query).sort('createTime', -1).skip(skip).limit(page_size)
        total = db.salary_records.count_documents(query)
        
        return list(cursor), total
    
    @classmethod
    def create(cls, record_data):
        """创建薪资记录"""
        now = datetime.now()
        record_data.setdefault('createTime', now)
        record_data.setdefault('payStatus', 'unpaid')
        record_data.setdefault('payStatusText', '待发放')
        
        # 自动计算金额
        if 'workHours' in record_data and 'hourlyRate' in record_data:
            record_data['amount'] = record_data['workHours'] * record_data['hourlyRate']
        
        result = db.salary_records.insert_one(record_data)
        return result.inserted_id
    
    @classmethod
    def pay(cls, record_ids, month=None):
        """发放薪资"""
        query = {}
        if record_ids:
            object_ids = []
            for rid in record_ids:
                if isinstance(rid, str):
                    try:
                        object_ids.append(ObjectId(rid))
                    except:
                        pass
                else:
                    object_ids.append(rid)
            query['_id'] = {'$in': object_ids}
        if month:
            query['month'] = month
        
        return db.salary_records.update_many(
            query,
            {'$set': {
                'payStatus': 'paid',
                'payStatusText': '已发放',
                'payDate': datetime.now()
            }}
        )
    
    @classmethod
    def get_month_summary(cls, student_id, month):
        """获取月度汇总"""
        query = {'studentId': student_id, 'month': month}
        
        pipeline = [
            {'$match': query},
            {'$group': {
                '_id': None,
                'shouldPay': {'$sum': '$amount'},
                'workHours': {'$sum': '$workHours'},
                'paidCount': {'$sum': {'$cond': [{'$eq': ['$payStatus', 'paid']}, 1, 0]}},
                'totalCount': {'$sum': 1}
            }}
        ]
        
        result = list(db.salary_records.aggregate(pipeline))
        
        if not result:
            return {
                'shouldPay': 0,
                'actualPay': 0,
                'workHours': 0,
                'payStatus': 'unpaid',
                'payStatusText': '待发放'
            }
        
        data = result[0]
        
        # 计算实际发放金额
        paid_pipeline = [
            {'$match': {**query, 'payStatus': 'paid'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]
        paid_result = list(db.salary_records.aggregate(paid_pipeline))
        actual_pay = paid_result[0]['total'] if paid_result else 0
        
        all_paid = data['paidCount'] == data['totalCount'] and data['totalCount'] > 0
        
        return {
            'shouldPay': data['shouldPay'],
            'actualPay': actual_pay,
            'workHours': data['workHours'],
            'payStatus': 'paid' if all_paid else 'unpaid',
            'payStatusText': '已发放' if all_paid else '待发放'
        }
    
    @classmethod
    def to_dict(cls, record):
        """转换为字典"""
        if not record:
            return None
        
        return {
            '_id': str(record.get('_id')),
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
