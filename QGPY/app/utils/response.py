"""
统一响应格式工具
"""
from flask import jsonify


def success(data=None, message='success'):
    """
    成功响应
    
    Args:
        data: 响应数据
        message: 提示信息
    
    Returns:
        JSON响应
    """
    return jsonify({
        'code': 200,
        'message': message,
        'data': data
    })


def error(code=500, message='服务器错误', data=None):
    """
    错误响应
    
    Args:
        code: 错误码
        message: 错误信息
        data: 附加数据
    
    Returns:
        JSON响应
    """
    return jsonify({
        'code': code,
        'message': message,
        'data': data
    }), code


def bad_request(message='请求参数错误'):
    """400错误响应"""
    return error(400, message)


def unauthorized(message='未授权，请先登录'):
    """401错误响应"""
    return error(401, message)


def forbidden(message='权限不足'):
    """403错误响应"""
    return error(403, message)


def not_found(message='资源不存在'):
    """404错误响应"""
    return error(404, message)
