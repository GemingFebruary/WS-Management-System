# 前端开发文档 — 勤工助学岗位匹配系统

> 本文档记录 QGWEB (Vue 3) 和微信小程序前端的完整开发状态、技术规范和变更历史。
>
> 最后更新：2026-11-19

---

## 一、前端架构总览

### 1.1 双端架构

| 端 | 技术栈 | 入口 | 端口 |
|----|--------|------|------|
| QGWEB（Vue 网页端） | Vue 3 + TypeScript + Vite 8 + Pinia + Vue Router + SCSS + CSS Variables | `QGWEB/src/main.ts` | 3001 |
| QGMP（微信小程序） | 原生 WXML + WXSS + JS + 微信云开发 | `app.js` | — |

### 1.2 目录结构

```
QINGGONG -NEW/
├── QGWEB/                          # Vue 网页端
│   └── src/
│       ├── api/                    # API 请求层
│       │   ├── request.ts          # Axios 实例 + 拦截器 + 30s 缓存 + 去重
│       │   ├── auth.ts             # 认证接口
│       │   ├── jobs.ts             # 岗位接口
│       │   ├── applications.ts     # 申请接口
│       │   ├── salary.ts           # 薪资接口
│       │   └── admin.ts            # 管理接口
│       ├── assets/
│       │   ├── img/icon/           # SVG 图标（21 个 Element Plus 图标）
│       │   └── QG.png              # 系统 Logo
│       ├── components/
│       │   ├── Card.vue            # 通用卡片
│       │   ├── Modal.vue           # 弹窗（size/footer/Escape）
│       │   ├── Toast.vue           # 消息提示（Teleport + 自动消失）
│       │   ├── Loading.vue         # 全屏加载（text prop）
│       │   ├── TabBar.vue          # 移动端底部导航
│       │   ├── PageHeader.vue      # 页面顶部导航
│       │   ├── Swiper.vue          # 轮播图
│       │   ├── FormInput.vue       # 表单输入
│       │   ├── PasswordInput.vue   # 密码输入
│       │   ├── common/             # FLO 移植通用组件
│       │   │   ├── EmptyState.vue  # 空状态占位
│       │   │   ├── ErrorState.vue  # 错误状态 + 重试
│       │   │   ├── ConfirmDialog.vue # 确认弹窗
│       │   │   ├── MenuItem.vue    # 菜单项
│       │   │   └── AppIcon.vue     # SVG 图标渲染
│       │   └── index.ts            # Barrel 导出（14 组件）
│       ├── composables/
│       │   ├── useDevice.ts        # 响应式设备检测
│       │   └── useInfiniteScroll.ts # 无限滚动
│       ├── router/index.ts         # 路由配置（20 条，全部懒加载）
│       ├── stores/
│       │   ├── index.ts            # Pinia 实例
│       │   └── user.ts             # 用户状态管理
│       ├── styles/
│       │   ├── theme.css           # CSS 自定义属性（50+ 变量 + 暗色模式 + 全局组件类）
│       │   ├── variables.scss      # SCSS 设计 token
│       │   ├── mixins.scss         # 8 个 SCSS mixin
│       │   ├── index.scss          # 样式入口
│       │   ├── reset.scss          # CSS 重置
│       │   ├── common.scss         # 全局工具类
│       │   └── responsive.scss     # 响应式工具
│       ├── types/index.ts          # TypeScript 类型定义
│       ├── utils/
│       │   ├── date.ts             # 日期格式化
│       │   └── toast.ts            # Toast 程序式 API
│       └── views/                  # 19 个页面 + 404
│
├── pages/                          # 微信小程序页面（16 个）
│   ├── index/                      # 首页
│   ├── login/ + register/          # 登录注册
│   ├── profile/                    # 个人中心
│   ├── jobList/ + jobDetail/       # 岗位列表 + 详情
│   ├── applyJob/                   # 岗位申请
│   ├── myApplications/             # 我的申请
│   ├── salaryQuery/                # 薪资查询
│   ├── notices/                    # 全部公告（TabBar）
│   └── admin/                      # 管理端（6 子页面）
│       ├── admin.*                 # 管理首页
│       ├── jobManage/              # 岗位管理
│       ├── applicationReview/      # 申请审核
│       ├── studentManage/          # 学生管理
│       ├── noticeManage/           # 公告管理
│       └── salaryManage/           # 薪资管理
├── utils/util.js                   # 小程序工具函数（32 个）
├── cloud/common/                   # 云函数公共模块
├── cloudfunctions/                 # 云函数（7 个）
└── images/                         # 图标资源
```

---

## 二、QGWEB 样式系统

### 2.1 CSS 自定义属性（theme.css）

全局 `:root` 变量，支持运行时动态切换（暗色模式通过 `.dark` 类启用）：

```css
:root {
  --primary: #4A90E2;
  --primary-hover: #357ABD;
  --primary-light: rgba(74, 144, 226, 0.1);
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --card-bg: #ffffff;
  --border: #e8e8e8;
  --success: #52c41a;
  --warning: #faad14;
  --danger: #ff4d4f;
  --shadow-sm / --shadow / --shadow-md / --shadow-lg;
  --radius-sm/md/lg/xl/round;
}
```

全局组件类（`.flo-btn--primary`、`.flo-input`、`.flo-menu-group`、`.flo-status-badge`、`.flo-spinner` 等）定义在 `theme.css` 底部。

### 2.2 SCSS 变量（variables.scss）

通过 Vite `css.preprocessorOptions.scss.additionalData` 自动注入每个 `<style lang="scss">` 块：

```scss
$primary-color: #4A90E2;      $font-family: -apple-system, ...;
$mobile: 768px;               $navbar-height: 56px;
$tablet: 1024px;              $tabbar-height: 60px;
$desktop: 1280px;             $safe-area-bottom: env(safe-area-inset-bottom, 0px);
```

### 2.3 SCSS Mixins（mixins.scss）

| Mixin | 用途 |
|-------|------|
| `flex-center` | 居中 flex |
| `flex-between` | 两端对齐 flex |
| `flex-column` | 纵向 flex |
| `text-ellipsis($lines)` | 单行/多行省略 |
| `safe-area-bottom` | 安全区域底部适配 |
| `hairline-bottom` | 0.5px 伪元素分隔线 |
| `glass-effect($bg)` | 毛玻璃效果 |
| `tap-active` | 手指按压反馈 |

### 2.4 样式导入顺序

```
main.ts
  → import './styles/theme.css'      ← CSS 变量 + 全局组件类
  → import './styles/index.scss'     ← mixins + reset + common + responsive
```

---

## 三、QGWEB 组件库

### 3.1 组件清单（14 个）

| 组件 | 文件 | 核心 Props | 增强特性 |
|------|------|-----------|---------|
| Card | `Card.vue` | padding, shadow, radius | — |
| Modal | `Modal.vue` | modelValue, title, size(sm/md/lg), showCancel | **#footer 插槽** + Escape 关闭 + 非 scoped 样式 |
| Toast | `Toast.vue` | message, type, **duration**(3000ms) | **Teleport to body** + 自动消失 |
| Loading | `Loading.vue` | loading, **text**("加载中...") | 自定义文字 |
| TabBar | `TabBar.vue` | — | 4 标签 + SVG 图标 |
| PageHeader | `PageHeader.vue` | title, showBack, backUrl | — |
| Swiper | `Swiper.vue` | list, autoplay, interval | — |
| FormInput | `FormInput.vue` | modelValue, placeholder, type | — |
| PasswordInput | `PasswordInput.vue` | modelValue, placeholder | — |
| EmptyState | `common/EmptyState.vue` | icon, text, actionText | FLO 移植 |
| ErrorState | `common/ErrorState.vue` | title, message, retryText | FLO 移植 |
| ConfirmDialog | `common/ConfirmDialog.vue` | visible, title, message, danger | Teleport + Escape |
| MenuItem | `common/MenuItem.vue` | icon, label, to, iconBg, iconColor | router-link + 箭头 |
| AppIcon | `common/AppIcon.vue` | icon, size | SVG 渲染 + currentColor |

### 3.2 Composables（2 个）

| Composable | 文件 | 返回值 | 用途 |
|-----------|------|--------|------|
| `useDevice` | `composables/useDevice.ts` | `{ isMobile, isTablet, isDesktop, screenWidth }` | 响应式设备检测 |
| `useInfiniteScroll` | `composables/useInfiniteScroll.ts` | `{ items, loading, hasMore, load, refresh }` | 无限滚动列表 |

### 3.3 工具函数（2 个）

| 工具 | 文件 | 导出 | 用途 |
|------|------|------|------|
| `date.ts` | `utils/date.ts` | `formatDate()`, `formatDateTime()` | 日期格式化（兼容 `{$date: ms}`） |
| `toast.ts` | `utils/toast.ts` | `showToast()`, `showSuccess()`, `showError()`, `showWarning()`, `showInfo()` | Toast 程序式 API |

### 3.4 组件使用方式

```vue
<script setup>
// 直接导入（非 barrel import，确保 tree-shaking）
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import MenuItem from '@/components/common/MenuItem.vue'
import { showToast, showSuccess } from '@/utils/toast'
import { useDevice } from '@/composables/useDevice'

const { isMobile } = useDevice()
const showConfirm = ref(false)

showSuccess('操作成功')
</script>

<template>
  <EmptyState text="暂无岗位" actionText="刷新" @action="loadData" />
  <ErrorState @retry="loadData" />
  <ConfirmDialog v-model:visible="showConfirm" danger @confirm="onDelete" />
  <MenuItem icon="<svg>...</svg>" label="我的申请" to="/my-applications" />
</template>
```

---

## 四、QGWEB 路由配置

| 路径 | 组件 | 权限 | showTabBar | 说明 |
|------|------|------|-----------|------|
| `/home` | home/index.vue | 无 | ✅ | 首页 |
| `/login` | login/index.vue | 无 | — | 登录 |
| `/register` | register/index.vue | 无 | — | 注册 |
| `/profile` | profile/index.vue | 无 | ✅ | 个人中心 |
| `/job-list` | jobList/index.vue | 无 | ✅ | 岗位列表 |
| `/job-detail/:id` | jobDetail/index.vue | 无 | — | 岗位详情 |
| `/apply-job/:id` | applyJob/index.vue | 需登录 | — | 岗位申请 |
| `/my-applications` | myApplications/index.vue | 需登录 | — | 我的申请 |
| `/salary-query` | salaryQuery/index.vue | 需登录 | — | 薪资查询 |
| `/notices` | notices/index.vue | 无 | ✅ | 全部公告 |
| `/admin` | admin/index.vue | 需管理员 | — | 管理后台首页 |
| `/admin/job-manage` | admin/jobManage.vue | 需管理员 | — | 岗位管理 |
| `/admin/application-review` | admin/applicationReview.vue | 需管理员 | — | 申请审核 |
| `/admin/all-applications` | admin/allApplications.vue | 需管理员 | — | 全部申请 |
| `/admin/student-manage` | admin/studentManage.vue | 需管理员 | — | 学生管理 |
| `/admin/notice-manage` | admin/noticeManage.vue | 需管理员 | — | 公告管理 |
| `/admin/salary-manage` | admin/salaryManage.vue | 需管理员 | — | 薪资管理 |
| `/admin/data-export` | admin/dataExport.vue | 需管理员 | — | 数据导出 |
| `/admin/system-settings` | admin/systemSettings.vue | 需管理员 | — | 系统设置 |
| `/:pathMatch(.*)*` | error/404.vue | 无 | — | 404 |

**路由特性**: 全部使用 `() => import(...)` 懒加载；路由守卫检查 `requireAuth` 和 `requireAdmin`。

---

## 五、QGWEB 请求层

### 5.1 request.ts 核心机制

```
请求拦截器
  → 公共 API 白名单（/auth/login, /auth/register 不注入 Token）
  → GET 请求缓存检查（TTL 30 秒，命中则 adapter 短路）

响应拦截器
  → 业务错误处理（401 自动登出）
  → GET 响应自动写入缓存
  → 去重记录清理

http.get() 去重
  → 同一 URL+params 在途时复用 Promise
  → 5 秒后强制清理
```

### 5.2 导出函数

| 函数 | 用途 |
|------|------|
| `clearCache()` | 清除所有请求缓存（登录/退出/数据变更后调用） |
| `http.get/post/put/delete` | 封装请求方法 |

### 5.3 性能优化

| 优化 | 效果 |
|------|------|
| GET 缓存（30s） | 管理端页面切换零网络开销 |
| GET 去重 | 快速导航不触发重复请求 |
| vendor 分包 | Vue+axios 独立缓存（134KB），业务代码 27KB |
| 直接导入 | 19 个视图全部改为 `import X from '@/components/X.vue'` |

---

## 六、导航系统

### 6.1 桌面端顶部导航栏（≥768px）

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [QG.png] 勤工助学岗位匹配系统      首页  岗位列表  全部公告  个人中心    用户名 退出 │
└──────────────────────────────────────────────────────────────────────────────────┘
 ←── Logo 居左（距左 48px）──→          ←── 导航菜单居中 ──→         ←── 用户区居右 ──→
```

- 高度 56px，背景 `#4A90E2`，全宽布局
- 导航项圆角药丸式，active 项半透明白色背景

### 6.2 移动端顶部导航栏（<768px）

- 高度 44px，`position: sticky; top: 0`，全局样式 `.mobile-header`

### 6.3 移动端 TabBar

- 4 标签：首页 / 岗位 / 公告 / 我的
- 60px 高，桌面端隐藏

---

## 七、管理端功能

### 7.1 管理首页 — 统计卡片 + 功能菜单

### 7.2 岗位管理 — 搜索 + 状态筛选 + CRUD + 状态切换

### 7.3 申请审核 — 待审核列表 + 查看学生/岗位 + 通过/驳回

### 7.4 全部申请 — 状态筛选 + 时间排序 + 详情弹窗

### 7.5 学生管理 — 搜索 + 编辑(10字段) + 重置密码 + 禁用/启用

### 7.6 公告管理 — 列表 + 编辑 + 删除 + 发布

### 7.7 薪资管理 — 月份筛选 + 月度汇总 + 录入/编辑/删除/发放/批量发放

### 7.8 数据导出 — 申请/学生/薪资(JSON) + 发薪清单(CSV)

### 7.9 系统设置 — 公告入口 + 系统信息

---

## 八、个人中心

### 8.1 功能菜单

```
查看公告 → /notices
我的申请 → /my-applications
岗位列表 → /job-list
薪资查询 → /salary-query
---
编辑资料（弹窗: 手机号/邮箱/空闲时间/个人技能 + "修改密码"链接）
联系我们
---
管理后台（仅管理员）
---
退出登录
```

### 8.2 后端接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/auth/update-profile` | PUT | 更新 phone/email/freeTime/skills/experience |
| `/auth/change-password` | PUT | 验证旧密码 + bcrypt 哈希新密码 |

---

## 九、日期格式化

### 9.1 问题背景

微信云数据库 `db.serverDate()` 返回 `{$date: 1781083175517}` 格式。

### 9.2 解决方案

**QGPY 后端（源头转换）**: `wx_cloud_db.py` `_convert_dates()` 递归方法：
- `{$date: ms}` → ISO 字符串
- `{$oid: "xxx"}` → 纯字符串

**Vue 前端**: `utils/date.ts` `formatDate(date)` 兼容字符串/`{$date}`/Date/时间戳。

**小程序前端**: `utils/util.js` `formatCloudDate(date)` 同样兼容四种格式。

---

## 十、Vite 构建配置

```typescript
// vite.config.ts 关键配置
{
  plugins: [vue()],
  css: { preprocessorOptions: { scss: { additionalData: `@use "@/styles/variables.scss" as *;` } } },
  server: { port: 3001, strictPort: true, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || ...) return 'vendor-vue'    // 93KB
          if (id.includes('node_modules/axios')) return 'vendor-axios'       // 41KB
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
}
```

**构建产物**: vendor-vue 93KB + vendor-axios 41KB（独立缓存）+ 业务 chunk 27KB。

---

## 十一、浏览器标签页

- `<title>`: "勤工助学岗位匹配系统"
- `<link rel="icon">`: `favicon.png`（QG.png 副本）
- `<html lang="zh-CN">`

---

## 十二、页面对接状态

### 12.1 QGWEB Vue 页面（16 个）

| 页面 | API 调用 | 状态 |
|------|----------|------|
| home | `jobsApi.getRecommendJobs()` + `adminApi.getNotices()` | ✅ |
| jobList | `jobsApi.getJobList(params)` | ✅ |
| jobDetail | `jobsApi.getJobDetail(jobId)` | ✅ |
| applyJob | `jobsApi.getJobDetail()` + `applicationsApi.submitApplication()` | ✅ |
| myApplications | `applicationsApi.getMyApplications()` | ✅ |
| salaryQuery | `salaryApi.querySalary()` | ✅ |
| notices | `adminApi.getNotices()` | ✅ |
| profile | `authApi.updateProfile()` + `authApi.changePassword()` | ✅ |
| admin | `adminApi.getStats()` | ✅ |
| admin/jobManage | `jobsApi` CRUD | ✅ |
| admin/applicationReview | `applicationsApi` 审核 | ✅ |
| admin/allApplications | `applicationsApi` 列表 | ✅ |
| admin/studentManage | `adminApi` 学生管理 | ✅ |
| admin/noticeManage | `adminApi` 公告 CRUD | ✅ |
| admin/salaryManage | `salaryApi` 薪资全套 | ✅ |
| admin/dataExport | `adminApi.exportData()` + `exportPayroll()` | ✅ |

### 12.2 微信小程序页面（16 个）

| 页面 | 云函数调用 | 状态 |
|------|-----------|------|
| index | `callJobs('recommend')` + `callAdmin('getNotices')` | ✅ |
| jobList | `callJobs('list')` | ✅ |
| jobDetail | `callJobs('detail')` | ✅ |
| applyJob | `callJobs('detail')` + `callApplications('submit')` | ✅ |
| myApplications | `callApplications('myApplications')` | ✅ |
| salaryQuery | `callSalary('query')` + `callSalary('list')` | ✅ |
| notices | `callAdmin('getNotices')` | ✅ |
| profile | `callApplications` + `callSalary('query')` | ✅ |
| admin | `callAdmin('stats')` | ✅ |
| admin/jobManage | `callJobs` CRUD | ✅ |
| admin/applicationReview | `callApplications('adminList')` + `review` | ✅ |
| admin/studentManage | `callAdmin('studentList')` + `updateStudent` | ✅ |
| admin/noticeManage | `callAdmin` 公告 CRUD | ✅ |
| admin/salaryManage | `callSalary` 薪资全套 | ✅ |

---

## 十三、测试数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 学生 | 20 人 | 真实中文姓名、6 学院 12 专业 |
| 岗位 | 15 个 | 覆盖 12 个部门 |
| 申请 | 30 条 | 已通过 10 + 待审核 8 + 已驳回 4 + 已取消 3 + 其他 5 |
| 薪资 | 40+ 条 | 2026 年 1-6 月 |
| 公告 | 8 条 | 岗位申请/名额扩充/薪资发放/假期安排/培训通知等 |

测试账号: 管理员 `admin/admin123`，学生 `js2380000~js2380019/123456`

---

## 十四、已知限制

| 项目 | 说明 |
|------|------|
| 云数据库 HTTP API 单次查询上限 | 最多返回 20 条（使用大 limit 尽量获取） |
| 云数据库不支持 `$or` + `$regex` | keyword 搜索使用客户端过滤 |
| 云数据库日期格式 | `db.serverDate()` 返回 `{$date: ms}`，需 `_convert_dates()` 转换 |
| 云数据库 `_id` 查询 | 必须使用 `_.eq()` 包装 ObjectId 匹配 |

---

## 十五、审查修复记录（2026-06-11）

### 15.1 申请审核 500 错误修复

| 时间 | 问题 | 根因 | 修复 |
|------|------|------|------|
| 21:30 | Vue 端审核返回 500 | `_id` 查询用字符串而非 `_.eq()` | `wx_cloud_db.py` 新增 `_build_condition()` |
| 22:00 | `$set` 不合法 | 云数据库 `update()` 不需要 `$set` 包装 | 移除 `{$set: {...}}` → `{...}` |

### 15.2 FLO 组件移植（第二十八轮）

| 类别 | 文件 | 说明 |
|------|------|------|
| 样式基础 | `styles/theme.css` | 50+ CSS 变量 + 暗色模式 + 全局组件类 |
| 样式基础 | `styles/mixins.scss` | 8 个 SCSS mixin |
| 通用组件 | `common/EmptyState.vue` | 空状态占位 |
| 通用组件 | `common/ErrorState.vue` | 错误状态 + 重试 |
| 通用组件 | `common/ConfirmDialog.vue` | 确认弹窗（Teleport + Escape） |
| 通用组件 | `common/MenuItem.vue` | 菜单项（router-link + 箭头） |
| 通用组件 | `common/AppIcon.vue` | SVG 图标渲染 |
| Composable | `composables/useDevice.ts` | 响应式设备检测 |
| Composable | `composables/useInfiniteScroll.ts` | 无限滚动 |
| 工具 | `utils/toast.ts` | Toast 程序式 API |

### 15.3 性能优化（第二十九轮）

| 优化 | 效果 |
|------|------|
| Vite manualChunks | vendor-vue 93KB + vendor-axios 41KB 独立缓存 |
| request.ts 缓存 | GET 请求 30 秒内存缓存 |
| request.ts 去重 | 同一 URL 在途复用 Promise |
| 消除 barrel import | 19 个视图改为直接导入 |
| 移除未使用导入 | admin/index.vue 移除 Modal |

---

*文档维护说明: 本文档随前端开发进度持续更新。*
