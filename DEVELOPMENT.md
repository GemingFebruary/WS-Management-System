# 勤工助学岗位匹配管理系统 - 开发文档

## 项目概述

基于微信云开发的勤工助学岗位匹配管理小程序，包含学生端和管理员端。

## 技术架构

### 前端
- 微信小程序原生框架（WXML + WXSS + JavaScript）
- 响应式设计，适配不同屏幕尺寸

### 后端
- 微信云开发（CloudBase）
- 云函数（Node.js）
- 云数据库（MongoDB）

## 项目结构

```
QINGGONG/
├── app.js                  # 应用入口（含云开发初始化）
├── app.json                # 全局配置
├── app.wxss                # 全局样式
├── pages/                  # 页面目录
│   ├── index/              # 首页
│   ├── login/              # 登录页
│   ├── register/           # 注册页
│   ├── profile/            # 个人中心
│   ├── jobList/            # 岗位列表
│   ├── jobDetail/          # 岗位详情
│   ├── applyJob/           # 岗位申请
│   ├── myApplications/     # 我的申请
│   ├── salaryQuery/        # 薪资查询
│   └── admin/              # 管理员后台
├── utils/
│   └── util.js             # 工具函数（含云调用方法）
├── cloudfunctions/         # 云函数目录
│   ├── auth/               # 用户认证
│   ├── jobs/               # 岗位管理
│   ├── applications/       # 申请管理
│   ├── salary/             # 薪资管理
│   ├── admin/              # 管理员功能
│   ├── initDB/             # 数据库初始化
│   └── common/             # 公共模块
└── cloud/                  # 云开发辅助文件
    ├── common/             # 云函数公共模块
    └── database-init.js    # 数据库初始化脚本
```

## 云函数说明

| 云函数 | 功能 | 主要接口 |
|--------|------|----------|
| auth | 用户认证 | login, register, logout, getUserInfo |
| jobs | 岗位管理 | list, detail, recommend, create, update, delete |
| applications | 申请管理 | submit, myApplications, review, cancel |
| salary | 薪资管理 | query, record, calculate, list |
| admin | 管理员功能 | stats, studentList, exportData |
| initDB | 数据库初始化 | init, reset |

## 数据库集合

| 集合 | 用途 | 权限 |
|------|------|------|
| users | 用户信息 | 读:公开, 写:云函数 |
| jobs | 岗位信息 | 读:公开, 写:云函数 |
| applications | 申请记录 | 读写:云函数 |
| salary_records | 薪资记录 | 读写:云函数 |
| system_logs | 系统日志 | 读写:云函数 |

## 快速开始

### 1. 配置环境ID

在 `app.js` 第8行修改环境ID：
```javascript
env: 'your-env-id', // 替换为实际环境ID
```

### 2. 上传云函数

右键每个云函数文件夹 → "上传并部署：云端安装依赖"

### 3. 初始化数据库

在首页点击"初始化数据库"按钮，或在控制台执行：
```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: { action: 'init' }
})
```

## 开发规范

### 命名规范
- 变量：驼峰命名（camelCase），如 `jobName`, `studentId`
- 函数：驼峰命名，如 `loadData()`, `submitApplication()`
- 页面路径：小驼峰，如 `jobList`, `myApplications`

### 代码组织
- 页面逻辑放在对应页面的 `.js` 文件中
- 公共工具函数放在 `utils/util.js`
- 云函数公共模块放在 `cloudfunctions/common/`

### API调用
使用 `utils/util.js` 中的便捷方法：
```javascript
const { callAuth, callJobs, callApplications } = require('../../utils/util')

// 示例：登录
await callAuth('login', { account, password, role })

// 示例：获取岗位列表
await callJobs('list', { status: 'recruiting' })
```

## 智能匹配算法

匹配度计算维度：
- 专业匹配（30%权重）
- 年级匹配（20%权重）
- 成绩匹配（25%权重）
- 时间匹配（25%权重）

## 默认账号

管理员账号：
- 账号：admin
- 密码：admin123
- ⚠️ 请登录后及时修改密码

## 调试方法

### 本地调试
1. 右键云函数 → "开启本地调试"
2. 在小程序中调用云函数
3. 查看"本地调试"面板日志

### 云端调试
1. 云开发控制台 → 云函数 → 选择函数 → 日志
2. 查看调用记录和错误信息

### 真机调试
1. 点击顶部"真机调试"
2. 手机扫码
3. 查看手机端日志

## 常见问题

### 云函数调用失败
- 检查云函数是否已上传部署
- 检查 app.js 中环境ID是否正确
- 查看云函数日志

### 数据库操作失败
- 检查集合是否已创建
- 检查权限配置是否正确
- 查看云开发控制台

### 页面不显示数据
- 检查 setData 是否正确调用
- 检查 WXML 中变量名是否正确
- 查看控制台错误信息

## 相关文档

- [PROJECT_README.md](PROJECT_README.md) - 项目说明
- [API_DOCUMENT.md](API_DOCUMENT.md) - API接口文档
- [images/README.md](images/README.md) - 图标说明

## 注意事项

1. **不要在前端硬编码敏感信息**（如密钥、密码）
2. **所有写操作都通过云函数**进行权限验证
3. **定期备份数据库**重要数据
4. **及时修改默认密码**（admin/admin123）
5. **生产环境移除开发工具**（首页的初始化按钮）

---

最后更新：2026-05-23
