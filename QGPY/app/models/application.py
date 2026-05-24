"""
申请模型
"""
from datetime import datetime
from bson import ObjectId
from .database import db


class Application:
    """申请模型"""
    
    COLLECTION = 'applications'
    
    STATUS_MAP = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已驳回',
        'cancelled': '已取消'
    }
    
    @classmethod
    def find_by_id(cls, apply_id):
        """通过ID查找申请"""
        if isinstance(apply_id, str):
            try:
                apply_id = ObjectId(apply_id)
            except:
                pass
        return db.applications.find_one({'_id': apply_id})
    
    @classmethod
    def find_by_apply_id(cls, apply_id):
        """通过applyId查找申请"""
        return db.applications.find_one({'applyId': apply_id})
    
    @classmethod
    def find_by_student(cls, student_id, status=None, page=1, page_size=10):
        """查找学生的申请列表"""
        query = {'studentId': student_id}
        if status:
            query['status'] = status
        
        skip = (page - 1) * page_size
        cursor = db.applications.find(query).sort('applyTime', -1).skip(skip).limit(page_size)
        total = db.applications.count_documents(query)
        
        return list(cursor), total
    
    @classmethod
    def find_list(cls, filters=None, page=1, page_size=10):
        """查找申请列表（管理员）"""
        query = filters or {}
        
        skip = (page - 1) * page_size
        cursor = db.applications.find(query).sort('applyTime', -1).skip(skip).limit(page_size)
        total = db.applications.count_documents(query)
        
        return list(cursor), total
    
    @classmethod
    def create(cls, app_data):
        """创建申请"""
        now = datetime.now()
        app_data.setdefault('applyTime', now)
        app_data.setdefault('status', 'pending')
        app_data.setdefault('statusText', '待审核')
        
        result = db.applications.insert_one(app_data)
        return result.inserted_id
    
    @classmethod
    def update_status(cls, apply_id, status, **kwargs):
        """更新申请状态"""
        update_data = {
            'status': status,
            'statusText': cls.STATUS_MAP.get(status, status),
            'reviewTime': datetime.now()
        }
        
        # 添加其他字段
        if 'rejectReason' in kwargs:
            update_data['rejectReason'] = kwargs['rejectReason']
        if 'reviewer' in kwargs:
            update_data['reviewer'] = kwargs['reviewer']
        
        if isinstance(apply_id, str):
            try:
                apply_id = ObjectId(apply_id)
            except:
                pass
        
        return db.applications.update_one(
            {'_id': apply_id},
            {'$set': update_data}
        )
    
    @classmethod
    def cancel(cls, apply_id):
        """取消申请"""
        if isinstance(apply_id, str):
            try:
                apply_id = ObjectId(apply_id)
            except:
                pass
        
        return db.applications.update_one(
            {'_id': apply_id},
            {'$set': {
                'status': 'cancelled',
                'statusText': '已取消',
                'cancelTime': datetime.now()
            }}
        )
    
    @classmethod
    def to_dict(cls, app):
        """转换为字典"""
        if not app:
            return None
        
        return {
            '_id': str(app.get('_id')),
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
