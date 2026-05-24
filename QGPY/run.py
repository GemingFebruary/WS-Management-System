"""
Flask应用启动脚本
"""
import os
import sys
from app import create_app
from app.models.database import db

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    # 可以在这里添加数据库初始化逻辑
    print("数据库初始化完成")

def main():
    """主函数"""
    # 获取环境配置
    config_name = os.environ.get('FLASK_ENV', 'development')
    
    # 创建应用
    app = create_app(config_name)
    
    # 初始化数据库
    with app.app_context():
        db.init_app(app)
        init_database()
    
    # 获取端口
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    print(f"\n{'='*50}")
    print(f"勤工助学岗位匹配系统后端服务")
    print(f"运行环境: {config_name}")
    print(f"服务地址: http://localhost:{port}")
    print(f"{'='*50}\n")
    
    # 启动服务
    app.run(
        host='0.0.0.0',
        port=port,
        debug=app.config.get('DEBUG', True)
    )

if __name__ == '__main__':
    main()
