"""
微信云数据库客户端
通过腾讯云开发 HTTP API 访问微信云数据库
"""
import requests
import json
import time
from flask import current_app


class WXCloudDBClient:
    """微信云数据库客户端"""
    
    def __init__(self):
        self.env_id = None
        self.appid = None
        self.secret = None
        self.access_token = None
        self.token_expire_time = 0
        self.base_url = 'https://api.weixin.qq.com/tcb'
    
    def init_app(self, app):
        """从Flask应用配置初始化"""
        self.env_id = app.config.get('WX_CLOUD_ENV_ID', 'cloud1-d7g94p70f23bf5769')
        self.appid = app.config.get('WX_APPID', '')
        self.secret = app.config.get('WX_SECRET', '')
    
    def _get_access_token(self):
        """获取微信接口调用凭证（带缓存）"""
        # 检查token是否有效
        if self.access_token and time.time() < self.token_expire_time:
            return self.access_token
        
        if not self.appid or not self.secret:
            raise RuntimeError('未配置微信APPID或SECRET')
        
        url = f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={self.appid}&secret={self.secret}'
        
        try:
            response = requests.get(url, timeout=10)
            result = response.json()
            
            if 'access_token' not in result:
                raise RuntimeError(f'获取access_token失败: {result}')
            
            self.access_token = result['access_token']
            # token有效期7200秒，提前300秒刷新
            self.token_expire_time = time.time() + result.get('expires_in', 7200) - 300
            
            return self.access_token
            
        except Exception as e:
            print(f"[WXCloudDB] 获取access_token失败: {str(e)}")
            raise
    
    def _build_query_string(self, collection, query=None, limit=100):
        """
        构建数据库查询语句（类MongoDB语法）
        
        微信云数据库API需要的是数据库查询语句字符串，格式如：
        db.collection('users').where({userId: 'xxx'}).limit(1).get()
        """
        where_clause = ''
        if query:
            # 将Python字典转换为JavaScript对象格式
            conditions = []
            for key, value in query.items():
                if isinstance(value, str):
                    conditions.append(f"{key}: '{value}'")
                else:
                    conditions.append(f"{key}: {value}")
            where_clause = '{' + ', '.join(conditions) + '}'
        else:
            where_clause = '{}'
        
        # 构建查询语句
        query_str = f"db.collection('{collection}').where({where_clause}).limit({limit}).get()"
        return query_str
    
    def database_query(self, collection, query=None, limit=100):
        """
        查询云数据库
        
        Args:
            collection: 集合名称
            query: 查询条件（字典）
            limit: 返回数量限制
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databasequery?access_token={access_token}'
        
        # 构建查询语句（使用正确的语法）
        query_str = self._build_query_string(collection, query, limit)
        
        print(f"[WXCloudDB] 查询语句: {query_str}")
        
        data = {
            'env': self.env_id,
            'query': query_str
        }
        
        try:
            response = requests.post(url, json=data, timeout=30)
            result = response.json()
            
            if result.get('errcode', 0) != 0:
                print(f"[WXCloudDB] 查询失败: {result}")
                return []
            
            # 解析返回的数据
            data_list = result.get('data', [])
            print(f"[WXCloudDB] 查询成功，返回 {len(data_list)} 条记录")
            return [json.loads(item) for item in data_list]
            
        except Exception as e:
            print(f"[WXCloudDB] 查询异常: {str(e)}")
            return []
    
    def database_add(self, collection, data):
        """
        添加数据到云数据库
        
        Args:
            collection: 集合名称
            data: 要添加的数据（字典）
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databaseadd?access_token={access_token}'
        
        # 构建添加语句
        # 将Python字典转换为JavaScript对象格式
        data_fields = []
        for key, value in data.items():
            if isinstance(value, str):
                data_fields.append(f"{key}: '{value}'")
            elif isinstance(value, bool):
                data_fields.append(f"{key}: {str(value).lower()}")
            elif value is None:
                data_fields.append(f"{key}: null")
            else:
                data_fields.append(f"{key}: {value}")
        
        data_str = '{' + ', '.join(data_fields) + '}'
        query_str = f"db.collection('{collection}').add({{data: {data_str}}})"
        
        print(f"[WXCloudDB] 添加语句: {query_str}")
        
        post_data = {
            'env': self.env_id,
            'query': query_str
        }
        
        try:
            response = requests.post(url, json=post_data, timeout=30)
            result = response.json()
            
            if result.get('errcode', 0) != 0:
                print(f"[WXCloudDB] 添加失败: {result}")
                return None
            
            return result.get('id_list', [None])[0]
            
        except Exception as e:
            print(f"[WXCloudDB] 添加异常: {str(e)}")
            return None
    
    def database_update(self, collection, query, update_data):
        """
        更新云数据库数据
        
        Args:
            collection: 集合名称
            query: 查询条件
            update_data: 更新的数据
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databaseupdate?access_token={access_token}'
        
        # 构建where条件
        where_clause = ''
        if query:
            conditions = []
            for key, value in query.items():
                if isinstance(value, str):
                    conditions.append(f"{key}: '{value}'")
                else:
                    conditions.append(f"{key}: {value}")
            where_clause = '{' + ', '.join(conditions) + '}'
        else:
            where_clause = '{}'
        
        # 构建更新数据
        update_fields = []
        for key, value in update_data.items():
            if isinstance(value, str):
                update_fields.append(f"{key}: '{value}'")
            elif isinstance(value, bool):
                update_fields.append(f"{key}: {str(value).lower()}")
            elif value is None:
                update_fields.append(f"{key}: null")
            else:
                update_fields.append(f"{key}: {value}")
        
        update_str = '{$set: {' + ', '.join(update_fields) + '}}'
        query_str = f"db.collection('{collection}').where({where_clause}).update({{data: {update_str}}})"
        
        print(f"[WXCloudDB] 更新语句: {query_str}")
        
        post_data = {
            'env': self.env_id,
            'query': query_str
        }
        
        try:
            response = requests.post(url, json=post_data, timeout=30)
            result = response.json()
            
            if result.get('errcode', 0) != 0:
                print(f"[WXCloudDB] 更新失败: {result}")
                return False
            
            return result.get('matched', 0) > 0
            
        except Exception as e:
            print(f"[WXCloudDB] 更新异常: {str(e)}")
            return False


# 全局客户端实例
_wx_cloud_db = None

def get_wx_cloud_db():
    """获取微信云数据库客户端单例"""
    global _wx_cloud_db
    if _wx_cloud_db is None:
        _wx_cloud_db = WXCloudDBClient()
    return _wx_cloud_db
