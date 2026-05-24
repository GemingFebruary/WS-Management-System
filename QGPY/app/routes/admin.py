"""
管理后台路由模块
"""
from flask import Blueprint, request, g
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.salary import Salary
from app.utils import success, error, bad_request, admin_required
from app.utils.helpers import generate_id

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """
    获取统计数据（管理员）
    
    返回:
    - jobCount: 岗位总数
    - pendingCount: 待审核申请数
    - studentCount: 学生总数
    - totalSalary: 本月发放薪资
    """
    try:
        from datetime import datetime
        
        current_month = datetime.now().strftime('%Y-%m')
        
        # 岗位总数
        job_count = Job.find_list({}, None, 1, 1)[1]
        
        # 待审核申请数
        pending_count = Application.find_list({'status': 'pending'}, 1, 1)[1]
        
        # 学生总数
        from app.models.database import db
        student_count = db.users.count_documents({'role': 'student'})
        
        # 本月已发放薪资
        paid_pipeline = [
            {'$match': {'month': current_month, 'payStatus': 'paid'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]
        paid_result = list(db.salary_records.aggregate(paid_pipeline))
        total_salary = paid_result[0]['total'] if paid_result else 0
        
        return success({
            'jobCount': job_count,
            'pendingCount': pending_count,
            'studentCount': student_count,
            'totalSalary': total_salary
        })
    except Exception as e:
        return error(500, f'获取统计数据失败: {str(e)}')


@admin_bp.route('/student-list', methods=['GET'])
@admin_required
def get_student_list():
    """
    获取学生列表（管理员）
    
    查询参数:
    - keyword: 关键词搜索
    - pageNum: 页码
    - pageSize: 每页数量
    """
    keyword = request.args.get('keyword')
    page = int(request.args.get('pageNum', 1))
    page_size = int(request.args.get('pageSize', 20))
    
    try:
        from app.models.database import db
        
        query = {'role': 'student'}
        
        if keyword:
            query['$or'] = [
                {'name': {'$regex': keyword, '$options': 'i'}},
                {'studentId': {'$regex': keyword, '$options': 'i'}},
                {'college': {'$regex': keyword, '$options': 'i'}}
            ]
        
        skip = (page - 1) * page_size
        cursor = db.users.find(query).skip(skip).limit(page_size)
        total = db.users.count_documents(query)
        
        students = [User.to_dict(s) for s in cursor]
        
        return success({
            'total': total,
            'list': students
        })
    except Exception as e:
        return error(500, f'获取学生列表失败: {str(e)}')


@admin_bp.route('/update-student', methods=['PUT'])
@admin_required
def update_student():
    """
    更新学生信息（管理员）
    
    请求参数:
    - userId: 学生ID
    - 其他可更新字段
    """
    data = request.get_json()
    
    if not data or not data.get('userId'):
        return bad_request('学生ID不能为空')
    
    user_id = data.get('userId')
    
    try:
        user = User.find_by_id(user_id)
        if not user:
            return error(404, '学生不存在')
        
        # 构建更新数据
        update_data = {}
        updatable_fields = [
            'name', 'gender', 'college', 'major', 'grade',
            'phone', 'email', 'familyType', 'familyDesc',
            'gpa', 'freeTime', 'skills', 'experience', 'status'
        ]
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return bad_request('没有可更新的字段')
        
        User.update(user_id, update_data)
        
        return success(None, '学生信息更新成功')
    except Exception as e:
        return error(500, f'更新学生信息失败: {str(e)}')


@admin_bp.route('/export-data', methods=['GET'])
@admin_required
def export_data():
    """
    导出数据（管理员）
    
    查询参数:
    - type: 导出类型（applications/students/salary）
    """
    export_type = request.args.get('type', 'applications')
    
    try:
        data = []
        
        if export_type == 'applications':
            apps, _ = Application.find_list({}, 1, 1000)
            data = [Application.to_dict(a) for a in apps]
        elif export_type == 'students':
            from app.models.database import db
            students = db.users.find({'role': 'student'})
            data = [User.to_dict(s) for s in students]
        elif export_type == 'salary':
            records, _ = Salary.find_list({}, 1, 1000)
            data = [Salary.to_dict(r) for r in records]
        else:
            return bad_request('无效的导出类型')
        
        return success({
            'type': export_type,
            'count': len(data),
            'data': data
        })
    except Exception as e:
        return error(500, f'导出数据失败: {str(e)}')
