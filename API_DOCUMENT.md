# 勤工助学岗位匹配系统 - API接口文档（精简版）

> **注意**: 本文档为精简版，完整详细的API文档请查看 [API_FULL.md](API_FULL.md)


## 基础信息

- **调用方式**: `wx.cloud.callFunction()` （微信云开发）
- **数据格式**: JSON
- **认证方式**: 通过云函数内部验证用户openid和角色

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 接口概览

本项目采用微信云开发架构，所有接口通过云函数调用。主要包含以下云函数：

| 云函数 | 功能 | 详细文档 |
|--------|------|----------|
| auth | 用户认证 | [查看](API_FULL.md#一用户认证云函数-auth) |
| jobs | 岗位管理 | [查看](API_FULL.md#二岗位管理云函数-jobs) |
| applications | 申请管理 | [查看](API_FULL.md#三申请管理云函数-applications) |
| salary | 薪资管理 | [查看](API_FULL.md#四薪资管理云函数-salary) |
| admin | 管理员后台 | [查看](API_FULL.md#五管理员后台云函数-admin) |
| initDB | 数据库初始化 | [查看](API_FULL.md#六数据库初始化云函数-initdb) |

## 快速开始

### 1. 用户登录

```javascript
wx.cloud.callFunction({
  name: 'auth',
  data: {
    action: 'login',
    account: 'js23080509',
    password: '123456',
    role: 'student'
  }
})
```

### 2. 获取岗位列表

```javascript
wx.cloud.callFunction({
  name: 'jobs',
  data: {
    action: 'list',
    status: 'recruiting',
    pageNum: 1,
    pageSize: 10
  }
})
```

### 3. 提交申请

```javascript
wx.cloud.callFunction({
  name: 'applications',
  data: {
    action: 'submit',
    jobId: 'job_id_xxx',
    reason: '申请理由...'
  }
})
```

更多详细接口说明、参数说明、响应格式，请查看 [API_FULL.md](API_FULL.md)。

## 优化建议

如需了解接口优化方案和最佳实践，请查看 [TIP/TIP.md](TIP/TIP.md)。
