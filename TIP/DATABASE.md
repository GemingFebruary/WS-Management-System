# 数据库配置文档 — 勤工助学岗位匹配系统

> 本文档记录微信云开发数据库的配置方案，包括集合结构、索引、安全规则和初始化流程。
>
> 最后更新：2026-06-10

---

## 一、数据库概述

本系统使用**微信云开发数据库**（基于 MongoDB）作为主数据库。

- **云开发环境ID**: `cloud1-d7g94p70f23bf5769`（在 app.js 和云函数中配置）
- **数据库类型**: 文档型数据库（MongoDB 兼容）
- **访问方式**: 小程序端通过云函数访问，Web端通过腾讯云 HTTP API 访问
- **云函数列表**: `auth`、`jobs`、`applications`、`salary`、`admin`、`initDB`、`seedData`

---

## 二、集合（Collection）结构

系统共有 6 个集合：`users`、`jobs`、`applications`、`salary_records`、`system_logs`、`match_config`。

### 2.1 users — 用户集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | string | 是 | 用户登录ID（学生为学号，管理员为 admin） |
| studentId | string | 是 | 学号（唯一索引，管理员为空字符串） |
| openid | string | 否 | 微信 openid |
| name | string | 是 | 姓名（最长 50 字符） |
| password | string | 是 | bcrypt 加密密码（盐值轮数 10） |
| role | string | 是 | 角色：`student` / `admin` |
| gender | string | 否 | 性别 |
| college | string | 否 | 学院（最长 100 字符） |
| major | string | 否 | 专业（最长 100 字符） |
| grade | string | 否 | 年级，如 `2023级` |
| phone | string | 否 | 手机号（中国大陆格式 `1[3-9]XXXXXXXXX`） |
| email | string | 否 | 邮箱 |
| familyType | string | 否 | 家庭类型：`困难` / `特别困难` / `一般` |
| familyDesc | string | 否 | 家庭情况描述（最长 500 字符） |
| gpa | number | 否 | 绩点 |
| freeTime | string | 否 | 空闲时间（用于智能匹配） |
| skills | string / array | 否 | 技能 |
| experience | string | 否 | 经验 |
| preferredJobTypes | array | 否 | 岗位类型偏好（如 ["校内","校外"]），用于智能匹配 |
| courses | string | 否 | 课程时间（如 "周一上午 高等数学"），用于课程冲突检测 |
| status | string | 是 | 状态：`active` / `disabled` |
| createTime | Date | 否 | 创建时间（`db.serverDate()`） |
| updateTime | Date | 否 | 更新时间（`db.serverDate()`） |
| lastLoginTime | Date | 否 | 最后登录时间（`db.serverDate()`） |

**索引**:

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `{ studentId: 1 }` | 唯一索引 | 学号唯一，防止重复注册 |
| `{ openid: 1 }` | 普通索引 | 微信 openid 查询优化 |
| `{ role: 1, status: 1 }` | 复合索引 | 按角色+状态筛选用户 |

**说明**: 注册时 `userId` 默认等于 `studentId`；管理员账号的 `userId` 为 `admin`，`studentId` 为空字符串。

---

### 2.2 jobs — 岗位集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| jobName | string | 是 | 岗位名称 |
| department | string | 是 | 所属部门 |
| jobType | string | 否 | 岗位类型：`校内` / `校外`（默认 `校内`） |
| workTime | string | 是 | 工作时间，如 `周一至周五下午 14:00-17:00` |
| salary | number | 是 | 时薪（元/小时） |
| recruitNum | number | 否 | 招聘人数（默认 1） |
| status | string | 是 | 状态：`recruiting`（招聘中） / `full`（已满员） / `closed`（已关闭） |
| requirement | string | 否 | 岗位要求 |
| jobContent | string | 否 | 工作内容描述 |
| requiredMajor | string | 否 | 要求专业（空表示不限） |
| requiredGrade | string | 否 | 要求年级（空表示不限） |
| minGpa | number | 否 | 最低 GPA（默认 0，表示不限） |
| contactPerson | string | 否 | 联系人 |
| contactPhone | string | 否 | 联系电话 |
| requiredSkills | array | 否 | 技能要求（如 ["Office办公软件","服务意识"]），用于智能匹配 |
| contactEmail | string | 否 | 联系邮箱 |
| publishDate | Date | 否 | 发布时间（`db.serverDate()`） |
| createTime | Date | 否 | 创建时间（`db.serverDate()`） |
| updateTime | Date | 否 | 更新时间（`db.serverDate()`） |
| createdBy | string | 否 | 创建人（admin 的 userId） |

**索引**:

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `{ status: 1, publishDate: -1 }` | 复合索引 | 按状态筛选并按发布时间倒序 |
| `{ department: 1 }` | 普通索引 | 按部门筛选 |
| `{ jobType: 1 }` | 普通索引 | 按岗位类型筛选 |

**说明**: 智能匹配采用**可配置的多维加权模型**（见 2.6 `match_config`），四个维度为：技能标签、可工作时间、岗位类型偏好、年级/课程。匹配度 = Σ(维度分×权重)/Σ权重 ×100，并返回维度分解（`matchDimensions`）与匹配依据（`matchReasons`）。

---

### 2.3 applications — 申请集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| studentId | string | 是 | 学生学号 |
| studentName | string | 是 | 学生姓名 |
| studentInfo | object | 是 | 学生信息快照（提交时冻结） |
| studentInfo.major | string | 否 | 专业 |
| studentInfo.grade | string | 否 | 年级 |
| studentInfo.phone | string | 否 | 手机号 |
| studentInfo.email | string | 否 | 邮箱 |
| studentInfo.college | string | 否 | 学院 |
| studentInfo.gender | string | 否 | 性别 |
| studentInfo.familyType | string | 否 | 家庭类型 |
| jobId | string | 是 | 岗位 ID |
| jobName | string | 是 | 岗位名称 |
| department | string | 是 | 所属部门 |
| phone | string | 否 | 联系电话 |
| email | string | 否 | 邮箱 |
| availableTime | string | 否 | 可工作时间（最长 100 字符） |
| experience | string | 否 | 相关经验（最长 500 字符） |
| reason | string | 是 | 申请理由（最长 500 字符） |
| attachments | array | 否 | 附件列表（预留字段） |
| status | string | 是 | 状态：`pending` / `approved` / `rejected` / `cancelled` |
| statusText | string | 是 | 状态中文文本：`待审核` / `已通过` / `已驳回` / `已取消` |
| applyTime | Date | 否 | 申请时间（`db.serverDate()`） |
| reviewTime | Date / null | 否 | 审核时间 |
| rejectReason | string | 否 | 驳回理由 |
| reviewer | string | 否 | 审核人姓名 |

**索引**:

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `{ studentId: 1, status: 1 }` | 复合索引 | 按学生+状态查询（我的申请列表） |
| `{ jobId: 1 }` | 普通索引 | 按岗位查询申请 |
| `{ applyTime: -1 }` | 普通索引 | 按申请时间倒序排列 |

**说明**:
- 同一学生对同一岗位仅允许存在一条 `pending` 或 `approved` 状态的记录；被驳回后可重新申请。
- `studentInfo` 在提交时快照存储，后续学生修改个人信息不影响已提交的申请记录。
- 状态流转：`pending` -> `approved` / `rejected`，学生可将 `pending` 状态取消为 `cancelled`。

---

### 2.4 salary_records — 薪资记录集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| studentId | string | 是 | 学生学号 |
| jobId | string | 是 | 岗位 ID |
| jobName | string | 否 | 岗位名称（最长 100 字符） |
| workDate | string | 是 | 工作日期（格式 `YYYY-MM-DD`） |
| workHours | number | 是 | 工作时长（小时，范围 0.5-24） |
| hourlyRate | number | 是 | 时薪（元，范围 1-500） |
| amount | number | 是 | 金额 = workHours * hourlyRate |
| month | string | 是 | 月份（格式 `YYYY-MM`，从 workDate 提取） |
| payStatus | string | 是 | 发放状态：`unpaid` / `paid` |
| payDate | string / null | 否 | 发放日期（格式 `YYYY-MM-DD`） |
| createTime | Date | 否 | 创建时间（`db.serverDate()`） |
| updateTime | Date | 否 | 更新时间（`db.serverDate()`） |
| createdBy | string | 否 | 创建人（admin 的 userId） |

**索引**:

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `{ studentId: 1, month: 1 }` | 复合索引 | 按学生+月份查询薪资 |
| `{ payStatus: 1 }` | 普通索引 | 按发放状态筛选 |
| `{ createTime: -1 }` | 普通索引 | 按创建时间倒序 |

**说明**: 薪资记录由管理员通过 `salary` 云函数的 `record` 操作创建，发放后 `payStatus` 更新为 `paid` 并记录 `payDate`。支持按记录 ID 数组或按月份批量发放。

---

### 2.5 system_logs — 系统日志集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 日志类型，如 `login`、`register` 等 |
| userId | string | 是 | 操作用户 ID |
| action | string | 是 | 操作描述 |
| details | object | 否 | 详细信息（JSON 对象） |
| createTime | Date | 否 | 创建时间（`db.serverDate()`） |

**索引**: 当前无自定义索引（由 initDB 创建集合时统一处理）。

### 2.6 match_config — 匹配权重配置集合

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| _id | string | 是 | 固定为 `match` |
| weights | object | 是 | 权重：`{ skill, time, preference, conflict }`，默认各 25 |
| updatedBy | string | 否 | 最后修改人（admin userId） |
| updateTime | Date | 否 | 更新时间（`db.serverDate()`） |

**说明**: 管理员可在小程序「管理后台 → 系统管理 → 匹配权重」调整各维度权重，保存后立即生效。缺失时使用默认权重。

---

## 三、初始化流程

### 3.1 前置条件

1. 在微信开发者工具中，确保已开通云开发
2. 云开发环境 ID 为 `cloud1-d7g94p70f23bf5769`（与 `app.js` 中的配置一致）

### 3.2 执行初始化

在微信开发者工具中调用 `initDB` 云函数：

```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: { action: 'init' }
})
```

该操作会自动完成以下步骤：

1. **创建集合**: `users`、`jobs`、`applications`、`salary_records`、`system_logs`（已存在则跳过）
2. **创建索引**: 为上述 4 个集合创建全部索引（见第二节各集合的索引表）
3. **创建默认管理员账号**:
   - userId: `admin`
   - 密码: `admin123`（仅开发环境默认，部署后必须修改；bcrypt 加密存储）
   - 角色: `admin`
   - 状态: `active`
   - **重要**: 登录后请立即修改密码！
4. **添加示例数据**: 如果 `jobs` 集合为空，自动插入 3 个示例岗位：
   - 图书馆助理（图书馆，时薪 15 元）
   - 实验室助理（计算机学院，时薪 20 元）
   - 行政办公室助理（学生处，时薪 18 元）

### 3.3 重置数据库

```javascript
wx.cloud.callFunction({
  name: 'initDB',
  data: { action: 'reset' }
})
```

**警告**: 此操作会清空所有 5 个集合的全部数据，不可恢复。清空后需重新执行 `init` 操作。

---

## 四、安全规则

### 4.1 集合权限配置

在云开发控制台中，各集合的安全规则配置如下：

| 集合 | read | write | 说明 |
|------|------|-------|------|
| users | true | false | 前端可读取用户列表，写入必须通过云函数 |
| jobs | true | false | 前端可读取岗位列表（含搜索筛选），写入必须通过云函数 |
| applications | false | false | 完全私有，所有读写必须通过云函数 |
| salary_records | false | false | 完全私有，所有读写必须通过云函数 |
| system_logs | false | false | 完全私有，所有读写必须通过云函数 |

### 4.2 云函数安全措施

系统在云函数层面实现了多层安全防护：

**输入验证**（`common/validator.js`）:
- 学号格式验证：`/^[a-zA-Z0-9]{6,20}$/`
- 密码长度验证：6-20 位
- 手机号验证：`/^1[3-9]\d{9}$/`
- 邮箱验证：`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- 日期格式验证：`/^\d{4}-\d{2}-\d{2}$/`
- 数值范围验证：工作时长 0.5-24 小时，时薪 1-500 元

**正则注入防护**:
- 所有关键词搜索均通过 `escapeRegExp()` 函数转义特殊字符后再构建正则表达式
- 防止恶意正则表达式注入攻击

**文本清理**:
- 所有用户输入的文本字段通过 `sanitizeText()` 进行清理
- 自动去除首尾空白、限制最大长度
- 申请理由、经验等字段限制 500 字符

**分页限制**:
- 列表查询的 `pageSize` 上限为 50，防止恶意请求大量数据
- `pageNum` 最小值为 1

**字段白名单**:
- 岗位更新操作仅允许修改 `jobName`、`department`、`jobType`、`workTime`、`salary`、`recruitNum`、`requirement`、`jobContent`、`requiredMajor`、`requiredGrade`、`minGpa`、`contactPerson`、`contactPhone`、`contactEmail`、`status` 字段
- 学生信息更新操作仅允许修改 `name`、`gender`、`college`、`major`、`grade`、`phone`、`email`、`familyType`、`familyDesc`、`gpa`、`freeTime`、`skills`、`experience`、`status` 字段
- 不允许通过更新接口修改 `_id`、`password`、`openid`、`createTime` 等关键字段

**密码安全**:
- 使用 bcrypt 加密存储（盐值轮数 10）
- 兼容旧明文数据，登录时自动升级为 bcrypt 哈希
- 返回用户信息时自动排除 `password` 和 `openid` 字段

**权限控制**:
- 所有写操作（增删改）必须通过云函数
- 管理员操作通过 `verifyAdmin()` 验证角色
- 申请详情查看限制为本人或管理员
- 申请取消限制为本人且仅 `pending` 状态

**防重复提交**:
- 申请提交前检查是否已有 `pending` 或 `approved` 状态的相同申请
- 审核操作检查申请是否仍处于 `pending` 状态，防止重复审核

---

## 五、数据备份与恢复

### 5.1 备份方案

微信云开发数据库暂不提供自动备份功能，需手动操作：

1. **通过云开发控制台导出**:
   - 进入云开发控制台 -> 数据库 -> 选择集合 -> 导出为 JSON

2. **通过 admin 云函数导出**:
   ```javascript
   // 导出申请记录
   wx.cloud.callFunction({
     name: 'admin',
     data: { action: 'exportData', type: 'applications' }
   })

   // 导出学生信息（自动排除 password 和 openid）
   wx.cloud.callFunction({
     name: 'admin',
     data: { action: 'exportData', type: 'students' }
   })

   // 导出薪资记录
   wx.cloud.callFunction({
     name: 'admin',
     data: { action: 'exportData', type: 'salary' }
   })
   ```

### 5.2 恢复方案

1. **通过云开发控制台导入**: 将 JSON 文件导入对应集合
2. **通过 `initDB` 云函数重置**: 清空后重新初始化基础数据（管理员账号和示例岗位）
3. **手动插入**: 对于导出的数据，可通过云函数或控制台逐条导入

### 5.3 建议

- 定期（每周或每月）通过 `exportData` 导出全量数据备份
- 重要操作（如批量删除、状态变更）前先备份相关集合
- 备份文件妥善保管，注意脱敏处理（尤其是密码和 openid 字段）

---

## 附录：快速参考

### 集合与云函数对应关系

| 集合 | 主要操作云函数 | 可读权限 | 可写权限 |
|------|---------------|---------|---------|
| users | auth（登录/注册）、admin（管理） | 前端 + 云函数 | 仅云函数 |
| jobs | jobs（CRUD） | 前端 + 云函数 | 仅云函数 |
| applications | applications（CRUD） | 仅云函数 | 仅云函数 |
| salary_records | salary（CRUD） | 仅云函数 | 仅云函数 |
| system_logs | 各云函数写入 | 仅云函数 | 仅云函数 |

### 字段状态值速查

| 字段 | 可选值 |
|------|--------|
| users.role | `student`, `admin` |
| users.status | `active`, `disabled` |
| users.familyType | `困难`, `特别困难`, `一般` |
| jobs.status | `recruiting`, `full`, `closed` |
| jobs.jobType | `校内`, `校外` |
| applications.status | `pending`, `approved`, `rejected`, `cancelled` |
| salary_records.payStatus | `unpaid`, `paid` |

---

**文档维护**: 如有数据库结构变更，请及时更新本文档
**最后更新**: 2026-06-10
