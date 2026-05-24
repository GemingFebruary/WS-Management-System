"""
辅助工具函数
"""
import uuid
import random
import string
from datetime import datetime


def generate_id(prefix=''):
    """
    生成唯一ID
    
    Args:
        prefix: ID前缀
    
    Returns:
        唯一ID字符串
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{prefix}{timestamp}{random_str}"


def paginate(query, page_num=1, page_size=10):
    """
    分页处理
    
    Args:
        query: 查询对象
        page_num: 页码
        page_size: 每页数量
    
    Returns:
        分页后的数据和总数
    """
    skip = (page_num - 1) * page_size
    total = query.count()
    data = query.skip(skip).limit(page_size)
    return data, total


def format_date(date_obj, format_str='%Y-%m-%d %H:%M:%S'):
    """
    格式化日期
    
    Args:
        date_obj: 日期对象
        format_str: 格式字符串
    
    Returns:
        格式化后的日期字符串
    """
    if not date_obj:
        return ''
    if isinstance(date_obj, datetime):
        return date_obj.strftime(format_str)
    return str(date_obj)


def calculate_match_score(user_info, job_info):
    """
    计算岗位匹配度
    
    Args:
        user_info: 用户信息
        job_info: 岗位信息
    
    Returns:
        匹配度分数 (0-100)
    """
    score = 0
    
    # 专业匹配 (30%)
    if job_info.get('requiredMajor'):
        if user_info.get('major') == job_info['requiredMajor']:
            score += 30
    else:
        score += 30  # 无专业要求，默认满分
    
    # 年级匹配 (20%)
    if job_info.get('requiredGrade'):
        if user_info.get('grade') == job_info['requiredGrade']:
            score += 20
    else:
        score += 20  # 无年级要求，默认满分
    
    # 成绩匹配 (25%)
    if job_info.get('minGpa'):
        user_gpa = user_info.get('gpa', 0)
        if user_gpa >= job_info['minGpa']:
            score += 25
        else:
            # 线性计算部分分数
            score += int(25 * (user_gpa / job_info['minGpa']))
    else:
        score += 25  # 无GPA要求，默认满分
    
    # 时间匹配 (25%) - 简化处理
    score += 25
    
    return min(score, 100)


def get_status_text(status, status_type='job'):
    """
    获取状态文本
    
    Args:
        status: 状态码
        status_type: 状态类型 (job/application/pay)
    
    Returns:
        状态文本
    """
    status_map = {
        'job': {
            'recruiting': '招聘中',
            'full': '已满员',
            'closed': '已关闭'
        },
        'application': {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已驳回',
            'cancelled': '已取消'
        },
        'pay': {
            'paid': '已发放',
            'unpaid': '待发放'
        }
    }
    
    return status_map.get(status_type, {}).get(status, '未知')
