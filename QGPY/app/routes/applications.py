"""
申请路由模块
"""
from flask import Blueprint, request, g
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.utils import success, error, bad_request, login_required, admin_required, student_required
from app.utils.helpers import generate_id

applications_bp = Blueprint('applications', __name__)


@applications_bp.route('/submit', methods=['POST'])
@login_required
def submit_application():
    """
    提交申请
    
    请求参数:
    - jobId: 岗位ID
    - reason: 申请理由
    - phone: 手机号
    - email: 邮箱
    - availableTime: 可工作时间
    - experience: 相关经验
    - attachments: 附件列表
    """
    data = request.get_json()
    
    if not data:
        return bad_request('请求参数不能为空')
    
    job_id = data.get('jobId')
    if not job_id:
        return bad_request('岗位ID不能为空')
    
    # 检查岗位是否存在
    job = Job.find_by_job_id(job_id)
    if not job:
        return error(404, '岗位不存在')
    
    # 检查是否已申请过
    existing = Application.find_list({
        'studentId': g.user_id,
        'jobId': job_id,
        'status': {'$in': ['pending', 'approved']}
    }, 1, 1)
    
    if existing[0]:
        return error(400, '您已申请过该岗位')
    
    # 获取用户信息
    user = User.find_by_id(g.user_id)
    if not user:
        return error(404, '用户不存在')
    
    try:
        # 生成申请ID
        apply_id = generate_id('APP')
        
        app_data = {
            'applyId': apply_id,
            'studentId': g.user_id,
            'studentName': user.get('name'),
            'studentInfo': {
                'major': user.get('major'),
                'grade': user.get('grade'),
                'phone': user.get('phone'),
                'email': user.get('email'),
                'college': user.get('college'),
                'gender': user.get('gender'),
                'familyType': user.get('familyType')
            },
            'jobId': job_id,
            'jobName': job.get('jobName'),
            'department': job.get('department'),
            'phone': data.get('phone'),
            'email': data.get('email'),
            'availableTime': data.get('availableTime'),
            'experience': data.get('experience'),
            'reason': data.get('reason'),
            'attachments': data.get('attachments', [])
        }
        
        Application.create(app_data)
        
        return success({'applyId': apply_id}, '申请提交成功')
    except Exception as e:
        return error(500, f'提交申请失败: {str(e)}')


@applications_bp.route('/my-applications', methods=['GET'])
@login_required
def get_my_applications():
    """
    获取我的申请列表
    
    查询参数:
    - status: 状态筛选
    - pageNum: 页码
    - pageSize: 每页数量
    """
    status = request.args.get('status')
    page = int(request.args.get('pageNum', 1))
    page_size = int(request.args.get('pageSize', 20))
    
    try:
        apps, total = Application.find_by_student(g.user_id, status, page, page_size)
        
        app_list = [Application.to_dict(app) for app in apps]
        
        return success({
            'total': total,
            'list': app_list
        })
    except Exception as e:
        return error(500, f'获取申请列表失败: {str(e)}')


@applications_bp.route('/detail', methods=['GET'])
@login_required
def get_application_detail():
    """
    获取申请详情
    
    查询参数:
    - applyId: 申请ID
    """
    apply_id = request.args.get('applyId')
    
    if not apply_id:
        return bad_request('申请ID不能为空')
    
    try:
        app = Application.find_by_apply_id(apply_id)
        
        if not app:
            return error(404, '申请不存在')
        
        # 检查权限（只能查看自己的申请，管理员可以查看所有）
        if g.user_role != 'admin' and app.get('studentId') != g.user_id:
            return error(403, '无权查看此申请')
        
        return success(Application.to_dict(app))
    except Exception as e:
        return error(500, f'获取申请详情失败: {str(e)}')


@applications_bp.route('/review', methods=['POST'])
@admin_required
def review_application():
    """
    审核申请（管理员）
    
    请求参数:
    - applyId: 申请ID
    - action: 操作（approve/reject）
    - rejectReason: 驳回原因（action为reject时必填）
    """
    data = request.get_json()
    
    if not data:
        return bad_request('请求参数不能为空')
    
    apply_id = data.get('applyId')
    action = data.get('action')
    
    if not apply_id or not action:
        return bad_request('申请ID和操作不能为空')
    
    if action not in ['approve', 'reject']:
        return bad_request('无效的操作类型')
    
    if action == 'reject' and not data.get('rejectReason'):
        return bad_request('驳回原因不能为空')
    
    try:
        app = Application.find_by_apply_id(apply_id)
        if not app:
            return error(404, '申请不存在')
        
        if app.get('status') != 'pending':
            return error(400, '该申请已处理，无法重复审核')
        
        status = 'approved' if action == 'approve' else 'rejected'
        
        Application.update_status(
            app['_id'],
            status,
            rejectReason=data.get('rejectReason'),
            reviewer=g.user_id
        )
        
        message = '申请已通过' if action == 'approve' else '申请已驳回'
        return success(None, message)
    except Exception as e:
        return error(500, f'审核申请失败: {str(e)}')


@applications_bp.route('/admin-list', methods=['GET'])
@admin_required
def get_admin_application_list():
    """
    获取申请列表（管理员）
    
    查询参数:
    - status: 状态筛选
    - jobId: 岗位ID筛选
    - pageNum: 页码
    - pageSize: 每页数量
    """
    status = request.args.get('status')
    job_id = request.args.get('jobId')
    page = int(request.args.get('pageNum', 1))
    page_size = int(request.args.get('pageSize', 20))
    
    filters = {}
    if status:
        filters['status'] = status
    if job_id:
        filters['jobId'] = job_id
    
    try:
        apps, total = Application.find_list(filters, page, page_size)
        
        app_list = [Application.to_dict(app) for app in apps]
        
        return success({
            'total': total,
            'list': app_list
        })
    except Exception as e:
        return error(500, f'获取申请列表失败: {str(e)}')


@applications_bp.route('/cancel', methods=['POST'])
@login_required
def cancel_application():
    """
    取消申请
    
    请求参数:
    - applyId: 申请ID
    """
    data = request.get_json()
    
    if not data or not data.get('applyId'):
        return bad_request('申请ID不能为空')
    
    apply_id = data.get('applyId')
    
    try:
        app = Application.find_by_apply_id(apply_id)
        if not app:
            return error(404, '申请不存在')
        
        # 只能取消自己的申请
        if app.get('studentId') != g.user_id:
            return error(403, '无权取消此申请')
        
        if app.get('status') != 'pending':
            return error(400, '该申请已处理，无法取消')
        
        Application.cancel(app['_id'])
        
        return success(None, '申请已取消')
    except Exception as e:
        return error(500, f'取消申请失败: {str(e)}')
