"""
全局错误处理
"""
from flask import Flask
from .response import error


def register_error_handlers(app: Flask):
    """注册全局错误处理器"""
    
    @app.errorhandler(400)
    def bad_request_handler(e):
        return error(400, '请求参数错误')
    
    @app.errorhandler(401)
    def unauthorized_handler(e):
        return error(401, '未授权，请先登录')
    
    @app.errorhandler(403)
    def forbidden_handler(e):
        return error(403, '权限不足')
    
    @app.errorhandler(404)
    def not_found_handler(e):
        return error(404, '资源不存在')
    
    @app.errorhandler(405)
    def method_not_allowed_handler(e):
        return error(405, '请求方法不允许，请检查HTTP方法（GET/POST/PUT/DELETE）')
    
    @app.errorhandler(500)
    def internal_error_handler(e):
        return error(500, '服务器内部错误')
    
    @app.errorhandler(Exception)
    def global_exception_handler(e):
        app.logger.error(f'未处理的异常: {str(e)}')
        return error(500, '服务器内部错误')
