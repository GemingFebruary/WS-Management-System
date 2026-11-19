# 后端开发文档 — 勤工助学岗位匹配系统（QGPY）

> 本文档基于学年论文《勤工助学岗位匹配管理系统分析与前端页面设计》的系统设计章节，结合 QGPY 后端实际代码，记录后端架构、路由、模型、认证机制及与设计文档的映射关系。
>
> 最后更新：2026-06-10

---

## 一、架构概览

### 1.1 设计文档 → 实际实现映射

设计文档提出四层架构，QGPY 的实际实现如下：

| 设计文档层次 | 职责 | QGPY 实现 |
|-------------|------|-----------|
| **表现层** | 接收用户请求，展示数据 | QGWEB (Vue 3) + QGMP (小程序) |
| **业务逻辑层** | 处理业务逻辑，提供统一接口 | `app/routes/` 五个蓝图（auth/jobs/applications/salary/admin） |
| **数据访问层** | 封装数据操作，降低耦合 | `app/models/*_cloud.py` 四个 Cloud 模型 + `app/utils/wx_cloud_db.py` |
| **数据存储层** | 存储所有数据 | 微信云数据库（MongoDB 兼容），通过 HTTP API 访问 |

> **重要说明**: 设计文档原文提到 MySQL + JDBC 架构，实际实现采用**微信云数据库 + HTTP API** 方案。这是开发过程中的合理调整——微信云数据库与小程序云开发天然集成，且通过 `wx_cloud_db.py` 封装的 HTTP API 可供 Python 后端访问，实现了三端数据统一。

### 1.2 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| Web 框架 | Flask | 3.0.0 |
| 跨域支持 | Flask-CORS | 4.0.0 |
| 认证 | PyJWT + bcrypt | 2.8.0 / 4.1.2 |
| 数据库访问 | 微信云数据库 HTTP API | — |
| 本地数据库（备用） | PyMongo (MongoDB) | 4.6.1 |
| 环境配置 | python-dotenv | 1.0.0 |
| 部署 | gunicorn | 21.2.0 |
| HTTP 客户端 | requests | 2.31.0 |

### 1.3 目录结构

```
QGPY/
├── app/
│   ├── __init__.py              # Flask 应用工厂（create_app）
│   ├── routes/                  # 业务逻辑层 — 路由蓝图
│   │   ├── auth.py              # 认证路由（登录/注册/个人信息）
│   │   ├── jobs.py              # 岗位路由（CRUD/搜索/推荐）
│   │   ├── applications.py      # 申请路由（提交/查看/审核/取消）
│   │   ├── salary.py            # 薪资路由（查询/记录/发放）
│   │   └── admin.py             # 管理路由（统计/学生管理/公告/导出）
│   ├── models/                  # 数据访问层 — 模型
│   │   ├── database.py          # 本地 MongoDB 连接（备用）
│   │   ├── user.py              # 用户模型（本地 MongoDB）
│   │   ├── user_cloud.py        # 用户模型（云数据库 HTTP API）
│   │   ├── job.py               # 岗位模型（本地 MongoDB）
│   │   ├── job_cloud.py         # 岗位模型（云数据库 HTTP API）
│   │   ├── application.py       # 申请模型（本地 MongoDB）
│   │   ├── application_cloud.py # 申请模型（云数据库 HTTP API）
│   │   ├── salary.py            # 薪资模型（本地 MongoDB）
│   │   └── salary_cloud.py      # 薪资模型（云数据库 HTTP API）
│   └── utils/                   # 工具层
│       ├── __init__.py          # 统一导出
│       ├── response.py          # 统一响应格式（success/error/bad_request 等）
│       ├── decorators.py        # 装饰器（login_required/admin_required/student_required）
│       ├── helpers.py           # 辅助函数（generate_id/calculate_match_score 等）
│       ├── error_handler.py     # 全局错误处理（400/401/403/404/405/500）
│       ├── wx_cloud_db.py       # 微信云数据库客户端（核心）
│       └── cloud_function_client.py  # 云函数 HTTP 调用客户端（备用）
├── config.py                    # 多环境配置（dev/prod/testing）
├── run.py                       # 启动脚本
├── requirements.txt             # Python 依赖
├── .env                         # 环境变量（不纳入版本控制）
├── .env.example                 # 环境变量模板
└── .gitignore                   # Git 忽略规则
```

---

## 二、设计文档七大模块 → 后端实现对照

### 2.1 用户管理模块

**设计要求**: 注册、登录、个人信息管理、用户权限管理

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 学生注册 | 填写学号/姓名/专业/年级/联系方式/家庭情况 | `POST /api/auth/register` | `auth.py` |
| 用户登录 | 账号密码验证，返回角色对应页面 | `POST /api/auth/login` | `auth.py` |
| 查看个人信息 | 学生/管理员查看个人信息 | `GET /api/auth/user-info` | `auth.py` |
| 修改个人信息 | 修改联系方式/可工作时间/个人技能 | `PUT /api/auth/update-profile` | `auth.py` |
| 修改密码 | 输入当前密码+新密码 | `PUT /api/auth/change-password` | `auth.py` |
| 用户权限管理 | 管理员管理用户角色和权限 | `GET/PUT /api/admin/students` | `admin.py` |

**实现细节**:
- 密码使用 bcrypt 加密存储（盐值轮数 10）
- 登录成功返回 JWT Token（7 天有效期）
- 注册时自动验证学号格式、手机号格式、邮箱格式
- `update-profile` 仅允许修改 phone/email/freeTime/skills 字段

### 2.2 岗位管理模块

**设计要求**: 岗位发布、编辑删除、查询筛选、状态管理

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 岗位发布 | 填写岗位名称/描述/要求/工作时间/薪酬/招聘人数 | `POST /api/jobs/create` | `jobs.py` |
| 岗位编辑 | 修改已发布岗位信息 | `PUT /api/jobs/update/:id` | `jobs.py` |
| 岗位删除 | 删除不需要的岗位 | `DELETE /api/jobs/delete/:id` | `jobs.py` |
| 岗位列表 | 按名称/类型/部门/状态筛选 | `GET /api/jobs/list` | `jobs.py` |
| 岗位详情 | 查看单个岗位完整信息 | `GET /api/jobs/detail/:id` | `jobs.py` |
| 岗位推荐 | 根据匹配度推荐岗位 | `GET /api/jobs/recommend` | `jobs.py` |
| 状态管理 | 设置发布中/已招满/已关闭 | `PUT /api/jobs/toggle-status/:id` | `jobs.py` |

**实现细节**:
- 岗位更新使用白名单模式，仅允许修改 15 个指定字段（防止注入 `role`/`createdBy` 等）
- 关键词搜索通过 `escapeRegExp()` 转义特殊字符（防正则注入）
- 分页查询 `pageSize` 上限 50（防恶意大量请求）
- 岗位 ID 兼容 `_id` 和 `jobId` 两种格式（双路径查找）

### 2.3 智能匹配模块

**设计要求**: 匹配参数设置、智能匹配计算、匹配结果展示、岗位推荐

| 功能 | 设计要求 | QGPY 实现 | 位置 |
|------|---------|-----------|------|
| 匹配度计算 | 基于专业/年级/成绩/时间四维度 | `calculate_match_score()` | `helpers.py` |
| 岗位推荐 | 为学生推荐匹配度高的岗位 | `GET /api/jobs/recommend` | `jobs.py` |
| 列表匹配度 | 岗位列表附带匹配分数 | `GET /api/jobs/list`（已登录时） | `jobs.py` |

**匹配算法**（来自设计文档 + 实际实现）:

| 维度 | 权重 | 匹配逻辑 |
|------|------|---------|
| 专业匹配 | 30% | 岗位 `requiredMajor` 为空（不限）或与学生 `major` 一致 |
| 年级匹配 | 20% | 岗位 `requiredGrade` 为空（不限）或与学生 `grade` 一致 |
| 成绩匹配 | 25% | 学生 `gpa` ≥ 岗位 `minGpa`（默认 0 不限） |
| 时间匹配 | 25% | 学生 `freeTime` 与岗位 `workTime` 的时间段重叠度 |

> **注意**: 早期版本使用 `random.randint(60, 99)` 生成随机匹配分数（已修复），现已改为调用 `calculate_match_score()` 真实计算。

### 2.4 申请审核模块

**设计要求**: 申请提交、申请查看、申请审核、结果反馈

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 提交申请 | 选择岗位，填写申请信息 | `POST /api/applications/submit` | `applications.py` |
| 我的申请 | 学生查看自身申请记录 | `GET /api/applications/my` | `applications.py` |
| 申请详情 | 查看单条申请详情 | `GET /api/applications/detail/:id` | `applications.py` |
| 取消申请 | 学生取消 pending 状态的申请 | `PUT /api/applications/cancel/:id` | `applications.py` |
| 审核列表 | 管理员查看待审核申请 | `GET /api/applications/admin-list` | `applications.py` |
| 审核操作 | 通过或驳回，驳回需填写原因 | `PUT /api/applications/review/:id` | `applications.py` |

**业务规则**:
- 同一学生对同一岗位仅允许一条 `pending` 或 `approved` 记录（被驳回后可重新申请）
- 已处理的申请不能再次审核（防重复审核）
- 驳回时强制要求填写 `rejectReason`
- 申请提交时冻结学生信息快照（`studentInfo` 字段），后续修改不影响已提交申请

**状态流转**:
```
pending → approved（通过）
pending → rejected（驳回）
pending → cancelled（学生主动取消）
rejected → pending（重新申请）
```

### 2.5 薪酬管理模块

**设计要求**: 薪酬标准设置、工作时长记录、薪酬计算、薪酬明细查看

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 薪资查询 | 学生查看薪资明细和汇总 | `GET /api/salary/query` | `salary.py` |
| 薪资列表 | 学生查看薪资记录列表 | `GET /api/salary/list` | `salary.py` |
| 记录工时 | 管理员录入工作时长 | `POST /api/salary/record` | `salary.py` |
| 标记发放 | 管理员标记薪资已发放 | `PUT /api/salary/pay` | `salary.py` |
| 薪资统计 | 管理员查看薪资统计 | `GET /api/salary/stats` | `salary.py` |

**薪资计算规则**:
- `amount = workHours × hourlyRate`
- 工作时长范围：0.5 ~ 24 小时
- 时薪范围：1 ~ 500 元
- 月份自动从 `workDate` 提取（格式 `YYYY-MM`）
- 支持按记录 ID 数组或按月份批量发放

### 2.6 数据统计模块

**设计要求**: 岗位数据统计、学生数据统计、申请数据统计、薪酬数据统计、报表导出

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 管理统计 | 四项统计数据（岗位/待审核/学生/薪资） | `GET /api/admin/stats` | `admin.py` |
| 数据导出 | 导出申请/学生/薪资数据为 JSON | `GET /api/admin/export` | `admin.py` |
| 学生列表 | 搜索/查看所有学生 | `GET /api/admin/students` | `admin.py` |
| 公告管理 | 发布/查看/删除公告 | `GET/POST/DELETE /api/admin/notices` | `admin.py` |

> **设计文档 vs 实际**: 设计文档要求导出 Excel 格式，当前实现为 JSON 下载。Excel 导出可通过前端 `xlsx` 库实现，后端提供 JSON 数据即可。

### 2.7 系统设置模块

**设计要求**: 系统参数设置、密码重置、日志管理、数据备份与恢复

| 功能 | 设计要求 | QGPY 实现 | 路由 |
|------|---------|-----------|------|
| 密码重置 | 管理员重置学生密码 | `PUT /api/admin/reset-password` | `admin.py` |
| 公告系统 | 发布系统公告 | `POST /api/admin/notices` | `admin.py` |
| 系统信息 | 查看系统版本等信息 | 前端展示 | — |

> **未实现功能**: 日志管理（system_logs 集合已有但无查询接口）、数据备份与恢复（依赖云开发控制台手动操作）、系统参数设置（当前硬编码在 config.py）。

---

## 三、核心模块详解

### 3.1 应用工厂 — `app/__init__.py`

Flask 应用工厂模式，职责：
1. 加载配置（`config.py` 按环境区分 dev/prod/testing）
2. 启用 CORS（允许 `http://localhost:3001` 等来源）
3. 注册 5 个路由蓝图（统一 `/api/` 前缀）
4. 注册全局错误处理器
5. 初始化微信云数据库客户端
6. 添加请求日志中间件（开发调试用）
7. 提供 `/health` 和 `/` 健康检查端点

```python
# 蓝图注册
app.register_blueprint(auth_bp,          url_prefix='/api/auth')
app.register_blueprint(jobs_bp,          url_prefix='/api/jobs')
app.register_blueprint(applications_bp,  url_prefix='/api/applications')
app.register_blueprint(salary_bp,        url_prefix='/api/salary')
app.register_blueprint(admin_bp,         url_prefix='/api/admin')
```

### 3.2 微信云数据库客户端 — `app/utils/wx_cloud_db.py`

**核心类**: `WXCloudDBClient`

这是 QGPY 后端最关键的组件，负责通过腾讯云 HTTP API 访问微信云数据库。

**工作原理**:
1. 使用 `WX_APPID` + `WX_SECRET` 获取 `access_token`（带缓存，2 小时有效）
2. 通过 `https://api.weixin.qq.com/tcb/databasequery` 等 API 操作云数据库
3. 查询结果经过 `_convert_dates()` 递归转换 MongoDB 扩展 JSON 格式

**主要方法**:

| 方法 | 说明 |
|------|------|
| `database_query(collection, query, limit)` | 查询集合数据 |
| `database_add(collection, data)` | 新增记录 |
| `database_update(collection, query, data)` | 更新记录 |
| `database_delete(collection, query)` | 删除记录 |
| `_convert_dates(obj)` | 递归转换 `{$date: ms}` 为 ISO 字符串 |
| `_escape_js_string(s)` | 转义字符串中的特殊字符（防注入） |

**日期转换**（`_convert_dates`）:
微信云数据库的 `db.serverDate()` 返回 MongoDB 扩展 JSON 格式 `{$date: 1781083175517}`，此方法在查询结果返回时统一转换为 ISO 字符串 `"2026-06-10T06:39:35.517Z"`，避免前端和 Python 代码处理原始格式。

### 3.3 认证机制 — `app/utils/decorators.py` + `app/routes/auth.py`

**Token 流程**:
```
登录 → 验证密码(bcrypt) → 生成 JWT Token → 返回前端
请求 → Authorization: Bearer <token> → jwt.decode 验证 → 注入 g.user_id / g.role
```

**三个装饰器**:

| 装饰器 | 作用 | 使用场景 |
|--------|------|---------|
| `@login_required` | 验证 JWT Token 有效性 | 需要登录的接口 |
| `@admin_required` | 验证 Token + 角色为 admin | 管理员专属接口 |
| `@student_required` | 验证 Token + 角色为 student | 学生专属接口 |

**JWT Payload 结构**:
```json
{
  "user_id": "js23080509",
  "role": "student",
  "exp": 1781687975,
  "iat": 1781083175
}
```

### 3.4 统一响应格式 — `app/utils/response.py`

所有接口统一返回格式：

```json
// 成功
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误
{
  "code": 400,
  "message": "请求参数不能为空",
  "data": null
}
```

**便捷函数**:

| 函数 | 等价调用 |
|------|---------|
| `success(data)` | `jsonify({code: 200, message: 'success', data})` |
| `error(code, msg)` | `jsonify({code, message: msg, data: None})` |
| `bad_request(msg)` | `error(400, msg)` |
| `unauthorized(msg)` | `error(401, msg)` |
| `forbidden(msg)` | `error(403, msg)` |
| `not_found(msg)` | `error(404, msg)` |

### 3.5 全局错误处理 — `app/utils/error_handler.py`

捕获 Flask 标准 HTTP 异常并返回统一格式：

| HTTP 状态码 | 处理 | 中文提示 |
|------------|------|---------|
| 400 | `bad_request_handler` | 请求参数错误 |
| 401 | `unauthorized_handler` | 未授权，请先登录 |
| 403 | `forbidden_handler` | 权限不足 |
| 404 | `not_found_handler` | 资源不存在 |
| 405 | `method_not_allowed_handler` | 请求方法不允许 |
| 500 | `internal_error_handler` | 服务器内部错误 |

### 3.6 辅助函数 — `app/utils/helpers.py`

| 函数 | 说明 |
|------|------|
| `generate_id(prefix)` | 生成唯一 ID（时间戳 + 随机串，如 `APP20260610143025a1b2c3`） |
| `calculate_match_score(user, job)` | 四维度匹配度计算（专业 30% + 年级 20% + 成绩 25% + 时间 25%） |
| `get_status_text(status)` | 状态码转中文文本 |
| `paginate(query, page, size)` | 分页处理工具 |

---

## 四、双模型架构说明

QGPY 存在两套并行的模型层：

| 模型 | 数据库 | 状态 |
|------|--------|------|
| `user.py` / `job.py` / `application.py` / `salary.py` | 本地 MongoDB（PyMongo） | **备用**，当前未使用 |
| `user_cloud.py` / `job_cloud.py` / `application_cloud.py` / `salary_cloud.py` | 微信云数据库 HTTP API | **主用**，全部路由使用 |

**为什么保留两套？**

1. **本地开发调试**: 本地 MongoDB 无需网络，启动即用
2. **测试隔离**: 可在本地数据库做测试，不影响云数据库
3. **渐进迁移**: 未来若需迁移到独立 MongoDB，只需切换 import

路由文件统一使用 `Cloud` 版本：
```python
from app.models.job_cloud import JobCloud as Job
from app.models.user_cloud import UserCloud as User
```

---

## 五、配置管理 — `config.py`

### 5.1 环境变量（`.env` 文件）

```env
# 微信云开发配置（必填）
WX_CLOUD_ENV_ID=cloud1-d7g94p70f23bf5769
WX_APPID=your_appid
WX_SECRET=your_secret

# JWT 配置（生产环境必填）
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRE_DAYS=7

# Flask 配置
FLASK_ENV=development
FLASK_PORT=5000

# CORS 配置
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# MongoDB 配置（备用，本地开发用）
MONGODB_URI=mongodb://localhost:27017/qinggong
```

### 5.2 安全机制

- `JWT_SECRET_KEY` 缺失时发出 `warnings.warn()` 警告（不再静默使用弱密钥）
- `WX_CLOUD_ENV_ID` 不再提供硬编码回退值（避免 .env 泄露真实 ID）
- 生产环境通过 `FLASK_ENV=production` 启用 `ProductionConfig`（DEBUG=False）

---

## 六、非功能需求实现对照

### 6.1 性能需求

| 设计要求 | 实现方案 | 状态 |
|---------|---------|------|
| Web 端页面加载 < 3s | Vue 3 + Vite 构建优化 | ✅ |
| 小程序端页面加载 < 2s | 原生小程序 + 云函数 | ✅ |
| 操作响应 < 1s | 云数据库 HTTP API + 缓存 access_token | ✅ |
| 支持 100 并发 | Flask + gunicorn 多 worker | ✅ |
| 存储 10000+ 学生 | 微信云数据库无上限 | ✅ |

### 6.2 安全需求

| 设计要求 | 实现方案 | 状态 |
|---------|---------|------|
| 账号密码认证 | JWT Token + bcrypt | ✅ |
| 密码加密存储 | bcrypt（盐值轮数 10） | ✅ |
| 权限控制 | 三级装饰器（login/admin/student） | ✅ |
| 防 SQL 注入 | NoSQL 数据库 + 字段白名单 | ✅ |
| 防 XSS 攻击 | `sanitizeText()` 文本清理 | ✅ |
| 防正则注入 | `escapeRegExp()` 特殊字符转义 | ✅ |
| 错误信息脱敏 | catch 块不返回 `err.message` | ✅ |
| 敏感数据保护 | 查询返回时排除 password/openid | ✅ |

### 6.3 可扩展性

| 设计要求 | 实现方案 |
|---------|---------|
| 模块化设计 | Flask Blueprint 蓝图机制，五个独立模块 |
| 便于新增功能 | 新增路由文件 + 注册蓝图即可 |
| 双端数据同步 | 共用云数据库，三端数据实时一致 |

---

## 七、API 端点完整列表

### 7.1 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/login` | 用户登录 | 公开 |
| POST | `/register` | 学生注册 | 公开 |
| GET | `/user-info` | 获取当前用户信息 | 登录 |
| PUT | `/update-profile` | 修改个人信息 | 登录 |
| PUT | `/change-password` | 修改密码 | 登录 |

### 7.2 岗位模块 `/api/jobs`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/list` | 岗位列表（筛选/排序/分页） | 公开 |
| GET | `/detail/:id` | 岗位详情 | 公开 |
| GET | `/recommend` | 推荐岗位（匹配度排序） | 登录 |
| POST | `/create` | 创建岗位 | 管理员 |
| PUT | `/update/:id` | 更新岗位 | 管理员 |
| DELETE | `/delete/:id` | 删除岗位 | 管理员 |
| PUT | `/toggle-status/:id` | 切换岗位状态 | 管理员 |

### 7.3 申请模块 `/api/applications`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/submit` | 提交申请 | 学生 |
| GET | `/my` | 我的申请列表 | 学生 |
| GET | `/detail/:id` | 申请详情 | 登录 |
| PUT | `/cancel/:id` | 取消申请 | 学生 |
| GET | `/admin-list` | 管理员查看申请列表 | 管理员 |
| PUT | `/review/:id` | 审核申请（通过/驳回） | 管理员 |

### 7.4 薪资模块 `/api/salary`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/query` | 查询薪资信息 | 登录 |
| GET | `/list` | 薪资记录列表 | 登录 |
| POST | `/record` | 记录工时 | 管理员 |
| PUT | `/pay` | 标记发放 | 管理员 |
| GET | `/stats` | 薪资统计 | 管理员 |

### 7.5 管理模块 `/api/admin`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/stats` | 管理统计数据 | 管理员 |
| GET | `/students` | 学生列表（搜索） | 管理员 |
| PUT | `/students/:id` | 更新学生信息 | 管理员 |
| PUT | `/reset-password` | 重置学生密码 | 管理员 |
| GET | `/export` | 数据导出 | 管理员 |
| GET | `/notices` | 获取公告列表 | 公开 |
| POST | `/notices` | 发布公告 | 管理员 |
| DELETE | `/notices/:id` | 删除公告 | 管理员 |

---

## 八、启动与部署

### 8.1 本地开发

```bash
# 1. 进入后端目录
cd QGPY

# 2. 创建虚拟环境（首次）
python -m venv ../.venv
source ../.venv/Scripts/activate   # Windows
# source ../.venv/bin/activate     # macOS/Linux

# 3. 安装依赖
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 填入真实值

# 5. 启动服务
python run.py
# 服务运行在 http://localhost:5000
```

### 8.2 生产部署

```bash
# 使用 gunicorn 部署
FLASK_ENV=production gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

### 8.3 健康检查

```bash
# 基础检查
curl http://localhost:5000/health
# → {"code": 200, "message": "服务正常运行"}

# 云数据库连通性检查（调试用）
curl http://localhost:5000/api/admin/debug-cloud-db
```

---

## 九、与设计文档差异说明

| 项目 | 设计文档 | 实际实现 | 调整原因 |
|------|---------|---------|---------|
| 数据库 | MySQL + JDBC | 微信云数据库 + HTTP API | 三端数据统一，与小程序云开发天然集成 |
| 数据访问层 | JDBC 连接 | `wx_cloud_db.py` HTTP API 封装 | 适配云数据库访问方式 |
| 智能匹配 | 独立匹配结果表 | 岗位列表实时计算 | 减少数据冗余，匹配度随学生信息变化自动更新 |
| 数据导出 | Excel 格式 | JSON 格式 | 后端提供 JSON，前端可用 `xlsx` 库转 Excel |
| 日志管理 | 独立日志查询页面 | system_logs 集合已创建，无查询接口 | 待后续开发 |
| 数据备份 | 自动备份+恢复 | 手动导出+云开发控制台 | 微信云开发暂不提供自动备份 API |
| 系统参数设置 | 可配置系统名称/超时等 | 硬编码在 config.py | 待后续开发管理界面 |

---

*本文档随 QGPY 后端代码更新同步维护。*
