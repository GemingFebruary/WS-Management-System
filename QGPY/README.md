# 勤工助学管理系统 - Python Flask后端

## 项目简介

本项目是勤工助学管理系统的Python Flask后端服务，实现Vue网页端、微信小程序端和微信云开发数据库的三端数据互通。

## 技术栈

- **框架**: Flask 3.0.0
- **数据库**: MongoDB + PyMongo
- **认证**: JWT (PyJWT)
- **密码加密**: bcrypt
- **跨域**: Flask-CORS
- **环境配置**: python-dotenv

## 项目结构

```
QGPY/
├── app/
│   ├── __init__.py          # Flask应用工厂
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── database.py      # 数据库连接
│   │   ├── user.py          # 用户模型
│   │   ├── job.py           # 岗位模型
│   │   ├── application.py   # 申请模型
│   │   └── salary.py        # 薪资模型
│   ├── routes/              # API路由
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证接口
│   │   ├── jobs.py          # 岗位接口
│   │   ├── applications.py  # 申请接口
│   │   ├── salary.py        # 薪资接口
│   │   └── admin.py         # 管理接口
│   └── utils/               # 工具函数
│       ├── __init__.py
│       ├── response.py      # 响应封装
│       ├── decorators.py    # 装饰器
│       ├── helpers.py       # 辅助函数
│       └── error_handler.py # 错误处理
├── config.py                # 配置文件
├── requirements.txt         # 依赖列表
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
└── run.py                   # 启动入口
```

## 安装与运行

### 1. 安装依赖

```bash
cd QGPY
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `MONGODB_URI`: MongoDB连接地址
- `JWT_SECRET_KEY`: JWT密钥
- `ALLOWED_ORIGINS`: 允许的跨域源

### 3. 启动服务

```bash
python run.py
```

服务默认运行在 http://localhost:5000

## API接口文档

### 认证接口 (auth)

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 用户登录 |
| /api/auth/register | POST | 学生注册 |
| /api/auth/logout | POST | 用户登出 |
| /api/auth/user-info | GET | 获取用户信息 |

### 岗位接口 (jobs)

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/jobs/list | GET | 获取岗位列表 |
| /api/jobs/detail | GET | 获取岗位详情 |
| /api/jobs/recommend | GET | 获取推荐岗位 |
| /api/jobs/create | POST | 创建岗位 |
| /api/jobs/update | PUT | 更新岗位 |
| /api/jobs/delete | DELETE | 删除岗位 |
| /api/jobs/toggle-status | PUT | 切换岗位状态 |

### 申请接口 (applications)

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/applications/submit | POST | 提交申请 |
| /api/applications/my-applications | GET | 我的申请列表 |
| /api/applications/detail | GET | 申请详情 |
| /api/applications/review | POST | 审核申请 |
| /api/applications/admin-list | GET | 管理员申请列表 |
| /api/applications/cancel | POST | 取消申请 |

### 薪资接口 (salary)

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/salary/query | GET | 查询薪资 |
| /api/salary/record | POST | 记录工作时长 |
| /api/salary/calculate | POST | 计算薪资 |
| /api/salary/list | GET | 薪资列表 |
| /api/salary/pay | POST | 发放薪资 |

### 管理接口 (admin)

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/admin/stats | GET | 统计数据 |
| /api/admin/student-list | GET | 学生列表 |
| /api/admin/update-student | PUT | 更新学生信息 |
| /api/admin/export-data | GET | 导出数据 |

## 三端数据互通架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vue网页端     │     │   Python后端    │     │  微信小程序端   │
│    (QGWEB)      │◄───►│    (QGPY)       │◄───►│   (QGMP)        │
│                 │     │                 │     │                 │
│  http://localhost│     │  http://localhost│     │  微信云开发     │
│     :5173       │     │     :5000       │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   MongoDB       │
                        │  (云数据库)     │
                        └─────────────────┘
```

## 数据库集合

- `users`: 用户数据
- `jobs`: 岗位数据
- `applications`: 申请数据
- `salary_records`: 薪资记录
- `work_records`: 工作时长记录

## 注意事项

1. 确保MongoDB服务已启动
2. 生产环境请修改JWT密钥
3. 配置正确的跨域源地址
4. 微信小程序端需要通过云函数调用后端API

## 微信小程序对接说明

微信小程序端需要通过云函数调用Python后端API，需要在云函数中添加HTTP调用逻辑。详见 `小程序代码问题记录.md` 中的对接方案。
