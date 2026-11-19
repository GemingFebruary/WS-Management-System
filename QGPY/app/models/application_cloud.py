"""
申请模型 - 微信云数据库版本
通过HTTP API访问微信云数据库
"""
from datetime import datetime
from app.utils.wx_cloud_db import get_wx_cloud_db


class ApplicationCloud:
    """申请模型 - 微信云数据库版"""

    COLLECTION = 'applications'

    STATUS_MAP = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已驳回',
        'cancelled': '已取消'
    }

    @classmethod
    def _wx_db(cls):
        return get_wx_cloud_db()

    @classmethod
    def find_by_id(cls, apply_id):
        """通过ID查找申请"""
        wx_db = cls._wx_db()
        # 先尝试 _id
        apps = wx_db.database_query(cls.COLLECTION, {'_id': apply_id}, limit=1)
        if apps:
            found_id = apps[0].get('_id')
            print(f"[APPLICATION] find_by_id: 通过 _id 查询找到, _id={found_id} (type={type(found_id).__name__})")
            return apps[0]
        # 再尝试 applyId 字段
        apps = wx_db.database_query(cls.COLLECTION, {'applyId': apply_id}, limit=1)
        if apps:
            found_id = apps[0].get('_id')
            print(f"[APPLICATION] find_by_id: 通过 applyId 查询找到, _id={found_id} (type={type(found_id).__name__})")
        else:
            print(f"[APPLICATION] find_by_id: 未找到 {apply_id}")
        return apps[0] if apps else None

    @classmethod
    def find_by_apply_id(cls, apply_id):
        """通过applyId查找申请（兼容 _id 和 applyId 字段）"""
        wx_db = cls._wx_db()
        # 先查 applyId 字段
        apps = wx_db.database_query(cls.COLLECTION, {'applyId': apply_id}, limit=1)
        if apps:
            print(f"[APPLICATION] find_by_apply_id: 通过 applyId 字段找到 {apply_id}")
            return apps[0]
        # 再查 _id（云函数创建的申请可能没有 applyId 字段）
        apps = wx_db.database_query(cls.COLLECTION, {'_id': apply_id}, limit=1)
        if apps:
            print(f"[APPLICATION] find_by_apply_id: 通过 _id 字段找到 {apply_id}")
        else:
            print(f"[APPLICATION] find_by_apply_id: 未找到 {apply_id}")
        return apps[0] if apps else None

    @classmethod
    def find_by_student(cls, student_id, status=None, page=1, page_size=10):
        """查找学生的申请列表"""
        wx_db = cls._wx_db()
        query = {'studentId': student_id}
        if status:
            query['status'] = status

        # 云数据库HTTP API不支持skip/sort，取足够大的limit后客户端分页
        limit = min(page * page_size, 100)
        all_apps = wx_db.database_query(cls.COLLECTION, query, limit=limit)

        # 客户端按applyTime降序排序
        all_apps.sort(key=lambda x: str(x.get('applyTime', '')), reverse=True)

        total = len(all_apps)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_apps = all_apps[start:end]

        return page_apps, total

    @classmethod
    def find_list(cls, filters=None, page=1, page_size=10):
        """查找申请列表（管理员）"""
        wx_db = cls._wx_db()
        filters = filters or {}

        # 构建查询条件（云数据库支持的简单等值匹配）
        query = {}
        if filters.get('status'):
            # 支持 $in 语法：status 为列表
            status_val = filters['status']
            if isinstance(status_val, dict) and '$in' in status_val:
                # 云数据库HTTP API不支持 $in，需要客户端过滤
                pass
            else:
                query['status'] = status_val
        if filters.get('jobId'):
            query['jobId'] = filters['jobId']
        if filters.get('studentId'):
            query['studentId'] = filters['studentId']

        # 云数据库HTTP API单次最多返回20条，取足够大的limit
        limit = min(page * page_size, 100)
        all_apps = wx_db.database_query(cls.COLLECTION, query if query else None, limit=limit)

        # 客户端处理 $in 过滤
        status_in = filters.get('status')
        if isinstance(status_in, dict) and '$in' in status_in:
            allowed = status_in['$in']
            all_apps = [a for a in all_apps if a.get('status') in allowed]

        # 客户端按applyTime降序排序
        all_apps.sort(key=lambda x: str(x.get('applyTime', '')), reverse=True)

        total = len(all_apps)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_apps = all_apps[start:end]

        return page_apps, total

    @classmethod
    def create(cls, app_data):
        """创建申请"""
        wx_db = cls._wx_db()
        now = datetime.now().isoformat()
        app_data.setdefault('applyTime', now)
        app_data.setdefault('status', 'pending')
        app_data.setdefault('statusText', '待审核')

        return wx_db.database_add(cls.COLLECTION, app_data)

    @classmethod
    def update_status(cls, apply_id, status, **kwargs):
        """更新申请状态"""
        wx_db = cls._wx_db()
        update_data = {
            'status': status,
            'statusText': cls.STATUS_MAP.get(status, status),
            'reviewTime': datetime.now().isoformat()
        }

        if 'rejectReason' in kwargs:
            update_data['rejectReason'] = kwargs['rejectReason']
        if 'reviewer' in kwargs:
            update_data['reviewer'] = kwargs['reviewer']

        # 二次查找确保拿到精确 _id
        app = cls.find_by_id(apply_id)
        if not app:
            print(f"[APPLICATION] update_status: find_by_id 未找到 {apply_id}")
            return False

        real_id = app.get('_id')
        print(f"[APPLICATION] update_status: apply_id={apply_id} (type={type(apply_id).__name__}), real_id={real_id} (type={type(real_id).__name__}), same={apply_id == real_id}")

        # 确保 _id 为字符串
        real_id_str = str(real_id)
        print(f"[APPLICATION] update_status: real_id_str={real_id_str}")

        result = wx_db.database_update(
            cls.COLLECTION,
            {'_id': real_id_str},
            update_data
        )
        print(f"[APPLICATION] update_status 结果: {result}")
        return result

    @classmethod
    def cancel(cls, apply_id):
        """取消申请"""
        wx_db = cls._wx_db()

        # 查找文档以获取精确 _id
        app = cls.find_by_id(apply_id)
        if not app:
            return False

        return wx_db.database_update(
            cls.COLLECTION,
            {'_id': app.get('_id')},
            {
                'status': 'cancelled',
                'statusText': '已取消',
                'cancelTime': datetime.now().isoformat()
            }
        )

    @classmethod
    def update(cls, apply_id, update_data):
        """更新申请"""
        wx_db = cls._wx_db()

        # 查找文档以获取精确 _id
        app = cls.find_by_id(apply_id)
        if not app:
            return False

        return wx_db.database_update(
            cls.COLLECTION,
            {'_id': app.get('_id')},
            update_data
        )

    @classmethod
    def to_dict(cls, app):
        """转换为字典"""
        if not app:
            return None

        return {
            '_id': str(app.get('_id', '')),
            'applyId': app.get('applyId'),
            'studentId': app.get('studentId'),
            'studentName': app.get('studentName'),
            'studentInfo': app.get('studentInfo'),
            'jobId': app.get('jobId'),
            'jobName': app.get('jobName'),
            'department': app.get('department'),
            'phone': app.get('phone'),
            'email': app.get('email'),
            'availableTime': app.get('availableTime'),
            'experience': app.get('experience'),
            'reason': app.get('reason'),
            'attachments': app.get('attachments'),
            'status': app.get('status'),
            'statusText': app.get('statusText'),
            'applyTime': app.get('applyTime'),
            'reviewTime': app.get('reviewTime'),
            'rejectReason': app.get('rejectReason'),
            'reviewer': app.get('reviewer')
        }
