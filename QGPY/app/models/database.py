"""
数据库连接管理
"""
import os
from pymongo import MongoClient
from flask import current_app


class Database:
    """数据库管理类"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def init_app(self, app):
        """初始化数据库连接"""
        uri = app.config.get('MONGODB_URI', 'mongodb://localhost:27017/qinggong')
        self._client = MongoClient(uri)
        self._db = self._client.get_database()
    
    @property
    def db(self):
        """获取数据库对象"""
        if self._db is None:
            raise RuntimeError('数据库未初始化，请先调用init_app')
        return self._db
    
    @property
    def users(self):
        """用户集合"""
        return self.db.users
    
    @property
    def jobs(self):
        """岗位集合"""
        return self.db.jobs
    
    @property
    def applications(self):
        """申请集合"""
        return self.db.applications
    
    @property
    def salary_records(self):
        """薪资记录集合"""
        return self.db.salary_records
    
    def close(self):
        """关闭数据库连接"""
        if self._client:
            self._client.close()


# 全局数据库实例
db = Database()
