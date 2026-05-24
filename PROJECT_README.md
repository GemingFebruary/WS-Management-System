# 勤工助学岗位匹配管理系统

## 项目概述

基于微信云开发的勤工助学岗位匹配管理小程序，实现学生岗位申请、管理员审核、薪资管理等完整业务流程。

**技术栈**：微信小程序 + 微信云开发（云函数 + 云数据库）

## 快速开始

### 1. 环境准备

- 安装微信开发者工具
- 开通微信云开发服务
- 获取环境ID（云开发控制台查看）

### 2. 配置项目

修改 `app.js` 第8行的环境ID：
```javascript
env: 'your-env-id', // 替换为实际环境ID
```

### 3. 上传云函数

右键以下文件夹 → "上传并部署：云端安装依赖"：
- cloudfunctions/auth
- cloudfunctions/jobs
- cloudfunctions/applications
- cloudfunctions/salary
- cloudfunctions/admin
- cloudfunctions/initDB

### 4. 初始化数据库

在首页点击"初始化数据库"按钮，或在控制台执行：
```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: { action: 'init' }
})
```

### 5. 配置权限

在云开发控制台配置数据库集合权限（详见 [DEVELOPMENT.md](DEVELOPMENT.md)）。

## 项目结构

```
QINGGONG/
├── app.js                  # 应用入口（含云开发初始化）
├── app.json                # 全局配置
├── pages/                  # 页面目录（13个页面）
│   ├── index/              # 首页
│   ├── login/              # 登录
│   ├── register/           # 注册
│   ├── profile/            # 个人中心
│   ├── jobList/            # 岗位列表
│   ├── jobDetail/          # 岗位详情
│   ├── applyJob/           # 岗位申请
│   ├── myApplications/     # 我的申请
│   ├── salaryQuery/        # 薪资查询
│   └── admin/              # 管理员后台
├── utils/util.js           # 工具函数（含云调用）
├── cloudfunctions/         # 云函数（6个）
└── cloud/                  # 云开发辅助文件
```

## 核心功能

### 学生端
- 用户注册/登录
- 浏览岗位（搜索、筛选、智能推荐）
- 提交申请、查看进度
- 薪资查询

### 管理员端
- 数据统计看板
- 岗位管理（发布、编辑、上下架）
- 申请审核
- 薪资录入与发放

## 云函数说明

| 云函数 | 功能 |
|--------|------|
| auth | 用户认证（登录、注册） |
| jobs | 岗位管理（CRUD、智能匹配） |
| applications | 申请管理（提交、审核） |
| salary | 薪资管理（查询、发放） |
| admin | 管理员功能（统计、导出） |
| initDB | 数据库初始化 |

## 数据库设计

5个核心集合：
- **users** - 用户信息
- **jobs** - 岗位信息
- **applications** - 申请记录
- **salary_records** - 薪资记录
- **system_logs** - 系统日志

## 默认账号

- 账号：admin
- 密码：admin123
- ⚠️ 请登录后及时修改

## 开发文档

- [DEVELOPMENT.md](DEVELOPMENT.md) - 详细开发文档
- [API_DOCUMENT.md](API_DOCUMENT.md) - API接口说明
- [images/README.md](images/README.md) - 图标资源说明

## 注意事项

1. tabBar 图标需准备6个PNG文件（81x81px）放在 `images/` 目录
2. 轮播图URL需在 `app.js` 中配置
3. 生产环境请移除首页的"初始化数据库"按钮
4. 所有写操作通过云函数进行权限验证

---
