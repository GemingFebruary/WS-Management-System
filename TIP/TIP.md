# 勤工助学岗位匹配管理系统 - 改进建议与开发日志（精简版）

> 本文档汇总项目审查中发现的问题、改进建议与当前状态，并作为后续开发日志的载体。
> **完整历史日志**（2026-05 ~ 2026-06-16，共 24 章）已归档至 [TIP-full-archive-20260616.md](TIP-full-archive-20260616.md)。
> 前端详见 [FRONTEND.md](FRONTEND.md)｜后端 [BACKEND.md](BACKEND.md)｜数据库 [DATABASE.md](DATABASE.md)｜综合技术 [TECHNICAL.md](TECHNICAL.md)
>
> 最后更新：2026-11-19

---

## 一、项目概览

**三端架构**（共用微信云数据库 MongoDB）：

| 端 | 技术栈 | 位置 | 规模 |
|----|--------|------|------|
| QGMP 微信小程序 | 原生 WXML/WXSS/JS + 云开发 | `pages/`（16 页）、`cloudfunctions/`（7 云函数）、`utils/` | 主体 |
| QGWEB 网页端 | Vue 3 + TypeScript + Vite + Pinia | `QGWEB/src/`（20 个 .vue、20 路由、14 组件） | src 0.4 MB |
| QGPY 后端 | Flask 3 + PyJWT + bcrypt | `QGPY/app/`（5 路由 + 8 模型） | 0.3 MB |

- **智能匹配**：四维度加权（专业 30% / 年级 20% / 成绩 25% / 时间 25%）。
- **认证**：bcrypt 密码 + HMAC-SHA256 Token（24h 过期）。
- **云函数**：auth / jobs / applications / salary / admin / initDB / seedData。
- **论文定位（2026-11 开题）**：聚焦小程序端，后端不作为研究重点；重点为可配置多维加权匹配 + 匹配度可视化、数据统计可视化。

---

## 二、问题总览

> 下表为 2026-05 ~ 2026-06 全部审查结论（40 项），完整背景见归档文档。

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

---

## 三、关键决策与架构说明

- **ARCH-02**：小程序与 Python 后端对接方案已确认——云函数直连云数据库，QGPY 通过 HTTP API 访问同一云数据库。
- **DATA-02**：initDB / reset 仅用于开发测试，生产环境应移除。
- **CODE-04**：Token 已升级为 HMAC-SHA256 签名 + 24h 过期，格式 `base64(payload).hmac`。
- **ARCH-03**：各云函数内置独立 `common/`（auth.js / response.js / validator.js）。
- **NEW-09**：`FLO/` 为参考项目，本地保留、不入库。
- **页面规模**：小程序 16 个（11 顶层 + 5 个 admin 子页）；QGWEB 20 个 .vue（9 admin + 10 业务 + 404）。
- 更多架构改进建议（REF-01 ~ REF-14，多为低优先级）见归档文档。

---

## 四、当前状态（2026-11-19）

### 项目阶段

| 时间 | 阶段 | 产出 |
|------|------|------|
| 2026-05 ~ 06 | 代码开发 | 三端 + 7 云函数，功能冻结 |
| 2026-07-16 | 算法与数据库设计 | `文档/算法分析与数据库设计文档.md` |
| 2026-09-22 | 论文定稿与检测 | 学年论文、查重报告、AIGC 检测报告（`文档/`） |
| 2026-11-15 | 开题答辩 | 通过开题，同意开题 |

### 结构快照

| 目录 | 内容 | 体积 |
|------|------|------|
| `pages/` | 11 顶层 + 5 admin 子页（共 16 页） | — |
| `cloudfunctions/` | 7 云函数 + common（含 node_modules） | 330.6 MB |
| `QGPY/` | Flask 后端 | 0.3 MB |
| `QGWEB/` | Vue 3 网页端 | src 0.4 MB |
| `TIP/` | 6 份开发文档（含归档） | ~230 KB |
| `文档/` | 论文/设计/开题等中文文档 | ~22 MB |
| `FLO/` | 参考项目（不入库） | 200.8 MB |

---

## 五、待办事项

| 编号 | 事项 | 优先级 | 状态 |
|------|------|--------|------|
| GIT-02 | Git 初始化并推送 GitHub | 🔴 高 | ⬜ 待执行 |
| DEPLOY-01 | 云函数重新部署 | 🔴 高 | ⬜ 待执行 |
| MATCH-01 | 匹配模型改为可配置多维加权 + 匹配度可视化 | 🔴 高 | ⬜ 待规划（开题要求） |
| FLOW-02 | 自动化测试 | 🟡 中 | ⬜ 待添加 |
| CHART-01 | 引入 ECharts 数据可视化 | 🟡 中 | ⬜ 待规划（开题要求） |
| FLOW-03 | 云函数版本管理 | 🟢 低 | ⬜ 待规范 |
| FEAT-04 | 消息通知系统 | 🟢 低 | ⬜ 待规划 |
| IMP-10 | 系统日志查询接口 | 🟢 低 | ⬜ 待规划 |

---

## 六、文档索引

| 文档 | 说明 |
|------|------|
| [TIP/TIP.md](TIP.md) | **主文档**（本文件，精简版） |
| [TIP/TIP-full-archive-20260616.md](TIP-full-archive-20260616.md) | 完整历史日志归档 |
| [TIP/FRONTEND.md](FRONTEND.md) | 前端开发文档（QGWEB + 小程序） |
| [TIP/BACKEND.md](BACKEND.md) | 后端开发文档（QGPY） |
| [TIP/DATABASE.md](DATABASE.md) | 数据库配置文档 |
| [TIP/TECHNICAL.md](TECHNICAL.md) | 综合技术文档 |
| [TIP/ROADMAP.md](ROADMAP.md) | 项目调整方向与修改路线（基于开题报告） |
| `文档/` | 论文/设计/开题等中文文档集中存放 |
| [README.md](../README.md) / [PROJECT_README.md](../PROJECT_README.md) | 项目入口说明 |
| [API_DOCUMENT.md](../API_DOCUMENT.md) / [API_FULL.md](../API_FULL.md) | API 文档 |
| [DEVELOPMENT.md](../DEVELOPMENT.md) / [DOCUMENT_STRUCTURE.md](../DOCUMENT_STRUCTURE.md) | ⚠️ 已过时 |

---

*文档维护说明: 后续所有开发文档、开发日志均在 TIP/ 文件夹内生成/修改。*
