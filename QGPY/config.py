"""
Flask应用配置文件
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Config:
    """基础配置类"""

    # 密钥配置 — 生产环境必须通过环境变量设置，缺失时抛出异常
    _secret = os.environ.get('JWT_SECRET_KEY')
    if not _secret:
        import warnings
        warnings.warn(
            "JWT_SECRET_KEY 未设置，使用开发默认密钥。生产环境请设置环境变量！",
            stacklevel=2
        )
    SECRET_KEY = _secret or 'dev-secret-key-change-in-production'

    # JWT配置
    JWT_SECRET_KEY = _secret or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_EXPIRE_DAYS', 7)))

    # 微信云开发配置
    WX_CLOUD_ENV_ID = os.environ.get('WX_CLOUD_ENV_ID', '')
    WX_APPID = os.environ.get('WX_APPID', '')
    WX_SECRET = os.environ.get('WX_SECRET', '')
    
    # MongoDB配置
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/qinggong')
    
    # CORS配置
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    
    # 分页配置
    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 100
    
    # 密码加密配置
    BCRYPT_ROUNDS = 10


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    ENV = 'production'


class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    DEBUG = True


# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
