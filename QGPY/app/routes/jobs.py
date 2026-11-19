"""
岗位路由模块 - 使用微信云数据库
"""
from datetime import datetime
from flask import Blueprint, request, g
from app.models.job_cloud import JobCloud as Job
from app.models.user_cloud import UserCloud as User
from app.utils import success, error, bad_request, login_required, admin_required
from app.utils.helpers import generate_id, calculate_match_score, get_status_text

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('/list', methods=['GET'])
def get_job_list():
    """
    获取岗位列表
    
    查询参数:
    - keyword: 关键词搜索
    - jobType: 岗位类型
    - department: 部门
    - status: 状态
    - sortBy: 排序方式（publishDate/salary/match）
    - pageNum: 页码
    - pageSize: 每页数量
    """
    # 获取查询参数
    filters = {
        'keyword': request.args.get('keyword'),
        'jobType': request.args.get('jobType'),
        'department': request.args.get('department'),
        'status': request.args.get('status', 'recruiting')
    }
    
    # 移除空值
    filters = {k: v for k, v in filters.items() if v}
    
    sort_by = request.args.get('sortBy', 'publishDate')
    page = int(request.args.get('pageNum', 1))
    page_size = int(request.args.get('pageSize', 10))
    
    try:
        jobs, total = Job.find_list(filters, sort_by, page, page_size)
        
        # 转换为字典列表
        job_list = [Job.to_dict(job) for job in jobs]
        
        # 如果用户已登录，计算匹配度
        auth_header = request.headers.get('Authorization')
        if auth_header and sort_by == 'match':
            user_id = getattr(g, 'user_id', None)
            user = User.find_by_id(user_id) if user_id else None
            if user:
                for job in job_list:
                    job['matchScore'] = calculate_match_score(user, job)
            else:
                for job in job_list:
                    job['matchScore'] = 0
        
        return success({
            'total': total,
            'list': job_list
        })
    except Exception as e:
        return error(500, f'获取岗位列表失败: {str(e)}')


@jobs_bp.route('/detail', methods=['GET'])
def get_job_detail():
    """
    获取岗位详情
    
    查询参数:
    - jobId: 岗位ID
    """
    job_id = request.args.get('jobId')
    
    if not job_id:
        return bad_request('岗位ID不能为空')
    
    try:
        job = Job.find_by_job_id(job_id)
        
        if not job:
            return error(404, '岗位不存在')
        
        job_dict = Job.to_dict(job)
        
        # 如果用户已登录，计算匹配度
        auth_header = request.headers.get('Authorization')
        if auth_header:
            user_id = getattr(g, 'user_id', None)
            user = User.find_by_id(user_id) if user_id else None
            if user:
                job_dict['matchScore'] = calculate_match_score(user, job)
            else:
                job_dict['matchScore'] = 0
        
        return success(job_dict)
    except Exception as e:
        return error(500, f'获取岗位详情失败: {str(e)}')


@jobs_bp.route('/recommend', methods=['GET'])
def get_recommend_jobs():
    """
    获取推荐岗位
    未登录时返回最新招聘中的岗位（无匹配度）
    """
    try:
        # 获取招聘中的岗位
        jobs, total = Job.find_list({'status': 'recruiting'}, 'publishDate', 1, 20)

        job_list = []
        for job in jobs:
            job_dict = Job.to_dict(job)
            job_list.append(job_dict)

        # 如果用户已登录，计算匹配度并按匹配度排序
        user_id = getattr(g, 'user_id', None)
        if user_id:
            user = User.find_by_id(user_id)
            if user and user.get('role') == 'student':
                for job_dict in job_list:
                    job_dict['matchScore'] = calculate_match_score(user, job_dict)
                job_list.sort(key=lambda x: x.get('matchScore', 0), reverse=True)

        return success({
            'total': len(job_list[:10]),
            'list': job_list[:10]
        })
    except Exception as e:
        return error(500, f'获取推荐岗位失败: {str(e)}')


@jobs_bp.route('/create', methods=['POST'])
@admin_required
def create_job():
    """
    创建岗位（管理员）
    
    请求参数:
    - jobName: 岗位名称
    - department: 部门
    - workTime: 工作时间
    - salary: 薪资
    - jobType: 岗位类型
    - recruitNum: 招聘人数
    - requirement: 岗位要求
    - jobContent: 工作内容
    - requiredMajor: 要求专业
    - requiredGrade: 要求年级
    - minGpa: 最低GPA
    - contactPerson: 联系人
    - contactPhone: 联系电话
    - contactEmail: 联系邮箱
    """
    data = request.get_json()
    
    if not data:
        return bad_request('请求参数不能为空')
    
    # 必填字段
    required_fields = ['jobName', 'department', 'workTime', 'salary']
    for field in required_fields:
        if not data.get(field):
            return bad_request(f'{field}为必填项')
    
    try:
        # 生成岗位ID
        job_id = generate_id('JOB')
        
        job_data = {
            'jobId': job_id,
            'jobName': data.get('jobName'),
            'department': data.get('department'),
            'workTime': data.get('workTime'),
            'salary': float(data.get('salary')),
            'jobType': data.get('jobType', '校内'),
            'recruitNum': int(data.get('recruitNum', 1)),
            'requirement': data.get('requirement', ''),
            'jobContent': data.get('jobContent', ''),
            'requiredMajor': data.get('requiredMajor', ''),
            'requiredGrade': data.get('requiredGrade', ''),
            'minGpa': float(data.get('minGpa', 0)) if data.get('minGpa') else None,
            'contactPerson': data.get('contactPerson', ''),
            'contactPhone': data.get('contactPhone', ''),
            'contactEmail': data.get('contactEmail', ''),
            'publishDate': datetime.now().strftime('%Y-%m-%d'),
            'createdBy': g.user_id
        }
        
        Job.create(job_data)
        
        return success({'jobId': job_id}, '岗位创建成功')
    except Exception as e:
        return error(500, f'创建岗位失败: {str(e)}')


@jobs_bp.route('/update', methods=['PUT'])
@admin_required
def update_job():
    """
    更新岗位（管理员）
    
    请求参数:
    - jobId: 岗位ID
    - 其他可更新字段
    """
    data = request.get_json()
    
    if not data or not data.get('jobId'):
        return bad_request('岗位ID不能为空')
    
    job_id = data.get('jobId')
    
    try:
        job = Job.find_by_job_id(job_id)
        if not job:
            return error(404, '岗位不存在')
        
        # 构建更新数据
        update_data = {}
        updatable_fields = [
            'jobName', 'department', 'workTime', 'salary', 'jobType',
            'recruitNum', 'requirement', 'jobContent', 'requiredMajor',
            'requiredGrade', 'minGpa', 'contactPerson', 'contactPhone', 'contactEmail'
        ]
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return bad_request('没有可更新的字段')
        
        Job.update(job['_id'], update_data)
        
        return success(None, '岗位更新成功')
    except Exception as e:
        return error(500, f'更新岗位失败: {str(e)}')


@jobs_bp.route('/delete', methods=['DELETE'])
@admin_required
def delete_job():
    """
    删除岗位（管理员）
    
    查询参数:
    - jobId: 岗位ID
    """
    job_id = request.args.get('jobId')
    
    if not job_id:
        return bad_request('岗位ID不能为空')
    
    try:
        job = Job.find_by_job_id(job_id)
        if not job:
            return error(404, '岗位不存在')
        
        Job.delete(job['_id'])
        
        return success(None, '岗位删除成功')
    except Exception as e:
        return error(500, f'删除岗位失败: {str(e)}')


@jobs_bp.route('/toggle-status', methods=['PUT'])
@admin_required
def toggle_job_status():
    """
    切换岗位状态（管理员）
    
    请求参数:
    - jobId: 岗位ID
    - status: 新状态
    """
    data = request.get_json()
    
    if not data or not data.get('jobId') or not data.get('status'):
        return bad_request('岗位ID和状态不能为空')
    
    job_id = data.get('jobId')
    status = data.get('status')
    
    try:
        job = Job.find_by_job_id(job_id)
        if not job:
            return error(404, '岗位不存在')
        
        update_data = {
            'status': status,
            'statusText': get_status_text(status, 'job')
        }
        
        Job.update(job['_id'], update_data)
        
        return success(None, '状态更新成功')
    except Exception as e:
        return error(500, f'更新状态失败: {str(e)}')
