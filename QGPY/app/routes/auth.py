"""
认证路由模块
"""
import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, current_app, g
from app.models.user_cloud import UserCloud as User
from app.utils import success, error, bad_request, login_required
from app.utils.helpers import generate_id

auth_bp = Blueprint('auth', __name__)


def generate_token(user_id, role):
    """生成JWT Token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录（公开接口，无需认证）
    
    请求参数:
    - account: 账号（学号或userId）
    - password: 密码
    - role: 角色（student/admin）
    """
    print(f"[LOGIN] 收到登录请求")
    
    try:
        data = request.get_json()
        
        if not data:
            print(f"[LOGIN] 错误: 请求参数为空")
            return bad_request('请求参数不能为空')
        
        account = data.get('account')
        password = data.get('password')
        role = data.get('role', 'student')
        
        print(f"[LOGIN] 账号: {account}, 角色: {role}")
        
        if not account or not password:
            return bad_request('账号和密码不能为空')
        
        # 查找用户
        user = None
        if role == 'admin':
            user = User.find_by_user_id(account)
            if user and user.get('role') != 'admin':
                return error(401, '账号不存在')
        else:
            # 学生登录：先查userId，再查studentId
            user = User.find_by_user_id(account)
            if not user:
                user = User.find_by_student_id(account)
        
        if not user:
            print(f"[LOGIN] 错误: 账号 {account} 不存在")
            return error(401, '账号不存在，请先注册')
        
        # 检查用户状态
        if user.get('status') == 'disabled':
            return error(403, '账号已被禁用，请联系管理员')
        
        # 验证密码
        if not User.verify_password(user, password):
            print(f"[LOGIN] 错误: 密码错误")
            return error(401, '密码错误')
        
        # 如果是明文密码，自动升级为bcrypt
        stored_password = user.get('password', '')
        if stored_password and not stored_password.startswith('$2'):
            User.upgrade_password(user['userId'], password)
        
        # 更新最后登录时间
        User.update_last_login(user['userId'])
        
        # 生成Token
        token = generate_token(user['userId'], user['role'])
        
        # 返回用户信息
        user_info = User.to_dict(user)
        
        print(f"[LOGIN] 成功: 用户 {account} 登录成功")
        
        return success({
            'token': token,
            'userInfo': user_info
        }, '登录成功')
        
    except Exception as e:
        print(f"[LOGIN] 异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return error(500, f'登录失败: {str(e)}')


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    学生注册（公开接口，无需认证）
    
    请求参数:
    - studentId: 学号
    - name: 姓名
    - gender: 性别
    - college: 学院
    - major: 专业
    - grade: 年级
    - phone: 手机号
    - email: 邮箱
    - familyType: 家庭类型
    - familyDesc: 家庭情况描述
    - password: 密码
    """
    print(f"[REGISTER] 收到注册请求")
    
    try:
        data = request.get_json()
        
        if not data:
            print(f"[REGISTER] 错误: 请求参数为空")
            return bad_request('请求参数不能为空')
        
        # 必填字段验证
        required_fields = ['studentId', 'name', 'password']
        for field in required_fields:
            if not data.get(field):
                return bad_request(f'{field}为必填项')
        
        student_id = data.get('studentId')
        password = data.get('password')
        
        print(f"[REGISTER] 学号: {student_id}, 姓名: {data.get('name')}")
        
        # 密码长度验证
        if len(password) < 6 or len(password) > 20:
            return bad_request('密码长度为6-20位')
        
        # 检查学号是否已存在
        if User.find_by_student_id(student_id):
            print(f"[REGISTER] 错误: 学号 {student_id} 已注册")
            return error(400, '该学号已注册')
        
        # 检查userId是否重复
        if User.find_by_user_id(student_id):
            print(f"[REGISTER] 错误: 学号 {student_id} 已注册")
            return error(400, '该学号已注册')
        
        # 构建用户数据
        user_data = {
            'userId': student_id,
            'studentId': student_id,
            'name': data.get('name'),
            'gender': data.get('gender', ''),
            'college': data.get('college', ''),
            'major': data.get('major', ''),
            'grade': data.get('grade', ''),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'familyType': data.get('familyType', '一般'),
            'familyDesc': data.get('familyDesc', ''),
            'password': password,
            'role': 'student',
            'openid': ''
        }
        
        # 创建用户
        User.create(user_data)
        print(f"[REGISTER] 成功: 用户 {student_id} 注册成功")
        return success({'userId': student_id}, '注册成功')
        
    except Exception as e:
        print(f"[REGISTER] 异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return error(500, f'注册失败: {str(e)}')


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """用户登出"""
    # 这里可以添加token黑名单逻辑
    return success(None, '登出成功')


@auth_bp.route('/user-info', methods=['GET'])
@login_required
def get_user_info():
    """获取用户信息"""
    user = User.find_by_id(g.user_id)
    
    if not user:
        return error(404, '用户不存在')
    
    user_info = User.to_dict(user)
    return success(user_info)
