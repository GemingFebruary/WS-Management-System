"""
用户模型
"""
from datetime import datetime
import bcrypt
from .database import db


class User:
    """用户模型"""
    
    COLLECTION = 'users'
    
    @classmethod
    def find_by_id(cls, user_id):
        """通过ID查找用户"""
        return db.users.find_one({'userId': user_id})
    
    @classmethod
    def find_by_student_id(cls, student_id):
        """通过学号查找用户"""
        return db.users.find_one({'studentId': student_id})
    
    @classmethod
    def find_by_user_id(cls, user_id):
        """通过userId查找用户"""
        return db.users.find_one({'userId': user_id})
    
    @classmethod
    def create(cls, user_data):
        """创建用户"""
        # 加密密码
        if 'password' in user_data:
            user_data['password'] = bcrypt.hashpw(
                user_data['password'].encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
        
        # 设置默认字段
        now = datetime.now()
        user_data.setdefault('createTime', now)
        user_data.setdefault('updateTime', now)
        user_data.setdefault('lastLoginTime', now)
        user_data.setdefault('status', 'active')
        
        result = db.users.insert_one(user_data)
        return result.inserted_id
    
    @classmethod
    def update(cls, user_id, update_data):
        """更新用户信息"""
        update_data['updateTime'] = datetime.now()
        return db.users.update_one(
            {'userId': user_id},
            {'$set': update_data}
        )
    
    @classmethod
    def update_last_login(cls, user_id):
        """更新最后登录时间"""
        return db.users.update_one(
            {'userId': user_id},
            {'$set': {'lastLoginTime': datetime.now()}}
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
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return db.users.update_one(
            {'userId': user_id},
            {'$set': {'password': hashed.decode('utf-8')}}
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
