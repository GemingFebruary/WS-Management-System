"""
管理后台路由模块
"""
from flask import Blueprint, request, g
from app.models.user_cloud import UserCloud as User
from app.models.job_cloud import JobCloud as Job
from app.models.application_cloud import ApplicationCloud as Application
from app.models.salary_cloud import SalaryCloud as Salary
from app.utils import success, error, bad_request, admin_required
from app.utils.helpers import generate_id
from app.utils.wx_cloud_db import get_wx_cloud_db

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
        wx_db = get_wx_cloud_db()

        # 岗位总数 — 直接查询云数据库，取大 limit 获取尽量准确的总数
        jobs = wx_db.database_query('jobs', limit=1000)
        job_count = len(jobs)
        print(f"[STATS] 岗位总数: {job_count}")

        # 待审核申请数
        apps = wx_db.database_query('applications', {'status': 'pending'}, limit=1000)
        pending_count = len(apps)
        print(f"[STATS] 待审核申请: {pending_count}")

        # 学生总数
        students = wx_db.database_query('users', {'role': 'student'}, limit=1000)
        student_count = len(students)
        print(f"[STATS] 学生总数: {student_count}")

        # 本月已发放薪资
        salary_records = wx_db.database_query('salary_records', {'month': current_month, 'payStatus': 'paid'}, limit=1000)
        total_salary = sum(r.get('amount', 0) for r in salary_records)
        print(f"[STATS] 本月发放: {total_salary} (记录数: {len(salary_records)})")

        return success({
            'jobCount': job_count,
            'pendingCount': pending_count,
            'studentCount': student_count,
            'totalSalary': total_salary
        })
    except Exception as e:
        print(f"[STATS] 获取统计数据失败: {type(e).__name__}: {str(e)}")
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
        # 通过云数据库查询学生列表，关键词搜索使用客户端过滤
        wx_db = get_wx_cloud_db()
        query = {'role': 'student'}
        all_students = wx_db.database_query('users', query, limit=100)

        # 客户端关键词过滤（云数据库HTTP API不支持$regex）
        if keyword:
            keyword_lower = keyword.lower()
            all_students = [s for s in all_students
                          if keyword_lower in (s.get('name', '')).lower() or
                          keyword_lower in (s.get('studentId', '')).lower() or
                          keyword_lower in (s.get('college', '')).lower()]

        total = len(all_students)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_students = all_students[start:end]

        students = [User.to_dict(s) for s in page_students]
        
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
            # 通过云数据库查询学生列表
            wx_db = get_wx_cloud_db()
            students = wx_db.database_query('users', {'role': 'student'}, limit=100)
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


@admin_bp.route('/notices', methods=['GET'])
def get_notices():
    """获取公告列表（公开接口）"""
    try:
        wx_db = get_wx_cloud_db()
        notices = wx_db.database_query('notices', limit=20)
        if not notices:
            # notices 集合可能不存在，返回空列表而非报错
            print(f"[ADMIN] 公告查询返回空（集合可能不存在或未初始化），返回 0 条")
            return success({'list': []})
        # 按 publishDate 降序排列
        notices.sort(key=lambda x: str(x.get('publishDate', '')), reverse=True)
        print(f"[ADMIN] 公告查询成功，返回 {len(notices)} 条")
        return success({'list': notices})
    except Exception as e:
        # 集合不存在等异常，返回空列表
        print(f"[ADMIN] 获取公告异常: {type(e).__name__}: {str(e)}")
        return success({'list': []})


@admin_bp.route('/notices', methods=['POST'])
@admin_required
def create_notice():
    """发布公告（管理员）"""
    from datetime import datetime
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return bad_request('标题和内容不能为空')
    try:
        wx_db = get_wx_cloud_db()
        notice_data = {
            'title': data['title'][:100],
            'content': data['content'][:500],
            'publishDate': datetime.now().isoformat(),
            'publisher': g.user_id or 'admin'
        }
        result = wx_db.database_add('notices', notice_data)
        if result:
            return success({'noticeId': result}, '公告发布成功')
        return error(500, '发布公告失败')
    except Exception as e:
        return error(500, f'发布公告失败: {str(e)}')


@admin_bp.route('/notices/<notice_id>', methods=['PUT'])
@admin_required
def update_notice(notice_id):
    """更新公告（管理员）"""
    data = request.get_json()
    if not data:
        return bad_request('请求参数不能为空')
    try:
        wx_db = get_wx_cloud_db()
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title'][:100]
        if 'content' in data:
            update_data['content'] = data['content'][:500]
        if not update_data:
            return bad_request('没有可更新的字段')
        wx_db.database_update('notices', {'_id': notice_id}, update_data)
        return success(None, '公告更新成功')
    except Exception as e:
        return error(500, f'更新公告失败: {str(e)}')


@admin_bp.route('/notices/<notice_id>', methods=['DELETE'])
@admin_required
def delete_notice(notice_id):
    """删除公告（管理员）"""
    try:
        wx_db = get_wx_cloud_db()
        wx_db.database_delete('notices', {'_id': notice_id})
        return success(None, '公告删除成功')
    except Exception as e:
        return error(500, f'删除公告失败: {str(e)}')


@admin_bp.route('/debug-cloud-db', methods=['GET'])
@admin_required
def debug_cloud_db():
    """
    调试接口：测试微信云数据库连接状态
    测试 access_token 获取 + notices 集合查询 + users 集合查询
    """
    results = {}

    # 1. 测试 access_token
    try:
        wx_db = get_wx_cloud_db()
        token = wx_db._get_access_token()
        results['access_token'] = f'{token[:10]}...(有效)' if token else '获取失败'
    except Exception as e:
        results['access_token'] = f'错误: {type(e).__name__}: {str(e)}'

    # 2. 测试 users 集合（已知存在）
    try:
        wx_db = get_wx_cloud_db()
        users = wx_db.database_query('users', limit=2)
        results['users'] = {'count': len(users), 'sample': users[0] if users else None}
    except Exception as e:
        results['users'] = f'错误: {type(e).__name__}: {str(e)}'

    # 3. 测试 notices 集合
    try:
        wx_db = get_wx_cloud_db()
        notices = wx_db.database_query('notices', limit=5)
        results['notices'] = {'count': len(notices), 'sample': notices[0] if notices else None}
    except Exception as e:
        results['notices'] = f'错误: {type(e).__name__}: {str(e)}'

    return success(results)


@admin_bp.route('/payroll-export', methods=['GET'])
@admin_required
def payroll_export():
    """
    发薪清单导出（管理员）

    查询参数:
    - month: 月份（必填，格式 YYYY-MM）
    - payStatus: 发放状态筛选（paid/unpaid/all，默认 all）
    """
    from datetime import datetime
    from collections import defaultdict
    from app.models.salary_cloud import SalaryCloud as Salary
    from app.models.user_cloud import UserCloud as User

    month = request.args.get('month')
    if not month:
        return bad_request('月份参数不能为空')

    pay_status = request.args.get('payStatus', 'all')

    try:
        wx_db = get_wx_cloud_db()
        query = {'month': month}
        all_records = wx_db.database_query('salary_records', query, limit=100)

        if not all_records:
            return success({
                'month': month,
                'exportTime': datetime.now().isoformat(),
                'totalStudents': 0,
                'totalAmount': 0,
                'records': []
            })

        # 按 studentId 分组
        groups = defaultdict(lambda: {'records': [], 'totalHours': 0, 'totalAmount': 0, 'paidAmount': 0})
        for r in all_records:
            sid = r.get('studentId', '')
            grp = groups[sid]
            grp['records'].append(r)
            grp['totalHours'] += r.get('workHours', 0)
            grp['totalAmount'] += r.get('amount', 0)
            if r.get('payStatus') == 'paid':
                grp['paidAmount'] += r.get('amount', 0)

        # 构建发薪清单
        export_records = []
        for sid, grp in groups.items():
            unpaid_amount = grp['totalAmount'] - grp['paidAmount']
            if pay_status == 'paid' and grp['paidAmount'] == 0:
                continue
            if pay_status == 'unpaid' and unpaid_amount == 0:
                continue

            # 关联学生信息
            user = User.find_by_id(sid)
            name = user.get('name', sid) if user else sid
            college = user.get('college', '') if user else ''

            # 取该学生的平均时薪（用于清单展示）
            rates = [r.get('hourlyRate', 0) for r in grp['records'] if r.get('hourlyRate')]
            avg_rate = round(sum(rates) / len(rates), 1) if rates else 0

            all_paid = unpaid_amount == 0 and g['totalAmount'] > 0

            export_records.append({
                'studentId': sid,
                'name': name,
                'college': college,
                'totalHours': round(grp['totalHours'], 1),
                'hourlyRate': avg_rate,
                'totalAmount': round(grp['totalAmount'], 2),
                'paidAmount': round(grp['paidAmount'], 2),
                'unpaidAmount': round(unpaid_amount, 2),
                'recordCount': len(grp['records']),
                'payStatus': '已发放' if all_paid else '待发放',
                'items': [{
                    'workDate': r.get('workDate', ''),
                    'workHours': r.get('workHours', 0),
                    'hourlyRate': r.get('hourlyRate', 0),
                    'amount': r.get('amount', 0),
                    'jobName': r.get('jobName', ''),
                    'payStatus': '已发放' if r.get('payStatus') == 'paid' else '待发放'
                } for r in sorted(grp['records'], key=lambda x: str(x.get('workDate', '')))]
            })

        export_records.sort(key=lambda x: x['studentId'])

        return success({
            'month': month,
            'exportTime': datetime.now().isoformat(),
            'totalStudents': len(export_records),
            'totalAmount': round(sum(r['totalAmount'] for r in export_records), 2),
            'records': export_records
        })
    except Exception as e:
        return error(500, f'导出发薪清单失败: {str(e)}')
