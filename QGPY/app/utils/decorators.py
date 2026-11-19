"""
装饰器工具
"""
import jwt
from functools import wraps
from flask import request, current_app, g
from .response import unauthorized, forbidden


def login_required(f):
    """
    登录验证装饰器
    
    验证请求头中的Authorization Token
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return unauthorized('缺少Authorization请求头')
        
        # 解析Token
        try:
            # 支持 "Bearer token" 格式
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
            
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # 将用户信息存入g对象
            g.user_id = payload.get('user_id')
            g.user_role = payload.get('role')
            g.user_info = payload
            
        except jwt.ExpiredSignatureError:
            return unauthorized('Token已过期，请重新登录')
        except jwt.InvalidTokenError:
            return unauthorized('无效的Token')
        
        return f(*args, **kwargs)
    
    return decorated_function


def admin_required(f):
    """
    管理员权限装饰器
    
    要求用户必须是管理员角色
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if g.user_role != 'admin':
            return forbidden('需要管理员权限')
        return f(*args, **kwargs)
    
    return decorated_function


def student_required(f):
    """
    学生权限装饰器
    
    要求用户必须是学生角色
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if g.user_role != 'student':
            return forbidden('需要学生权限')
        return f(*args, **kwargs)
    
    return decorated_function
