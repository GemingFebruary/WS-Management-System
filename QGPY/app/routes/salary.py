"""
薪资路由模块
"""
from flask import Blueprint, request, g
from app.models.salary_cloud import SalaryCloud as Salary
from app.models.user_cloud import UserCloud as User
from app.utils import success, error, bad_request, login_required, admin_required
from app.utils.helpers import generate_id

salary_bp = Blueprint('salary', __name__)


@salary_bp.route('/query', methods=['GET'])
@login_required
def query_salary():
    """
    查询薪资信息
    
    查询参数:
    - month: 月份（格式：YYYY-MM）
    """
    month = request.args.get('month')
    
    try:
        # 获取薪资明细
        records, total, stats = Salary.find_by_student(g.user_id, month, 1, 100)
        
        # 获取月度汇总
        if month:
            month_summary = Salary.get_month_summary(g.user_id, month)
        else:
            # 默认获取当前月份
            from datetime import datetime
            current_month = datetime.now().strftime('%Y-%m')
            month_summary = Salary.get_month_summary(g.user_id, current_month)
        
        # 获取用户统计
        all_records, _, all_stats = Salary.find_by_student(g.user_id, None, 1, 1000)
        
        # 计算当前在岗岗位数
        job_ids = set(r.get('jobId') for r in all_records if r.get('payStatus') == 'paid')
        
        result = {
            'totalSalary': all_stats.get('totalAmount', 0),
            'monthSalary': month_summary.get('shouldPay', 0),
            'totalHours': all_stats.get('totalHours', 0),
            'currentJobCount': len(job_ids),
            'monthData': month_summary,
            'detailList': [Salary.to_dict(r) for r in records]
        }
        
        return success(result)
    except Exception as e:
        return error(500, f'查询薪资失败: {str(e)}')


@salary_bp.route('/record', methods=['POST'])
@admin_required
def record_work():
    """
    记录工作时长（管理员）
    
    请求参数:
    - studentId: 学生ID
    - jobId: 岗位ID
    - jobName: 岗位名称
    - workDate: 工作日期
    - workHours: 工作时长
    - hourlyRate: 时薪
    """
    data = request.get_json()
    
    if not data:
        return bad_request('请求参数不能为空')
    
    required_fields = ['studentId', 'jobId', 'workDate', 'workHours', 'hourlyRate']
    for field in required_fields:
        if field not in data:
            return bad_request(f'{field}为必填项')
    
    try:
        # 检查学生是否存在
        user = User.find_by_id(data.get('studentId'))
        if not user:
            return error(404, '学生不存在')
        
        # 生成记录ID
        record_id = generate_id('SAL')
        
        # 解析月份
        work_date = data.get('workDate')
        month = work_date[:7] if len(work_date) >= 7 else work_date
        
        record_data = {
            'recordId': record_id,
            'studentId': data.get('studentId'),
            'jobId': data.get('jobId'),
            'jobName': data.get('jobName', ''),
            'workDate': work_date,
            'workHours': float(data.get('workHours')),
            'hourlyRate': float(data.get('hourlyRate')),
            'month': month,
            'remark': data.get('remark', ''),
            'createdBy': g.user_id
        }
        
        Salary.create(record_data)
        
        return success({'recordId': record_id}, '记录成功')
    except Exception as e:
        return error(500, f'记录工作时长失败: {str(e)}')


@salary_bp.route('/calculate', methods=['POST'])
@admin_required
def calculate_salary():
    """
    计算薪资（管理员）
    
    请求参数:
    - month: 月份（可选，默认当前月）
    """
    data = request.get_json() or {}
    month = data.get('month')
    
    if not month:
        from datetime import datetime
        month = datetime.now().strftime('%Y-%m')
    
    try:
        # 查询该月所有薪资记录
        records, _, _ = Salary.find_by_student_all(month)

        if not records:
            return success({
                'month': month,
                'summary': {'totalStudents': 0, 'totalAmount': 0, 'totalHours': 0, 'paidAmount': 0, 'unpaidAmount': 0},
                'students': []
            })

        # 按 studentId 分组聚合
        from collections import defaultdict
        groups = defaultdict(lambda: {'totalHours': 0, 'totalAmount': 0, 'recordCount': 0, 'paidAmount': 0, 'unpaidAmount': 0})
        for r in records:
            sid = r.get('studentId', '')
            g = groups[sid]
            g['totalHours'] += r.get('workHours', 0)
            g['totalAmount'] += r.get('amount', 0)
            g['recordCount'] += 1
            if r.get('payStatus') == 'paid':
                g['paidAmount'] += r.get('amount', 0)
            else:
                g['unpaidAmount'] += r.get('amount', 0)

        # 关联学生信息
        student_list = []
        for sid, grp in groups.items():
            user = User.find_by_id(sid)
            name = user.get('name', sid) if user else sid
            college = user.get('college', '') if user else ''
            all_paid = grp['unpaidAmount'] == 0 and grp['totalAmount'] > 0
            student_list.append({
                'studentId': sid,
                'name': name,
                'college': college,
                'totalHours': round(grp['totalHours'], 1),
                'totalAmount': round(grp['totalAmount'], 2),
                'recordCount': grp['recordCount'],
                'payStatus': 'paid' if all_paid else 'unpaid'
            })

        # 按总金额降序
        student_list.sort(key=lambda x: x['totalAmount'], reverse=True)

        total_amount = sum(s['totalAmount'] for s in student_list)
        total_hours = sum(s['totalHours'] for s in student_list)
        paid_amount = sum(s['totalAmount'] for s in student_list if s['payStatus'] == 'paid')

        return success({
            'month': month,
            'summary': {
                'totalStudents': len(student_list),
                'totalAmount': round(total_amount, 2),
                'totalHours': round(total_hours, 1),
                'paidAmount': round(paid_amount, 2),
                'unpaidAmount': round(total_amount - paid_amount, 2)
            },
            'students': student_list
        })
    except Exception as e:
        return error(500, f'计算薪资失败: {str(e)}')


@salary_bp.route('/list', methods=['GET'])
@admin_required
def get_salary_list():
    """
    获取薪资列表（管理员）
    
    查询参数:
    - month: 月份筛选
    - studentId: 学生ID筛选
    - pageNum: 页码
    - pageSize: 每页数量
    """
    month = request.args.get('month')
    student_id = request.args.get('studentId')
    page = int(request.args.get('pageNum', 1))
    page_size = int(request.args.get('pageSize', 20))
    
    filters = {}
    if month:
        filters['month'] = month
    if student_id:
        filters['studentId'] = student_id
    
    try:
        records, total = Salary.find_list(filters, page, page_size)
        
        record_list = [Salary.to_dict(r) for r in records]
        
        return success({
            'total': total,
            'list': record_list
        })
    except Exception as e:
        return error(500, f'获取薪资列表失败: {str(e)}')


@salary_bp.route('/pay', methods=['POST'])
@admin_required
def pay_salary():
    """
    发放薪资（管理员）
    
    请求参数:
    - recordIds: 记录ID列表（可选）
    - month: 月份（可选，发放整月）
    """
    data = request.get_json()
    
    if not data:
        return bad_request('请求参数不能为空')
    
    record_ids = data.get('recordIds', [])
    month = data.get('month')
    
    if not record_ids and not month:
        return bad_request('请指定要发放的记录或月份')
    
    try:
        result = Salary.pay(record_ids, month)
        
        return success({
            'modifiedCount': result['modified_count']
        }, '薪资发放成功')
    except Exception as e:
        return error(500, f'发放薪资失败: {str(e)}')


@salary_bp.route('/update', methods=['PUT'])
@admin_required
def update_salary():
    """
    编辑薪资记录（管理员）

    请求参数:
    - recordId: 记录ID（必填）
    - workDate, workHours, hourlyRate, jobName, remark（可选）
    """
    data = request.get_json()
    if not data or not data.get('recordId'):
        return bad_request('记录ID不能为空')

    record_id = data.pop('recordId')

    try:
        # 检查记录是否存在
        record = Salary.find_by_id(record_id)
        if not record:
            return error(404, '薪资记录不存在')

        # 已发放的记录不允许编辑
        if record.get('payStatus') == 'paid':
            return bad_request('已发放的记录不允许编辑')

        Salary.update(record_id, data)
        return success(None, '更新成功')
    except Exception as e:
        return error(500, f'更新薪资记录失败: {str(e)}')


@salary_bp.route('/delete', methods=['DELETE'])
@admin_required
def delete_salary():
    """
    删除薪资记录（管理员）

    请求参数:
    - recordId: 记录ID（必填）
    """
    data = request.get_json() or {}
    record_id = data.get('recordId') or request.args.get('recordId')

    if not record_id:
        return bad_request('记录ID不能为空')

    try:
        record = Salary.find_by_id(record_id)
        if not record:
            return error(404, '薪资记录不存在')

        # 已发放的记录不允许删除
        if record.get('payStatus') == 'paid':
            return bad_request('已发放的记录不允许删除')

        Salary.delete(record.get('_id'))
        return success(None, '删除成功')
    except Exception as e:
        return error(500, f'删除薪资记录失败: {str(e)}')
