"""
用户模型 - 微信云数据库版本
通过HTTP API访问微信云数据库
"""
from datetime import datetime
import bcrypt
from app.utils.wx_cloud_db import get_wx_cloud_db


class UserCloud:
    """用户模型 - 微信云数据库版"""
    
    COLLECTION = 'users'
    
    @classmethod
    def find_by_id(cls, user_id):
        """通过ID查找用户"""
        wx_db = get_wx_cloud_db()
        users = wx_db.database_query(cls.COLLECTION, {'userId': user_id}, limit=1)
        return users[0] if users else None
    
    @classmethod
    def find_by_student_id(cls, student_id):
        """通过学号查找用户"""
        wx_db = get_wx_cloud_db()
        users = wx_db.database_query(cls.COLLECTION, {'studentId': student_id}, limit=1)
        return users[0] if users else None
    
    @classmethod
    def find_by_user_id(cls, user_id):
        """通过userId查找用户"""
        wx_db = get_wx_cloud_db()
        users = wx_db.database_query(cls.COLLECTION, {'userId': user_id}, limit=1)
        return users[0] if users else None
    
    @classmethod
    def create(cls, user_data):
        """创建用户"""
        wx_db = get_wx_cloud_db()
        
        # 加密密码
        if 'password' in user_data:
            user_data['password'] = bcrypt.hashpw(
                user_data['password'].encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
        
        # 设置默认字段
        now = datetime.now().isoformat()
        user_data.setdefault('createTime', now)
        user_data.setdefault('updateTime', now)
        user_data.setdefault('lastLoginTime', now)
        user_data.setdefault('status', 'active')
        
        return wx_db.database_add(cls.COLLECTION, user_data)
    
    @classmethod
    def update(cls, user_id, update_data):
        """更新用户信息"""
        wx_db = get_wx_cloud_db()
        update_data['updateTime'] = datetime.now().isoformat()
        return wx_db.database_update(
            cls.COLLECTION,
            {'userId': user_id},
            update_data
        )
    
    @classmethod
    def update_last_login(cls, user_id):
        """更新最后登录时间"""
        wx_db = get_wx_cloud_db()
        return wx_db.database_update(
            cls.COLLECTION,
            {'userId': user_id},
            {'lastLoginTime': datetime.now().isoformat()}
        )
    
    @classmethod
    def verify_password(cls, user, password):
        """验证密码"""
        if not user or 'password' not in user:
            return False
        
        stored_password = user['password']
        
        # 检查是否是bcrypt哈希
        if stored_password.startswith('$2'):
            return bcrypt.checkpw(
                password.encode('utf-8'),
                stored_password.encode('utf-8')
            )
        else:
            # 明文密码（旧数据兼容）
            return password == stored_password
    
    @classmethod
    def upgrade_password(cls, user_id, password):
        """将明文密码升级为bcrypt哈希"""
        wx_db = get_wx_cloud_db()
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return wx_db.database_update(
            cls.COLLECTION,
            {'userId': user_id},
            {'password': hashed.decode('utf-8')}
        )
    
    @classmethod
    def to_dict(cls, user, include_sensitive=False):
        """转换为字典"""
        if not user:
            return None
        
        result = {
            'userId': user.get('userId'),
            'name': user.get('name'),
            'studentId': user.get('studentId'),
            'role': user.get('role'),
            'major': user.get('major'),
            'grade': user.get('grade'),
            'phone': user.get('phone'),
            'email': user.get('email'),
            'college': user.get('college'),
            'gender': user.get('gender'),
            'familyType': user.get('familyType'),
            'familyDesc': user.get('familyDesc'),
            'gpa': user.get('gpa'),
            'freeTime': user.get('freeTime'),
            'skills': user.get('skills'),
            'experience': user.get('experience')
        }
        
        if include_sensitive:
            result['openid'] = user.get('openid')
            result['status'] = user.get('status')
            result['createTime'] = user.get('createTime')
            result['lastLoginTime'] = user.get('lastLoginTime')
        
        return result
