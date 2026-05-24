"""
Flask应用工厂模块
"""
from flask import Flask
from flask_cors import CORS
from config import config


def create_app(config_name='default'):
    """
    应用工厂函数
    
    Args:
        config_name: 配置名称 (development/production/testing)
    
    Returns:
        Flask应用实例
    """
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 启用CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['ALLOWED_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # 注册蓝图
    from app.routes.auth import auth_bp
    from app.routes.jobs import jobs_bp
    from app.routes.applications import applications_bp
    from app.routes.salary import salary_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(salary_bp, url_prefix='/api/salary')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # 注册错误处理
    from app.utils.error_handler import register_error_handlers
    register_error_handlers(app)
    
    # 初始化微信云数据库客户端
    from app.utils.wx_cloud_db import get_wx_cloud_db
    wx_db = get_wx_cloud_db()
    wx_db.init_app(app)
    print(f"[INIT] 微信云数据库客户端初始化完成，环境ID: {app.config.get('WX_CLOUD_ENV_ID')}")
    
    # 请求日志记录（开发调试用）
    @app.before_request
    def log_request():
        from flask import request
        print(f"[REQUEST] {request.method} {request.path} | Auth: {request.headers.get('Authorization', 'None')[:50] if request.headers.get('Authorization') else 'None'}")
    
    # 健康检查端点
    @app.route('/health')
    def health_check():
        return {'code': 200, 'message': '服务正常运行', 'data': None}
    
    @app.route('/')
    def index():
        return {
            'code': 200,
            'message': '勤工助学岗位匹配系统API服务',
            'data': {
                'version': '1.0.0',
                'docs': '/api/docs'
            }
        }
    
    return app
