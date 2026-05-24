"""
数据库初始化脚本
在本地MongoDB中创建测试用户，用于开发测试
"""
import os
import sys
from datetime import datetime

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.database import db
from app.models.user import User


def init_database():
    """初始化数据库"""
    app = create_app('development')
    
    with app.app_context():
        # 初始化数据库连接
        db.init_app(app)
        
        print("=" * 50)
        print("数据库初始化工具")
        print("=" * 50)
        
        # 检查是否已有用户
        existing_users = list(db.users.find().limit(5))
        
        if existing_users:
            print(f"\n发现 {len(existing_users)} 个现有用户:")
            for user in existing_users:
                print(f"  - {user.get('userId')} ({user.get('name')})")
        
        print("\n" + "=" * 50)
        print("创建测试用户")
        print("=" * 50)
        
        # 创建测试学生用户
        test_students = [
            {
                'userId': 'js23080509',
                'studentId': 'js23080509',
                'name': '测试学生',
                'gender': '男',
                'college': '计算机学院',
                'major': '软件工程',
                'grade': '2023级',
                'phone': '13800138000',
                'email': 'test@example.com',
                'familyType': '一般',
                'familyDesc': '',
                'password': '123456',  # 明文密码，会被自动加密
                'role': 'student',
                'openid': '',
                'status': 'active'
            },
            {
                'userId': '2023001',
                'studentId': '2023001',
                'name': '张三',
                'gender': '男',
                'college': '信息学院',
                'major': '计算机科学',
                'grade': '2023级',
                'phone': '13800138001',
                'email': 'zhangsan@example.com',
                'familyType': '困难',
                'familyDesc': '家庭经济困难',
                'password': '123456',
                'role': 'student',
                'openid': '',
                'status': 'active'
            }
        ]
        
        # 创建测试管理员
        test_admins = [
            {
                'userId': 'admin',
                'studentId': 'admin',
                'name': '管理员',
                'gender': '男',
                'college': '学生处',
                'major': '',
                'grade': '',
                'phone': '13900139000',
                'email': 'admin@example.com',
                'familyType': '一般',
                'familyDesc': '',
                'password': 'admin123',
                'role': 'admin',
                'openid': '',
                'status': 'active'
            }
        ]
        
        created_count = 0
        
        # 创建学生用户
        for student_data in test_students:
            existing = User.find_by_user_id(student_data['userId'])
            if not existing:
                User.create(student_data)
                print(f"✓ 创建学生: {student_data['userId']} - {student_data['name']}")
                created_count += 1
            else:
                print(f"○ 用户已存在: {student_data['userId']}")
        
        # 创建管理员
        for admin_data in test_admins:
            existing = User.find_by_user_id(admin_data['userId'])
            if not existing:
                User.create(admin_data)
                print(f"✓ 创建管理员: {admin_data['userId']} - {admin_data['name']}")
                created_count += 1
            else:
                print(f"○ 用户已存在: {admin_data['userId']}")
        
        print("\n" + "=" * 50)
        print(f"初始化完成！新建 {created_count} 个用户")
        print("=" * 50)
        print("\n测试账号:")
        print("  学生: js23080509 / 123456")
        print("  学生: 2023001 / 123456")
        print("  管理员: admin / admin123")
        print("=" * 50)


if __name__ == '__main__':
    init_database()
