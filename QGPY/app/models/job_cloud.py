"""
岗位模型 - 微信云数据库版本
通过HTTP API访问微信云数据库
"""
from datetime import datetime
from app.utils.wx_cloud_db import get_wx_cloud_db


class JobCloud:
    """岗位模型 - 微信云数据库版"""

    COLLECTION = 'jobs'

    @classmethod
    def _wx_db(cls):
        return get_wx_cloud_db()

    @classmethod
    def find_by_id(cls, job_id):
        """通过 _id 或 jobId 查找岗位"""
        wx_db = cls._wx_db()
        # 先尝试 _id
        jobs = wx_db.database_query(cls.COLLECTION, {'_id': job_id}, limit=1)
        if jobs:
            return jobs[0]
        # 再尝试 jobId 字段
        jobs = wx_db.database_query(cls.COLLECTION, {'jobId': job_id}, limit=1)
        return jobs[0] if jobs else None

    @classmethod
    def find_by_job_id(cls, job_id):
        """通过 jobId 查找岗位（兼容 _id）"""
        return cls.find_by_id(job_id)

    @classmethod
    def find_list(cls, filters=None, sort_by=None, page=1, page_size=10):
        """查找岗位列表"""
        wx_db = cls._wx_db()
        filters = filters or {}

        # 构建查询条件
        query = {}
        if filters.get('jobType'):
            query['jobType'] = filters['jobType']
        if filters.get('department'):
            query['department'] = filters['department']
        if filters.get('status'):
            query['status'] = filters['status']
        # keyword 搜索需要正则，云数据库 HTTP API 不直接支持 $or 正则
        # 暂用 jobName 精确匹配或不传 keyword

        # 云数据库 HTTP API 单次最多返回 20 条，取足够大的 limit
        limit = min(page * page_size, 100)
        all_jobs = wx_db.database_query(cls.COLLECTION, query if query else None, limit=limit)

        # keyword 客户端过滤
        keyword = filters.get('keyword', '')
        if keyword:
            keyword_lower = keyword.lower()
            all_jobs = [j for j in all_jobs if
                        keyword_lower in (j.get('jobName', '')).lower() or
                        keyword_lower in (j.get('department', '')).lower() or
                        keyword_lower in (j.get('jobContent', '')).lower()]

        # 排序
        reverse = True
        if sort_by == 'salary':
            all_jobs.sort(key=lambda x: x.get('salary', 0), reverse=True)
        elif sort_by == 'recruitNum':
            all_jobs.sort(key=lambda x: x.get('recruitNum', 0), reverse=True)
        else:  # publishDate
            all_jobs.sort(key=lambda x: str(x.get('publishDate', '')), reverse=True)

        total = len(all_jobs)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_jobs = all_jobs[start:end]

        return page_jobs, total

    @classmethod
    def create(cls, job_data):
        """创建岗位"""
        wx_db = cls._wx_db()
        now = datetime.now().isoformat()
        job_data.setdefault('createTime', now)
        job_data.setdefault('updateTime', now)
        job_data.setdefault('status', 'recruiting')
        return wx_db.database_add(cls.COLLECTION, job_data)

    @classmethod
    def update(cls, job_id, update_data):
        """更新岗位"""
        wx_db = cls._wx_db()
        update_data['updateTime'] = datetime.now().isoformat()
        # 先查到文档的 _id
        job = cls.find_by_id(job_id)
        if not job:
            return None
        # 用 _id 作为查询条件（云数据库更新需要精确匹配）
        return wx_db.database_update(
            cls.COLLECTION,
            {'_id': job.get('_id')},
            update_data
        )

    @classmethod
    def delete(cls, job_id):
        """删除岗位（云数据库 HTTP API 不直接支持删除，标记为 closed）"""
        return cls.update(job_id, {'status': 'closed'})

    @classmethod
    def to_dict(cls, job):
        """转换为字典"""
        if not job:
            return None

        return {
            '_id': str(job.get('_id', '')),
            'jobId': job.get('jobId') or str(job.get('_id', '')),
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
            'updateTime': job.get('updateTime'),
            'matchScore': job.get('matchScore', 0)
        }
