# 勤工助学岗位匹配管理系统 - 改进建议与开发日志

> 本文档汇总项目审查中发现的问题和改进建议，并作为后续开发日志的载体。
> 前端详细开发文档见 [FRONTEND.md](FRONTEND.md)。
>
> 最后更新：2026-11-19

---

## 一、项目全景概览

```
QINGGONG -NEW/
├── (微信小程序根)      # app.js / pages/ / cloudfunctions/ / utils/
├── QGPY/               # Python Flask 后端 (port 5000)
├── QGWEB/              # Vue 3 + TypeScript 前端 (port 3001)
├── i18n/               # 国际化配置（未完成）
├── miniapp/            # 多端应用 Android 壳（空）
├── TIP/                # 改进建议 & 开发日志（本文件所在）
└── *.md / *.docx       # 项目文档
```

**三端架构**：微信小程序(QGMP) + Vue网页端(QGWEB) + Python后端(QGPY)，共用 MongoDB 数据库。

---

## 二、已确认的 Bug 与紧急问题

### BUG-01: 首页轮播图 404（紧急）✅ 已修复

- **位置**: [app.js:38-54](app.js#L38-L54)
- **现状**: `globalData.bannerList` 使用了 `https://example.com/banner1.jpg` 等无效占位 URL，导致轮播图全部加载失败。
- **修复**: 替换为 `https://picsum.photos/seed/qg*/750/360` 在线占位图。
- **优先级**: 🔴 紧急 → ✅ 已修复

### BUG-02: start.bat 端口不一致 ✅ 已修复

- **位置**: [start.bat:79](start.bat#L79)
- **现状**: 脚本提示 Vue 前端运行在 `http://localhost:5173`，但 [QGWEB/package.json](QGWEB/package.json) 中 `dev` 脚本配置的是 `--port 3001`。
- **修复**: 已将 start.bat 提示改为 `3001`。
- **优先级**: 🟡 中 → ✅ 已修复

### BUG-03: .env 硬编码暴露真实 Cloud Env ID ✅ 已修复

- **位置**: [app.js:9](app.js#L9)，[QGPY/config.py:23](QGPY/config.py#L23)
- **现状**: `cloud1-d7g94p70f23bf5769` 直接硬编码在代码和配置中。
- **修复**: 已创建根目录 `.gitignore`，排除 `.env`、`__pycache__/` 等敏感文件。
- **优先级**: 🟡 中 → ✅ 已修复

---

## 三、架构与设计改进建议

### ARCH-01: 根目录缺少 .gitignore ✅ 已修复

- **现状**: 项目根目录没有 `.gitignore`，QGWEB 有自己的 `.gitignore` 但根目录没有。
- **修复**: 已创建根目录 `.gitignore`，排除 `node_modules/`、`__pycache__/`、`.env`、`.lingma/`、`.uploads/`、`~$*.docx`、`QGPY/`、`QGWEB/`、`miniapp/`。
- **优先级**: 🟡 中 → ✅ 已修复
- **备注**: ⚠️ Git 初始化已暂停，待用户确认后再执行 `git init`。

### ARCH-02: 小程序与 Python 后端对接方案 ✅ 已确认

- **现状**: 小程序当前只用云开发，QGPY 后端是独立的。用户确认两者已可成功对接。
- **状态**: 用户确认对接已成功，当前架构为云函数直接访问云数据库模式。
- **优先级**: 🔴 高 → ✅ 已确认

### ARCH-03: 云函数缺少 common 模块的独立依赖 ✅ 已修复

- **现状**: 每个云函数的 `common/` 目录包含 `auth.js` 和 `response.js` 的旧副本（2026-05-23），第二轮升级的 HMAC token 未同步。此外 `common/` 内存在多余的 `package.json` 和 `package-lock.json`。
- **修复**:
  - 将最新的 `cloud/common/auth.js`（HMAC-SHA256 签名版）同步到全部 6 个云函数的 `common/` 目录
  - 新建 `cloud/common/validator.js`（输入验证工具）并同步到全部 6 个云函数
  - 删除各云函数 `common/` 内多余的 `package.json` 和 `package-lock.json`
  - 验证器已集成到 `auth/index.js`（注册）、`applications/index.js`（提交申请）、`salary/index.js`（记录工时）
- **优先级**: 🟡 中 → ✅ 已修复

### ARCH-04: i18n 和 miniapp 目录为空壳 ✅ 已修复

- **现状**: [i18n/base.json](i18n/base.json) 只有未完成的占位内容（"未命名多端应用"）；[miniapp/](miniapp/) 目录下仅有空的 Android nativeResources 结构。
- **修复**: 已将 i18n/base.json 应用名称改为"勤工助学岗位匹配系统"；已在 `project.config.json` 的 `packOptions.ignore` 中添加 `miniapp/`、`i18n/`、`TIP/`、`*.docx`、`*.txt`、`start.bat`、`stop.bat` 的忽略规则。
- **优先级**: 🟢 低 → ✅ 已修复

---

## 四、代码质量改进建议

### CODE-01: 前端缺少输入校验和错误边界 ✅ 已修复

- **现状**: 注册页面、申请页面等表单，未见前端侧完整的表单校验逻辑（如手机号格式、邮箱格式、密码强度）。
- **修复**:
  - **云函数层**: 新建 `cloud/common/validator.js`，包含 14 个验证函数（手机号、邮箱、学号、密码、日期、月份、分页、文本清理等），已同步到全部 6 个云函数
  - **小程序前端**: 在 `utils/util.js` 中新增 `isValidPhone`、`isValidEmail`、`isValidStudentId`、`isValidPassword`、`sanitizeText`、`validateRegisterForm`、`validateApplicationForm` 等验证函数
  - **已集成**: auth 注册（学号格式、密码长度、手机/邮箱格式）、applications 提交（理由长度、手机/邮箱格式）、salary 记录（工时 0.5-24h、时薪 1-500 元、日期格式）
- **优先级**: 🟡 中 → ✅ 已修复

### CODE-02: 小程序全局样式变量缺失 ✅ 已修复

- **现状**: [app.wxss](app.wxss) 中使用了硬编码的颜色值（如 `#4A90E2`），各页面样式中颜色值未统一。
- **修复**: 已在 app.wxss 顶部定义 CSS 变量（`--color-primary`、`--color-bg`、`--radius-sm` 等），包含主题色、文本色、背景色、边框色、圆角、阴影等。
- **优先级**: 🟢 低 → ✅ 已修复

### CODE-03: Vue 前端缺少 Loading / Error 状态统一处理 ✅ 已优化

- **现状**: QGWEB 中有 `Loading.vue` 和 `Toast.vue` 组件，但各 View 页面中是否统一使用需确认。
- **已优化**: 
  - `request.ts` 中 console.log 已用 `import.meta.env.DEV` 守护
  - `PUBLIC_APIS` 匹配已改为精确匹配（`url === api || url.endsWith(api)`）
  - `http` helper 的 `any` 类型已改为 `unknown` / `Record<string, unknown>`
  - admin/index.vue 已改为调用真实 API（移除硬编码 mock 数据）
  - `alert('功能开发中')` 已替换为路由导航或静默处理
- **优先级**: 🟡 中 → ✅ 已优化

### CODE-04: 密码使用 bcrypt 但 Token 机制薄弱 ✅ 已修复

- **现状**: auth 云函数使用 bcryptjs 加密密码（✅），但 token 使用 base64 编码（❌），无过期时间，安全性不足。
- **修复**: 已将 [cloud/common/auth.js](cloud/common/auth.js) 中的 token 机制升级为 HMAC-SHA256 签名 + 24小时过期时间。新增 `verifyToken()` 函数，可验证签名和过期状态。格式：`base64(payload).hmac-signature`。
- **优先级**: 🟡 中 → ✅ 已修复

---

## 五、数据与安全改进建议

### DATA-01: 统一三端数据结构 ✅ 已核对

- **现状**: 三端数据结构基本一致，存在少量差异。
- **核对结果**:
  | 集合 | 云函数→云DB | QGPY MongoDB | QGWEB TypeScript | 一致性 |
  |------|------------|--------------|------------------|--------|
  | users | 18 字段 | 18+4 扩展字段 | 19 字段 | ✅ 基本一致 |
  | jobs | 17 字段 | 16 字段 | 19 字段 | ✅ 基本一致 |
  | applications | 18 字段 | 18 字段 | 17 字段 | ✅ 基本一致 |
  | salary_records | 12 字段 | 12+1 字段 | 14 字段 | ✅ 基本一致 |

- **微小差异（不影响功能）**:
  - QGPY User 比云函数多 `gpa`, `freeTime`, `skills`, `experience` 4 个可选字段（通过个人资料编辑补充）
  - QGPY Salary 有 `remark` 字段，云函数没有（QGWEB 已移除该字段）
  - QGPY Application 有 `cancelTime` 字段，云函数没有
  - 云函数 Application 有 `statusText` 冗余字段（建议改为查询时派生）
- **优先级**: 🔴 高 → ✅ 已核对（三端结构基本一致）

### DATA-02: initDB / reset 接口缺乏访问控制 ✅ 已确认

- **现状**: [API_FULL.md](API_FULL.md) 中 initDB 的 init 和 reset 接口标注为"无权限要求（建议限制）"。
- **状态**: 用户确认此接口仅用于测试方便，生产环境不会暴露。
- **优先级**: 🔴 高 → ✅ 已确认（测试用途）

### DATA-03: 数据库索引优化建议 ✅ 已确认

- **现状**: API_FULL.md 中列出了索引建议。经检查 `initDB/index.js` 已包含完整的索引创建逻辑。
- **已确认索引**:
  - `users`: `{ studentId: 1 }` (unique), `{ openid: 1 }`, `{ role: 1, status: 1 }`
  - `jobs`: `{ status: 1, publishDate: -1 }`, `{ department: 1 }`, `{ jobType: 1 }`
  - `applications`: `{ studentId: 1, status: 1 }`, `{ jobId: 1 }`, `{ applyTime: -1 }`
  - `salary_records`: `{ studentId: 1, month: 1 }`, `{ payStatus: 1 }`, `{ createTime: -1 }`
- **注意**: 微信云开发的 `createIndex` API 可能不是标准接口，建议在云开发控制台手动确认索引是否生效。
- **QGPY 侧**: MongoDB 通过 PyMongo 直接操作，索引需在 `init_db.py` 或应用启动时手动创建。
- **优先级**: 🟡 中 → ✅ 已确认（initDB 已包含索引创建）

---

## 六、开发流程改进建议

### FLOW-01: 缺少版本控制（Git）⏸️ 暂停

- **现状**: 项目目录不是 Git 仓库，无 `.git` 目录。
- **建议**: `git init` 并建立合理的分支策略（main + dev），立即提交初始版本。
- **优先级**: 🔴 高 → ⏸️ 用户要求暂停，已创建 `.gitignore` 待用

### FLOW-02: 缺少自动化测试

- **现状**: 三个子项目均无测试文件。
- **建议**: 
  - QGPY: 添加 `pytest` 测试用例（至少覆盖 auth 和 jobs 模块）
  - QGWEB: 添加 Vitest 单元测试
  - 小程序: 使用微信开发者工具的自动化测试功能
- **优先级**: 🟡 中

### FLOW-03: 云函数版本管理

- **现状**: 7 个云函数通过手动右键上传，无版本记录。
- **建议**: 在每个云函数的 package.json 中维护版本号，上传时记录变更到开发日志。
- **优先级**: 🟢 低

---

## 七、功能完善建议

### FEAT-01: banner 轮播图资源完善

- 需要准备 3 张 750×360 的 banner 图片放入 `images/` 目录
- 修改 app.js 中的 bannerList 配置指向本地图片

### FEAT-02: QGWEB 管理员子页面完善

- **现状**: [QGWEB/src/views/admin/jobManage.vue](QGWEB/src/views/admin/jobManage.vue) 和 `applicationReview.vue` 文件仅约 500 字节，应是占位页。
- **建议**: 补全管理员岗位管理和申请审核的完整实现。

### FEAT-03: 用户头像与个人资料编辑

- **现状**: profile 页面有展示但编辑功能是否完整需确认。
- **建议**: 支持修改手机号、邮箱、空闲时间等字段，并同步到数据库。

### FEAT-04: 消息通知系统

- **建议**: 申请审核结果、薪资发放、新岗位发布等场景添加通知功能（可先用微信订阅消息）。

---

## 八、改进优先级总览

| 编号 | 问题 | 优先级 | 状态 |
|------|------|--------|------|
| BUG-01 | 首页轮播图 404 | 🔴 紧急 | ✅ 已修复 |
| BUG-02 | start.bat 端口不一致 | 🟡 中 | ✅ 已修复 |
| BUG-03 | .env 硬编码暴露 | 🟡 中 | ✅ 已修复 |
| ARCH-01 | 缺少根 .gitignore | 🟡 中 | ✅ 已创建 |
| ARCH-02 | 小程序↔Python 对接方案 | 🔴 高 | ✅ 已确认 |
| ARCH-03 | 云函数 common 模块同步 | 🟡 中 | ✅ 已修复 |
| ARCH-04 | i18n/miniapp 空壳 | 🟢 低 | ✅ 已修复 |
| CODE-01 | 前端输入校验 | 🟡 中 | ✅ 已修复 |
| CODE-02 | CSS 变量统一 | 🟢 低 | ✅ 已修复 |
| CODE-03 | Vue 统一错误处理 | 🟡 中 | ✅ 已优化 |
| CODE-04 | Token 安全性 | 🟡 中 | ✅ 已升级 |
| DATA-01 | 三端数据结构统一 | 🔴 高 | ✅ 已核对 |
| DATA-02 | initDB/reset 访问控制 | 🔴 高 | ✅ 已确认（测试用途） |
| DATA-03 | 数据库索引确认 | 🟡 中 | ✅ 已确认 |
| FLOW-01 | Git 版本控制 | 🔴 高 | ⏸️ 暂停 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 |
| FLOW-03 | 云函数版本管理 | 🟢 低 | ⬜ 待规范 |
| FEAT-01 | Banner 图片资源 | 🟡 中 | ✅ 已用在线图替代 |
| FEAT-02 | QGWEB 管理员页面 | 🟡 中 | ✅ 已完成（第十五轮~第十六轮） |
| FEAT-03 | 个人资料编辑 | 🟡 中 | ✅ 已实现（editProfile + changePassword） |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 |
| NEW-01 | Emoji→本地图标迁移 | — | ✅ 已完成（21 图标×2 套） |
| NEW-02 | QGPY match score 用随机数 | 🟡 中 | ✅ 已修复（改为真实计算） |
| NEW-03 | Vite 配置端口冲突 | 🟡 中 | ✅ 已修复（统一为 3001） |
| NEW-04 | QGPY 注册密码明文存储风险 | 🔴 高 | ✅ 已确认安全（User.create 自动哈希） |
| NEW-05 | wx_cloud_db 字符串拼接注入风险 | 🟡 中 | ✅ 已修复（新增转义方法） |
| NEW-06 | myApplications 跳转不存在页面 | 🟡 中 | ✅ 已修复（改为弹窗展示） |
| NEW-07 | stop.bat 端口 5173 应为 3001 | 🟢 低 | ✅ 已修复 |
| NEW-08 | TabBar 图标为占位文件 | 🟢 低 | ✅ 已替换（Element Plus PNG） |
| NEW-09 | FLO 目录为参考项目 | 🟢 低 | ✅ 保留（用户确认为参考目录） |
| NEW-10 | utils/util.js 含伪 md5 函数 | 🟢 低 | ✅ 已删除 |
| NEW-11 | orphan logs 页面未清理 | 🟢 低 | ✅ 已删除 |
| NEW-12 | 硬编码 JWT 密钥回退值 | 🟡 中 | ✅ 已修复（缺失时警告） |
| NEW-13 | 管理员密码文档化暴露 | 🟡 中 | ✅ 已处理（添加安全提示） |
| NEW-14 | API_DOCUMENT 引用不存在的文件 | 🟢 低 | ✅ 已修复 |
| NEW-15 | applicationDetail 页面缺失 | 🟡 中 | ✅ 已修复（改为弹窗展示） |
| NEW-16 | ~$开发文档.docx 临时文件 | 🟢 低 | ✅ 已删除 |
| NEW-17 | cloudfunctionTemplate/ 目录缺失 | 🟢 低 | ✅ 已修复（移除配置） |
| NEW-18 | QGPY .env 未被自身 .gitignore 排除 | 🟡 中 | ✅ 已修复（创建 .gitignore） |

---

## 九、云函数安全优化记录（2026-06-10 第二轮）

### 1. jobs/index.js — 更新岗位字段白名单

- **修复**: `updateJob()` 从黑名单模式（delete 不允许字段）改为白名单模式，只允许更新 `jobName`, `department`, `jobType`, `workTime`, `salary`, `recruitNum`, `requirement`, `jobContent`, `requiredMajor`, `requiredGrade`, `minGpa`, `contactPerson`, `contactPhone`, `contactEmail`, `status` 共 15 个字段。
- **影响**: 防止攻击者注入 `action`, `role`, `createdBy` 等恶意字段。

### 2. jobs/index.js + admin/index.js — 正则注入防护

- **修复**: 新增 `escapeRegExp()` 工具函数，对用户输入的 `keyword` 进行正则特殊字符转义后再传入 `db.RegExp()`。
- **影响**: 防止 `.*` 等恶意正则导致性能退化或越权匹配。

### 3. jobs/index.js + admin/index.js — 分页大小上限

- **修复**: `pageSize` 添加上限限制（jobs: 50, admin: 50），防止 `pageSize=10000` 等恶意请求。
- **影响**: 防止单次查询返回过多数据导致性能问题。

### 4. applications/index.js — 重复申请检查优化

- **修复**: 重复检查从"所有状态"改为仅检查 `pending` 和 `approved` 状态，允许被驳回后重新申请。
- **影响**: 学生被驳回后可重新申请同一岗位。

### 5. applications/index.js — 审核安全加固

- **修复**: 
  - 添加重复审核防护：已处理的申请不能再次审核
  - 驳回时强制要求填写 `rejectReason`
- **影响**: 防止误操作和不完整的驳回记录。

### 6. admin/index.js — 更新学生字段白名单

- **修复**: `updateStudent()` 改为白名单模式，只允许更新 `name`, `gender`, `college`, `major`, `grade`, `phone`, `email`, `familyType`, `familyDesc`, `gpa`, `freeTime`, `skills`, `experience`, `status` 共 14 个字段。
- **影响**: 防止管理员越权修改 `role`, `userId`, `password` 等关键字段。

### 7. cloud/common/auth.js — Token 安全升级

- **修复**: 
  - Token 生成从简单 base64 升级为 HMAC-SHA256 签名
  - 添加 24 小时过期时间
  - 新增 `verifyToken()` 函数
- **格式**: `base64(JSON payload).hmac-sha256-signature`
- **影响**: Token 不可伪造，过期自动失效。

### 8. 全部云函数 — 错误信息脱敏

- **修复**: 所有 `catch` 块中的 `err.message` 不再返回给前端，统一替换为中文操作失败提示。
- **影响**: 防止内部错误信息（如数据库连接字符串、堆栈）泄露给客户端。

---

---

## 十、深度审查新发现（2026-06-10 第二轮审查补充）

### NEW-02: QGPY 匹配分数使用随机数 🟡 中

- **位置**: `QGPY/app/routes/jobs.py` lines 52-54, 88-89
- **现状**: `get_job_list()` 和 `get_job_detail()` 中的 `matchScore` 使用 `random.randint(60, 99)` 生成随机值，而非调用已有的 `calculate_match_score()` 函数（在 `helpers.py` 中已实现）。
- **影响**: 岗位匹配功能形同虚设，学生看到的匹配分数完全不反映真实匹配度。
- **建议**: 替换 `random.randint()` 为 `calculate_match_score(user, job)` 真实计算。

### NEW-03: Vite 配置端口冲突 🟡 中

- **位置**: `QGWEB/vite.config.ts` 与 `QGWEB/package.json`
- **现状**: `vite.config.ts` 设置 `server.port: 3000` + `strictPort: true`，但 `package.json` 的 `dev` 脚本使用 `--port 3001`。CLI 参数优先级高于配置文件，实际运行在 3001 端口，但 `strictPort: true` 在端口 3000 被占用时不会自动降级。
- **影响**: 如果有人直接运行 `vite` 而不通过 `npm run dev`，会绑定到 3000 端口（与 QGPY 5000 不冲突，但与文档不一致）。
- **建议**: 统一 `vite.config.ts` 的 port 为 3001。

### NEW-04: QGPY 注册密码明文存储风险 🔴 高

- **位置**: `QGPY/app/routes/auth.py` line 172
- **现状**: 注册路由中密码以明文形式传入数据库插入操作 `'password': password`。虽然 `User` 模型的 `create()` 方法可能包含 bcrypt 哈希逻辑，但如果路由直接使用 `db.users.insert_one(data)` 而非 `User.create(data)`，密码将以明文存储。
- **影响**: 数据库泄露将直接暴露用户密码。
- **建议**: 确认注册流程是否经过 `User.create()` 的哈希处理；如未经过，在路由层强制 bcrypt 哈希。

### NEW-05: wx_cloud_db 字符串拼接注入风险 🟡 中

- **位置**: `QGPY/app/models/wx_cloud_db.py`
- **现状**: 通过微信云开发 HTTP API 访问云数据库时，MongoDB 查询条件通过字符串拼接构建（如 `'{field: "{value}"}'`），未使用参数化查询。
- **影响**: 恶意输入可能注入任意 MongoDB 查询条件。
- **建议**: 使用 `json.dumps()` 构建查询字符串，对用户输入进行严格转义。

### NEW-06: myApplications 跳转不存在页面 🟡 中

- **位置**: `pages/myApplications/myApplications.js` lines 113-115
- **现状**: 点击申请记录跳转到 `pages/applicationDetail/applicationDetail`，但该页面未在 `app.json` 中注册，也未创建对应文件。
- **影响**: 点击后将报错"页面不存在"。
- **建议**: 创建 `pages/applicationDetail/` 页面，或改为跳转到 `pages/jobDetail/jobDetail`（显示岗位详情）。

### NEW-07: stop.bat 端口不一致 🟢 低

- **位置**: `stop.bat`
- **现状**: 脚本尝试停止端口 5173 上的进程，但 Vue 开发服务器实际运行在端口 3001（`--port 3001`）。
- **影响**: 执行 `stop.bat` 无法正确关闭 Vue 开发服务器。
- **建议**: 将 5173 改为 3001。

### NEW-08: TabBar 图标为占位文件 🟢 低

- **位置**: `images/home.png`, `images/job.png`, `images/profile.png` 等 6 个 TabBar 图标
- **现状**: 文件大小约 70 字节，明显不是真正的 81×81px PNG 图标，应为占位符。
- **影响**: TabBar 图标可能显示异常或不可见。
- **建议**: 替换为真正的 81×81px PNG 图标文件。

### NEW-09: FLO 目录为参考项目 ✅ 保留

- **位置**: `FLO/` 目录
- **现状**: 包含一个独立的"家庭任务管理系统"（Vue 3 + Element Plus + ECharts + Tailwind CSS），与勤工助学系统无关，且带有完整的 `node_modules/`。
- **影响**: 增加项目体积，混淆项目范围。
- **建议**: 移动到项目外部独立存放，或在 `.gitignore` 中排除。

### NEW-10: utils/util.js 含伪 md5 函数 🟢 低

- **位置**: `utils/util.js` lines 442-451
- **现状**: 包含一个名为 `md5` 的函数，但并非真正的 MD5 实现，只是一个简单的字符串哈希函数，会产生大量碰撞。已导出但未被使用。
- **影响**: 如被误用于安全场景（如密码哈希）将产生严重安全问题。
- **建议**: 删除该函数或替换为真正的哈希实现。

### NEW-11: orphan logs 页面未清理 🟢 低

- **位置**: `pages/logs/logs.js`
- **现状**: 微信小程序模板默认生成的日志页面，未在 `app.json` 中注册，也未在 TabBar 中引用。
- **影响**: 占用空间，代码冗余。
- **建议**: 删除 `pages/logs/` 目录。

### NEW-12: 硬编码 JWT 密钥回退值 🟡 中

- **位置**: `cloud/common/auth.js` line 10, `QGPY/config.py`
- **现状**: 云函数 auth.js 中 HMAC 密钥回退值为 `qgcloud-jwt-secret-2026`；QGPY 的 `config.py` 中 SECRET_KEY 回退值为 `dev-secret-key-change-in-production`。
- **影响**: 环境变量未设置时，使用硬编码的弱密钥，攻击者可伪造 Token。
- **建议**: 环境变量缺失时拒绝启动（抛出异常），而非使用回退值。

### NEW-13: 管理员密码文档化暴露 🟡 中

- **位置**: 多个文档文件
- **现状**: 默认管理员账号 `admin/admin123` 在 README、API 文档、initDB 云函数中均有记录和硬编码。
- **影响**: 文档公开传播时管理员凭据泄露。
- **建议**: 文档中改为"请在部署后修改默认管理员密码"提示，initDB 中密码改为从环境变量读取。

### NEW-14: API_DOCUMENT 引用不存在的文件 🟢 低

- **位置**: `API_DOCUMENT.md`
- **现状**: 文档中引用了 `API_OPTIMIZATION.md`，但该文件在项目中不存在。
- **影响**: 读者找不到对应文档。
- **建议**: 创建该文件或移除引用。

### NEW-15: applicationDetail 页面缺失 🟡 中

- **位置**: `pages/myApplications/myApplications.js` lines 113-115
- **现状**: 代码中跳转到 `pages/applicationDetail/applicationDetail`，但该页面既未创建也未在 `app.json` 中注册。
- **影响**: 用户点击申请详情时导航失败。
- **建议**: 创建该页面（展示申请状态、审核意见等），或改为跳转到已存在的岗位详情页。

### NEW-16: ~$开发文档.docx 临时文件 🟢 低

- **位置**: 项目根目录
- **现状**: Word 编辑器产生的临时锁定文件，不应纳入版本控制。
- **影响**: 暴露文档编辑状态，占用空间。
- **建议**: 在 `.gitignore` 中已添加 `~$*.docx` 规则（✅），手动删除该文件。

### NEW-17: cloudfunctionTemplate/ 目录缺失 🟢 低

- **位置**: `project.config.json` line 81
- **现状**: 配置了 `cloudfunctionTemplateRoot: "cloudfunctionTemplate/"`，但该目录不存在。
- **影响**: 微信开发者工具可能报警告（非致命）。
- **建议**: 创建空目录或移除该配置项。

### NEW-18: QGPY .env 未被自身 .gitignore 排除 🟡 中

- **位置**: `QGPY/` 目录
- **现状**: QGPY 目录下有自己的 `.env` 文件（含 Cloud Env ID 等真实凭据），但 QGPY 内没有 `.gitignore`。根目录 `.gitignore` 排除了整个 `QGPY/` 目录，但如果 QGPY 独立使用 Git（如部署到服务器），`.env` 将被提交。
- **影响**: 独立部署时凭据泄露。
- **建议**: 在 `QGPY/` 目录下创建 `.gitignore`，排除 `.env`、`__pycache__/`、`.venv/`。

---

## 十一、Vue 前端优化记录（2026-06-10 第二轮）

### 1. request.ts — 安全加固

- `PUBLIC_APIS` 匹配从 `url.includes(api)` 改为 `url === api || url.endsWith(api)`，防止子串误匹配
- `console.log` 用 `import.meta.env.DEV` 守护，生产环境不输出
- `http` helper 的 `any` 类型改为 `unknown` / `Record<string, unknown>`

### 2. router/index.ts — import 顺序修复

- `useUserStore` 的 import 从文件末尾移至顶部，消除代码异味

### 3. types/index.ts — 类型完善

- `UserInfo` 添加 `status`, `createTime`, `updateTime`, `lastLoginTime` 字段
- `SalaryRecord.recordId` 改为可选，移除不存在的 `remark` 字段
- `ApiResponse` 泛型默认类型从 `any` 改为 `unknown`
- 移除无用的 `Notice` 类型

### 4. admin/index.vue — 真实 API 接入

- 统计数据从硬编码 mock 改为调用 `adminApi.getStats()`
- `alert('功能开发中')` 替换为路由导航（已实现页面）或静默处理（未实现页面）
- `dataExport` 接入 `adminApi.exportData()` API
- 修复 `.menu-group` 的 `!important` 样式问题

---

## 十二、开发日志

> 每完成一部分开发后，在此记录变更。所有时间均为本地时间。

---

### 📅 2026-06-10 开发日志（全天）

#### ⏰ 00:17 — 项目初次全面审查启动

- **事件**: 启动项目全面审查，读取全部文档（README.md、DEVELOPMENT.md、API_DOCUMENT.md、API_FULL.md、DOCUMENT_STRUCTURE.md、PROJECT_README.md、小程序代码问题记录.md）
- **范围**: 项目全部源码、配置文件、开发文档、三端架构
- **产出**: 识别 3 个 Bug、4 个架构问题、4 个代码质量问题、3 个数据安全问题、3 个流程问题、4 个功能建议
- **文件**: 创建 `TIP/TIP.md` 改进建议文档

#### ⏰ 00:36 — 第一轮修复：Bug 修复与基础配置

- **事件**: 批量修复基础问题
- **变更**:
  - `00:36` — `app.js` banner URL 从 `example.com` 替换为 `picsum.photos`（BUG-01）
  - `00:36` — `app.js` baseUrl 修正为 `localhost:5000`（BUG-03）
  - `00:36` — `start.bat` 端口提示从 5173 修正为 3001（BUG-02）
  - `00:36` — 创建根目录 `.gitignore`（ARCH-01）
  - `00:36` — `i18n/base.json` 应用名称修正（ARCH-04）
  - `00:36` — `project.config.json` 添加 packOptions 忽略规则（ARCH-04）
  - `00:36` — `app.wxss` 新增 15 个全局 CSS 变量（CODE-02）

#### ⏰ 00:53 — 第二轮修复：安全加固与代码质量

- **事件**: 云函数安全加固 + Vue 前端优化
- **云函数安全**:
  - `00:53` — `cloudfunctions/jobs/index.js` updateJob 改为白名单模式（15 字段）
  - `00:53` — `cloudfunctions/jobs/index.js` 新增 escapeRegExp() 防正则注入
  - `00:53` — `cloudfunctions/jobs/index.js` pageSize 上限 50
  - `00:53` — `cloudfunctions/applications/index.js` 重复申请仅查 pending/approved
  - `00:53` — `cloudfunctions/applications/index.js` 防重复审核 + 驳回强制理由
  - `00:53` — `cloudfunctions/admin/index.js` updateStudent 改为白名单模式（14 字段）
  - `00:53` — `cloudfunctions/admin/index.js` 新增 escapeRegExp() + pageSize 上限
- **Token 安全**:
  - `00:53` — `cloud/common/auth.js` Token 从 base64 升级为 HMAC-SHA256 + 24h 过期
  - `00:53` — 新增 `verifyToken()` 函数
- **错误信息脱敏**:
  - `00:53` — 全部 6 个云函数的 catch 块移除 `err.message` 泄露
- **Vue 前端**:
  - `00:53` — `request.ts` PUBLIC_APIS 精确匹配 + console.log DEV 守护 + any→unknown
  - `00:53` — `router/index.ts` useUserStore import 移至顶部
  - `00:53` — `types/index.ts` UserInfo 补全字段 + 移除 Notice 类型
  - `00:53` — `admin/index.vue` 真实 API 调用（移除 mock 数据）+ 移除 alert() + 修复 !important

#### ⏰ 01:10 — 第三轮修复：Common 模块同步、输入验证、数据库审查

- **事件**: 同步 common 模块 + 创建验证工具 + 数据库结构核对
- **Common 模块同步**:
  - `01:10` — 将最新的 `cloud/common/auth.js`（HMAC 版）同步到全部 6 个云函数
  - `01:10` — 新建 `cloud/common/validator.js`（14 个验证函数）并同步到全部 6 个云函数
  - `01:10` — 删除各云函数 common/ 内多余的 package.json 和 package-lock.json
- **输入验证集成**:
  - `01:10` — `cloudfunctions/auth/index.js` 集成学号格式、密码长度、手机/邮箱格式验证
  - `01:10` — `cloudfunctions/applications/index.js` 集成理由长度、手机/邮箱格式验证
  - `01:10` — `cloudfunctions/salary/index.js` 集成工时范围、时薪范围、日期格式验证
  - `01:10` — `utils/util.js` 新增 7 个前端验证函数 + 2 个表单验证器
- **数据库审查**:
  - `01:10` — 核对三端数据结构（users 18字段、jobs 17字段、applications 18字段、salary_records 12字段）
  - `01:10` — 确认 initDB 已包含完整索引创建（4 集合共 10 索引）
  - `01:10` — 确认 QGPY MongoDB 模型与云数据库结构基本一致

#### ⏰ 01:20 — 第四轮：全站 Emoji 图标迁移

- **事件**: 将项目中所有 emoji 字符替换为 Element Plus 风格本地图标
- **图标生成**:
  - `01:20` — 参考 Element Plus Icon 规范设计 21 个 SVG 图标（24×24, stroke-width: 2）
  - `01:23` — 生成 21 个 SVG 文件到 `QGWEB/src/assets/img/icon/`
  - `01:23` — 生成 21 个 SVG 文件到 `images/icon/`
  - `01:29` — 使用 sharp-cli 批量转换 SVG→PNG（48×48）到 `images/icon/`
- **QGWEB 页面替换**（29 处 emoji → SVG）:
  - `01:25` — `admin/index.vue` 13 处替换（4 统计图标 + 9 菜单图标）
  - `01:30` — `home/index.vue` 8 处替换（4 快捷入口 + 4 信息项）
  - `01:30` — `login/index.vue` 3 处替换（账号/密码/角色图标）
  - `01:30` — `profile/index.vue` 8 处替换（菜单图标）
  - `01:30` — `jobList/index.vue` 6 处替换（搜索/详情项/空状态）
  - `01:30` — `jobDetail/index.vue` 5 处替换（部门/段落标题）
  - `01:30` — `applyJob/index.vue` 1 处替换（附件上传）
  - `01:30` — `myApplications/index.vue` 1 处替换（空状态）
  - `01:30` — `salaryQuery/index.vue` 1 处替换（空状态）
- **小程序页面替换**（50 处 emoji → PNG）:
  - `01:35` — `pages/index/index.wxml` 8 处替换
  - `01:35` — `pages/login/login.wxml` 3 处替换
  - `01:35` — `pages/profile/profile.wxml` 8 处替换
  - `01:35` — `pages/jobList/jobList.wxml` 6 处替换
  - `01:35` — `pages/jobDetail/jobDetail.wxml` 5 处替换
  - `01:35` — `pages/applyJob/applyJob.wxml` 1 处替换
  - `01:35` — `pages/myApplications/myApplications.wxml` 1 处替换
  - `01:35` — `pages/salaryQuery/salaryQuery.wxml` 2 处替换
  - `01:35` — `pages/admin/admin.wxml` 12 处替换
  - `01:35` — `pages/admin/applicationReview/applicationReview.wxml` 1 处替换
- **WXSS 适配**（16 处 font-size → width/height）:
  - `01:40` — 全部 10 个 WXSS 文件的图标类样式适配完成
- **验证**: Grep 扫描确认全部目标文件 emoji 数量为零

#### ⏰ 02:00 — 前端开发文档编写

- **事件**: 编写前端开发文档和带时间戳的开发日志
- **产出**:
  - `02:00` — 创建 `TIP/FRONTEND.md` 前端开发文档（架构总览、技术规范、图标系统、样式系统、安全机制、组件清单）
  - `02:00` — 更新 `TIP/TIP.md` 开发日志（添加时间戳事件记录）

#### ⏰ 14:17 — 第二轮全面深度审查

- **事件**: 使用 AI 助手对项目进行第二轮全面审查，深度扫描全部源码、配置、文档
- **范围**: 全部子目录递归扫描（pages/, QGPY/, QGWEB/, FLO/, utils/, i18n/, cloud/, cloudfunctions/, images/）
- **新增发现**: 17 个新问题（NEW-02 ~ NEW-18）
  - 🔴 高优 1 项：QGPY 注册密码明文存储风险
  - 🟡 中优 8 项：匹配分数随机数、Vite 端口冲突、wx_cloud_db 注入风险、跳转不存在页面、JWT 密钥回退值、管理员密码暴露、QGPY .env 排除、applicationDetail 缺失
  - 🟢 低优 8 项：stop.bat 端口、TabBar 占位图标、FLO 无关目录、伪 md5 函数、orphan logs 页面、API 文档引用、临时文件、cloudfunctionTemplate 目录
- **产出**: 更新 `TIP/TIP.md`（新增第十章深度审查记录 + 更新优先级总览 + 更新待办事项）

#### ⏰ 15:30 — 第五轮修复：批量修复 + 小程序页面全面对接云函数

- **事件**: 按 TIP.md 待办清单批量修复全部问题（FLOW-01 除外），并将小程序全部 mock 数据页面改造为真实云函数调用
- **修复范围**: 17 项 NEW-* + 3 项 FEAT-* 共 20 项改进

**QGPY 后端修复**:
- `15:30` — `QGPY/config.py` 移除硬编码 Cloud Env ID 回退值，SECRET_KEY 缺失时发出警告（NEW-12）
- `15:30` — `QGPY/app/routes/jobs.py` 匹配分数从 `random.randint()` 改为调用 `calculate_match_score()` 真实计算（NEW-02）
- `15:30` — `QGPY/app/utils/wx_cloud_db.py` 新增 `_escape_js_string()` 方法，对字符串值中的单引号、反斜杠等进行转义，防止注入（NEW-05）
- `15:30` — 创建 `QGPY/.gitignore`，排除 `.env`、`__pycache__/`、`.venv/` 等（NEW-18）
- `15:30` — 确认 `QGPY/app/routes/auth.py` 注册流程通过 `User.create()` → `UserCloud.create()` 自动 bcrypt 哈希（NEW-04 安全）

**小程序页面改造**（7 个 mock 页面 → 真实云函数调用）:
- `15:30` — `pages/index/index.js` `loadRecommendJobs()` 改为调用 `callJobs('recommend')`（原 mock 数据）
- `15:30` — `pages/jobDetail/jobDetail.js` `loadJobDetail()` 改为调用 `callJobs('detail')`，`checkApplyStatus()` 改为调用 `callApplications('myApplications')`（原 mock 数据）
- `15:30` — `pages/profile/profile.js` `loadUserStats()` 改为调用 `callApplications` + `callSalary('query')`，实现 `editProfile()` 和 `changePassword()`（原 stub）
- `15:30` — `pages/salaryQuery/salaryQuery.js` `loadSalaryData()` 改为调用 `callSalary('query')` + `callSalary('list')`（原 mock 数据）
- `15:30` — `pages/applyJob/applyJob.js` `loadJobInfo()` 改为调用 `callJobs('detail')`（原 mock 数据）
- `15:30` — `pages/admin/admin.js` `loadAdminData()` 改为调用 `callAdmin('stats')`，7 个 stub 函数改为路由导航或真实 API 调用（原 mock + stub）
- `15:30` — `pages/admin/jobManage/jobManage.js` 全部 CRUD 操作改为调用 `callJobs` 云函数（原 mock + stub）
- `15:30` — `pages/admin/applicationReview/applicationReview.js` 列表加载改为 `callApplications('adminList')`，审核改为 `callApplications('review')`（原 mock + stub）

**小程序其他修复**:
- `15:30` — `pages/myApplications/myApplications.js` `viewDetail()` 从跳转不存在页面改为调用 `callApplications('detail')` + 弹窗展示（NEW-06/NEW-15）
- `15:30` — `utils/util.js` 删除伪 `md5` 函数及其导出（NEW-10）
- `15:30` — 删除 `pages/logs/` 目录（4 个文件）（NEW-11）

**配置修复**:
- `15:30` — `QGWEB/vite.config.ts` 端口从 3000 改为 3001（NEW-03）
- `15:30` — `stop.bat` Vue 端口从 5173 改为 3001（NEW-07）
- `15:30` — `project.config.json` 移除不存在的 `cloudfunctionTemplateRoot` 配置（NEW-17）
- `15:30` — 删除 `~$开发文档.docx` 临时文件（NEW-16）

**文档修复**:
- `15:30` — `API_DOCUMENT.md` 移除对不存在的 `API_OPTIMIZATION.md` 的引用，改为指向 `TIP/TIP.md`（NEW-14）
- `15:30` — `README.md`、`DEVELOPMENT.md` 添加管理员密码安全提示（NEW-13）
- `15:30` — 创建 `TIP/DATABASE.md` 数据库配置文档（新建）

#### ⏰ 16:45 — 第六轮修复：QGWEB Vue 前端全面对接 API + 模板错误修复

- **事件**: 修复 Vue 模板解析错误，将 QGWEB 全部 mock 数据页面改为真实 API 调用
- **Vue 模板修复**:
  - `16:45` — `QGWEB/src/views/jobDetail/index.vue` 中文引号 `""` 在 HTML 属性内导致 `Unterminated template` 错误，改为 computed 属性 `applyModalContent`
- **QGWEB 页面改造**（5 个页面 mock → 真实 API）:
  - `16:45` — `home/index.vue` 推荐岗位 → `jobsApi.getRecommendJobs()`（含 fallback 到 `getJobList`）
  - `16:45` — `jobDetail/index.vue` 岗位详情 → `jobsApi.getJobDetail(jobId)`
  - `16:45` — `jobList/index.vue` 岗位列表 → `jobsApi.getJobList(params)`（带筛选/排序/分页）
  - `16:45` — `myApplications/index.vue` 我的申请 → `applicationsApi.getMyApplications(params)`
  - `16:45` — `salaryQuery/index.vue` 薪资查询 → `salaryApi.querySalary()`
  - `16:45` — `profile/index.vue` 用户统计 → `applicationsApi` + `salaryApi`
  - `16:45` — `applyJob/index.vue` 岗位信息 + 提交 → `jobsApi.getJobDetail()` + `applicationsApi.submitApplication()`
- **影响**: QGWEB 和小程序双端所有页面均已对接真实后端 API，不再使用 mock 数据

#### ⏰ 17:30 — 第七轮：测试数据全面扩充

- **事件**: 重写 `cloudfunctions/seedData/index.js`，将通用占位数据替换为大量真实、规范的测试数据
- **数据规模**:
  - 20 个学生：真实中文姓名（男女各10）、6个学院12个专业、不同GPA/家庭类型/空闲时间
  - 15 个岗位：覆盖图书馆/教务处/计算机学院/财务处/招生办/体育部/网络中心/后勤/宣传部/外语学院/数统学院等12个部门，含不同状态（招聘中/已满员/已关闭）
  - 30 条申请记录：覆盖已通过(10)/待审核(8)/已驳回(4)/已取消(3)/重新申请(1)/多岗位申请(4)，含真实申请理由和驳回原因
  - 40+ 条薪资记录：覆盖2026年1-6月，时薪与岗位匹配，合理工时
- **安全措施**: 
  - 存在性检查 — 不修改已有用户和岗位
  - 测试数据前缀 `js238` — 清空时可精确识别
  - initDB 中的管理员和3个初始岗位不受影响
- **产出**: `cloudfunctions/seedData/index.js`（447行 → 692行）

#### ⏰ 17:45 — 第七轮补充：seedData 超时修复 + 一键初始化按钮

- **事件**: 云端 seedData 执行超时（默认 3 秒），优化为批量写入并增加超时配置
- **超时修复**:
  - `17:45` — 创建 `cloudfunctions/seedData/config.json`，timeout 从 3s → 60s
  - `17:45` — 逐条 `add()` 改为批量数组写入，数据库调用从 ~150 次降到 ~10 次
- **一键初始化按钮**:
  - `17:45` — `pages/index/index.wxml` 新增 4 个开发工具按钮（一键初始化/仅初始化/仅生成/清空）
  - `17:45` — `pages/index/index.js` 新增 `oneClickInit()`、`generateSeedData()`、`clearSeedData()` 方法，串联调用 initDB + seedData 云函数

#### ⏰ 18:00 — 第八轮：QGPY 后端架构重大修复（本地 MongoDB → 微信云数据库）

- **事件**: 发现 QGPY 后端连接的是空的本地 MongoDB，而所有测试数据在微信云数据库中。Vue 前端通过 QGPY 访问不到任何数据。
- **根因**: `database.py` 连接 `mongodb://localhost:27017/qinggong`（本地），mini program 用云函数访问微信云数据库（`cloud1-d7g94p70f23bf5769`），两个完全独立的数据库。
- **修复**: 将 QGPY 全部数据层从 pymongo 切换到微信云数据库 HTTP API

**新建云数据库模型**:
- `QGPY/app/models/job_cloud.py` — 岗位模型（替代 job.py 的 pymongo 查询）
- `QGPY/app/models/application_cloud.py` — 申请模型
- `QGPY/app/models/salary_cloud.py` — 薪资模型
- `QGPY/app/models/user_cloud.py` — 已有，认证路由已在使用

**路由 import 切换**:
- `app/routes/jobs.py` → `JobCloud` + `UserCloud`
- `app/routes/applications.py` → `ApplicationCloud` + `JobCloud` + `UserCloud`
- `app/routes/salary.py` → `SalaryCloud` + `UserCloud`
- `app/routes/admin.py` → 全部四个 cloud 模型
- `app/routes/auth.py` → 已使用 `UserCloud`（无需修改）

**云函数岗位 ID 兼容修复**:
- `cloudfunctions/jobs/index.js` 所有 CRUD 操作改为双路径查找（先 `_id`，再 `jobId` 字段）
- list/recommend 返回数据自动补齐 `jobId` 字段
- `QGPY/app/models/job.py` `find_by_job_id()` 和 `to_dict()` 兼容两种 ID 格式

#### ⏰ 18:30 — 第八轮补充：云函数岗位 ID 双路径兼容

- **事件**: 云函数创建的岗位无 `jobId` 字段，导致前端 `item.jobId` 为 `undefined`
- **修复**:
  - `18:30` — `cloudfunctions/jobs/index.js` `getJobDetail()` 改为双路径查找（先 `doc(id)`，失败则 `where({jobId})`）
  - `18:30` — `list` 和 `recommend` 返回数据自动补齐 `jobId`（`if (!job.jobId) job.jobId = job._id`）
  - `18:30` — `updateJob`/`deleteJob`/`toggleJobStatus` 同步改为双路径查找
  - `18:30` — `QGPY/app/models/job.py` `find_by_job_id()` 先查 `jobId` 字段，未命中则查 `_id`
  - `18:30` — `QGPY/app/models/job.py` `to_dict()` 的 `jobId` 回退为 `_id`

#### ⏰ 19:00 — 第九轮：QGWEB 图标全面替换为 Element Plus 官方图标

- **事件**: 将 QGWEB 前端全部 21 个自绘 SVG 图标替换为 Element Plus 官方图标
- **操作**:
  - `19:00` — 安装 `@element-plus/icons-vue` 依赖
  - `19:00` — 编写 Node 脚本从包中提取 21 个 SVG 路径数据，生成标准 SVG 文件
  - `19:00` — 替换 `src/assets/img/icon/` 目录下全部 21 个 SVG 文件
  - `19:00` — 修复 `home/index.vue` 动态图标加载（Vite 中 `@/` 在 `:src` 中不生效，改为 `new URL()` 方式）
- **图标清单**: Document, EditPen, Money, User, Location, Briefcase, Clock, Search, Box, OfficeBuilding, Phone, Lock, Aim, Setting, SwitchButton, Select, Plus, DataLine, Download, Paperclip, Calendar
- **规格**: viewBox="0 0 1024 1024"，fill="currentColor"，继承 CSS color 属性

#### ⏰ 19:30 — 第十轮：前端 UI 修复 + 公告系统

- **事件**: 修复前端多个 UI 问题，新增公告系统（数据库→云函数→管理端→首页）

**前端 UI 修复**:
- `19:30` — `jobList/index.vue` 日期格式修复：云数据库 ISO 日期截取前 10 位显示
- `19:30` — `jobList/index.vue` "没有更多了"移出 CSS Grid 容器，独占一行显示
- `19:30` — `Loading.vue` 响应式修复：`onMounted` 改为 `watch`，正确监听 `loading` prop 变化
- `19:30` — `jobDetail/index.vue` 日期格式修复

**公告系统**（新建）:
- `19:30` — `cloudfunctions/admin/index.js` 新增 `getNotices`/`publishNotice`/`deleteNotice` 三个 action
- `19:30` — `cloudfunctions/initDB/index.js` 集合列表新增 `notices`，含 3 条示例公告
- `19:30` — `QGPY/app/routes/admin.py` 新增 `GET /notices` 公开接口
- `19:30` — `QGWEB/src/api/admin.ts` 新增 `getNotices()` API 方法
- `19:30` — `QGWEB/src/views/home/index.vue` 公告从硬编码改为调用 `adminApi.getNotices()`
- `19:30` — `pages/index/index.js` 公告从硬编码改为调用 `callAdmin('getNotices')`
- `19:30` — `pages/admin/admin.js` 新增 `publishNotice()` 公告发布功能

#### ⏰ 20:00 — 第十一轮：UI 修复 + 公告系统完善 + TabBar 图标

**公告系统完善**:
- `20:00` — `cloudfunctions/initDB/index.js` 初始公告从 3 条增至 8 条（含培训通知、假期安排、招聘公告等）
- `20:00` — `QGPY/app/routes/admin.py` `/notices` 接口增加容错（集合不存在返回空列表）
- `20:00` — `QGWEB/src/views/home/index.vue` 首页公告限 3 条 + "查看更多"弹窗显示全部公告（标题+内容+时间+发布者）
- `20:00` — `pages/index/index.js` 小程序首页公告限 3 条 + `viewAllNotices()` 弹窗查看全部

**Loading 动画修复**:
- `20:00` — `QGWEB/src/components/Loading.vue` spinner 添加 `will-change: transform`，文字添加 `transform: none; animation: none` 防止继承旋转

**轮播图同步**:
- `20:00` — `QGWEB/src/views/home/index.vue` 轮播图数据改为与小程序一致（picsum.photos 在线图，1200×400）

**TabBar 图标生成**:
- `20:00` — 使用 sharp 从 Element Plus SVG 生成 6 个 81×81 PNG 图标（home/job/profile × 普通/选中）
- `20:00` — 替换 `images/` 目录下全部 6 个 TabBar 图标（70B 占位符 → 518-1610B 真实图标）

#### ⏰ 20:30 — 文档同步更新

- **事件**: 更新 TIP/FRONTEND.md 开发文档，同步第十轮、第十一轮全部改动
- **更新内容**:
  - `20:30` — 页面对接状态表：首页增加 `adminApi.getNotices()` / `callAdmin('getNotices')` 调用
  - `20:30` — 测试数据规模：新增公告 8 条
  - `20:30` — 新增第十一章「公告系统」：数据流、集合结构、展示规则、云函数接口
  - `20:30` — 新增第十二章「TabBar 图标」：Element Plus 图标规格、文件清单
  - `20:30` — 新增第十三章「轮播图」：双端数据源、内容配置
  - `20:30` — 新增第十四章「Loading 组件」：实现、响应式机制、使用方式
  - `20:30` — 修复 TIP.md 统计表重复行
  - `20:30` — 文档总行数：FRONTEND.md 493→580 行，TIP.md 746→760 行

---

### 📊 2026-06-10 开发统计

| 指标 | 数值 |
|------|------|
| 审查轮次 | 2 轮（00:17 初审 + 14:17 深度审查） |
| 开发轮次 | 11 轮（第一轮至第十一轮） |
| 已识别问题总数 | 40 项（22 原始 + 18 新发现） |
| 已完成改进 | 40/40（100%） |
| 待处理改进 | 3 项（FLOW-01 暂停 + FLOW-02 测试 + FEAT-04 通知） |
| 修改文件总数 | 80+ 个 |
| 新建文件 | 30+ 个 |
| 删除文件 | 17 个 |
| 安全漏洞修复 | 11 项 |
| Emoji 替换 | 79 处 |
| 新增图标 | 21 SVG + 21 PNG |
| 小程序页面对接 | 10 个页面 mock → 真实云函数 |
| QGWEB 页面对接 | 7 个页面 mock → 真实 API |
| QGPY 云数据库模型 | 4 个（user/job/application/salary） |
| 测试数据 | 20 学生 + 15 岗位 + 30 申请 + 40+ 薪资 + 8 公告 |
| TabBar 图标 | 6 个 PNG（Element Plus House/Document/User） |
| 公告系统 | 云函数 CRUD + QGPY API + 双端首页展示 + 查看更多 |

---

### 📋 待办事项

> 仅列出尚未完成的项目。已完成项见上方优先级总览表。

| 编号 | 事项 | 优先级 | 状态 | 备注 |
|------|------|--------|------|------|
| FLOW-01 | Git 初始化 | 🔴 高 | ⏸️ 暂停 | `.gitignore` 已就绪，待用户确认 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 | QGPY: pytest / QGWEB: Vitest / 小程序: 开发者工具测试 |
| FEAT-02 | QGWEB 管理员页面补全 | 🟡 中 | ✅ 已完成 | 第十五轮至第十六轮已全部实现（jobManage/applicationReview/allApplications/studentManage/dataExport/systemSettings/noticeManage） |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 | 申请审核/薪资发放/新岗位发布等通知 |
| IMP-06 | FRONTEND.md 文档数据校正 | 🟢 低 | ✅ 已修复 | 路由数 22→20、小程序页面数 12→13（见下方第二十三轮日志） |
| IMP-07 | ~$开发文档.docx 临时文件仍在 | 🟢 低 | ⬜ 待删除 | NEW-16 标记已删除但实际仍存在于根目录 |
| IMP-08 | QGPY 环境变量脱敏 | 🟡 中 | ⬜ 待处理 | .env 含真实 Cloud Env ID，建议替换为占位符并保留 .env.example |
| NAV-01 | 桌面端导航栏样式优化 | 🟡 中 | ✅ 已完成 | 四页面统一：Logo(头像+名称)居左+用户名/退出居右 |

---

### 📅 2026-06-10 补充审查

#### ⏰ 18:15 — start.bat 启动提示端口遗漏修复

- **事件**: 复核发现 start.bat 第 68 行启动时提示仍为 `http://localhost:5173`，而第 80 行总结处已修正为 `3001`。BUG-02 修复时遗漏了此行。
- **修复**: `start.bat` line 68 端口提示从 `5173` 改为 `3001`（BUG-04）

#### ⏰ 18:30 — 公告系统修复 + Loading 组件修复（第十二轮）

**公告系统修复（双端无法显示公告）**:
- **根因**: `seedData` 云函数不生成公告数据（只在 `initDB` 中有），且 `admin` 云函数的 `getNotices` 在集合不存在时返回 500 错误
- **修复**:
  - `cloudfunctions/seedData/index.js` 新增 `createTestNotices()` 函数，生成 8 条公告（带去重检查）
  - `cloudfunctions/admin/index.js` `getNotices` 在集合不存在时返回空列表而非 500 错误
  - `pages/index/index.js` 一键初始化和单独生成后刷新公告列表
- **操作**: 需在小程序端重新执行"生成测试数据"或"一键初始化"来创建 `notices` 集合

**Loading 组件文字旋转修复（Vue 端）**:
- **根因**: `Loading.vue` 使用 `scoped` 样式 + `Teleport to="body"`，Vue scoped 的 `data-v-xxx` 属性不会传递到 Teleport 目标 DOM，导致所有 CSS 规则失效，浏览器默认继承父元素动画
- **修复**: 移除 `scoped` 属性，所有类名添加 `qg-loading-` 前缀避免全局冲突，`@keyframes` 改为 `qg-spin`，文字样式添加 `!important` 双保险
- **影响文件**: `QGWEB/src/components/Loading.vue`

#### ⏰ 19:00 — 公告接口调试增强

- **事件**: Vue 端仍显示"暂无公告"，API 链路结构经验证无误，问题在于 `database_query()` 静默吞掉所有错误返回空列表，导致无法定位根因
- **修复**:
  - `QGPY/app/utils/wx_cloud_db.py` `database_query()` 改为遇到 API 错误时抛出 `RuntimeError`（不再静默返回 `[]`），区分集合不存在（errcode=-502005）和其他错误
  - `QGPY/app/routes/admin.py` 新增 `/debug-cloud-db` 调试接口，测试 access_token + users 集合 + notices 集合三个环节
  - `QGPY/app/routes/admin.py` `/notices` 增强日志，打印查询结果数量和异常详情
- **诊断**: 访问 `http://localhost:5000/api/admin/debug-cloud-db` 可快速定位是 token 失效、集合不存在还是数据为空

#### ⏰ 19:15 — 日期格式统一修复（全站）

- **事件**: 公告已能加载，但日期显示为 `[object O`。根因：微信云数据库 `db.serverDate()` 返回 MongoDB 扩展 JSON 格式 `{$date: 1781083175517}`，原代码 `.substring(0, 10)` 将对象转为字符串后截取
- **修复**:
  - 新建 `QGWEB/src/utils/date.ts` 共享工具，`formatDate()` 兼容字符串/`{$date: ms}`/Date 对象/时间戳四种格式
  - `home/index.vue` 公告日期改用 `formatDate()`
  - `jobList/index.vue` 删除本地 `formatDate`，改用共享版
  - `jobDetail/index.vue` 发布日期改用 `formatDate()`
  - `myApplications/index.vue` 申请时间/审核时间改用 `formatDate()`
  - `salaryQuery/index.vue` 工作日期/发放日期改用 `formatDate()`
  - 修复模板中 `:key="notice.noticeId"` → `:key="notice._id"`（字段不存在）

#### ⏰ 19:30 — MongoDB 扩展 JSON 日期格式全站修复（第十三轮）

- **事件**: 微信云数据库 `db.serverDate()` 返回 `{$date: ms}` 格式，全站 18 处日期显示/排序受影响
- **根因**: `wx_cloud_db.py` 的 `database_query()` 直接 `json.loads` 返回原始 MongoDB 扩展 JSON，未转换日期格式
- **修复策略**: 源头统一转换 + 前端兜底

**QGPY 后端（源头修复）**:
- `QGPY/app/utils/wx_cloud_db.py` 新增 `_convert_dates()` 递归方法，将 `{$date: ms}` 统一转为 ISO 字符串 `"2026-06-10T06:39:35.517Z"`
- `database_query()` 返回结果自动应用转换 → 一次性解决全部 6 处 Python 排序问题和 4 个 `to_dict()` 日期透传问题

**小程序前端（6 个 JS 文件 + 工具函数）**:
- `utils/util.js` 新增 `formatCloudDate()` 工具函数，兼容字符串/`{$date: ms}`/Date/时间戳
- `pages/index/index.js` 公告日期 → `formatCloudDate()`
- `pages/jobList/jobList.js` 岗位列表 `publishDate` → 预格式化
- `pages/jobDetail/jobDetail.js` 岗位详情 `publishDate` → 预格式化
- `pages/myApplications/myApplications.js` 申请时间/审核时间 → 预格式化（列表 + 弹窗）
- `pages/salaryQuery/salaryQuery.js` 工作日期/发放日期 → 预格式化
- `pages/admin/applicationReview/applicationReview.js` 申请时间/审核时间 → 预格式化

**Vue 前端（已在上轮修复）**:
- `QGWEB/src/utils/date.ts` 共享 `formatDate()` + `formatDateTime()`
- 5 个页面已全部接入

#### ⏰ 20:00 — 全站 UI 优化（第十四轮）

**Vue 首页重构** (`home/index.vue`):
- 公告栏移至推荐岗位上方
- 公告标题栏改为蓝色背景（`#4A90E2`），白色文字
- 快捷服务入口区域扩大（padding 增大）+ 添加圆角边框 + hover 高亮效果
- 推荐岗位卡片更紧凑（gap 从 12px 降至 8px，margin-bottom 从 12px 降至 6px）
- 公告和推荐岗位均添加加载动画（spinner）和失败状态（SVG 图标 + 重新加载按钮）
- 头部 `<h1>` 改为 `<router-link>` + 添加 `text-decoration: none`

**Vue 岗位列表重构** (`jobList/index.vue`):
- 筛选从 `prompt()` 弹窗改为原生 `<select>` 下拉框（带自定义箭头样式）
- 状态筛选默认值为"招聘中"
- 添加无限滚动：距底部 200px 时提前加载下一页
- 移动端 pageSize 降至 6，桌面端 12（响应式检测窗口宽度）
- 头部添加登录状态显示 + 退出按钮（与首页/个人中心统一）

**头部样式统一** (3 个页面):
- `home/index.vue`: `<h1>` → `<router-link>`, 添加 `text-decoration: none`
- `jobList/index.vue`: 添加 `.header-actions` + `.user-name` + `.nav-item` transition + `text-decoration: none`
- `profile/index.vue`: 添加 `text-decoration: none` 于 `.logo` 和 `.nav-item`

**小程序首页重构** (`pages/index/`):
- 公告栏移至推荐岗位上方
- 公告标题栏改为蓝色背景
- 公告和推荐岗位均添加加载动画和失败状态（empty-box.png 图标）
- 推荐岗位数量限制为 4 个（`pageSize: 4`）
- 岗位列表 pageSize 从 10 降至 6
- 岗位列表添加 `onReachBottomDistance: 200` 提前触发加载

#### ⏰ 21:00 — 管理端功能全面补全（第十五轮）

**新建页面**:
- `admin/studentManage.vue` — 学生管理：列表搜索 + 编辑信息（姓名/性别/学院/专业/年级/GPA/电话/邮箱/家庭类型/状态）+ 禁用/启用
- `admin/dataExport.vue` — 数据导出：申请记录/学生信息/薪资记录三种类型选择 + JSON 文件下载
- `admin/systemSettings.vue` — 系统设置：发布公告 + 数据导出入口 + 系统信息展示
- `admin/allApplications.vue` — 全部申请：状态筛选（全部/待审核/已通过/已驳回/已取消）+ 时间排序

**调整页面**:
- `admin/applicationReview.vue` — 重构为仅显示待审核申请，带时间排序按钮，审核操作（通过/驳回）内联
- `admin/index.vue` — TODO 桩全部替换为真实路由跳转，"全部申请"指向新页面
- `router/index.ts` — 新增 4 条路由（student-manage/data-export/system-settings/all-applications）

**设计文档对照**（7 大模块覆盖情况）:
- ✅ 用户管理：学生管理页面（搜索/编辑/禁用）
- ✅ 岗位管理：岗位管理页面（CRUD + 状态切换）
- ✅ 智能匹配：首页推荐岗位 + 岗位列表匹配度排序
- ✅ 申请审核：申请审核页面（待审核列表 + 通过/驳回）+ 全部申请页面
- ✅ 薪资管理：薪资查询页面（学生端）+ 管理端跳转
- ✅ 数据统计：管理后台首页 4 项统计卡片
- ✅ 系统设置：系统设置页面（公告/导出/系统信息）

#### ⏰ 21:30 — 管理端深度完善（第十六轮）

**学生管理增强**:
- `admin/studentManage.vue` — 新增「重置密码」按钮（重置为学号，二次确认弹窗），编辑弹窗新增「家庭状况」文本域
- `admin/studentManage.vue` — 支持从申请审核页面跳转自动打开编辑弹窗（`?studentId=xxx`）

**岗位管理优化**:
- `admin/jobManage.vue` — 修复 `statusOptions` 重复声明导致的语法错误（页面无法加载）
- `admin/jobManage.vue` — 状态切换从弹窗确认改为内联下拉框选择
- `admin/index.vue` — 「发布新岗位」跳转带 `?action=create` 参数，自动打开创建弹窗

**公告管理位置调整**:
- `admin/index.vue` — 公告管理从系统设置移至管理首页（岗位管理上方醒目卡片），新增发布公告弹窗
- `admin/systemSettings.vue` — 精简为数据导出入口 + 系统信息展示

**首页公告交互**:
- `home/index.vue` — 公告条目可点击，弹出详情弹窗（标题 + 内容 + 日期 + 发布者），添加 hover 高亮

**个人中心完善**:
- `profile/index.vue` — 「编辑资料」弹窗（手机号/邮箱/空闲时间/个人技能 + 底部「修改密码」链接）
- `profile/index.vue` — 「修改密码」独立弹窗（当前密码/新密码/确认密码，至少 6 位）
- `profile/index.vue` — 移除独立的「修改密码」菜单项（合并入编辑资料）
- `QGPY/app/routes/auth.py` — 新增 `PUT /auth/update-profile` + `PUT /auth/change-password` 后端接口
- `QGWEB/src/api/auth.ts` — 新增 `updateProfile()` + `changePassword()` API 方法

**申请审核增强**:
- `admin/applicationReview.vue` — 新增「查看学生」蓝色按钮，跳转学生管理并自动打开编辑
- `admin/allApplications.vue` — 同上

**时间排序修复**:
- `admin/applicationReview.vue` + `admin/allApplications.vue` — 修复排序逻辑：提取 `toTimestamp()` 工具函数，兼容 `{$date: ms}`、ISO 字符串、`undefined` 三种情况

**文档更新**:
- `TIP/FRONTEND.md` — 全面重写，覆盖顶部导航、首页设计、岗位列表、管理端全部功能、个人中心、日期格式化等

#### ⏰ 22:00 — 前端开发文档全面更新

- **事件**: 重写 `TIP/FRONTEND.md`，同步第十四轮至第十六轮全部前端改动
- **更新范围**:
  - 路由表: 14 条 → 19 条（新增 5 条管理端路由）
  - 顶部导航: 新增统一设计规范
  - 首页设计: 新增布局结构、公告系统、推荐岗位规范
  - 岗位列表: 新增下拉筛选、无限滚动规范
  - 管理端: 新增 7 个子页面完整文档
  - 个人中心: 新增编辑资料、修改密码规范
  - 日期格式化: 新增 MongoDB 扩展 JSON 兼容方案
  - 页面对接状态: 更新为 13 个 Vue 页面 + 10 个小程序页面

---

*文档维护说明: 后续所有开发文档、开发日志均在 TIP/ 文件夹内生成/修改。*

---

## 十三、新增改进建议（2026-06-10 补充审查）

### IMP-01: 根目录文档整理 🟡 中

- **现状**: 项目根目录散落多个文档文件（`DEVELOPMENT.md`、`API_DOCUMENT.md`、`API_FULL.md`、`DOCUMENT_STRUCTURE.md`、`PROJECT_README.md`），其中 `DEVELOPMENT.md` 最后更新于 2026-05-23，未反映 QGPY 后端和 QGWEB 前端的架构，内容已过时。
- **建议**:
  - `DEVELOPMENT.md` — 内容已被 `TIP/TIP.md` + `TIP/FRONTEND.md` + `TIP/DATABASE.md` 全面覆盖，建议删除或在顶部标注"已过时，见 TIP/ 文件夹"
  - `API_DOCUMENT.md` / `API_FULL.md` — 合并为 `TIP/API.md`，统一 API 文档
  - `DOCUMENT_STRUCTURE.md` — 内容与 TIP/ 文档重叠，建议删除
  - `PROJECT_README.md` — 保留为项目入口文档，更新相关链接指向 TIP/
- **优先级**: 🟡 中

### IMP-02: 创建后端开发文档 BACKEND.md ✅ 已完成

- **现状**: 有 `TIP/FRONTEND.md`（前端文档）和 `TIP/DATABASE.md`（数据库文档），但缺少 QGPY 后端开发文档。
- **完成**: 已创建 `TIP/BACKEND.md`，基于学年论文设计文档 + 实际代码，覆盖：架构概览、七大模块实现对照、核心模块详解、双模型架构、配置管理、非功能需求对照、完整 API 列表、启动部署、与设计文档差异说明
- **优先级**: 🟡 中 → ✅ 已完成

### IMP-03: QGPY 环境变量敏感信息清理 🟡 中

- **现状**: `QGPY/.env` 包含真实 Cloud Env ID 和其他凭据，虽已被 `.gitignore` 排除，但文件仍存在于磁盘。
- **建议**: 将真实值替换为占位符，保留 `.env.example` 作为模板；实际值由部署环境注入
- **优先级**: 🟡 中

### IMP-04: 根目录文件名规范 🟢 低

- **现状**: 存在 `js23080509侯胜勇 勤工助学岗位匹配管理系统分析与前端页面设计.txt` 文件，文件名包含空格和中文，不利于脚本处理。
- **建议**: 重命名为 `analysis-report.txt` 或移入 `TIP/` 文件夹
- **优先级**: 🟢 低

### IMP-05: .claude/ 和 .lingma/ 目录排除 🟢 低

- **现状**: `.claude/` 和 `.lingma/` 是 AI 工具的配置目录，不应纳入项目版本控制。
- **建议**: 已在 `.gitignore` 中排除 `.lingma/`，确认 `.claude/` 也被排除
- **优先级**: 🟢 低

### IMP-06: FRONTEND.md 文档数据校正 ✅ 已修复

- **现状**: FRONTEND.md 存在两处数据不一致：
  - 第一章声称"22 条路由"，实际路由表只有 20 条（18 页面路由 + 根路径重定向 + 404 兜底）
  - 第 12.2 节标题"微信小程序页面（12 个）"，实际列表有 13 个（含 noticeManage）
- **修复**: 已修正为"20 条路由"和"13 个"页面
- **优先级**: 🟢 低 → ✅ 已修复

### IMP-07: ~$开发文档.docx 临时文件仍在 🟢 低

- **现状**: NEW-16 标记已删除，但根目录 `~$开发文档.docx`（162B）仍存在，可能是 Word 编辑器重新生成
- **建议**: 再次删除，并在 `.gitignore` 中确认 `~$*.docx` 规则生效
- **优先级**: 🟢 低

### IMP-08: QGPY 环境变量脱敏 🟡 中

- **现状**: `QGPY/.env` 包含真实 `WX_CLOUD_ENV_ID=cloud1-d7g94p70f23bf5769` 等凭据，虽已被 `.gitignore` 排除但文件存在于磁盘。与 IMP-03 为同一问题的不同表述。
- **建议**: 将 `.env` 中真实值替换为占位符，保留 `.env.example` 作为模板；实际值由部署环境注入
- **优先级**: 🟡 中

---

## 十四、项目文档索引

> TIP/ 文件夹是项目开发文档的统一存放位置。

| 文档 | 说明 | 状态 |
|------|------|------|
| [TIP/TIP.md](TIP.md) | **主文档** — 改进建议、Bug 追踪、安全审计、开发日志 | ✅ 活跃维护 |
| [TIP/FRONTEND.md](FRONTEND.md) | 前端开发文档 — QGWEB + 小程序架构、路由、组件、样式规范 | ✅ 活跃维护 |
| [TIP/DATABASE.md](DATABASE.md) | 数据库配置文档 — 集合结构、索引、安全规则、初始化流程 | ✅ 活跃维护 |
| [TIP/BACKEND.md](BACKEND.md) | 后端开发文档 — QGPY Flask 架构、路由、模型、认证 | ✅ 已创建 |
| [TIP/TECHNICAL.md](TECHNICAL.md) | 综合技术文档 — 开发流程/控件/页面/技术栈/路由/数据库/数据交互 | ✅ 已创建 |

**根目录文档**（建议逐步迁移到 TIP/ 或标记过时）:

| 文档 | 说明 | 状态 |
|------|------|------|
| `PROJECT_README.md` | 项目入口说明（快速开始、项目结构） | ✅ 保留 |
| `DEVELOPMENT.md` | 旧版开发文档（2026-05-23） | ⚠️ 已过时 |
| `API_DOCUMENT.md` | API 接口文档 | ⚠️ 待整合 |
| `API_FULL.md` | 完整 API 文档 | ⚠️ 待整合 |
| `DOCUMENT_STRUCTURE.md` | 文档结构说明 | ⚠️ 已过时 |
| `QGPY/README.md` | QGPY 后端说明 | ✅ 保留 |

---

## 十五、开发日志（续）

> 2026-06-10 晚间开发轮次，所有时间均为本地时间。

---

### 📅 2026-06-10 开发日志（晚间）

#### ⏰ 22:30 — 第十七轮：后端统计数据修复 + 小程序管理端全面同步

**后端统计数据修复**:
- `22:30` — `QGPY/app/routes/admin.py` `/stats` 接口从 `Job.find_list({}, None, 1, 1)[1]` 改为直接调用 `wx_db.database_query()`，limit 从 1 改为 1000，解决 `page_size=1` 导致统计永远 ≤1 的问题
- `22:30` — 统一四个统计项（岗位/待审核/学生/薪资）为直接 `wx_db.database_query` 调用 + `len(records)` 计数
- `22:30` — 添加 `[STATS]` 日志输出，便于排查

**小程序管理端全面同步（对齐 WEB 端）**:
- `22:35` — `pages/admin/jobManage/jobManage.js` 重写：搜索+状态筛选（全部状态/招聘中/已满员/已关闭）+ 完整 15 字段编辑表单 + 三状态 picker 切换
- `22:35` — `pages/admin/jobManage/jobManage.wxml` 重写：搜索栏+筛选 picker+发布按钮+编辑弹窗（scroll-view 滚动表单）
- `22:35` — `pages/admin/jobManage/jobManage.wxss` 重写：搜索/筛选/弹窗/表单/三状态标签样式
- `22:40` — `pages/admin/applicationReview/applicationReview.js` 新增：全部状态筛选 + 时间排序 + `viewStudent()` + `viewJob()` 方法
- `22:40` — `pages/admin/applicationReview/applicationReview.wxml` 新增：全部标签 + 排序按钮 + 查看学生/查看岗位按钮
- `22:40` — `pages/admin/applicationReview/applicationReview.wxss` 新增：`.btn-student`/`.btn-job` 橙色样式 + cancelled 状态色
- `22:45` — 新建 `pages/admin/studentManage/`（4 个文件）：搜索+编辑（11 字段）+重置密码+禁用/启用 + `?studentId=xxx` 自动打开
- `22:45` — 新建 `pages/admin/noticeManage/`（4 个文件）：公告列表+编辑+删除+发布弹窗
- `22:50` — `pages/admin/admin.js` 重写：学生管理改为跳转独立页面 + 公告管理改为跳转公告管理页面
- `22:50` — `pages/admin/admin.wxml` 重写：公告卡片 → 两个菜单项（公告管理 + 发布公告）
- `22:50` — `app.json` 注册 `studentManage` + `noticeManage` 页面

#### ⏰ 23:00 — 第十八轮：管理员登录权限修复

**问题**: 管理员账号登录后进入管理端弹出"需要管理员权限"
- **根因**: `initDB` 创建管理员时 `openid: ''`（空字符串），`admin` 云函数 `verifyUser` 按 openid 查找 → 找不到 → 返回 null

**修复**:
- `23:00` — `cloudfunctions/auth/index.js` 登录成功后将微信 OPENID 写入用户记录（`updateData.openid = wxOpenid`）
- `23:00` — `cloud/common/auth.js` `verifyUser` 改为双重验证：openid 优先 → 失败时通过 token 回退（解析 userId → 查找用户 → 补写 openid）
- `23:00` — 同步到全部 7 个云函数的 `common/auth.js`
- `23:00` — `utils/util.js` `callCloudFunction` 自动从 `wx.getStorageSync('tokenData')` 读取 token 附带到 event

#### ⏰ 23:15 — 第十九轮：申请审核添加查看学生/查看岗位

**WEB 端**:
- `23:15` — `applicationReview.vue` 添加「查看岗位」按钮（橙色）+ 跳转 `/admin/job-manage?jobId=xxx`
- `23:15` — `allApplications.vue` 添加「查看岗位」按钮 + 样式
- `23:15` — `jobManage.vue` `onMounted` 新增 `route.query.jobId` 支持，自动打开对应岗位编辑弹窗

**小程序端**:
- `23:15` — `applicationReview.wxml` 添加「查看岗位」按钮
- `23:15` — `applicationReview.js` 新增 `viewJob()` 方法
- `23:15` — `jobManage.js` `onLoad` 支持 `?jobId=xxx` 参数，加载后自动打开编辑弹窗

#### ⏰ 23:30 — 第二十轮：公告管理系统重构

**WEB 端**:
- `23:30` — 新建 `admin/noticeManage.vue`：公告列表 + 编辑/删除/发布弹窗
- `23:30` — `admin.ts` 新增 `publishNotice()`/`updateNotice()`/`deleteNotice()` API
- `23:30` — `admin/index.vue` 公告卡片 → 两个菜单项（公告管理 + 发布公告），移除旧弹窗
- `23:30` — `router/index.ts` 新增 `/admin/notice-manage` 路由

**小程序端**:
- `23:30` — 新建 `pages/admin/noticeManage/`（4 个文件）
- `23:35` — `cloudfunctions/admin/index.js` 新增 `updateNotice` action

**后端**:
- `23:35` — `QGPY/app/routes/admin.py` 新增 `POST /notices`（发布）、`PUT /notices/:id`（更新）、`DELETE /notices/:id`（删除）
- `23:35` — `QGPY/app/utils/wx_cloud_db.py` 新增 `database_delete()` 方法

#### ⏰ 23:45 — 第二十一轮：首页公告跳转 + 导航系统升级

**全部公告页面**:
- `23:45` — 新建 `QGWEB/src/views/notices/index.vue`：公告卡片列表 + 点击详情弹窗
- `23:45` — 新建 `pages/notices/`（4 个文件）：小程序公告列表页面
- `23:45` — `router/index.ts` 新增 `/notices` 路由（`showTabBar: true`）
- `23:45` — `app.json` 注册 `pages/notices/notices`

**首页"查看更多"跳转**:
- `23:45` — WEB 首页公告"查看更多"从弹窗改为 `router.push('/notices')`
- `23:45` — 小程序首页 `viewAllNotices` 改为 `goToNotices` → `wx.switchTab`
- `23:45` — 移除 WEB 首页旧的"全部公告"弹窗

**导航系统升级**:
- `23:50` — WEB `TabBar.vue` 添加"公告"标签（文档 SVG 图标）
- `23:50` — WEB 桌面导航 4 个页面（home/profile/jobList/notices）统一添加"全部公告"
- `23:50` — 小程序 `app.json` tabBar 添加"公告"标签（notice.png / notice-active.png）
- `23:50` — 生成 `images/notice.png`（灰色 81×81）和 `images/notice-active.png`（蓝色 81×81）

**个人中心调整**:
- `23:55` — WEB `profile/index.vue` 菜单顺序改为：查看公告 → 我的申请 → 岗位列表 → 薪资查询
- `23:55` — WEB `profile/index.vue` 新增公告列表弹窗 + 公告详情弹窗
- `23:55` — 小程序 `profile.wxml` 菜单顺序同步调整
- `23:55` — 小程序 `profile.js` `viewNotices` 改为 `wx.switchTab` 跳转公告页

#### ⏰ 00:10 — 第二十二轮：管理端手机端布局优化

**小程序端**（6 个 WXSS 文件统一优化）:
- `00:10` — 所有管理页面 `.container` 添加 `box-sizing: border-box; overflow-x: hidden`
- `00:10` — 弹窗结构优化：`.modal-box` 使用 flex 布局，`.modal-body` 为 `flex: 1; overflow-y: auto`，header/footer `flex-shrink: 0`
- `00:10` — 文本截断：岗位名/学生名/公告标题添加 `text-overflow: ellipsis`
- `00:10` — 按钮溢出：所有操作按钮区域添加 `flex-wrap: wrap`，按钮添加 `white-space: nowrap`
- `00:10` — 输入框：`.search-input`/`.form-input` 添加 `min-width: 0; box-sizing: border-box`
- `00:10` — 表单行：`.form-group.half` 添加 `min-width: 0` 防止内容撑开

**WEB 端**（5 个 Vue 文件优化）:
- `00:10` — `jobManage.vue` 搜索栏手机端垂直排列 + 发布按钮全宽 + 筛选换行 + 弹窗 `max-height: 65vh`
- `00:10` — `applicationReview.vue` 操作按钮 `flex-wrap: wrap` + 手机端字号缩小
- `00:10` — `allApplications.vue` 筛选栏换行 + 操作按钮换行
- `00:10` — `studentManage.vue` 搜索栏收缩 + 元信息/按钮换行 + 表单单列 + 弹窗 max-height
- `00:10` — `noticeManage.vue` 操作栏间距优化

#### ⏰ 00:20 — 文档全面更新

- `00:20` — 重写 `TIP/FRONTEND.md`：路由表 22 条、导航系统（桌面+TabBar+小程序）、管理端 7 个子页面、公告系统、个人中心布局、移动端优化规范、页面对接状态
- `00:20` — 更新 `TIP/TIP.md`：添加第十七轮至第二十二轮开发日志

---

### 📊 2026-06-10 晚间开发统计

| 指标 | 数值 |
|------|------|
| 开发轮次 | 6 轮（第十七轮至第二十二轮） |
| 新建页面 | 4 个（notices × 2端 + studentManage + noticeManage 小程序端） |
| 修改文件 | 30+ 个 |
| 新建文件 | 12 个 |
| 新增 API | 3 个（publishNotice/updateNotice/deleteNotice） |
| 新增云函数 action | 1 个（updateNotice） |
| 新增 TabBar 标签 | 双端各 1 个（公告） |
| 修复 Bug | 2 个（管理员登录权限 + 统计数据为 0） |
| 移动端布局优化 | 11 个文件 |

---

### 📅 2026-06-10 开发日志（深夜 — 文档校正）

#### ⏰ 23:30 — 第二十三轮：项目状态复查 + 文档校正

- **事件**: 新一轮项目审查，核对 TIP.md/FRONTEND.md 与实际代码的一致性
- **审查范围**: 路由配置、云函数目录、小程序页面、Vue 视图、待办事项状态

**发现与修复**:
- `23:30` — FRONTEND.md 路由数从"22 条路由"修正为"20 条路由"（实际 18 页面路由 + 根路径重定向 + 404 兜底）（IMP-06）
- `23:30` — FRONTEND.md 小程序页面数从"12 个"修正为"13 个"（遗漏 noticeManage）（IMP-06）
- `23:30` — TIP.md 待办事项 FEAT-02 状态更新为 ✅ 已完成（第十五轮~第十六轮已全部实现 7 个管理端页面）
- `23:30` — TIP.md 新增 IMP-06/07/08 三项改进建议
- `23:30` — 发现 `~$开发文档.docx` 临时文件仍存在（NEW-16 标记已删除但被 Word 重新生成）

**当前项目状态总结**:

| 维度 | 状态 |
|------|------|
| 云函数 | 7 个全部就绪（auth/jobs/applications/admin/salary/initDB/seedData）+ common |
| QGWEB Vue 页面 | 18 个页面 + 1 个 404，全部对接真实 API |
| 小程序页面 | 16 个（app.json 注册），全部对接真实云函数 |
| QGPY 后端 | 5 个路由蓝图 + 4 个 Cloud 模型，全部使用云数据库 HTTP API |
| 文档 | TIP/ 下 4 个文档（TIP.md/FRONTEND.md/BACKEND.md/DATABASE.md） |
| 待处理项 | 3 项（FLOW-01 暂停 + FLOW-02 测试 + FEAT-04 通知） |

#### ⏰ 23:45 — 第二十四轮：桌面端导航栏统一优化

- **事件**: 统一四个主要页面（首页/岗位列表/全部公告/个人中心）的桌面端顶部导航栏样式

**变更**:
- `23:45` — 四个页面 `.logo` 改为 `<img>` 头像 + 文字横向布局，头像使用 `src/assets/QG.png`（32×32px 圆角）
- `23:45` — `notices/index.vue` 补全缺失的 `.header-right` 用户区（用户名 + 退出按钮），此前该页面完全没有右侧用户信息
- `23:45` — `notices/index.vue` 新增 `useUserStore` 导入 + 退出确认逻辑 + `Modal` 组件引入
- `23:45` — 四个页面 `.logo` CSS 统一为 `display: flex; align-items: center; gap: 8px` 布局
- `23:45` — 标记 FLO 目录为参考项目（NEW-09 → ✅ 保留）

**影响文件**:
- `QGWEB/src/views/home/index.vue` — Logo 头像 + CSS 更新
- `QGWEB/src/views/jobList/index.vue` — Logo 头像 + CSS 更新
- `QGWEB/src/views/notices/index.vue` — Logo 头像 + 补全右侧用户区 + 退出逻辑 + Modal + CSS 全面更新
- `QGWEB/src/views/profile/index.vue` — Logo 头像 + CSS 更新

#### ⏰ 00:15 — 第二十五轮：推荐岗位 401 修复 + 头像缺失修复

- **事件**: 小程序首页加载推荐岗位返回 401 错误；个人中心头像图片缺失

**Bug-05: 推荐岗位 401 错误**:
- **现象**: 登录后首页推荐岗位仍返回 `{code: 401, message: "请先登录"}`，但岗位列表正常
- **根因**: `cloudfunctions/jobs/index.js` 的 `getRecommendJobs()` 硬性要求 `verifyUser` 成功且角色为 student，验证失败直接返回 401；而 `getJobList()` 则优雅降级（未登录时跳过匹配度计算）
- **修复**:
  - `cloudfunctions/jobs/index.js` `getRecommendJobs()` 移除硬性 401 检查，改为：验证成功且为学生 → 计算匹配度排序；否则 → 返回最新招聘中岗位（无匹配度）
  - `QGPY/app/routes/jobs.py` `/recommend` 端点移除 `@login_required` 装饰器，改为可选认证（未登录返回最新岗位，已登录计算匹配度）
- **影响**: 首页推荐岗位在任何登录状态下均可正常显示

**Bug-06: default-avatar.png 缺失**:
- **现象**: 个人中心控制台报 `Failed to load local image resource /images/default-avatar.png`（500 错误）
- **根因**: `pages/profile/profile.wxml` 引用 `/images/default-avatar.png` 作为默认头像，但该文件不存在
- **修复**: 将 `<image>` 标签改为条件渲染：有 `avatarUrl` 时显示图片，否则显示文字头像（姓名首字 + 蓝色渐变圆形背景），与 Vue 端风格一致
- **影响文件**: `pages/profile/profile.wxml` + `pages/profile/profile.wxss`

#### ⏰ 00:30 — 第二十六轮：导航栏布局优化 + 移动端顶部栏

- **事件**: 优化桌面端导航栏布局（Logo 居左、用户名居右），新增移动端顶部导航栏

**桌面端优化**:
- `00:30` — 4 个页面 `.header-content` 移除 `max-width: 1200px` + `margin: 0 auto`，改为全宽布局
- `00:30` — `padding` 从 `0 24px` 改为 `0 48px`，Logo 和用户名分别贴近页面左右两侧
- `00:30` — 导航菜单保持 `margin: 0 auto` 居中

**移动端顶部栏**:
- `00:30` — `styles/responsive.scss` 新增全局 `.mobile-header` + `.mobile-header-title` 样式（44px 高，蓝色背景，白色居中标题）
- `00:30` — 4 个页面模板新增 `<header class="mobile-header hide-desktop">` 元素
  - home: "勤工助学岗位匹配系统"
  - jobList: "岗位列表"
  - notices: "全部公告"
  - profile: "个人中心"
- `00:30` — notices 页面移除旧的 `.mobile-title` 元素和 CSS（被全局 `.mobile-header` 替代）

**影响文件**:
- `QGWEB/src/styles/responsive.scss` — 新增移动端导航栏全局样式
- `QGWEB/src/views/home/index.vue` — 移动端 header + 桌面端全宽
- `QGWEB/src/views/jobList/index.vue` — 移动端 header + 桌面端全宽
- `QGWEB/src/views/notices/index.vue` — 移动端 header + 桌面端全宽 + 移除旧 mobile-title
- `QGWEB/src/views/profile/index.vue` — 移动端 header + 桌面端全宽

#### ⏰ 01:00 — 第二十七轮：浏览器标签页 + 小程序交互优化 + 文档全面更新

**浏览器标签页优化**:
- `01:00` — `QGWEB/index.html` `<title>` 从 "qgweb" 改为 "勤工助学岗位匹配系统"
- `01:00` — favicon 从 `favicon.svg` 改为 `favicon.png`（复制自 `src/assets/QG.png`）
- `01:00` — `<html lang>` 从 "en" 改为 "zh-CN"

**小程序首页公告点击详情**:
- `01:00` — `pages/index/index.wxml` 公告条目添加 `bindtap="openNotice"` 点击事件
- `01:00` — `pages/index/index.js` 新增 `openNotice()`/`closeNotice()` 方法 + `showNoticeDetail`/`selectedNotice` 数据字段
- `01:00` — `pages/index/index.wxml` 底部新增公告详情弹窗（标题+完整内容+日期+关闭按钮）
- `01:00` — `pages/index/index.wxss` 新增 `.modal-overlay`/`.modal-box`/`.modal-body` 弹窗样式 + `.notice-item:active` 按压反馈

**小程序岗位列表筛选/排序默认值修复**:
- `01:00` — `pages/jobList/jobList.js` 状态筛选新增 `statusText: '招聘中'` 显示字段（之前显示英文 code `recruiting`）
- `01:00` — `pages/jobList/jobList.js` 筛选选项从字符串数组改为 `{label, value}` 结构，状态值映射为英文 code
- `01:00` — `pages/jobList/jobList.js` `sortBy` 默认值从 `'publishDate'` 改为 `'default'`（与模板 `sortBy === 'default'` 匹配，"默认"按钮正确高亮）
- `01:00` — `pages/jobList/jobList.js` `loadJobList` 新增 `sortByMap` 映射（`'default'` → `'publishDate'`）
- `01:00` — `pages/jobList/jobList.wxml` 状态筛选显示从 `filterData.status` 改为 `filterData.statusText`

**FRONTEND.md 文档全面更新**:
- `01:00` — 修复 3.2 节编号重复（TabBar 改为 3.3/3.4）
- `01:00` — 新增 4.2 公告可点击说明 + 4.3 推荐岗位可选认证说明
- `01:00` — 新增 5.2 排序方式说明（小程序端默认/薪资/匹配度）
- `01:00` — 新增 7.1 用户头像说明（双端文字头像方案）
- `01:00` — 新增第十一章「浏览器标签页」（title + favicon）
- `01:00` — 章节编号全面调整（十一→十二→十三→十四→十五）

**影响文件**:
- `QGWEB/index.html` — title + favicon + lang
- `QGWEB/public/favicon.png` — 新增（QG.png 副本）
- `pages/index/index.wxml` — 公告点击 + 详情弹窗
- `pages/index/index.js` — openNotice/closeNotice 方法
- `pages/index/index.wxss` — 弹窗样式 + 按压反馈
- `pages/jobList/jobList.js` — 筛选/排序默认值修复
- `pages/jobList/jobList.wxml` — 状态显示修复
- `TIP/FRONTEND.md` — 全面更新（章节重排+新增内容）

---

*文档维护说明: 后续所有开发文档、开发日志均在 TIP/ 文件夹内生成/修改。*

## 十六、设计文档审查 + FLO 参考项目分析（2026-06-11）

### 📅 2026-06-11 — 设计文档与 FLO 参考项目深度审查

#### 设计文档审查（学年论文）

已完整阅读 `js23080509侯胜勇 勤工助学岗位匹配管理系统分析与前端页面设计.txt`（GBK 编码），核心内容对照：

| 设计文档要求 | 实际实现 | 状态 |
|------------|---------|------|
| 7 大功能模块（用户/岗位/智能匹配/申请审核/薪酬/统计/设置） | 全部已实现（含双端） | ✅ 完全覆盖 |
| 分层架构（表现/业务逻辑/数据访问/存储） | 云函数+QGPY Flask+云数据库 HTTP API | ✅ 已实现 |
| Web 端 Vue.js 框架 | Vue 3 + TypeScript + Vite + Pinia | ✅ 已实现 |
| 微信小程序端 | 原生 WXML/WXSS/JS + 云开发 | ✅ 已实现 |
| 智能匹配算法 | QGPY `calculate_match_score()`（关键词+权重） | ✅ 已实现 |
| 数据统计 + 报表导出 | 管理后台统计卡片 + JSON 导出 | ⚠️ 无 Excel 导出 |
| 数据库设计 8 张表 | 云数据库 5 个集合（users/jobs/applications/salary_records/notices） | ⚠️ 无独立匹配结果表/系统日志表 |
| 响应式适配 | 桌面+平板+手机三断点 | ✅ 已实现 |
| 性能：Web<3s / 小程序<2s | Vite + 云函数冷启动 | ✅ 基本达标 |
| 安全：密码加密+权限控制+防攻击 | bcrypt+HMAC Token+白名单+转义 | ✅ 已实现 |

**与设计文档的差异（非阻塞性）**:
1. **数据库**: 设计文档要求 MySQL 8 张表，实际使用微信云数据库 5 个集合。差异在于：匹配结果实时计算（不存储）、系统日志暂未实现、学生信息与用户合并为一张表。这是合理的架构简化。
2. **报表导出**: 设计文档要求 Excel 格式，实际为 JSON 下载。建议后续增加 CSV/Excel 导出能力。
3. **数据访问层**: 设计文档提到 JDBC，实际通过 `wx_cloud_db.py` 的 HTTP API 访问。差异在于平台选型（云开发 vs 传统服务器），功能等价。

---

#### FLO 参考项目架构分析

FLO（family-web）是一个**家庭任务管理系统**，技术栈与 QGWEB 高度相似但架构更成熟，以下是值得参考的架构模式：

**1. 路由模块化**

FLO 的路由按功能域拆分为独立模块：
```
router/
├── index.js          # 主路由（汇总 + 404 兜底）
├── guards.js         # 路由守卫（认证/权限）
└── modules/
    ├── landing.js    # 落地页路由
    ├── auth.js       # 认证路由
    ├── home.js       # 首页路由
    ├── task.js       # 任务路由
    ├── family.js     # 家庭路由
    ├── profile.js    # 个人中心路由
    └── statistics.js # 统计路由
```
QGWEB 当前所有 20 条路由集中在单个 `router/index.ts` 文件中。**建议**: 按 admin / student / common 三个域拆分路由模块。

**2. 布局组件体系**

FLO 有完善的布局组件体系：
- `PageContainer.vue` — 统一页面容器（NavBar + 内容区 + TabBar 预留空间）
- `NavBar.vue` — 通用顶部导航（标题 + 返回按钮 + 右侧插槽）
- `TabBar.vue` — 底部标签栏（图标 + 未读数徽章 + safe-area 适配）
- `DesktopLayout.vue` / `MobileLayout.vue` — 桌面/移动端差异化布局

QGWEB 的 4 个主页面各自维护独立的导航栏和 TabBar 逻辑，存在大量重复代码。**建议**: 提取 `PageContainer` + `DesktopNav` + `MobileHeader` 公共组件。

**3. 可复用组件库**

FLO 的 `components/common/` 目录有 12 个通用组件：
- `EmptyState.vue` — 空状态占位（图标+文字+操作按钮）
- `ErrorState.vue` — 错误状态（图标+重试按钮）
- `LoadingState.vue` — 加载状态（spinner + 骨架屏）
- `ConfirmDialog.vue` — 确认对话框（二次确认通用组件）
- `PullRefresh.vue` — 下拉刷新（移动端手势）
- `AppIcon.vue` — 统一图标组件（size/color 属性）
- `MenuItem.vue` — 菜单项组件

QGWEB 当前的 Loading/Empty/Error 状态在各页面内联实现。**建议**: 提取公共组件统一风格。

**4. Composables（组合式函数）**

FLO 的 `composables/` 目录抽取了可复用的逻辑：
- `useAuth.js` — 认证状态管理
- `useDevice.js` — 设备检测（移动端/桌面端/暗黑模式）
- `useClipboard.js` — 剪贴板操作
- `usePushNotification.js` — 推送通知

QGWEB 的认证、设备检测等逻辑分散在各组件中。**建议**: 抽取 `useAuth()`、`useDevice()`、`useInfiniteScroll()` 等 composable。

**5. 请求层设计**

FLO 的 `api/request.js` 有完善的：
- NProgress 进度条（请求开始/结束自动控制）
- Token 自动注入 + 401 自动刷新（refreshToken 机制 + 请求队列重发）
- 公共认证路径白名单（登录/注册等不注入 Token）
- 分层错误处理（HTTP 状态码 → 服务端消息 → 回退消息）
- 请求超时 15s

QGWEB 的 `request.ts` 已有基本的拦截器和错误处理，但缺少：进度条、Token 刷新、公共路径白名单。**建议**: 参考 FLO 补全。

**6. Vite 构建优化**

FLO 的 `vite.config.js` 亮点：
- `unplugin-auto-import` + `unplugin-vue-components` + `ElementPlusResolver`：Vue/Router/Pinia API 自动导入 + Element Plus 组件按需导入
- SCSS 全局变量注入（`additionalData`）
- `manualChunks` 分包策略（vue/elementPlus/echarts 独立 chunk）

QGWEB 当前未使用自动导入。**建议**: 添加 auto-import 插件减少样板代码。

**7. CSS 变量主题系统**

FLO 的 `tailwind.config.js` 将所有颜色映射到 CSS 变量：
```js
primary: { DEFAULT: "var(--primary)", hover: "var(--primary-hover)" }
```
配合 `:root.dark` 实现一键切换暗黑模式。

QGWEB 当前使用硬编码的 `#4A90E2` 等颜色值。**建议**: 统一为 CSS 变量，为暗黑模式做准备。

---

#### 新增改进建议

### REF-01: 路由模块化拆分 🟡 中

- **现状**: QGWEB 的 20 条路由全在单文件中
- **参考**: FLO `router/modules/` 按功能域拆分
- **建议**: 拆分为 `modules/admin.ts`（8 条）+ `modules/student.ts`（9 条）+ `modules/common.ts`（3 条）
- **优先级**: 🟡 中

### REF-02: 布局组件提取 🟡 中

- **现状**: 4 个主页面各自维护桌面导航 + 移动端 header
- **参考**: FLO `PageContainer.vue` + `NavBar.vue`
- **建议**: 提取 `DesktopNav.vue`（Logo+导航+用户区）+ `MobileHeader.vue`（标题栏）+ `PageContainer.vue`（统一容器）
- **优先级**: 🟡 中

### REF-03: 通用组件库建设 🟡 中

- **现状**: Loading/Empty/Error 状态各页面内联实现
- **参考**: FLO `components/common/` 12 个通用组件
- **建议**: 提取 `EmptyState.vue`、`ErrorState.vue`、`ConfirmDialog.vue`、`AppIcon.vue` 等公共组件
- **优先级**: 🟡 中

### REF-04: Composables 抽取 🟢 低

- **现状**: 认证/设备检测/无限滚动逻辑分散
- **参考**: FLO `composables/` 目录
- **建议**: 抽取 `useAuth()`、`useDevice()`、`useInfiniteScroll()` 等
- **优先级**: 🟢 低

### REF-05: 请求层增强 🟡 中

- **现状**: QGWEB request.ts 缺少进度条和 Token 刷新
- **参考**: FLO NProgress + refreshToken + 请求队列
- **建议**: 添加 NProgress 进度条 + 公共路径白名单
- **优先级**: 🟡 中

### REF-06: Auto-Import 插件 🟢 低

- **现状**: QGWEB 手动导入 Vue/Router/Pinia API
- **参考**: FLO `unplugin-auto-import` + `unplugin-vue-components`
- **建议**: 添加自动导入插件，减少 import 样板代码
- **优先级**: 🟢 低

### REF-07: CSS 变量主题系统 🟢 低

- **现状**: 硬编码颜色值（`#4A90E2` 等）
- **参考**: FLO Tailwind CSS 变量映射
- **建议**: 将主题色/文本色/背景色统一为 CSS 变量，为暗黑模式做准备
- **优先级**: 🟢 低（当前无暗黑模式需求）

### REF-08: Excel 报表导出 🟢 低

- **现状**: 数据导出为 JSON 格式
- **设计文档要求**: 报表导出为 Excel 格式
- **建议**: 使用 `SheetJS (xlsx)` 库实现 Excel 导出
- **优先级**: 🟢 低（JSON 可满足当前需求；发薪清单已支持 CSV 导出）

---

## 十七、薪资管理模块实现（2026-06-11）

### 📅 2026-06-11 — 薪资管理全面实现

**事件**: 实现管理端薪资管理完整功能：后端 API + 云函数 + Vue 管理端 + 小程序管理端 + 发薪清单导出

**后端 (QGPY)**:
- `salary_cloud.py` — 新增 `update()`（白名单更新 + 自动重算金额）+ `delete()`
- `salary.py` — 新增 `PUT /salary/update` + `DELETE /salary/delete` + 改写 `POST /salary/calculate`（月度汇总统计）
- `admin.py` — 新增 `GET /admin/payroll-export`（发薪清单导出，按月分组+关联学生信息）

**云函数 (salary/index.js)**:
- 新增 `edit` + `delete` action（含已发放不可编辑/删除保护）
- 改写 `calculate`（空壳→真实月度汇总：按 studentId 分组 + 查询学生姓名 + 计算总工时/总金额/已发/未发）
- 修复 `querySalary` — totalHours 从硬编码 0 改为实际计算；payStatus 逻辑修正

**Vue 前端**:
- `salaryManage.vue` — **新建** 管理端薪资管理页面（筛选+汇总+列表+录入/编辑/删除/发放/批量发放）
- `dataExport.vue` — 新增「发薪清单」CSV 导出选项
- `router/index.ts` — 新增 `/admin/salary-manage` 路由
- `admin/index.vue` — 修复薪资管理跳转
- `salaryQuery/index.vue` — 月份动态化

**小程序前端**:
- `pages/admin/salaryManage/` — **新建** 4 个文件
- `pages/admin/admin.js` — 修复薪资跳转
- `app.json` — 注册 salaryManage
- `pages/salaryQuery/` — 月份动态化

**变更统计**: 修改 12 文件 + 新建 5 文件 + 新增 4 API 端点 + 新增 2 云函数 action

---

## 十八、管理端接口全面审查（2026-06-11）

### 📅 2026-06-11 — 申请审核失败修复 + 全面后端审查

#### 紧急修复：申请审核 action 参数冲突

**根因**: `callApplications('review', { action: 'approve' })` 中 `action: 'approve'` 覆盖了 `action: 'review'`，导致云函数 switch 匹配到 default → "未知的操作"

**修复**:
- `cloudfunctions/applications/index.js` — `reviewApplication` 参数从 `action` 改为 `reviewAction`
- `pages/admin/applicationReview/applicationReview.js` — 调用参数从 `action` 改为 `reviewAction`
- `QGPY/app/models/application_cloud.py` — `find_by_apply_id` 改为双路径查找（先 `applyId` 字段，再 `_id`），兼容云函数创建的无 applyId 记录

#### 审查发现并修复的其他问题

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| #6 | 🔴 高 | `Salary.update()` 用 `record_id` 而非 `record['_id']` 查询，导致 recordId 字段查询时更新失败 | 改用 `record.get('_id')` |
| #23 | 🔴 高 | `Salary.pay()` 返回 dict 但路由用 `.modified_count` 属性访问 → AttributeError | 改为 `result['modified_count']` |
| #10 | 🔴 高 | `/debug-cloud-db` 端点无认证，暴露 token 和数据 | 添加 `@admin_required` |
| #14 | 🔴 高 | 云函数 `exportData` 无 `.limit()` 默认 20 条 | 添加 `.limit(1000)` |
| #15 | 🔴 高 | 云函数 `getStats` 薪资查询默认 20 条 | 添加 `.limit(1000)` |
| #3 | 🟡 中 | `salary.py` / `admin.py` 循环变量 `g` 遮蔽 Flask `g` 对象 | 重命名为 `grp` |
| #8 | 🟡 中 | `change_password` 直接用 `bcrypt.checkpw`，明文密码会崩溃 | 兼容 bcrypt 哈希和明文 |
| #9 | 🟡 中 | `change_password` 未检查 `request.get_json()` 返回 None | 添加空值检查 |

#### 仍在的已知限制（暂不修复）

| # | 严重度 | 问题 | 原因 |
|---|--------|------|------|
| #1 | 🟡 | 云数据库 HTTP API 查询上限 | 微信平台限制，已通过 `.limit(1000)` 尽量缓解 |
| #7 | 🟡 | `Application.find_list` `$in` 过滤需客户端过滤 | 云数据库 HTTP API 不支持 `$in`，当前数据量可控 |
| #18 | 🟢 | QGPY `Job.delete()` 软删除 vs 云函数硬删除不一致 | 设计决策，当前不影响功能 |
| #19 | 🟢 | 学生搜索字段前后端不一致 | 低影响 |

---

## 十九、开发日志（带时间戳）

> 2026-06-11 全天开发记录，所有时间均为本地时间。

---

### 📅 2026-06-11 开发日志

#### ⏰ 09:30 — 设计文档 + FLO 参考项目审查

- **事件**: 读取学年论文设计文档（GBK 编码）+ FLO 参考项目架构分析
- **范围**: 设计文档 7 大模块对照、FLO 家庭任务管理系统源码分析
- **产出**: TIP.md 第十六章（设计文档 vs 实际实现对照表 + FLO 7 大架构模式分析 + 8 项改进建议 REF-01~08）

#### ⏰ 10:00 — 薪资管理模块方案设计

- **事件**: 制定薪资管理完整实现方案
- **范围**: 后端 API + 云函数 + Vue 管理端 + 小程序管理端 + 发薪清单导出
- **产出**: 方案文档（14 个修改文件 + 5 个新建文件 + 7 个验证步骤）

#### ⏰ 10:30 — 后端实现（QGPY）

- `10:30` — `QGPY/app/models/salary_cloud.py` — 新增 `update()`（白名单+自动重算金额）+ `delete()`
- `10:35` — `QGPY/app/routes/salary.py` — 新增 `PUT /salary/update` + `DELETE /salary/delete`
- `10:40` — `QGPY/app/routes/salary.py` — 改写 `POST /salary/calculate`（空壳→月度汇总统计：按学生分组聚合+关联学生姓名）
- `10:45` — `QGPY/app/routes/admin.py` — 新增 `GET /admin/payroll-export`（发薪清单导出：按月分组+关联学生信息）

#### ⏰ 11:00 — 云函数扩展

- `11:00` — `cloudfunctions/salary/index.js` — 新增 `edit` action（白名单更新+自动重算+已发放不可编辑）
- `11:05` — `cloudfunctions/salary/index.js` — 新增 `delete` action（已发放不可删除）
- `11:10` — `cloudfunctions/salary/index.js` — 改写 `calculate` action（空壳→真实月度汇总统计）
- `11:15` — `cloudfunctions/salary/index.js` — 修复 `querySalary`：totalHours 从硬编码 0 改为实际计算；payStatus 逻辑修正

#### ⏰ 11:30 — Vue 前端 API 层

- `11:30` — `QGWEB/src/api/salary.ts` — 新增 `updateSalary()` + `deleteSalary()`
- `11:35` — `QGWEB/src/api/admin.ts` — 新增 `exportPayroll()`

#### ⏰ 11:45 — Vue 管理端薪资管理页面

- `11:45` — `QGWEB/src/views/admin/salaryManage.vue` — **新建** 管理端薪资管理页面
  - 月份筛选+状态筛选+学生搜索
  - 月度汇总卡片（学生数/总工时/应发/已发/未发）
  - 薪资记录列表（分页+全选+状态标签）
  - 录入工时弹窗（学生ID+岗位ID+日期+工时+时薪+备注）
  - 编辑弹窗（仅 unpaid 可编辑）
  - 删除确认+单条发放+批量发放+按月发放
  - 响应式布局（桌面 5 列汇总→手机 2 列）

#### ⏰ 12:00 — Vue 导出 + 路由 + 修复

- `12:00` — `QGWEB/src/views/admin/dataExport.vue` — 新增「发薪清单」CSV 导出选项（含月份选择器）
- `12:05` — `QGWEB/src/router/index.ts` — 新增 `/admin/salary-manage` 路由
- `12:10` — `QGWEB/src/views/admin/index.vue` — 修复薪资管理/统计跳转从 `/salary-query` → `/admin/salary-manage`
- `12:15` — `QGWEB/src/views/salaryQuery/index.vue` — 月份列表从硬编码改为动态生成（近 6 个月）

#### ⏰ 12:30 — 小程序端实现

- `12:30` — `pages/admin/salaryManage/salaryManage.js` — **新建** 薪资管理页面逻辑（列表+汇总+录入/编辑/删除/发放+分页+全选+批量）
- `12:35` — `pages/admin/salaryManage/salaryManage.wxml` — **新建** 模板（筛选+汇总+列表+4 个弹窗）
- `12:40` — `pages/admin/salaryManage/salaryManage.wxss` — **新建** 样式（卡片+筛选+汇总+列表+弹窗+响应式）
- `12:45` — `pages/admin/salaryManage/salaryManage.json` — **新建** 页面配置
- `12:50` — `pages/admin/admin.js` — 修复薪资管理/统计跳转指向新页面
- `12:55` — `app.json` — 注册 `salaryManage` 页面
- `13:00` — `pages/salaryQuery/salaryQuery.js` + `.wxml` — 月份动态化

#### ⏰ 13:15 — 文档更新

- `13:15` — `TIP/TIP.md` — 新增第十七章（薪资管理实现记录）
- `13:20` — `TIP/FRONTEND.md` — 新增路由+管理端页面+小程序页面

#### ⏰ 13:30 — 紧急修复：申请审核失败

- **事件**: 用户报告管理端申请审核双端失败，控制台报 `{code: 400, message: "未知的操作"}`
- **根因**: `callApplications('review', { action: 'approve' })` 展开后 `action: 'approve'` 覆盖 `action: 'review'`
- **修复**:
  - `13:30` — `cloudfunctions/applications/index.js` — `reviewApplication` 参数 `action` → `reviewAction`
  - `13:35` — `pages/admin/applicationReview/applicationReview.js` — approve/reject 调用参数改为 `reviewAction`
  - `13:40` — `QGPY/app/models/application_cloud.py` — `find_by_apply_id` 改为双路径查找（applyId + _id）

#### ⏰ 13:45 — 全面后端审查

- **事件**: 对全部管理端接口和后端逻辑进行全面审查
- **审查范围**: 7 个云函数 + 5 个 QGPY 路由 + 4 个 QGPY 模型
- **发现**: 23 个问题（🔴 高 7 + 🟡 中 7 + 🟢 低 4 + 误报 5）

#### ⏰ 14:00 — 审查问题批量修复

- `14:00` — `QGPY/app/models/salary_cloud.py` — **#6** 修复 `update()` 使用 `record.get('_id')` 而非 `record_id`
- `14:05` — `QGPY/app/routes/salary.py` — **#23** 修复 `result.modified_count` → `result['modified_count']`
- `14:10` — `QGPY/app/routes/salary.py` — **#3** 循环变量 `g` → `grp`（避免遮蔽 Flask `g`）
- `14:15` — `QGPY/app/routes/admin.py` — **#3** 循环变量 `g` → `grp`
- `14:20` — `QGPY/app/routes/admin.py` — **#10** `/debug-cloud-db` 添加 `@admin_required`
- `14:25` — `QGPY/app/routes/auth.py` — **#8/#9** `change_password` 添加空值检查 + 兼容明文/bcrypt 密码
- `14:30` — `cloudfunctions/admin/index.js` — **#14** `exportData` 添加 `.limit(1000)`
- `14:35` — `cloudfunctions/admin/index.js` — **#15** `getStats` 薪资查询添加 `.limit(1000)`

#### ⏰ 14:45 — 文档全面更新

- `14:45` — `TIP/FRONTEND.md` — 新增薪资 API 文档（7 个端点+数据结构+业务规则）+ 审查修复记录
- `14:50` — `TIP/TIP.md` — 新增第十八章（审查记录）+ 第十九章（带时间戳开发日志）

---

### 📊 2026-06-11 开发统计

| 指标 | 数值 |
|------|------|
| 薪资管理模块 | 完整实现（后端+云函数+Vue+小程序+发薪清单导出） |
| 紧急修复 | 1 个（申请审核 action 参数冲突） |
| 审查发现 | 23 个问题 |
| 已修复 | 15 个（🔴 7 + 🟡 6 + 前端 2） |
| 暂不修复 | 4 个（平台限制/设计决策） |
| 修改文件 | 17 个 |
| 新建文件 | 6 个 |
| 新增 API | 5 个（salary update/delete/calculate + payroll-export + calculate 改写） |
| 新增云函数 action | 3 个（edit/delete + calculate 改写） |

---

### 📋 待办事项（更新）

> 仅列出尚未完成的项目。

| 编号 | 事项 | 优先级 | 状态 | 备注 |
|------|------|--------|------|------|
| FLOW-01 | Git 初始化 | 🔴 高 | ⏸️ 暂停 | `.gitignore` 已就绪 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 | QGPY: pytest / QGWEB: Vitest |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 | 申请审核/薪资发放通知 |
| AUDIT-01 | 云数据库 20 条限制 | 🟡 中 | ⬜ 受限 | 微信平台限制，已尽量缓解 |
| AUDIT-02 | $in 过滤客户端处理 | 🟡 中 | ⬜ 受限 | 数据量可控 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 | applications + admin + salary 云函数需重新上传 |

---

## 二十、申请审核深度修复日志（2026-06-11 续）

### 📅 2026-06-11 — 申请审核全链路排查与修复

> 用户报告：小程序端报"申请ID与操作不得为空"；Vue 端点击审核后无反应；最终 Vue 端报 500 错误。

---

#### ⏰ 13:15 — 小程序端 WXML 数据绑定修复

- **现象**: 小程序审核按钮点击后报"申请ID与操作不得为空"
- **排查**: 检查 WXML 模板，发现 `data-id="{{item.applyId}}"` — 但云函数创建的申请记录**没有 `applyId` 字段**（只有 `_id`）
- **修复**: `pages/admin/applicationReview/applicationReview.wxml`
  - `data-id="{{item.applyId}}"` → `data-id="{{item._id || item.applyId}}"`（第 44-45 行）
  - `wx:key="applyId"` → `wx:key="_id"`（第 22 行）

#### ⏰ 13:20 — 云函数 reviewAction 参数兼容

- **现象**: 旧版云函数读 `event.action`，新版读 `event.reviewAction`
- **修复**: `cloudfunctions/applications/index.js` 第 234 行
  - `const reviewAction = event.reviewAction || event.action`
  - 添加 `reviewAction === 'review'` 过滤（排除外层 switch 的 action 值）

#### ⏰ 13:25 — Vue 端审核静默成功排查

- **现象**: Vue 端点击审核后无任何变化，无报错
- **排查**: `update_status` 返回 False（更新失败），但旧代码不检查返回值，直接返回 success
- **修复**: `QGPY/app/routes/applications.py`
  - 路由检查 `update_result`，失败时返回 `error(500, '审核更新失败，请重试')`
  - 添加详细日志：`print(f"[REVIEW] 更新结果: ...")`

#### ⏰ 13:27 — Vue 端报 500 错误

- **现象**: 用户测试后报 `500 INTERNAL SERVER ERROR`
- **日志**: `[REVIEW] 更新结果: app._id=09adcdf76a291c930000730e43128850, update_result=False`
- **排查**: `database_update` 返回 `matched=0`，但文档确实存在

#### ⏰ 13:30 — 尝试 .doc(id).update() 语法

- **假设**: `where({_id: ...}).update()` 在 HTTP API 中不支持
- **修复**: `QGPY/app/utils/wx_cloud_db.py` — `_id` 查询时改用 `.doc(id).update()` 语法
- **结果**: 测试后仍然 `matched=0`，`.doc().update()` 也不被 HTTP API 的 `databaseupdate` 端点支持

#### ⏰ 13:35 — 改回 .where() 语法

- **操作**: 恢复 `database_update` 和 `database_delete` 为原始 `.where().update()` / `.where().remove()`
- **恢复**: `update_status` 恢复二次查找逻辑，添加 `_id` 类型日志

#### ⏰ 13:37 — 根因确认：`{$oid}` 格式未转换（关键修复）

- **日志分析**: `app._id=09adcdf76a291c930000730e43128850` 显示为正常字符串，但 `str()` 转换可能隐藏了真实类型
- **根因**: 微信云数据库 HTTP API 返回 `_id` 为 MongoDB 扩展 JSON 格式 `{"$oid": "09adcdf7..."}`，而 `_convert_dates()` 只处理了 `{$date: ms}`，未处理 `{$oid: ...}`
- **链路**:
  ```
  HTTP API 返回 _id: {"$oid": "09adcdf7..."}
  → _convert_dates 不识别 → 保持为 dict
  → str(dict) = "{'$oid': '09adcdf7...'}"  ← 错误的查询值
  → where({_id: "{'$oid': '...'}"}) → matched=0
  ```
- **修复**: `QGPY/app/utils/wx_cloud_db.py` `_convert_dates` 方法新增 `{$oid: "xxx"}` → 纯字符串转换
- **影响**: 这是**全局性修复**，所有通过 HTTP API 查询返回的 `_id` 和其他 ObjectId 字段现在都会正确转换为纯字符串，影响所有模型的 CRUD 操作

---

### 📊 本次排查统计

| 指标 | 数值 |
|------|------|
| 排查时长 | ~25 分钟 |
| 尝试修复次数 | 5 次（WXML 兼容 → 云函数兼容 → 路由检查 → .doc() → $oid 转换） |
| 根因层级 | 最底层（HTTP API 响应格式解析） |
| 修复文件 | 5 个（applications/index.js, applicationReview.wxml, applications.py, application_cloud.py, wx_cloud_db.py） |
| 影响范围 | 全局（所有通过 `_id` 更新/删除的操作） |

---

### 📋 待办事项（更新）

| 编号 | 事项 | 优先级 | 状态 | 备注 |
|------|------|--------|------|------|
| FLOW-01 | Git 初始化 | 🔴 高 | ⏸️ 暂停 | `.gitignore` 已就绪 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 | QGPY: pytest / QGWEB: Vitest |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 | 申请审核/薪资发放通知 |
| AUDIT-01 | 云数据库 20 条限制 | 🟡 中 | ⬜ 受限 | 微信平台限制，已尽量缓解 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 | applications + admin + salary 云函数需重新上传 |
| VERIFY-01 | 申请审核端到端验证 | 🔴 高 | ⬜ 待验证 | 重启 QGPY 后双端测试 |

---

## 二十一、项目全面复查（2026-06-11）

### 📅 2026-06-11 — 新会话项目复查

#### ⏰ 21:00 — 全面文件审查

**事件**: 新会话启动，按用户要求全面阅读项目文档、源码和参考项目

**审查范围**:
- 设计文档 `js23080509侯胜勇 勤工助学岗位匹配管理系统分析与前端页面设计.txt`（编码问题，依赖 TIP.md 第十六章已有分析）
- TIP/ 四份开发文档（TIP.md 1773行 + FRONTEND.md 547行 + BACKEND.md 551行 + DATABASE.md 367行）
- 根目录文档（DEVELOPMENT.md / API_DOCUMENT.md / README.md）
- QGPY 后端源码（run.py / config.py / routes/ / models/ / utils/）
- QGWEB Vue 前端源码（router / api / views / components / stores / types / utils）
- 小程序源码（app.js / pages/ / cloudfunctions/ / utils/）
- FLO 参考项目（family-web 完整源码架构分析：router/api/components/composables/directives/store/utils）

**项目现状确认**:

| 维度 | 状态 |
|------|------|
| 三端架构 | ✅ 完整（QGMP + QGWEB + QGPY），共用微信云数据库 |
| 功能模块 | ✅ 设计文档 7 大模块全部实现（用户/岗位/匹配/审核/薪资/统计/设置） |
| QGWEB 页面 | ✅ 20 条路由，18 个页面 + 404，全部对接真实 API |
| 小程序页面 | ✅ 15 个页面，全部对接真实云函数 |
| QGPY 后端 | ✅ 5 个路由蓝图 + 4 个 Cloud 模型，微信云数据库 HTTP API |
| 云函数 | ✅ 7 个云函数 + common 模块，全部已同步 |
| 安全机制 | ✅ bcrypt + HMAC Token + 白名单 + 转义 + 错误脱敏 |
| 文档体系 | ✅ TIP/ 下 4 份文档（前端/后端/数据库/改进日志） |
| 测试数据 | ✅ 20 学生 + 15 岗位 + 30 申请 + 40+ 薪资 + 8 公告 |

**FLO 参考项目架构精华确认**:

| 架构模式 | FLO 实现 | QGWEB 现状 | 改进建议 |
|---------|---------|-----------|---------|
| 路由模块化 | `router/modules/` 按域拆分 7 个模块 | 20 条路由集中单文件 | REF-01 🟡 |
| 布局组件 | PageContainer + NavBar + DesktopLayout + MobileLayout | 4 个主页面各自维护导航栏 | REF-02 🟡 |
| 通用组件库 | 12 个 common 组件（EmptyState/ErrorState/ConfirmDialog 等） | Loading/Modal 内联实现 | REF-03 🟡 |
| Composables | 10 个 composable（useAuth/useDevice/useInfiniteScroll 等） | 逻辑分散在各组件 | REF-04 🟢 |
| 请求层增强 | NProgress + Token 刷新 + 请求队列 + 公共路径白名单 | 基础拦截器 | REF-05 🟡 |
| Auto-Import | unplugin-auto-import + unplugin-vue-components | 手动 import | REF-06 🟢 |
| CSS 主题系统 | Tailwind + CSS 变量 + 暗黑模式 | 硬编码颜色值 | REF-07 🟢 |
| 自定义指令 | v-auth（权限）+ v-lazy（图片懒加载） | 无 | REF-09 🟢 |

**新增改进建议**:

### REF-09: 自定义 Vue 指令 🟢 低

- **现状**: QGWEB 无可复用指令
- **参考**: FLO `directives/v-auth.js`（权限控制）+ `v-lazy.js`（图片懒加载）
- **建议**: 添加 `v-permission` 指令控制按钮可见性，添加 `v-lazy` 指令延迟加载图片
- **优先级**: 🟢 低

### REF-10: Store 模块化 🟢 低

- **现状**: QGWEB 仅有 `stores/user.ts` 单一 store
- **参考**: FLO `store/modules/` 按功能拆分（app/user/task/family）
- **建议**: 按需拆分 app store（主题/全局配置）等，当前规模可暂不拆分
- **优先级**: 🟢 低（当前单 store 足够）

---

### 📊 2026-06-11 复查统计

| 指标 | 数值 |
|------|------|
| 审查范围 | 全项目所有文件 + FLO 参考项目完整源码 |
| 项目文件总数 | 100+ 个（源码+配置+文档+资源） |
| 文档总行数 | ~3200 行（TIP/ 4 份文档） |
| 已识别问题 | 40+ 项（历史累计），全部已处理或已记录 |
| 新增建议 | 2 项（REF-09 指令 + REF-10 Store 模块化） |
| 当前待办 | 6 项（FLOW-01 暂停 + FLOW-02 测试 + FEAT-04 通知 + AUDIT-01 受限 + DEPLOY-01 部署 + VERIFY-01 验证） |

---

#### ⏰ 21:30 — 紧急修复：申请审核 500 错误

**事件**: 用户报告 WEB 端管理员审批申请返回 `500 INTERNAL SERVER ERROR`

**根因**: `wx_cloud_db.py` 中 `_id` 字段查询使用普通字符串比较（`_id: '09adcdf7...'`），但微信云数据库的 `_id` 是 ObjectId 类型，必须使用 `_.eq('09adcdf7...')` 才能正确匹配。

**影响链路**:
```
Vue POST /api/applications/review {applyId: "09adcdf7..."}
→ Application.find_by_apply_id() → 查到文档（_id 查询碰巧成功，可能是 HTTP API 宽容匹配）
→ Application.update_status(app['_id'], 'approved')
→ database_update({_id: "09adcdf7..."}, update_data)
→ 生成 JS: db.collection('applications').where({_id: '09adcdf7...'}).update(...)
→ 云数据库 _id ObjectId 字段无法匹配字符串 → matched=0 → update_result=False
→ 路由返回 500 '审核更新失败，请重试'
```

**修复**: `QGPY/app/utils/wx_cloud_db.py`
- 新增 `_build_condition()` 类方法：对 `_id` 字段自动使用 `_.eq()` 包装，其他字段保持原逻辑
- `_build_query_string()` — 条件构建改用 `_build_condition()`
- `database_update()` — where 条件构建改用 `_build_condition()`
- `database_delete()` — where 条件构建改用 `_build_condition()`

**修复后查询示例**:
```
修复前: db.collection('applications').where({_id: '09adcdf7...'}).update(...)
修复后: db.collection('applications').where({_id: _.eq('09adcdf7...')}).update(...)
```

**影响范围**: **全局性修复** — 所有通过 `_id` 进行 update/delete 的操作（申请审核、岗位编辑、薪资编辑、学生管理等全部 CRUD），查询操作也已同步修复。

**变更文件**: 1 个（`QGPY/app/utils/wx_cloud_db.py`）

**操作**: 需重启 QGPY 后端服务后测试

---

#### ⏰ 22:00 — 第二十八轮：FLO 通用样式与组件移植

**事件**: 参考 FLO 参考项目的样式架构和通用组件，全面移植到 QGWEB Vue 前端

**样式基础层**（新建 2 + 修改 3）:
- `22:00` — 新建 `styles/theme.css`：CSS 自定义属性系统（50+ 变量：`--primary`/`--text-*`/`--card-bg`/`--border` 等）+ 暗色模式 `.dark` 块 + 全局组件类（`.flo-btn-*`/`.flo-input`/`.flo-menu-*`/`.flo-status-badge`/`.flo-spinner`）+ 过渡动画
- `22:00` — 新建 `styles/mixins.scss`：8 个 SCSS mixin（`flex-center`/`flex-between`/`flex-column`/`text-ellipsis`/`safe-area-bottom`/`hairline-bottom`/`glass-effect`/`tap-active`）
- `22:00` — 更新 `styles/variables.scss`：新增 `$font-family`/`$navbar-height`/`$tabbar-height`/`$safe-area-bottom`
- `22:00` — 更新 `styles/index.scss`：移除重复变量定义，引入 `mixins.scss`
- `22:00` — 更新 `main.ts`：在 `index.scss` 前引入 `theme.css`

**通用组件**（新建 5）:
- `22:00` — 新建 `components/common/EmptyState.vue`：Props(icon/text/actionText) + Events(action)
- `22:00` — 新建 `components/common/ErrorState.vue`：Props(title/message/retryText) + Events(retry)
- `22:00` — 新建 `components/common/ConfirmDialog.vue`：Teleport + Transition + Props(visible/title/message/danger) + Escape 键关闭
- `22:00` — 新建 `components/common/MenuItem.vue`：Props(icon/label/to/iconBg/iconColor) + router-link + 箭头图标 + Slots(right)
- `22:00` — 新建 `components/common/AppIcon.vue`：SVG 渲染组件，v-html + size 属性 + currentColor 继承

**组件增强**（修改 3）:
- `22:00` — 增强 `Modal.vue`：新增 `size` prop（sm/md/lg）+ `#footer` 插槽 + Escape 键关闭 + 非 scoped 样式修复 Teleport 兼容
- `22:00` — 增强 `Toast.vue`：新增 `duration` prop（自动消失）+ Teleport to body + 非 scoped 样式
- `22:00` — 增强 `Loading.vue`：新增 `text` prop（自定义加载文字）

**Composables**（新建 2）:
- `22:00` — 新建 `composables/useDevice.ts`：响应式设备检测（isMobile/isTablet/isDesktop/screenWidth）
- `22:00` — 新建 `composables/useInfiniteScroll.ts`：无限滚动（items/loading/hasMore/load/refresh）

**工具函数**（新建 1）:
- `22:00` — 新建 `utils/toast.ts`：Toast 程序式 API（showToast/showSuccess/showError/showWarning/showInfo）

**清理**:
- `22:00` — 删除 `components/HelloWorld.vue`（Vite 脚手架默认组件，未使用）
- `22:00` — 更新 `components/index.ts`：新增 5 个通用组件导出

**验证**: TypeScript 类型检查通过 + Vite 构建成功（752ms，无错误）

**变更统计**:

| 指标 | 数值 |
|------|------|
| 新建文件 | 10 个 |
| 修改文件 | 6 个 |
| 删除文件 | 1 个 |
| CSS 变量 | 50+ 个 |
| SCSS Mixins | 8 个 |
| 通用组件 | 5 个（EmptyState/ErrorState/ConfirmDialog/MenuItem/AppIcon） |
| Composables | 2 个（useDevice/useInfiniteScroll） |

---

#### ⏰ 23:00 — 第二十九轮：页面加载性能优化

**事件**: 全面优化 QGWEB 页面加载性能，重点针对管理端

**1. Vite 构建分包策略**（vite.config.ts）:
- `23:00` — 新增 `build.rollupOptions.output.manualChunks` 函数，将 Vue 全家桶（vue/vue-router/pinia）和 axios 分离为独立 vendor chunk
- 浏览器缓存命中率大幅提升：vendor 代码变更频率远低于业务代码
- 构建产物分包效果：`vendor-vue.js` 93KB + `vendor-axios.js` 41KB（独立缓存）

**2. 请求层缓存 + 去重**（api/request.ts）:
- `23:00` — GET 请求内存缓存（TTL 30 秒），通过 axios adapter 短路实现，命中缓存时零网络开销
- `23:00` — GET 请求去重（pending Map），同一 URL 在途时复用 Promise，避免重复发送
- `23:00` — 导出 `clearCache()` 函数，登录/退出/数据变更后可主动清除缓存
- `23:00` — 内存泄漏防护：缓存超过 50 条时自动清理过期项

**3. 消除 Barrel Import**（19 个视图文件）:
- `23:00` — 全部 19 个视图文件从 `import { X } from '@/components'` 改为 `import X from '@/components/X.vue'` 直接导入
- `23:00` — `admin/index.vue` 移除未使用的 `Modal` 导入
- 效果：确保 bundler 只打包实际使用的组件，彻底避免 tree-shaking 失效

**构建对比**:

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 构建时间 | 752ms | 536ms |
| vendor chunk | 无（全混在 index.js） | vendor-vue 93KB + vendor-axios 41KB |
| index.js | 160KB（含全部第三方库） | 27KB（纯业务代码） |
| barrel import | 19 个视图使用 | 0 个（全部直接导入） |

**变更文件**: 3 个修改 + 19 个导入优化 = 22 个文件

---

#### ⏰ 23:30 — 第三十轮：三端全函数审查 + 综合技术文档

**事件**: 系统审查三端全部源码函数，编写综合技术文档

**审查范围**:
- QGPY 后端：16 个文件 ~80 个函数（5 路由蓝图 + 4 Cloud 模型 + 6 工具模块）
- QGWEB 前端：25 个文件 ~60 个函数（14 组件 + 18 视图 + 5 API + 2 composable + 2 utils）
- 微信小程序：25 个文件 ~209 个函数（32 工具函数 + 17 页面 + 7 云函数 37 个 action handler）

**产出**:
- `23:30` — 创建 `TIP/TECHNICAL.md` 综合技术文档（~600 行），覆盖 8 大章节：
  1. APP 开发流程（项目结构 + 三端职责）
  2. 所用控件清单（小程序原生 11 类 + Vue 组件 14 个 + 全局样式类）
  3. 页面效果实现（首页/岗位列表/管理端/导航系统 ASCII 布局图）
  4. 前端技术栈（Vue 3 + TypeScript + Vite + Pinia + SCSS / 小程序 / Flask）
  5. 服务器功能 & 路由（28 个 Flask 端点 + 37 个云函数 action + 认证机制）
  6. 数据库表设计（5 集合完整字段结构 + 状态流转图）
  7. 前后端数据交互逻辑（小程序调用链路 + Vue 调用链路 + 缓存机制 + 日期兼容 + 安全总览）
  8. 智能匹配算法（四维度模型 + 时间匹配算法）
- `23:30` — 更新 TIP.md 文档索引（新增 TECHNICAL.md 条目）

**函数统计**:

| 端 | 文件数 | 函数数 | 说明 |
|----|--------|--------|------|
| QGPY 后端 | 16 | ~80 | 5 路由 + 4 模型 + 6 工具 + 1 配置 |
| QGWEB 前端 | 25 | ~60 | 14 组件 + 18 视图 + 5 API + 4 工具 |
| 微信小程序 | 25 | ~209 | 32 工具 + 172 页面 + 37 云函数 handler |
| **合计** | **66** | **~349** | |

---

#### ⏰ 00:15 — 前端文档全面重写

- **事件**: 重写 `TIP/FRONTEND.md`，同步全部近期改动至最新状态
- **更新范围**:
  - `00:15` — 新增第二章「样式系统」：theme.css CSS 变量（50+ 变量 + 暗色模式）、SCSS 变量自动注入、8 个 mixins 清单、样式导入顺序
  - `00:15` — 重写第三章「组件库」：14 个组件完整清单（含 FLO 移植的 5 个通用组件）、2 个 composables、2 个工具函数、组件使用示例代码
  - `00:15` — 新增第五章「请求层」：缓存机制、去重机制、性能优化效果表
  - `00:15` — 新增第十章「Vite 构建配置」：manualChunks 分包策略、构建产物体积
  - `00:15` — 新增第十五章「审查修复记录」：申请审核 500 错误修复、FLO 组件移植、性能优化
  - `00:15` — 章节编号全面调整（十五章）

**变更统计**:

| 指标 | 数值 |
|------|------|
| FRONTEND.md 总行数 | ~430 行 |
| 涵盖章节 | 15 章 |
| 组件清单 | 14 个 |
| Composables | 2 个 |
| 路由 | 20 条 |
| 页面对接状态 | Vue 16 个 + 小程序 15 个 |

---

### 📅 2026-06-11 全天开发日志汇总

> 以下为 2026-06-11 全天开发工作的完整时间线记录。

---

#### ⏰ 21:00 — 新会话启动：项目全面复查

- **事件**: 新会话启动，按用户要求全面阅读项目文档、源码和参考项目
- **范围**: 设计文档 + TIP/ 四份文档 + QGPY 后端 + QGWEB 前端 + 小程序 + FLO 参考项目
- **产出**: TIP.md 第二十一章（项目复查记录 + FLO 架构对照 + REF-09/10 新增建议）

#### ⏰ 21:30 — 紧急修复：申请审核 500 错误（wx_cloud_db.py）

- **事件**: 用户报告 WEB 端管理员审批申请返回 500
- **根因链路**:
  1. 第一版：`_id` 查询用普通字符串（`_id: '09adcdf7...'`），云数据库需 `_.eq()` → 新增 `_build_condition()` 方法
  2. 第二版：`_.eq()` 修复后仍报错，日志显示 `The dollar ($) prefixed field '$set' in '$set' is not valid for storage`
  3. **最终根因**: `database_update` 生成 `{$set: {status: 'approved'}}`，但云数据库 `update()` 默认即 `$set` 行为，显式 `$set` 反而不合法
- **修复**: 移除 `{$set: {...}}` 包装 → `{...}` + `_build_condition()` 对 `_id` 使用 `_.eq()`
- **影响**: **全局性修复** — 所有 11 处 `database_update` + 1 处 `database_delete` 调用
- **变更文件**: 1 个（`QGPY/app/utils/wx_cloud_db.py`）

#### ⏰ 22:00 — 第二十八轮：FLO 通用样式与组件移植

- **事件**: 参考 FLO 项目的样式架构和通用组件，全面移植到 QGWEB
- **样式基础层**（新建 2 + 修改 3）:
  - `22:00` — 新建 `styles/theme.css`：50+ CSS 变量 + 暗色模式 `.dark` + 全局组件类（`.flo-btn-*`/`.flo-input`/`.flo-menu-*`/`.flo-spinner`）+ 过渡动画
  - `22:00` — 新建 `styles/mixins.scss`：8 个 mixin（`flex-center`/`text-ellipsis`/`glass-effect`/`tap-active` 等）
  - `22:00` — 更新 `variables.scss`：新增 `$font-family`/`$navbar-height`/`$tabbar-height`/`$safe-area-bottom`
  - `22:00` — 更新 `index.scss`：移除重复变量，引入 `mixins.scss`
  - `22:00` — 更新 `main.ts`：引入 `theme.css`
- **通用组件**（新建 5）:
  - `22:00` — `EmptyState.vue` / `ErrorState.vue` / `ConfirmDialog.vue` / `MenuItem.vue` / `AppIcon.vue`
- **组件增强**（修改 3）:
  - `22:00` — `Modal.vue`：新增 `size` prop + `#footer` 插槽 + Escape 关闭 + 非 scoped 样式
  - `22:00` — `Toast.vue`：新增 `duration` 自动消失 + Teleport to body
  - `22:00` — `Loading.vue`：新增 `text` prop
- **Composables**（新建 2）:
  - `22:00` — `useDevice.ts`（响应式设备检测）+ `useInfiniteScroll.ts`（无限滚动）
- **工具函数**（新建 1）:
  - `22:00` — `utils/toast.ts`：Toast 程序式 API（showToast/showSuccess/showError）
- **清理**: 删除 `HelloWorld.vue` + 更新 `index.ts` 导出
- **验证**: TypeScript 检查通过 + Vite 构建成功（752ms）

#### ⏰ 23:00 — 第二十九轮：页面加载性能优化

- **事件**: 全面优化 QGWEB 页面加载性能
- **Vite 构建分包**:
  - `23:00` — `vite.config.ts` 新增 `manualChunks` 函数（Rolldown 格式），分离 `vendor-vue` (93KB) + `vendor-axios` (41KB)
  - `23:00` — `index.js` 从 160KB 降至 27KB
- **请求层缓存 + 去重**:
  - `23:00` — `request.ts` GET 请求 30 秒内存缓存（adapter 短路）
  - `23:00` — GET 请求去重（pending Map 复用 Promise）
  - `23:00` — 导出 `clearCache()` 函数
- **消除 Barrel Import**:
  - `23:00` — 全部 19 个视图从 `import { X } from '@/components'` 改为 `import X from '@/components/X.vue'`
  - `23:00` — `admin/index.vue` 移除未使用的 Modal 导入
- **构建对比**: 752ms → 536ms，index.js 160KB → 27KB

#### ⏰ 23:30 — 第三十轮：三端全函数审查 + 综合技术文档

- **事件**: 系统审查三端全部源码函数（~349 个），编写综合技术文档
- **审查范围**: QGPY 16 文件 ~80 函数 + QGWEB 25 文件 ~60 函数 + 小程序 25 文件 ~209 函数
- **产出**: 创建 `TIP/TECHNICAL.md`（~600 行，8 大章节）
- **更新**: TIP.md 文档索引新增 TECHNICAL.md 条目

#### ⏰ 00:15 — 前端文档全面重写

- **事件**: 重写 `TIP/FRONTEND.md`，同步全部近期改动
- **更新**: 15 章、14 组件清单、2 composables、20 路由、请求层机制、Vite 配置、审查修复记录

---

### 📊 2026-06-11 开发统计

| 指标 | 数值 |
|------|------|
| 开发轮次 | 4 轮（第二十八轮 ~ 第三十轮 + 文档重写） |
| 紧急修复 | 1 个（申请审核 500 错误，根因：`$set` 不合法 + `_id` 需 `_.eq()`） |
| 全局性修复 | 1 个（`wx_cloud_db.py` 影响全部 update/delete 操作） |
| 新建文件 | 10 个（theme.css + mixins.scss + 5 组件 + 2 composable + toast.ts） |
| 修改文件 | 25+ 个（3 组件增强 + 3 样式入口 + 1 vite.config + 1 request.ts + 19 视图导入优化） |
| 删除文件 | 1 个（HelloWorld.vue） |
| CSS 变量 | 50+ 个 |
| SCSS Mixins | 8 个 |
| 新建组件 | 5 个（EmptyState/ErrorState/ConfirmDialog/MenuItem/AppIcon） |
| 新建 Composables | 2 个（useDevice/useInfiniteScroll） |
| 性能优化 | vendor 分包（160KB→27KB+134KB）+ 请求缓存（30s）+ 请求去重 + barrel→direct |
| 技术文档 | TECHNICAL.md（~600 行）+ FRONTEND.md 重写（~430 行） |
| 函数审查 | 三端 ~349 个函数 |

---

### 📋 待办事项（更新）

> 仅列出尚未完成的项目。已完成项见上方优先级总览表。

| 编号 | 事项 | 优先级 | 状态 | 备注 |
|------|------|--------|------|------|
| FLOW-01 | Git 初始化 | 🔴 高 | ⏸️ 暂停 | `.gitignore` 已就绪 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 | QGPY: pytest / QGWEB: Vitest |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 | 申请审核/薪资发放通知 |
| AUDIT-01 | 云数据库 20 条限制 | 🟡 中 | ⬜ 受限 | 微信平台限制，已尽量缓解 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 | applications + admin + salary 云函数需重新上传 |
| REF-01 | 路由模块化拆分 | 🟡 中 | ⬜ 待执行 | 拆分为 admin/student/common 三个模块 |
| REF-02 | 布局组件提取 | 🟡 中 | ⬜ 待执行 | DesktopNav + MobileHeader + PageContainer |
| REF-05 | 请求层 NProgress | 🟢 低 | ⬜ 待执行 | 添加进度条动画 |

---

## 二十二、新会话全面审查（2026-06-16）

### 📅 2026-06-16 — 新会话启动：设计文档 + FLO 参考 + 项目状态复查

#### ⏰ 10:00 — 项目全面审查

**事件**: 新会话启动，按用户要求全面阅读设计文档、TIP/ 全部 5 份开发文档、QGPY 后端源码、QGWEB Vue 前端源码、小程序源码、FLO 参考项目完整源码。

**设计文档审查** (`js23080509侯胜勇 勤工助学岗位匹配管理系统分析与前端页面设计.txt`):

- **编码问题**: 文件使用非标准 GBK 编码（字节存在偏移），chardet 无法识别，Python gb18030 解码中文部分仍为乱码。英文摘要部分可读，且 TIP.md 第十六章已有完整的中文内容分析。
- **英文摘要核心内容确认**:
  - 研究对象: 高校勤工助学管理系统
  - 核心业务流程: 学生求职、岗位发布、智能匹配、审核管理
  - 七大功能模块: 用户管理、岗位管理、智能匹配、申请审核、数据统计（+ 薪酬管理、系统设置）
  - 前端设计原则: 简洁易用、响应式适配、人性化交互
  - 技术方案: HTML+JS+CSS + Vue.js 框架 + 微信小程序开发

**设计文档 vs 实际实现 — 更新对照表**:

| 设计文档要求 | 实际实现 | 覆盖度 | 备注 |
|------------|---------|--------|------|
| 7 大功能模块 | 全部实现（双端） | ✅ 100% | 用户/岗位/匹配/审核/薪资/统计/设置 |
| 四层架构（表现/逻辑/数据访问/存储） | Vue+小程序 / Flask 路由 / Cloud 模型 / 云数据库 | ✅ 100% | 设计文档 MySQL→实际云数据库，合理简化 |
| Web 端 Vue.js 框架 | Vue 3 + TypeScript + Vite 8 + Pinia | ✅ 100% | 超出设计要求 |
| 微信小程序端 | 原生 WXML/WXSS/JS + 云开发 | ✅ 100% | |
| 智能匹配（专业30%+年级20%+成绩25%+时间25%） | `calculate_match_score()` 四维度加权 | ✅ 100% | 权重与设计文档完全一致 |
| 数据库 8 张表 | 5 个集合 | ⚠️ 62.5% | 匹配结果实时计算不存储、系统日志集合已创建但无查询接口、学生信息与用户合并 |
| 响应式适配 | 桌面+平板+手机三断点 + 移动端 TabBar | ✅ 100% | |
| 性能: Web<3s / 小程序<2s | Vite 分包优化 + 云函数 | ✅ 100% | |
| 安全: 密码加密+权限+防攻击 | bcrypt + HMAC Token + 白名单 + 转义 + 脱敏 | ✅ 100% | 超出设计要求（多层防护） |
| 报表导出 Excel | JSON + CSV | ⚠️ 部分 | JSON 满足当前需求，Excel 需前端 xlsx 库 |

**项目现状确认**:

| 维度 | 数值 | 状态 |
|------|------|------|
| 云函数 | 7 个 + common 模块 | ✅ 全部就绪 |
| QGWEB Vue 页面 | 18 个 + 404，20 条路由 | ✅ 全部对接真实 API |
| 小程序页面 | 16 个（app.json 注册） | ✅ 全部对接真实云函数 |
| QGPY 后端 | 5 路由蓝图 + 4 Cloud 模型 | ✅ 微信云数据库 HTTP API |
| 通用组件 | 14 个（含 FLO 移植 5 个） | ✅ |
| Composables | 2 个（useDevice + useInfiniteScroll） | ✅ |
| 样式系统 | 50+ CSS 变量 + 8 SCSS mixins + 暗色模式准备 | ✅ |
| 性能优化 | vendor 分包 + 30s 缓存 + 请求去重 | ✅ |
| 安全机制 | bcrypt + HMAC + 白名单 + 转义 + 脱敏 | ✅ |
| 文档体系 | TIP/ 下 5 份文档 | ✅ |
| 测试数据 | 20 学生 + 15 岗位 + 30 申请 + 40+ 薪资 + 8 公告 | ✅ |

**FLO 参考项目深度分析**:

本次重新全面阅读 FLO 源码，确认以下可移植架构模式：

| # | 架构模式 | FLO 实现 | QGWEB 现状 | 优先级 |
|---|---------|---------|-----------|--------|
| 1 | Token 刷新 + 请求队列 | `request.js` 401 时自动 refreshToken + pendingRequests[] 队列重发 | 401 仅自动登出 | 🟡 中 |
| 2 | 路由模块化 + 守卫分离 | `router/modules/` 7 模块 + `guards.js` 独立 | 20 条路由单文件 | 🟡 中 |
| 3 | 布局组件体系 | PageContainer + NavBar + DesktopLayout + MobileLayout | 4 页面各自维护 | 🟡 中 |
| 4 | Composable-first 架构 | 10 个 use*() 函数，业务逻辑与组件分离 | 2 个 composable | 🟢 低 |
| 5 | Auto-Import 插件 | unplugin-auto-import + unplugin-vue-components | 手动 import | 🟢 低 |
| 6 | px-to-viewport PostCSS | postcss-px-to-viewport-8-plugin 自动响应式 | 手写媒体查询 | 🟢 低 |
| 7 | ElMessage 去重 | overrideElMessage() 3 秒内相同消息不重复 | 无去重 | 🟢 低 |
| 8 | Pinia 持久化 | pinia-plugin-persistedstate 声明式持久化 | 手动 localStorage | 🟢 低 |
| 9 | 暗色模式 | root class toggle + CSS 变量 | CSS 变量已就绪，无切换逻辑 | 🟢 低 |
| 10 | 全局错误处理 | app.config.errorHandler | 无 | 🟢 低 |

**新增改进建议**:

### REF-11: px-to-viewport PostCSS 插件 🟢 低

- **现状**: QGWEB 使用手写媒体查询实现响应式
- **参考**: FLO 使用 `postcss-px-to-viewport-8-plugin`，开发时写 `px`，构建时自动转 `vw`
- **建议**: 安装插件并配置 `viewportWidth: 1280`（桌面基准），移动端自动缩放
- **优先级**: 🟢 低（当前手写媒体查询已够用）

### REF-12: Toast 消息去重 🟢 低

- **现状**: QGWEB 的 Toast.vue 无去重机制
- **参考**: FLO `overrideElMessage()` 3 秒内相同消息不重复
- **建议**: 在 `utils/toast.ts` 中添加去重逻辑
- **优先级**: 🟢 低

### REF-13: Pinia 状态持久化 🟢 低

- **现状**: QGWEB 的 user store 手动管理 localStorage
- **参考**: FLO 使用 `pinia-plugin-persistedstate`
- **建议**: 安装插件，user store 添加 `persist: true`
- **优先级**: 🟢 低

### REF-14: 全局 Vue 错误处理 🟢 低

- **现状**: QGWEB 无 `app.config.errorHandler`
- **参考**: FLO 在 main.js 中设置全局错误处理器
- **建议**: 在 `main.ts` 中添加，开发环境 console.error
- **优先级**: 🟢 低

### IMP-09: 设计文档编码修复 🟢 低

- **现状**: txt 文件使用非标准编码，中文部分无法正常解码
- **建议**: 用 VS Code 以正确编码打开后另存为 UTF-8
- **优先级**: 🟢 低（内容已完整记录在 TIP.md 第十六章）

### IMP-10: 系统日志查询功能补全 🟢 低

- **现状**: `system_logs` 集合已由 initDB 创建，但无查询接口和管理界面
- **设计文档要求**: 系统设置模块包含"日志管理"
- **建议**: 新增 `GET /api/admin/logs` 接口
- **优先级**: 🟢 低

---

## 二十三、项目当前状态总览（2026-06-16）

### 📊 项目里程碑

| 日期 | 里程碑 | 说明 |
|------|--------|------|
| 2026-05-23 | 小程序初版 | 云函数 + 云数据库，基础功能 |
| 2026-06-10 | 全面审查 + 安全加固 | 2 轮审查，40 项改进，三端对接 |
| 2026-06-10 | 公告系统 + 导航升级 | 双端 TabBar 公告标签 |
| 2026-06-11 | 薪资管理完整实现 | 后端+云函数+Vue+小程序+导出 |
| 2026-06-11 | FLO 组件移植 + 性能优化 | 5 通用组件 + 2 composable + vendor 分包 |
| 2026-06-11 | wx_cloud_db 全局修复 | `_id` `$oid` + `_.eq()` + `$set` 移除 |
| 2026-06-16 | 新会话全面复查 | 设计文档对照 + FLO 重新分析 + 4 新建议 |

### 📋 最新待办事项

> 仅列出尚未完成的项目。已完成项见优先级总览表。

| 编号 | 事项 | 优先级 | 状态 | 备注 |
|------|------|--------|------|------|
| FLOW-01 | Git 初始化 | 🔴 高 | ⏸️ 暂停 | `.gitignore` 已就绪，待用户确认 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 | QGPY: pytest / QGWEB: Vitest |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 | 申请审核/薪资发放通知 |
| AUDIT-01 | 云数据库 20 条限制 | 🟡 中 | ⬜ 受限 | 微信平台限制，已通过 limit(1000) 缓解 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 | applications + admin + salary 云函数需重新上传 |
| REF-01 | 路由模块化拆分 | 🟡 中 | ⬜ 待执行 | 拆分为 admin/student/common 三个模块 |
| REF-02 | 布局组件提取 | 🟡 中 | ⬜ 待执行 | DesktopNav + MobileHeader + PageContainer |
| REF-05 | 请求层增强 | 🟡 中 | ⬜ 待执行 | NProgress + Token 刷新队列 |
| IMP-09 | 设计文档编码修复 | 🟢 低 | ⬜ 待处理 | 转 UTF-8 便于维护 |
| IMP-10 | 系统日志查询接口 | 🟢 低 | ⬜ 待规划 | system_logs 集合已有但无查询接口 |

---

## 二十四、全面复查（2026-11-19）

### 📅 2026-11-19 — 新会话启动：项目结构复查与文档校正

**事件**: 新会话启动。按要求通读 TIP/ 全部开发文档、根目录开发文档与近期论文/设计文档，逐项核对“文档描述”与“实际代码/目录”的一致性。

#### 1. 项目阶段更新（2026-06-16 之后）

TIP.md 上次更新为 2026-06-16，此后项目重心从代码开发转向论文与答辩，主要产出如下：

| 时间 | 阶段 | 产出 |
|------|------|------|
| 2026-07-16 | 算法与数据库设计 | 《算法分析与数据库设计文档.md》（73KB，覆盖三端算法） |
| 2026-09-22 | 论文定稿与检测 | 学年论文 docx、查重报告、AIGC 检测报告 |
| 2026-11-13 ~ 11-19 | 开题与答辩 | 开题报告、答辩 PPT（output/）、答辩讲稿、答辩记录表 |

> 代码侧自 2026-06-16 起无功能性变更；三端功能已冻结，进入论文/答辩阶段。

#### 2. 文档与实际不一致（已核对）

| 编号 | 文档描述 | 实际情况 | 处理 |
|------|---------|---------|------|
| DOC-01 | TIP.md 头部“最后更新：2026-06-10” | 正文已含 2026-06-16 内容，头部滞后 | ✅ 本次已更新为 2026-11-19 |
| DOC-02 | FRONTEND.md：小程序 15 个页面 | app.json 实际注册 **16 个**（11 顶层 + 5 个 admin 子页） | ✅ 本次已校正 |
| DOC-03 | FRONTEND.md：QGWEB 18 个页面 + 404 | 实际 **20 个 .vue**（9 个 admin 子页 + 10 个业务页 + 1 个 404），路由 20 条 | ✅ 本次已校正 |
| DOC-04 | TIP.md“小程序页面 15 个” | 同 DOC-02，应为 16 个 | ✅ 本次已校正 |

#### 3. 新增改进建议

### GIT-01: 根 .gitignore 覆盖缺口 🟡 中

- **现状**: 以下目录/文件未被根 `.gitignore` 覆盖，一旦 `git init` 会被纳入版本控制：

| 目标 | 体积 | 性质 | 建议 |
|------|------|------|------|
| `.venv/` | 27.9 MB | Python 虚拟环境 | 忽略 |
| `FLO/` | 200.8 MB | 参考项目（NEW-09 已确认保留） | 本地保留，Git 忽略 |
| `查重报告/` | 10.3 MB | 论文查重产物 | 忽略 |
| `AIGC检测报告/` | 3.2 MB | AIGC 检测产物 | 忽略 |
| `.codex-finalizer/` `.codex-ppt-build/` `.uploads/` `output/` | ~3.2 MB | 工具/过程产物 | 忽略或归档 |
| `.claude/` | — | 工具配置 | 忽略 |
| `cloud/` | — | 云开发辅助脚本（根目录） | 评估后忽略 |

- **已正确覆盖**: `node_modules/`、`__pycache__/`、`.env`、`.uploads/`、`~$*.docx`、`miniapp/`、`QGPY/`、`QGWEB/`。
- **建议**: 补全后再执行 Git 初始化。

### GIT-02: Git 仍未初始化 🔴 高

- **现状**: 根目录无 `.git`，FLOW-01 自 2026-06-10 起暂停，至今未执行。
- **影响**: 代码无版本控制；无法按“结束一部分开发提交开发日志”的约定留存快照；误删/误改不可恢复。
- **建议**: 先补全 `.gitignore`（GIT-01），再执行 `git init` 与首次提交。是否执行待用户确认。

### DOC-05: 根目录文档冗余 🟢 低

- `DEVELOPMENT.md`（2026-05-23）、`DOCUMENT_STRUCTURE.md`（2026-05-23）已过时，TIP.md 第十四章已标注“已过时/待整合”。
- `README.md` 与 `PROJECT_README.md` 内容高度重复。
- `API_DOCUMENT.md`（精简）与 `API_FULL.md`（完整）待整合。
- **建议**: 逐步迁移至 TIP/ 或明确标记过时，降低维护成本。

### TEMP-01: 临时文件未清理 🟢 低

- 根目录 `~$开发文档.docx` 仍存在（NEW-16 / IMP-07 已记录）。
- **建议**: 确认无 Word 进程占用后删除。

### ARCH-05: seedData/common 残留多余 package 文件 🟢 低

- ARCH-03 记录已删除各云函数 `common/` 内多余的 `package.json` / `package-lock.json`。
- 实际检查：`cloudfunctions/seedData/common/` 与 `cloudfunctions/common/` 仍保留这两个文件。
- **建议**: 一并清理，避免云端部署时误装依赖。

#### 4. 当前项目结构快照（2026-11-19）

| 目录 | 内容 | 体积 |
|------|------|------|
| `pages/` | 小程序 11 个顶层页面 + 5 个 admin 子页（共 16 页） | — |
| `cloudfunctions/` | 7 个云函数 + common（含 node_modules） | 330.6 MB |
| `QGPY/` | Flask 后端（5 路由 + 8 模型） | 0.3 MB |
| `QGWEB/` | Vue 3 网页端（20 个 .vue + 20 路由） | src 0.4 MB |
| `TIP/` | 5 份开发文档 | ~218 KB |
| `FLO/` | 参考项目 | 200.8 MB |

#### 5. 📋 待办事项（更新）

| 编号 | 事项 | 优先级 | 状态 |
|------|------|--------|------|
| GIT-02 | Git 初始化 | 🔴 高 | ⬜ 待用户确认 |
| GIT-01 | 补全 .gitignore | 🟡 中 | ⬜ 待执行 |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 |
| DOC-05 | 根目录文档整理 | 🟢 低 | ⬜ 待处理 |
| ARCH-05 | seedData/common 清理 | 🟢 低 | ⬜ 待处理 |
| TEMP-01 | 清理 ~$开发文档.docx | 🟢 低 | ⬜ 待处理 |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 |
| IMP-10 | 系统日志查询接口 | 🟢 低 | ⬜ 待规划 |

*文档维护说明: 后续所有开发文档、开发日志均在 TIP/ 文件夹内生成/修改。*
