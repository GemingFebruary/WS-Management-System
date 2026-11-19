# 项目文档结构说明

## 📁 文档组织

本项目采用精简的文档结构，只保留核心必要的文档。

### 根目录文档（6个）

```
QINGGONG/
├── README.md                    # 📖 项目入口文档（本文档）
├── PROJECT_README.md            # 📋 项目详细说明
├── DEVELOPMENT.md               # 🔧 开发指南
├── API_DOCUMENT.md              # 📡 API接口（精简版）
├── API_FULL.md                  # 📡 API接口（完整版）
└── images/README.md             # 🎨 图标说明
```

### 文档用途说明

| 文档 | 用途 | 适用人群 |
|------|------|----------|
| README.md | 快速开始、项目概览 | 所有用户 |
| PROJECT_README.md | 详细功能说明、技术架构 | 开发者、产品经理 |
| DEVELOPMENT.md | 开发规范、调试方法 | 开发人员 |
| API_DOCUMENT.md | API快速参考 | 前端开发 |
| API_FULL.md | 完整API文档（28个接口） | 前后端开发 |
| images/README.md | UI图标说明 | UI设计、前端开发 |

## 🗂️ 代码结构

```
QINGGONG/
├── app.js                       # 应用入口（云开发初始化）
├── app.json                     # 全局配置
├── app.wxss                     # 全局样式
├── project.config.json          # 项目配置
│
├── pages/                       # 页面目录
│   ├── index/                   # 首页
│   ├── login/                   # 登录页
│   ├── register/                # 注册页
│   ├── profile/                 # 个人中心
│   ├── jobList/                 # 岗位列表 ✅ 已集成云函数
│   ├── jobDetail/               # 岗位详情
│   ├── applyJob/                # 岗位申请
│   ├── myApplications/          # 我的申请 ✅ 已集成云函数
│   ├── salaryQuery/             # 薪资查询
│   └── admin/                   # 管理员后台
│
├── utils/
│   └── util.js                  # 工具函数（云调用封装）
│
├── cloudfunctions/              # 云函数目录
│   ├── auth/                    # 用户认证 ✅
│   ├── jobs/                    # 岗位管理 ✅
│   ├── applications/            # 申请管理 ✅
│   ├── salary/                  # 薪资管理 ✅
│   ├── admin/                   # 管理员功能 ✅
│   ├── initDB/                  # 数据库初始化 ✅
│   ├── seedData/                # 测试数据生成 ✅
│   └── common/                  # 公共模块（本地开发用）
│       ├── response.js          # 响应格式
│       └── auth.js              # 认证中间件
│
└── cloud/                       # 云开发辅助文件
    └── database-init.js         # 数据库初始化脚本（可选）
```

## 📌 重要提示

### 云函数部署注意事项

1. **每个云函数必须自包含依赖**
   - common目录已复制到每个云函数内部
   - 引用路径使用 `./common/` 而非 `../common/`

2. **上传方式**
   - 右键云函数文件夹
   - 选择"上传并部署：云端安装依赖"
   - 不要上传根目录的common文件夹

3. **必须上传的云函数（7个）**
   - auth, jobs, applications, salary, admin, initDB, seedData

### 数据库权限配置

在云开发控制台配置各集合的安全规则：

**users 和 jobs 集合**：
```json
{ "read": true, "write": false }
```

**applications、salary_records、system_logs 集合**：
```json
{ "read": false, "write": false }
```

## 🚀 快速部署流程

1. 修改 `app.js` 中的环境ID
2. 上传7个云函数（右键 → 上传并部署：云端安装依赖）
3. 点击首页"初始化数据库"按钮
4. （可选）调用seedData生成测试数据
5. 配置数据库权限

## 📞 获取帮助

- 查看 [DEVELOPMENT.md](DEVELOPMENT.md) 了解开发规范
- 查看 [API_FULL.md](API_FULL.md) 了解接口详情
- 查看云函数日志排查问题
- 使用微信开发者工具的调试工具

---

**文档维护原则**：
- 保持文档精简，只保留核心内容
- 及时更新过时的信息
- 删除临时调试文档
- 重要变更同步到相关文档

最后更新：2026-05-23
