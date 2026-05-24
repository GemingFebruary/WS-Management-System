"""
数据库模型模块
"""
from .database import Database
from .user import User
from .job import Job
from .application import Application
from .salary import Salary

__all__ = ['Database', 'User', 'Job', 'Application', 'Salary']
