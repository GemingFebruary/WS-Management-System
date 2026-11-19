"""
微信云函数HTTP调用客户端
用于Python后端调用小程序云函数，实现与微信云数据库的互通
"""
import requests
import json
from flask import current_app


class CloudFunctionClient:
    """云函数调用客户端"""
    
    def __init__(self, base_url=None):
        """
        初始化客户端
        
        Args:
            base_url: 云函数HTTP触发器基础URL
                     格式: https://[云函数域名]/release/[云函数名]
        """
        self.base_url = base_url or current_app.config.get('CLOUD_FUNCTION_BASE_URL')
    
    def call(self, function_name, data=None):
        """
        调用云函数
        
        Args:
            function_name: 云函数名称 (auth, jobs, applications, salary, admin)
            data: 传递给云函数的数据
        
        Returns:
            云函数返回的结果
        """
        if not self.base_url:
            raise RuntimeError('未配置云函数HTTP触发器URL')
        
        url = f"{self.base_url}/{function_name}"
        
        try:
            response = requests.post(
                url,
                json=data or {},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[CloudFunction] 调用失败: {function_name}, 错误: {str(e)}")
            raise


class CloudAuthClient:
    """云认证客户端 - 封装用户认证相关操作"""
    
    def __init__(self, client=None):
        self.client = client or CloudFunctionClient()
    
    def login(self, account, password, role='student'):
        """用户登录"""
        result = self.client.call('auth', {
            'action': 'login',
            'account': account,
            'password': password,
            'role': role
        })
        return result
    
    def register(self, user_data):
        """用户注册"""
        result = self.client.call('auth', {
            'action': 'register',
            **user_data
        })
        return result
    
    def get_user_info(self, token):
        """获取用户信息"""
        result = self.client.call('auth', {
            'action': 'getUserInfo',
            'token': token
        })
        return result


class CloudDatabaseClient:
    """云数据库客户端 - 直接通过HTTP API访问微信云数据库"""
    
    def __init__(self, env_id=None, access_token=None):
        self.env_id = env_id or current_app.config.get('WX_CLOUD_ENV_ID', 'cloud1-d7g94p70f23bf5769')
        self.access_token = access_token
        self.base_url = 'https://api.weixin.qq.com/tcb'
    
    def _get_access_token(self):
        """获取微信接口调用凭证"""
        if self.access_token:
            return self.access_token
        
        # 从配置中获取
        appid = current_app.config.get('WX_APPID')
        secret = current_app.config.get('WX_SECRET')
        
        if not appid or not secret:
            raise RuntimeError('未配置微信APPID或SECRET')
        
        url = f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}'
        response = requests.get(url, timeout=10)
        result = response.json()
        
        if 'access_token' not in result:
            raise RuntimeError(f'获取access_token失败: {result}')
        
        return result['access_token']
    
    def database_query(self, collection, query=None):
        """
        查询云数据库
        
        Args:
            collection: 集合名称
            query: 查询条件
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databasequery?access_token={access_token}'
        
        data = {
            'env': self.env_id,
            'query': json.dumps({
                'collection_name': collection,
                'where': query or {}
            })
        }
        
        response = requests.post(url, json=data, timeout=30)
        return response.json()


# 全局客户端实例
_cloud_client = None

def get_cloud_client():
    """获取云函数客户端单例"""
    global _cloud_client
    if _cloud_client is None:
        _cloud_client = CloudFunctionClient()
    return _cloud_client


def get_cloud_auth():
    """获取云认证客户端"""
    return CloudAuthClient(get_cloud_client())
