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
    
    @staticmethod
    def _escape_js_string(value):
        """转义 JavaScript 字符串中的特殊字符，防止注入"""
        if not isinstance(value, str):
            return value
        # 转义反斜杠、单引号、换行符等
        return value.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '\\r')

    @classmethod
    def _build_condition(cls, key, value):
        """
        构建单个查询条件的 JS 语法片段。

        _id 字段使用 _.eq() 包装，因为云数据库中 _id 是 ObjectId 类型，
        普通字符串比较（_id: 'xxx'）无法匹配，必须用 _.eq('xxx') 才能正确比较。
        """
        if isinstance(value, str):
            escaped = cls._escape_js_string(value)
            if key == '_id':
                return f"{key}: _.eq('{escaped}')"
            return f"{key}: '{escaped}'"
        elif isinstance(value, bool):
            return f"{key}: {str(value).lower()}"
        elif value is None:
            return f"{key}: null"
        else:
            return f"{key}: {value}"

    @staticmethod
    def _convert_dates(obj):
        """
        递归转换 MongoDB 扩展 JSON 格式：
        - {$date: ms} → ISO 日期字符串
        - {$oid: "xxx"} → 纯字符串（ObjectId）

        微信云数据库通过 HTTP API 返回的特殊格式需要统一转换。
        """
        if isinstance(obj, dict):
            # {$date: ms} → ISO 日期字符串
            if set(obj.keys()) == {'$date'} and isinstance(obj['$date'], (int, float)):
                from datetime import datetime, timezone
                dt = datetime.fromtimestamp(obj['$date'] / 1000, tz=timezone.utc)
                return dt.strftime('%Y-%m-%dT%H:%M:%S.') + f"{dt.microsecond // 1000:03d}Z"
            # {$oid: "xxx"} → ObjectId 字符串（_id 等字段）
            if set(obj.keys()) == {'$oid'} and isinstance(obj['$oid'], str):
                return obj['$oid']
            return {k: WXCloudDBClient._convert_dates(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [WXCloudDBClient._convert_dates(item) for item in obj]
        return obj

    def _build_query_string(self, collection, query=None, limit=100):
        """
        构建数据库查询语句（类MongoDB语法）

        微信云数据库API需要的是数据库查询语句字符串，格式如：
        db.collection('users').where({userId: 'xxx'}).limit(1).get()
        """
        where_clause = ''
        if query:
            # 将Python字典转换为JavaScript对象格式
            conditions = [self._build_condition(key, value) for key, value in query.items()]
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

        Returns:
            查询结果列表

        Raises:
            RuntimeError: 当微信API返回错误时抛出（集合不存在、token失效等）
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databasequery?access_token={access_token}'

        # 构建查询语句（使用正确的语法）
        query_str = self._build_query_string(collection, query, limit)

        print(f"[WXCloudDB] 查询集合: {collection} | 语句: {query_str}")

        data = {
            'env': self.env_id,
            'query': query_str
        }

        try:
            response = requests.post(url, json=data, timeout=30)
            result = response.json()

            errcode = result.get('errcode', 0)
            if errcode != 0:
                errmsg = result.get('errmsg', '未知错误')
                print(f"[WXCloudDB] ❌ 查询失败 errcode={errcode} errmsg={errmsg} | 集合: {collection}")
                # 区分"集合不存在"和其他错误
                if errcode == -502005:
                    raise RuntimeError(f"集合 '{collection}' 不存在，请先执行 initDB 初始化")
                raise RuntimeError(f"微信云数据库查询失败: errcode={errcode}, errmsg={errmsg}")

            # 解析返回的数据，并转换 {$date} 日期格式
            data_list = result.get('data', [])
            records = [self._convert_dates(json.loads(item)) for item in data_list]
            print(f"[WXCloudDB] ✅ 查询成功，集合 {collection} 返回 {len(records)} 条记录")
            return records

        except RuntimeError:
            raise
        except Exception as e:
            print(f"[WXCloudDB] ❌ 查询异常: {type(e).__name__}: {str(e)}")
            raise RuntimeError(f"云数据库查询异常: {str(e)}")
    
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
                escaped = self._escape_js_string(value)
                data_fields.append(f"{key}: '{escaped}'")
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

        # 构建where条件（_id 使用 _.eq() 匹配 ObjectId）
        where_clause = ''
        if query:
            conditions = [self._build_condition(key, value) for key, value in query.items()]
            where_clause = '{' + ', '.join(conditions) + '}'
        else:
            where_clause = '{}'

        # 构建更新数据（云数据库 update() 默认即 $set 行为，无需 $set 包装）
        update_fields = []
        for key, value in update_data.items():
            if isinstance(value, str):
                escaped = self._escape_js_string(value)
                update_fields.append(f"{key}: '{escaped}'")
            elif isinstance(value, bool):
                update_fields.append(f"{key}: {str(value).lower()}")
            elif value is None:
                update_fields.append(f"{key}: null")
            else:
                update_fields.append(f"{key}: {value}")

        update_str = '{' + ', '.join(update_fields) + '}'
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

            matched = result.get('matched', 0)
            updated = result.get('updated', 0)
            print(f"[WXCloudDB] ✅ 更新结果: matched={matched}, updated={updated}")
            return matched > 0

        except Exception as e:
            print(f"[WXCloudDB] 更新异常: {str(e)}")
            return False

    def database_delete(self, collection, query):
        """
        删除云数据库数据

        Args:
            collection: 集合名称
            query: 查询条件
        """
        access_token = self._get_access_token()
        url = f'{self.base_url}/databasedelete?access_token={access_token}'

        where_clause = ''
        if query:
            conditions = [self._build_condition(key, value) for key, value in query.items()]
            where_clause = '{' + ', '.join(conditions) + '}'
        else:
            where_clause = '{}'

        query_str = f"db.collection('{collection}').where({where_clause}).remove()"

        print(f"[WXCloudDB] 删除语句: {query_str}")

        post_data = {
            'env': self.env_id,
            'query': query_str
        }

        try:
            response = requests.post(url, json=post_data, timeout=30)
            result = response.json()

            if result.get('errcode', 0) != 0:
                print(f"[WXCloudDB] 删除失败: {result}")
                return False

            return result.get('deleted', 0) > 0

        except Exception as e:
            print(f"[WXCloudDB] 删除异常: {str(e)}")
            return False


# 全局客户端实例
_wx_cloud_db = None

def get_wx_cloud_db():
    """获取微信云数据库客户端单例"""
    global _wx_cloud_db
    if _wx_cloud_db is None:
        _wx_cloud_db = WXCloudDBClient()
    return _wx_cloud_db
