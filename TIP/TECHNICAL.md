# 勤工助学岗位匹配系统 — 综合技术文档

> 本文档覆盖：APP 开发流程、所用控件、页面效果实现、前端技术、服务器功能 & 路由、数据库表设计、前后端数据交互逻辑。
>
> 最后更新：2026-06-11

---

## 一、APP 开发流程

### 1.1 整体开发流程

```
需求分析 → 系统设计 → 数据库设计 → 后端开发 → 前端开发 → 联调测试 → 部署上线
```

| 阶段 | 产出 | 技术选型 |
|------|------|---------|
| 需求分析 | 7 大功能模块定义（用户/岗位/匹配/审核/薪资/统计/设置） | 学年论文设计文档 |
| 系统设计 | 四层架构（表现/业务逻辑/数据访问/存储） | 分层架构设计 |
| 数据库设计 | 5 个集合（users/jobs/applications/salary_records/notices） | 微信云数据库 MongoDB |
| 后端开发 | QGPY Flask 后端 + 7 个云函数 | Python 3 + Node.js |
| 前端开发 | QGWEB Vue 网页端 + 微信小程序 | Vue 3 + 原生小程序 |
| 联调测试 | 双端对接云数据库，20 学生 + 15 岗位 + 30 申请测试数据 | seedData 云函数 |
| 部署 | 小程序发布 + Vue 打包 + Flask 部署 | Vite build + gunicorn |

### 1.2 项目结构

```
QINGGONG -NEW/
├── app.js / app.json / app.wxss     # 微信小程序入口
├── pages/                            # 小程序页面（15 个）
│   ├── index/                        # 首页（轮播图+公告+推荐岗位）
│   ├── login/ + register/            # 登录注册
│   ├── profile/                      # 个人中心
│   ├── jobList/ + jobDetail/         # 岗位列表 + 详情
│   ├── applyJob/                     # 岗位申请
│   ├── myApplications/               # 我的申请
│   ├── salaryQuery/                  # 薪资查询
│   ├── notices/                      # 全部公告（TabBar 页）
│   └── admin/                        # 管理端（6 个子页面）
│       ├── admin.*                   # 管理首页
│       ├── jobManage/                # 岗位管理
│       ├── applicationReview/        # 申请审核
│       ├── studentManage/            # 学生管理
│       ├── noticeManage/             # 公告管理
│       └── salaryManage/             # 薪资管理
├── cloudfunctions/                   # 云函数（7 个）
│   ├── auth/                         # 用户认证（login/register/logout/getUserInfo）
│   ├── jobs/                         # 岗位管理（CRUD + 推荐 + 匹配）
│   ├── applications/                 # 申请管理（submit/review/cancel）
│   ├── salary/                       # 薪资管理（record/pay/calculate）
│   ├── admin/                        # 管理功能（stats/students/notices/export）
│   ├── initDB/                       # 数据库初始化（创建集合/索引/管理员）
│   ├── seedData/                     # 测试数据生成（20学生+15岗位+30申请）
│   └── common/                       # 公共模块（auth/response/validator）
├── QGWEB/                            # Vue 3 网页端
│   └── src/
│       ├── api/                      # API 请求层（request + auth/jobs/applications/salary/admin）
│       ├── components/               # 组件库（14 个：Card/Modal/Toast/TabBar + 5 个通用组件）
│       ├── composables/              # 组合式函数（useDevice/useInfiniteScroll）
│       ├── router/                   # 路由配置（20 条）
│       ├── stores/                   # Pinia 状态管理（user store）
│       ├── styles/                   # 样式系统（theme.css + variables/mixins/common/reset/responsive）
│       ├── types/                    # TypeScript 类型定义
│       ├── utils/                    # 工具函数（date.ts + toast.ts）
│       └── views/                    # 页面视图（18 个 + 404）
├── QGPY/                             # Python Flask 后端
│   └── app/
│       ├── routes/                   # 路由蓝图（auth/jobs/applications/salary/admin）
│       ├── models/                   # 数据模型（*_cloud.py 云数据库版 + *.py 本地版）
│       └── utils/                    # 工具层（wx_cloud_db/response/decorators/helpers/error_handler）
└── TIP/                              # 开发文档
    ├── TIP.md                        # 改进建议 + 开发日志
    ├── FRONTEND.md                   # 前端开发文档
    ├── BACKEND.md                    # 后端开发文档
    ├── DATABASE.md                   # 数据库配置文档
    └── TECHNICAL.md                  # 综合技术文档（本文件）
```

### 1.3 三端职责划分

| 端 | 职责 | 数据来源 |
|----|------|---------|
| **微信小程序** | 学生端核心入口 + 管理员移动办公 | 云函数 → 云数据库 |
| **QGWEB Vue** | 学生端 Web 版 + 管理员桌面端 | Flask API → 云数据库 HTTP API |
| **QGPY Flask** | Vue 端的后端 API 网关 | 微信云数据库 HTTP API |

---

## 二、所用控件清单

### 2.1 小程序原生控件

| 控件 | 用途 | 使用页面 |
|------|------|---------|
| `<view>` | 通用容器 | 全部页面 |
| `<text>` | 文本显示 | 全部页面 |
| `<image>` | 图片/图标 | 全部页面（TabBar 图标、轮播图、头像） |
| `<input>` | 单行输入 | 登录、注册、搜索、表单 |
| `<textarea>` | 多行输入 | 申请理由、公告内容、家庭状况 |
| `<button>` | 操作按钮 | 全部页面 |
| `<picker>` | 选择器 | 性别/年级/部门/状态/月份选择 |
| `<swiper>` | 轮播图 | 首页 banner |
| `<scroll-view>` | 滚动区域 | 弹窗内表单滚动 |
| `<switch>` | 开关 | 管理端状态切换 |
| `<modal>` (wx.showModal) | 原生弹窗 | 确认操作、详情展示 |

### 2.2 QGWEB Vue 组件

| 组件 | 文件 | Props | 用途 |
|------|------|-------|------|
| **Card** | `Card.vue` | padding, shadow, radius | 通用卡片容器 |
| **Modal** | `Modal.vue` | modelValue, title, content, size, confirmText, cancelText, showCancel | 弹窗（Teleport + Escape + 自定义 footer） |
| **Toast** | `Toast.vue` | message, type, duration, visible | 消息提示（Teleport + 自动消失） |
| **Loading** | `Loading.vue` | loading, text | 全屏加载遮罩（Teleport） |
| **TabBar** | `TabBar.vue` | — | 移动端底部导航（4 标签） |
| **PageHeader** | `PageHeader.vue` | title, showBack, backUrl, rightText | 页面顶部导航栏 |
| **Swiper** | `Swiper.vue` | list, autoplay, interval | 轮播图（自动播放 + 指示器） |
| **FormInput** | `FormInput.vue` | modelValue, placeholder, type, disabled | 表单输入框（v-model + Enter 确认） |
| **PasswordInput** | `PasswordInput.vue` | modelValue, placeholder | 密码输入框（显示/隐藏切换） |
| **EmptyState** | `common/EmptyState.vue` | icon, text, actionText | 空状态占位 |
| **ErrorState** | `common/ErrorState.vue` | title, message, retryText | 错误状态 + 重试 |
| **ConfirmDialog** | `common/ConfirmDialog.vue` | visible, title, message, danger | 确认弹窗（Teleport + Escape） |
| **MenuItem** | `common/MenuItem.vue` | icon, label, to, iconBg, iconColor | 菜单项（router-link + 箭头） |
| **AppIcon** | `common/AppIcon.vue` | icon, size | SVG 图标渲染 |

### 2.3 QGWEB 全局样式类

| 类名 | 用途 |
|------|------|
| `.flo-btn--primary/secondary/danger/ghost` | 按钮变体 |
| `.flo-btn--sm/lg/block` | 按钮尺寸 |
| `.flo-input` / `.flo-textarea` | 输入框 |
| `.flo-menu-group` / `.flo-menu-item` | 菜单列表 |
| `.flo-status-badge` | 状态标签 |
| `.flo-spinner` | 加载旋转器 |
| `.card` / `.btn-*` / `.form-*` / `.status-tag-*` | common.scss 工具类 |

---

## 三、页面效果实现

### 3.1 首页布局

```
┌──────────────────────────────────────┐
│  Logo + 系统名称     导航菜单    用户名│  ← 桌面端导航栏（≥768px）
├──────────────────────────────────────┤
│  ╔══════════════════════════════╗    │
│  ║     轮播图 (Swiper)          ║    │  ← 750×360 在线图片
│  ╚══════════════════════════════╝    │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│  ← 快捷服务（4 宫格）
│  │岗位   │ │申请   │ │薪资   │ │个人   ││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│  ╔══════════════════════════════╗    │
│  ║ 📢 最新公告        查看更多 > ║    │  ← 蓝色标题栏 + 3 条公告
│  ║  · 公告标题 1       2026-06-10║    │
│  ║  · 公告标题 2       2026-06-09║    │
│  ║  · 公告标题 3       2026-06-08║    │
│  ╚══════════════════════════════╝    │
│                                      │
│  ╔══════════════════════════════╗    │
│  ║ 💼 推荐岗位        查看更多 > ║    │  ← 蓝色标题栏 + 岗位卡片网格
│  ║  ┌─────────┐ ┌─────────┐    ║    │
│  ║  │ 岗位卡片 │ │ 岗位卡片 │    ║    │  ← 桌面 3 列 / 平板 2 列 / 手机 1 列
│  ║  └─────────┘ └─────────┘    ║    │
│  ╚══════════════════════════════╝    │
├──────────────────────────────────────┤
│  首页    岗位    公告    我的         │  ← 移动端 TabBar（<768px）
└──────────────────────────────────────┘
```

**关键实现**:
- 轮播图：`Swiper.vue` 组件，opacity 交叉淡入，鼠标悬停暂停，自动播放
- 公告可点击：双端首页公告条目 `bindtap`/`@click` → 弹出详情弹窗
- 推荐岗位：可选认证模式（登录按匹配度排序，未登录返回最新）
- 加载/失败状态：spinner 动画 + empty-box 图标 + 重试按钮

### 3.2 岗位列表

- **筛选**: WEB 端用原生 `<select>` 下拉框；小程序端用 `wx.showActionSheet`
- **排序**: 小程序端 3 个按钮（默认/薪资/匹配度）
- **无限滚动**: 监听 `window.scroll`，距底部 200px 提前加载；移动端 pageSize:6，桌面端:12
- **日期格式**: `formatDate()` 兼容 `{$date: ms}` / ISO 字符串 / Date 对象

### 3.3 管理端页面

管理端页面统一模式：
- **搜索栏**: 输入框 + 搜索按钮（手机端垂直排列）
- **筛选**: 下拉框（状态/月份/类型）
- **列表**: 表格/卡片列表 + 分页
- **操作弹窗**: Modal 组件 + 表单
- **响应式**: `@media (max-width: 480px)` 单列表单、`flex-wrap` 按钮换行

### 3.4 导航系统

| 导航类型 | 显示条件 | 实现 |
|---------|---------|------|
| 桌面端顶部栏 | ≥768px | 4 页面各自维护（home/jobList/notices/profile） |
| 移动端顶部栏 | <768px | `.mobile-header` 全局样式（44px 蓝色 sticky） |
| 移动端 TabBar | `showTabBar: true` | Vue: `TabBar.vue` 组件；小程序: `app.json` tabBar |
| 管理端 PageHeader | 管理页面 | `PageHeader.vue` 组件（蓝色 sticky + 返回按钮） |

---

## 四、前端技术栈

### 4.1 QGWEB Vue 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.x | 响应式框架（Composition API + `<script setup>`） |
| TypeScript | 5.x | 类型安全 |
| Vite | 8.x | 构建工具（Rolldown bundler） |
| Vue Router | 4.x | 路由（20 条，全部懒加载） |
| Pinia | 2.x | 状态管理（user store） |
| Axios | 1.x | HTTP 请求（30s 缓存 + 去重） |
| SCSS | — | 样式预处理（variables + mixins 自动注入） |

**构建优化**:
- `manualChunks` 分包：`vendor-vue` (93KB) + `vendor-axios` (41KB) 独立缓存
- 全部路由懒加载：`() => import(...)` 按需加载
- 直接导入组件：消除 barrel import，确保 tree-shaking

**样式系统**:
- `theme.css` — CSS 自定义属性（50+ 变量 + 暗色模式 + 全局组件类）
- `variables.scss` — SCSS 设计 token（颜色/间距/字号/断点/z-index）
- `mixins.scss` — 8 个 mixin（flex-center / text-ellipsis / glass-effect 等）
- `common.scss` — 全局工具类（.card / .btn-* / .form-* / .status-tag-*）
- `responsive.scss` — 响应式工具（.container / .hide-mobile / .mobile-header）

### 4.2 微信小程序

| 技术 | 用途 |
|------|------|
| WXML | 模板（数据绑定 + 事件 + 条件渲染） |
| WXSS | 样式（CSS 变量 + rpx 适配） |
| JavaScript | 逻辑（Page/Component 生命周期） |
| 微信云开发 | 后端（云函数 + 云数据库 + 云存储） |

### 4.3 QGPY Flask 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Flask | 3.0.0 | Web 框架（Blueprint 蓝图机制） |
| Flask-CORS | 4.0.0 | 跨域支持 |
| PyJWT | 2.8.0 | JWT Token 生成/验证 |
| bcrypt | 4.1.2 | 密码哈希（盐值轮数 10） |
| requests | 2.31.0 | HTTP 客户端（调用微信云数据库 API） |
| gunicorn | 21.2.0 | 生产部署 |

---

## 五、服务器功能 & 路由

### 5.1 QGPY Flask API 路由（28 个端点）

#### 认证模块 `/api/auth`

| 方法 | 路径 | 权限 | 功能 | 调用模型 |
|------|------|------|------|---------|
| POST | `/login` | 公开 | 用户登录，返回 JWT | UserCloud.find_by_user_id → verify_password → generate_token |
| POST | `/register` | 公开 | 学生注册 | UserCloud.create（bcrypt 哈希） |
| POST | `/logout` | 登录 | 退出登录 | — |
| GET | `/user-info` | 登录 | 获取用户信息 | UserCloud.find_by_id → to_dict |
| PUT | `/update-profile` | 登录 | 修改个人信息 | UserCloud.update（phone/email/freeTime/skills） |
| PUT | `/change-password` | 登录 | 修改密码 | UserCloud.find_by_id → verify → update |

#### 岗位模块 `/api/jobs`

| 方法 | 路径 | 权限 | 功能 | 调用模型 |
|------|------|------|------|---------|
| GET | `/list` | 公开 | 岗位列表（筛选/排序/分页） | JobCloud.find_list → calculate_match_score |
| GET | `/detail` | 公开 | 岗位详情 | JobCloud.find_by_job_id |
| GET | `/recommend` | 登录 | 推荐岗位（匹配度排序） | JobCloud.find_list → calculate_match_score |
| POST | `/create` | 管理员 | 创建岗位 | JobCloud.create |
| PUT | `/update` | 管理员 | 更新岗位（白名单 15 字段） | JobCloud.update |
| DELETE | `/delete` | 管理员 | 删除岗位（软删除） | JobCloud.delete |
| PUT | `/toggle-status` | 管理员 | 切换岗位状态 | JobCloud.update |

#### 申请模块 `/api/applications`

| 方法 | 路径 | 权限 | 功能 | 调用模型 |
|------|------|------|------|---------|
| POST | `/submit` | 学生 | 提交申请 | ApplicationCloud.create |
| GET | `/my-applications` | 学生 | 我的申请列表 | ApplicationCloud.find_by_student |
| GET | `/detail` | 登录 | 申请详情 | ApplicationCloud.find_by_apply_id |
| POST | `/cancel` | 学生 | 取消申请 | ApplicationCloud.cancel |
| GET | `/admin-list` | 管理员 | 管理员申请列表 | ApplicationCloud.find_list |
| POST | `/review` | 管理员 | 审核申请（通过/驳回） | ApplicationCloud.update_status |

#### 薪资模块 `/api/salary`

| 方法 | 路径 | 权限 | 功能 | 调用模型 |
|------|------|------|------|---------|
| GET | `/query` | 登录 | 查询个人薪资 | SalaryCloud.find_by_student + get_month_summary |
| GET | `/list` | 管理员 | 薪资记录列表 | SalaryCloud.find_list |
| POST | `/record` | 管理员 | 录入工时 | SalaryCloud.create |
| PUT | `/update` | 管理员 | 编辑薪资（仅 unpaid） | SalaryCloud.update |
| DELETE | `/delete` | 管理员 | 删除薪资（仅 unpaid） | SalaryCloud.delete |
| POST | `/pay` | 管理员 | 发放薪资（按 ID/按月） | SalaryCloud.pay |
| POST | `/calculate` | 管理员 | 月度汇总统计 | SalaryCloud.find_by_student_all |

#### 管理模块 `/api/admin`

| 方法 | 路径 | 权限 | 功能 | 调用模型 |
|------|------|------|------|---------|
| GET | `/stats` | 管理员 | 管理统计数据 | wx_db.database_query ×4 |
| GET | `/student-list` | 管理员 | 学生列表 | wx_db.database_query |
| PUT | `/update-student` | 管理员 | 更新学生信息 | UserCloud.update |
| PUT | `/reset-password` | 管理员 | 重置密码 | UserCloud.update |
| GET | `/export-data` | 管理员 | 数据导出（JSON） | 各模型 find_list |
| GET | `/payroll-export` | 管理员 | 发薪清单导出（CSV） | wx_db.database_query |
| GET | `/notices` | 公开 | 获取公告列表 | wx_db.database_query |
| POST | `/notices` | 管理员 | 发布公告 | wx_db.database_add |
| PUT | `/notices/:id` | 管理员 | 更新公告 | wx_db.database_update |
| DELETE | `/notices/:id` | 管理员 | 删除公告 | wx_db.database_delete |
| GET | `/debug-cloud-db` | 管理员 | 云数据库连通性测试 | wx_db.database_query ×2 |

### 5.2 云函数 Actions（37 个）

| 云函数 | Actions | 关键逻辑 |
|--------|---------|---------|
| **auth** | login / register / logout / getUserInfo | bcrypt 密码验证 + JWT Token 生成 + wx openid 同步 |
| **jobs** | getJobList / getJobDetail / getRecommendJobs / createJob / updateJob / deleteJob / toggleJobStatus | 四维度匹配算法（专业 30% + 年级 20% + GPA 25% + 时间 25%） |
| **applications** | submitApplication / getMyApplications / getApplicationDetail / reviewApplication / getAdminApplicationList / cancelApplication | 防重复申请 + 防重复审核 + 驳回强制理由 |
| **salary** | querySalary / recordWorkHours / calculateSalary / getSalaryList / processPayment / editSalaryRecord / deleteSalaryRecord | 金额自动计算 + 已发放不可编辑 + 按月/按 ID 批量发放 |
| **admin** | getStats / getStudentList / updateStudent / exportData / getNotices / publishNotice / updateNotice / deleteNotice | 字段白名单 + 正则注入防护 + pageSize 上限 |
| **initDB** | initDatabase / resetDatabase | 创建 5 集合 + 索引 + 管理员 + 示例数据 |
| **seedData** | generateTestData / clearTestData | 20 学生 + 15 岗位 + 30 申请 + 40+ 薪资 + 8 公告 |

### 5.3 认证机制

**QGPY Flask 端**:
```
登录 → 验证密码(bcrypt) → 生成 JWT Token → 返回前端
请求 → Authorization: Bearer <token> → jwt.decode 验证 → 注入 g.user_id / g.role
```
三个装饰器：`@login_required` / `@admin_required` / `@student_required`

**云函数端**:
```
请求 → 云函数自动附带 wx openid → verifyUser(openid 查找 → 失败则 token 回退)
管理员操作 → verifyAdmin(verifyUser + role === 'admin')
```

---

## 六、数据库表设计

### 6.1 集合总览

| 集合 | 用途 | 记录数（测试） | 索引 |
|------|------|-------------|------|
| `users` | 用户信息 | 21（1 管理员 + 20 学生） | studentId(unique) / openid / role+status |
| `jobs` | 岗位信息 | 18（3 示例 + 15 测试） | status+publishDate / department / jobType |
| `applications` | 申请记录 | 30 | studentId+status / jobId / applyTime |
| `salary_records` | 薪资记录 | 40+ | studentId+month / payStatus / createTime |
| `notices` | 系统公告 | 8 | — |

### 6.2 users 集合

```javascript
{
  _id: "09adcdf7...",                    // 云数据库自动生成
  userId: "js23080509",                  // 登录 ID（学生=学号，管理员=admin）
  studentId: "js23080509",               // 学号（唯一索引，管理员为空字符串）
  openid: "oXXXX...",                    // 微信 openid（登录时自动写入）
  name: "侯胜勇",                        // 姓名
  password: "$2b$10$...",                // bcrypt 哈希密码
  role: "student",                       // 角色：student / admin
  gender: "男",                          // 性别
  college: "信息科学与工程学院",           // 学院
  major: "计算机科学与技术",              // 专业
  grade: "2023级",                       // 年级
  phone: "13812345678",                  // 手机号
  email: "js23080509@stu.edu.cn",       // 邮箱
  familyType: "困难",                    // 家庭类型
  familyDesc: "...",                     // 家庭情况描述
  gpa: 3.5,                             // 绩点
  freeTime: "周一至周五下午",             // 空闲时间（用于匹配）
  skills: "计算机操作",                   // 技能
  experience: "...",                     // 经验
  status: "active",                      // 状态：active / disabled
  createTime: "2026-06-10T...",          // 创建时间
  updateTime: "2026-06-10T...",          // 更新时间
  lastLoginTime: "2026-06-11T..."        // 最后登录时间
}
```

### 6.3 jobs 集合

```javascript
{
  _id: "09adcdf7...",
  jobId: "JOB20260610120000a1b2c3",      // 岗位 ID（自动生成）
  jobName: "图书馆助理",                   // 岗位名称
  department: "图书馆",                    // 所属部门
  jobType: "校内",                        // 岗位类型：校内 / 校外
  workTime: "周一至周五下午 14:00-17:00",  // 工作时间
  salary: 15,                             // 时薪（元/小时）
  recruitNum: 3,                          // 招聘人数
  status: "recruiting",                   // 状态：recruiting / full / closed
  requirement: "认真负责",                 // 岗位要求
  jobContent: "图书整理与借还服务",         // 工作内容
  requiredMajor: "",                       // 要求专业（空=不限）
  requiredGrade: "",                       // 要求年级（空=不限）
  minGpa: 0,                              // 最低 GPA（0=不限）
  contactPerson: "张老师",                 // 联系人
  contactPhone: "025-12345678",           // 联系电话
  contactEmail: "library@edu.cn",         // 联系邮箱
  publishDate: "2026-06-10T...",          // 发布时间
  createTime: "2026-06-10T...",           // 创建时间
  createdBy: "admin"                      // 创建人
}
```

### 6.4 applications 集合

```javascript
{
  _id: "09adcdf7...",
  applyId: "APP20260610143025a1b2c3",     // 申请 ID
  studentId: "js23080509",                // 学生学号
  studentName: "侯胜勇",                   // 学生姓名
  studentInfo: {                          // 申请时学生信息快照（冻结）
    major: "计算机科学与技术",
    grade: "2023级",
    phone: "13812345678",
    email: "js23080509@stu.edu.cn",
    college: "信息科学与工程学院",
    gender: "男",
    familyType: "困难"
  },
  jobId: "JOB20260610120000a1b2c3",       // 岗位 ID
  jobName: "图书馆助理",                   // 岗位名称
  department: "图书馆",                    // 所属部门
  phone: "13812345678",                   // 联系电话
  email: "js23080509@stu.edu.cn",         // 邮箱
  availableTime: "周一至周五下午",          // 可工作时间
  experience: "有图书馆工作经验",           // 相关经验
  reason: "希望锻炼自己的能力...",          // 申请理由
  status: "pending",                      // 状态：pending / approved / rejected / cancelled
  statusText: "待审核",                    // 状态中文
  applyTime: "2026-06-10T...",            // 申请时间
  reviewTime: null,                        // 审核时间
  rejectReason: null,                      // 驳回理由
  reviewer: null                           // 审核人
}
```

**状态流转**:
```
pending → approved（管理员通过）
pending → rejected（管理员驳回，需填写原因）
pending → cancelled（学生主动取消）
rejected → pending（学生重新申请）
```

### 6.5 salary_records 集合

```javascript
{
  _id: "09adcdf7...",
  recordId: "SAL20260610150000a1b2c3",    // 记录 ID
  studentId: "js23080509",                // 学生学号
  jobId: "JOB20260610120000a1b2c3",       // 岗位 ID
  jobName: "图书馆助理",                   // 岗位名称
  workDate: "2026-06-10",                // 工作日期
  workHours: 3,                           // 工作时长（0.5-24 小时）
  hourlyRate: 15,                         // 时薪（1-500 元）
  amount: 45,                             // 金额 = workHours × hourlyRate
  month: "2026-06",                       // 月份（从 workDate 提取）
  payStatus: "unpaid",                    // 发放状态：unpaid / paid
  payDate: null,                          // 发放日期
  createTime: "2026-06-10T...",           // 创建时间
  createdBy: "admin"                      // 创建人
}
```

### 6.6 notices 集合

```javascript
{
  _id: "09adcdf7...",
  title: "关于2026年暑期勤工助学岗位招聘通知",   // 标题（最长 100 字符）
  content: "各位同学：为做好...",                  // 内容（最长 500 字符）
  publishDate: "2026-06-10T...",                 // 发布时间
  publisher: "系统管理员"                          // 发布者
}
```

---

## 七、前后端数据交互逻辑

### 7.1 小程序端数据流

```
┌─────────────┐     callCloudFunction()      ┌──────────────────┐     db.collection()     ┌─────────────┐
│  小程序页面   │ ──────────────────────────→  │  云函数（Node.js） │ ────────────────────→  │  云数据库     │
│  (WXML/JS)  │ ←──────────────────────────  │  auth/jobs/...   │ ←────────────────────  │  (MongoDB)  │
└─────────────┘     {code, data, message}     └──────────────────┘     JSON documents      └─────────────┘
```

**调用链路示例 — 学生查看推荐岗位**:
```
pages/index/index.js
  → loadRecommendJobs()
  → util.callJobs('recommend', { pageSize: 4 })
  → callCloudFunction('jobs', { action: 'recommend', token: '...' })
  → wx.cloud.callFunction({ name: 'jobs', data: { action: 'recommend', token } })
  → cloudfunctions/jobs/index.js main()
    → getRecommendJobs()
    → verifyUser(event) → db.collection('users').where({openid}).get()
    → db.collection('jobs').where({status:'recruiting'}).limit(20).get()
    → calculateMatchScores(jobs, studentInfo)
    → return { code: 200, data: { list: [...] } }
  → pages/index/index.js setData({ recommendJobs: [...] })
```

**调用链路示例 — 管理员审核申请**:
```
pages/admin/applicationReview/applicationReview.js
  → approveApplication(e) → approveId = e.currentTarget.dataset.id
  → wx.cloud.callFunction({ name: 'applications', data: { action: 'review', reviewAction: 'approve', applyId } })
  → cloudfunctions/applications/index.js main()
    → reviewApplication()
    → verifyUser(event) → verifyAdmin(event)
    → db.collection('applications').doc(applyId).get()  // 检查状态=pending
    → db.collection('applications').doc(applyId).update({ data: { status: 'approved', ... } })
    → return { code: 200, message: '申请已通过' }
  → loadApplicationList()  // 刷新列表
```

### 7.2 Vue 端数据流

```
┌─────────────┐     axios HTTP 请求          ┌──────────────────┐     HTTP API         ┌─────────────┐
│  Vue 页面    │ ──────────────────────────→  │  QGPY Flask      │ ─────────────────→  │  云数据库     │
│  (.vue)     │ ←──────────────────────────  │  /api/*          │ ←─────────────────  │  (MongoDB)  │
└─────────────┘     {code, data, message}     └──────────────────┘    db.collection()   └─────────────┘
```

**调用链路示例 — 管理员审核申请（Vue 端）**:
```
views/admin/applicationReview.vue
  → submitReview()
  → applicationsApi.reviewApplication({ applyId, action: 'approve' })
  → http.post('/applications/review', { applyId, action: 'approve' })
  → axios POST http://localhost:5000/api/applications/review
  → QGPY routes/applications.py review_application()
    → @admin_required 装饰器验证 JWT
    → Application.find_by_apply_id(applyId)  // → wx_cloud_db.database_query
    → Application.update_status(app['_id'], 'approved')  // → wx_cloud_db.database_update
    → return success(None, '申请已通过')
  → applicationReview.vue loadPending()  // 刷新列表
```

### 7.3 请求缓存机制（Vue 端）

```
GET 请求 → 检查内存缓存（TTL 30 秒）
  ├─ 命中 → axios adapter 短路，直接返回缓存数据（零网络开销）
  └─ 未命中 → 发送网络请求
        ├─ 去重检查：同一 URL 在途时复用 Promise
        └─ 响应成功 → 写入缓存 + 清理去重记录
```

### 7.4 日期格式兼容链路

云数据库 `db.serverDate()` 返回 `{$date: 1781083175517}` 格式：

```
云数据库 → HTTP API 返回 {$date: ms} / {$oid: "xxx"}
  → wx_cloud_db.py _convert_dates() 递归转换
    → {$date: ms} → ISO 字符串 "2026-06-10T06:39:35.517Z"
    → {$oid: "xxx"} → 纯字符串 "xxx"
  → 各模型 to_dict() 透传
  → 前端 formatDate() 格式化为 "2026-06-10"
```

### 7.5 安全机制总览

| 层级 | 机制 | 实现 |
|------|------|------|
| 认证 | JWT Token | QGPY: PyJWT 7 天有效；云函数: HMAC-SHA256 24 小时 |
| 密码 | bcrypt 哈希 | 盐值轮数 10，兼容旧明文自动升级 |
| 权限 | 三级装饰器 | @login_required / @admin_required / @student_required |
| 输入验证 | 正则 + 白名单 | 学号/手机/邮箱格式验证；岗位/学生更新字段白名单 |
| 注入防护 | 转义 + 限制 | escapeRegExp 防正则注入；_escape_js_string 防字符串注入；pageSize 上限 50/100 |
| 错误脱敏 | 不返回内部信息 | 云函数 catch 块统一中文提示；QGPY 全局错误处理器 |
| 敏感数据 | 查询时排除 | to_dict() 排除 password/openid；导出时脱敏 |

---

## 八、智能匹配算法

### 8.1 四维度匹配模型

| 维度 | 权重 | 匹配逻辑 | 分数计算 |
|------|------|---------|---------|
| 专业匹配 | 30% | 岗位 `requiredMajor` 为空（不限）或与学生 `major` 一致 | 匹配=30，不匹配=0 |
| 年级匹配 | 20% | 岗位 `requiredGrade` 为空（不限）或与学生 `grade` 一致 | 匹配=20，不匹配=0 |
| 成绩匹配 | 25% | 学生 `gpa` ≥ 岗位 `minGpa`（默认 0 不限） | 满足=25，不满足=0 |
| 时间匹配 | 25% | 学生 `freeTime` 与岗位 `workTime` 关键词重叠度 | 比例 × 25 |

**总分 = 专业分 + 年级分 + 成绩分 + 时间分**（0-100 分）

### 8.2 时间匹配算法

```javascript
// 关键词提取 + 重叠度计算
function checkTimeMatch(freeTime, workTime) {
  // 提取时间段关键词（上午/下午/晚上/周一~周日）
  // 计算交集数量 / 并集数量
  return overlapCount / totalCount  // 0-1
}
```

---

*本文档随项目开发进度持续更新。*
