"""
岗位模型
"""
from datetime import datetime
from bson import ObjectId
from .database import db


class Job:
    """岗位模型"""
    
    COLLECTION = 'jobs'
    
    @classmethod
    def find_by_id(cls, job_id):
        """通过ID查找岗位"""
        if isinstance(job_id, str):
            try:
                job_id = ObjectId(job_id)
            except:
                pass
        return db.jobs.find_one({'_id': job_id})
    
    @classmethod
    def find_by_job_id(cls, job_id):
        """通过jobId查找岗位（兼容 _id 和 jobId 两种格式）"""
        if not job_id:
            return None
        # 先查 jobId 字段
        result = db.jobs.find_one({'jobId': job_id})
        if result:
            return result
        # 再查 _id 字段
        return cls.find_by_id(job_id)
    
    @classmethod
    def find_list(cls, filters=None, sort_by=None, page=1, page_size=10):
        """查找岗位列表"""
        filters = filters or {}
        
        # 构建查询条件
        query = {}
        if filters.get('keyword'):
            query['$or'] = [
                {'jobName': {'$regex': filters['keyword'], '$options': 'i'}},
                {'department': {'$regex': filters['keyword'], '$options': 'i'}}
            ]
        if filters.get('jobType'):
            query['jobType'] = filters['jobType']
        if filters.get('department'):
            query['department'] = filters['department']
        if filters.get('status'):
            query['status'] = filters['status']
        
        # 排序
        sort_field = 'publishDate'
        sort_order = -1
        if sort_by == 'salary':
            sort_field = 'salary'
            sort_order = -1
        elif sort_by == 'match':
            sort_field = 'matchScore'
            sort_order = -1
        
        # 分页
        skip = (page - 1) * page_size
        cursor = db.jobs.find(query).sort(sort_field, sort_order).skip(skip).limit(page_size)
        
        total = db.jobs.count_documents(query)
        
        return list(cursor), total
    
    @classmethod
    def create(cls, job_data):
        """创建岗位"""
        now = datetime.now()
        job_data.setdefault('createTime', now)
        job_data.setdefault('updateTime', now)
        job_data.setdefault('status', 'recruiting')
        job_data.setdefault('statusText', '招聘中')
        
        result = db.jobs.insert_one(job_data)
        return result.inserted_id
    
    @classmethod
    def update(cls, job_id, update_data):
        """更新岗位"""
        update_data['updateTime'] = datetime.now()
        
        if isinstance(job_id, str):
            try:
                job_id = ObjectId(job_id)
            except:
                pass
        
        return db.jobs.update_one(
            {'_id': job_id},
            {'$set': update_data}
        )
    
    @classmethod
    def delete(cls, job_id):
        """删除岗位"""
        if isinstance(job_id, str):
            try:
                job_id = ObjectId(job_id)
            except:
                pass
        
        return db.jobs.delete_one({'_id': job_id})
    
    @classmethod
    def to_dict(cls, job):
        """转换为字典"""
        if not job:
            return None
        
        result = {
            '_id': str(job.get('_id')),
            'jobId': job.get('jobId') or str(job.get('_id')),
            'jobName': job.get('jobName'),
            'department': job.get('department'),
            'jobType': job.get('jobType'),
            'workTime': job.get('workTime'),
            'salary': job.get('salary'),
            'recruitNum': job.get('recruitNum'),
            'status': job.get('status'),
            'statusText': job.get('statusText'),
            'publishDate': job.get('publishDate'),
            'requirement': job.get('requirement'),
            'jobContent': job.get('jobContent'),
            'requiredMajor': job.get('requiredMajor'),
            'requiredGrade': job.get('requiredGrade'),
            'minGpa': job.get('minGpa'),
            'contactPerson': job.get('contactPerson'),
            'contactPhone': job.get('contactPhone'),
            'contactEmail': job.get('contactEmail'),
            'createTime': job.get('createTime'),
            'updateTime': job.get('updateTime')
        }
        
        return result
