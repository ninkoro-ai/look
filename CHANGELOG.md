# CHANGELOG

## UI Redesign — 全局视觉升级（2026-08-17）

### Design System
- 重映射全局 Design Token（`app/globals.css`）：米白 `#FAF8F5` + 玫瑰粉 `#E98EA6` + 深黑 `#171717`，语义化 token 不变、全局生效
- 圆角 14/18/22/28px、柔和阴影 `shadow-soft`/`shadow-float`、`card-hairline`/`pressable` 轻量动效

### 组件 / 导航
- 新增 `components/ui.tsx`（SectionTitle / Chip / Pill / SoftCard）
- `AppShell` 底部导航 3 → 5 Tab（首页/衣橱/换装/收藏/我的），换装为中间浮起入口

### 页面重构（业务逻辑与数据层零改动）
- UI-01 首页：今天穿什么 Hero + 天气小卡 + 今日 Look 主卡 + 横向推荐 + 发现模块
- UI-02 衣橱：3 列图片网格 + 分类 Chip + 空态 CTA + 右下 FAB
- UI-03 换装：大模特 + 横向衣物卡片 + 收藏/AI 试穿分离
- UI-04 穿搭详情：大图 + 为什么这样搭 + 图片清单
- UI-05 新增 `/favorites` 收藏画廊（真实收藏数据）
- UI-06 新增 `/profile` 我的/风格（真实衣橱统计，无数据空态）
- UI-07 `/tryon` 结果页：Before/After + 完成标题，不暴露 Provider/task_id

### 验证
- 多尺寸截图：`scripts/shots/redesign/`（375/390/430/768/1440 × 6 页面）
- 回归：qa / qa-layout / qa-import / qa-model / qa-lab / qa-wardrobe / qa-beta / qa-alibaba / qa-tryon / qa-demo 全部 PASS
- 报告：`UI_REDESIGN_REPORT.md`

## Phase 6F Demo — Real Human Try-On Demo（2026-08-16）
## Phase 6F Demo — Real Human Try-On Demo（2026-08-16）

### 新增
- Demo 页 `/demo/real-tryon`（公开演示，不影响正式产品）：
  - 3 位虚拟模特（25 日常休闲 / 28 通勤职业 / 23 年轻甜美）
  - 10 件透明衣物 PNG（上衣×5 / 外套×2 / 裙子×2 / 裤子×1）
  - 选模特 → 选衣 → ✨ AI 试穿 → Before/After 对比
  - 展示：生成耗时、Provider（Alibaba AITryOn / Local Segmentation 回退）、成本估算（¥0.2 / ¥0）
- 素材：`public/demo/real-tryon/{models,garments}`；生成脚本 `scripts/gen-demo-assets.mjs`；数据定义 `lib/demo/tryonDemo.ts`
- QA：`scripts/qa-demo.mjs`（7 项断言）
- 报告：`PHASE_6F_DEMO_REPORT.md`

### 说明
- 模特暂用项目自有真人样例（本会话无图像生成工具）；衣物由自有矢量资产栅格化为透明 PNG
- 云端未开启时自动回退本地人像分割，Demo 始终可演示

### 安全/回归
- 不影响正式衣橱、用户数据、Beta 系统、原 Demo 数据
- 回归：qa-demo 7/7 · qa 16/16 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 13/13 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 · qa-tryon 9/9

## Phase 6F.0 — Alibaba AITryOn Production Connection（2026-08-16）
## Phase 6F.0 — Alibaba AITryOn Production Connection（2026-08-16）

### 配置
- Cloudflare Pages Production 写入 3 个环境变量（wrangler pages secret put）：
  - `DASHSCOPE_API_KEY`（加密）、`VTON_ALLOW_ALIBABA=true`、`VTON_BETA_ENABLED=true`
- Preview 不复制 Key；健康检查确认 `alibaba: "ready"`

### 新增/变更
- `/api/vton/health`：新增 `alibaba: "ready" | "disabled"` 与 `betaEnabled` 状态（不返回 Key）
- 成本保护：每用户每日最多 3 次 Alibaba TryOn
  - 客户端：/tryon 显示「今日剩余 N 次」，用尽提示「今日AI试穿次数已用完」
  - 服务端：tryon 接口先于上游检查，超限返回 429（优先 KV 持久化，未绑定时实例内存回退；KV 绑定后自动升级）
  - Provider 发送 `clientId`（Beta 用户用 betaUserId，其余本地随机）用于限额统计
- `/lab/vton/alibaba`：配置状态显示 `Alibaba AITryOn：READY / DISABLED`
- 首次真实调用记录：`benchmarks/alibaba-first-run.json`（无图片/用户信息）
- 报告：`PHASE_6F_0_ALIBABA_CONNECTION_REPORT.md`

### 实测（2026-08-16）
- 首次真实生成：task `f909e879-…` SUCCEEDED，约 181s，成本 ¥0.2
- 线上验证：health ready、实验台 READY、/tryon 配额 UI 生效
- 限额服务端验证：多实例下内存计数不可靠 → 已实现 KV 可选方案，KV 绑定待权限

### 安全
- Key 仅 Cloudflare Secret；未进代码/Git/日志/报告；健康检查不返回 Key；图片临时 48h
- 回归全过：qa 16/16 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 13/13 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 · qa-tryon 9/9

## Phase 6E — AI Try-On Value Validation（2026-08-16）
## Phase 6E — AI Try-On Value Validation（2026-08-16）

### 新增
- 功能开关：`VTON_BETA_ENABLED`（服务端门禁）+ `NEXT_PUBLIC_VTON_BETA_ENABLED`（构建期前端开关），真实 AI试穿仅 Beta 用户开放
- Beta 用户 AI 入口：换装间「✨ AI真实试穿」按钮（Beta + 开关 + 服务端就绪三条件，普通用户不可见）
- 产品页 `/tryon`：AI 真实试穿全流程
  - 选衣（top/outerwear/dress）→ 等待（三段式文案，不暴露 Provider/API）→ 结果（原图+AI 图）
  - 操作：❤️ 收藏 / 🔄 再试一次 / 📂 加入我的穿搭 / 👍 有帮助 / 👎 没帮助 / 1~5 星评分
  - 付费意愿问卷（A 愿意 / B 看价格 / C 不需要）
  - 失败处理：API 失败「生成失败，请稍后重试」、图片不合适「建议上传：正面全身照片」、超时自动重试一次
- Beta 事件扩展：`vton_started / vton_completed / vton_rated / vton_saved / vton_retry / vton_pay_intent`
- 指标统计：`computeVtonMetrics`（次数/成功率/平均耗时/平均成本/平均评分/二次生成率/收藏率/付费意愿分布）
- 看板 `/lab/vton/beta`：实时指标 + 成本监控 + 导出 `vton-cost-report.json`（含 10 用户月成本估算）
- 服务端门禁：upload/tryon/status/alibaba 端点统一走 `vtonBetaGate`（Key + Beta 开关 + Allow 开关）
- 报告：`PHASE_6E_REPORT.md`

### 变更
- `lib/db.ts`：`VtonTestRecord` 增加 `favorite`、`savedTo` 字段（向后兼容）
- `app/dress/page.tsx`：换装间加入口（仅 Beta + 服务端就绪时显示）

### 实测
- 模拟：Beta 建衣橱 → 选衣 → 生成（无 Key 优雅失败）→ 事件/看板/成本导出全部跑通
- 真实 AI 生成与真人价值数据待 `DASHSCOPE_API_KEY` + 10 名测试用户

### 安全
- Key 仅服务端；AI 试穿入口普通用户不可见；云端默认关闭；结果/事件仅行为统计、无照片
- 回归全过：qa 16/16 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 13/13 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 · qa-tryon 9/9

## Phase 6B.1 — Alibaba DashScope AITryOn Integration（2026-08-16）
## Phase 6B.1 — Alibaba DashScope AITryOn Integration（2026-08-16）

### 新增
- `AlibabaAITryOnProvider`：`lib/ai/vton/providers/alibaba.ts`（统一契约，调用方式不变；旧类名保留别名）
- 上传适配层 `ImageAssetUploader`：`lib/ai/vton/uploader.ts`（本地图片 → 压缩/规范化 → 临时公网 URL）
- 服务端端点：`functions/api/vton/upload.ts`（getPolicy + OSS 上传，返回 oss:// 48h URL）、`functions/api/vton/tryon.ts`（公网 URL 创建 aitryon 任务）
- 专属实验台 `/lab/vton/alibaba`：人物/衣物上传 → Generate → task_id / 状态流转 / 耗时 / 成本 / 结果图 / 错误码
- 20 组真实图片基准框架：`lib/ai/vton/alibabaBenchmark.ts`（真人自拍 ×8 / 衣服照片 ×8 / 复杂场景 ×4，图片放 `public/bench-assets/alibaba/` 后自动就绪）
- 基准记录：`vtonTests` 新增 `qualityScore`（1~5 人工质量分）；导出 `ALIBABA_BENCHMARK.json`（provider/success/duration_ms/cost/quality_score）
- 报告：`PHASE_6B_ALIBABA_REPORT.md`

### 变更
- `lib/ai/vton/registry.ts`：阿里云 Provider 改用 `AlibabaAITryOnProvider`
- `lib/db.ts`：新增 `deleteVtonTestsByProvider`

### 实测
- 本机 wrangler 验证：upload/tryon/status 代理编译运行，无 Key 时安全返回 AUTH_ERROR
- 真实云端调用未执行（缺 `DASHSCOPE_API_KEY` + 20 组真实图片），报告如实标注

### 安全
- Key 仅服务端；用户图片临时存储 48h、不持久化；云端默认关闭
- 回归全过：qa 17/17 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 10/10 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8

## Phase 6D — Closed Beta Validation（2026-08-16）

### 新增
- Beta 测试模式与数据隔离（`lib/beta/storage.ts`）：
  - 独立 IndexedDB（`chuanda-walk-in-closet-beta`），普通用户数据库 v3 不变
  - Beta 用户标识（本地生成）、一键退出并删除全部测试数据
  - 入口：邀请链接 `?beta=1` 或 `/lab/beta` 开启
- Beta 埋点与指标（`lib/beta/track.ts` / `lib/beta/metrics.ts` / `lib/beta/events.ts`）：
  - 事件：session / onboarding / upload / detection / garment_added / daily_outfit_viewed / dress_viewed / vton_clicked / feedback / data_deleted
  - 指标：首次衣橱完成率（≥5 件）、首次完成时间、Day0/3/7 衣物增长、Day1/3/7 留存、推荐查看率、AI 试穿点击率、反馈分布
- 产品面（不影响普通用户）：
  - 首页：Beta 空衣橱 3 步引导 + 今日 LOOK 点击埋点 + 轻量反馈入口 + Beta 退出/删除入口
  - 衣橱页：空衣橱时显示「添加我的第一件衣服」CTA（非空衣橱不变）
  - `/import`：AI 失败兜底（重新上传 / 手动添加一件）+ Beta 埋点
  - 换装间：`dress_page_viewed` 埋点；VTON 实验台：`vton_clicked` 埋点
- Beta 看板：`/lab/beta`（指标表、用户明细、反馈汇总、JSON 导出、删除数据）
- 基准数据：`benchmarks/beta-analytics-20260816.json`
- 报告：`PHASE_6D_REPORT.md`

### 变更
- `lib/db.ts`：数据库名按 Beta 状态切换；Beta 库新增 `betaEvents` 存储；新增 `ensureBetaSeeded`（只种模特不种演示衣物）、`deleteBetaDatabase`
- `hooks/useAppData.tsx`：Beta 库按需播种 + 会话埋点
- `scripts/qa-beta.mjs`：Beta 全流程回归（16 项断言，支持 `SAVE_BETA_EXPORT` 导出快照）

### 实测（2026-08-16，13 人模拟 Cohort）
- 首次衣橱完成率 69%（9/13）；平均首次完成时间 151s（<3min 目标达成）
- 留存 Day1 69% / Day3 54% / Day7 38%（模拟）
- 推荐查看用户占比 54%；AI 试穿点击率 38%
- 反馈 😊3 / 😐1 / 😞1 + 文字 1 条
- **真人数据待招募 10–20 名 Closed Beta 测试者采集**

### 安全
- Beta 事件仅含行为统计，无照片/姓名/手机号（QA 断言）；照片仅存本机 IndexedDB
- Beta 数据独立可删除；主库与普通用户数据不受影响；云端 VTON 维持默认关闭

## Phase 6C — Real Wardrobe Asset Validation（2026-08-16）

### 新增
- 衣橱 onboarding 实验台 `/lab/wardrobe`（仅实验环境，不影响 `/app` 正式流程）：
  - 两种上传方式：穿搭照片拆解（多件）/ 单品照片上传（单件）
  - 识别结果人工确认：改名 / 改分类 / 删除恢复 / 加入衣橱
  - Onboarding 统计：首次建立成功率、识别/整单耗时、类别与颜色准确率（样例比对）、修改/删除成本、继续添加率
  - 事件 JSON 导出（仅行为指标，无照片/隐私字段）
- 测试数据集：20 组（女生自拍穿搭×5 / 镜子自拍×5 / 衣架×5 / 平铺×5），全部为自绘演示 PNG：
  - `lib/ai/wardrobe/dataset.ts`（数据集定义）
  - `public/lab-samples/wardrobe/w01–w20.png`
  - `scripts/gen-wardrobe-samples.mjs`（场景 SVG 生成脚本，PNG 由无头渲染栅格化）
- 分析层：
  - `lib/ai/wardrobe/analytics.ts`（统计与指标计算）
  - `lib/db.ts`：IndexedDB 升到 v3，新增 `onboardingEvents` 存储（`OnboardingEvent`，仅事件不存图片）
- 基准数据：`benchmarks/wardrobe-onboarding-20260816.json`
- 报告：`PHASE_6C_REPORT.md`

### 变更
- `lib/types.ts`：`WardrobeItem` 增加可选 `subCategory`、`occasion` 字段（向后兼容，不做库迁移）
- QA 脚本 IndexedDB 版本 2 → 3（qa / qa-lab / qa-import / qa-model / qa-wardrobe）
- 新增 `scripts/qa-wardrobe.mjs`（衣橱实验台回归，11 项断言）

### 实测（2026-08-16，自动化模拟会话）
- 首次建立衣橱成功率：100%（模拟）
- 平均识别耗时：2ms（Mock）；平均整单处理耗时：106ms（Mock，远低于 30s 目标）
- 类别/颜色准确率：100%（Mock 演示数据，构造一致；真实准确率待 Beta 验证）
- 平均修改 0.5 次/单、删除 0.5 件/单；继续添加率 100%（模拟）

### 安全
- onboarding 事件只记录行为指标（计数/耗时/类别），不含照片、姓名、手机号等隐私数据（QA 断言通过）
- 未修改首页/衣橱/换装核心/推荐/VTON 架构；云端 VTON 维持默认关闭

## Phase 6B — 国内 VTON Provider Benchmark（2026-08-16）

### 新增

- 统一 VTON Provider 契约：`lib/ai/vton/contract.ts`（VTONInput / VTONTask / VTONResult / VirtualTryOnProvider / runVTONToCompletion / adaptLegacyProvider）
- 统计工具：`lib/ai/vton/stats.ts`（成功率、P50/P95、最快/最慢、成本、错误码统计、6 维质量综合分）
- 阿里云百炼 AI试衣 Provider：`lib/ai/vton/providers/AlibabaVTONProvider.ts`（aitryon，图片本地压缩至 ≤1024px）
- 服务端代理（Cloudflare Pages Functions，Key 仅服务端）：`functions/api/vton/alibaba.ts`、`status.ts`、`health.ts`、`_lib.ts`
- 固定 Benchmark 数据集扩展至 20 组（T恤×5 / 衬衫×5 / 外套×5 / 连衣裙×5）：`lib/ai/vton/benchmark.ts`
- 实验台 `/lab/vton` 增强：Provider 单选、运行当前/全部、成功率/P50/P95/成本/错误统计、6 维人工评分、JSON/MD 导出
- 基准数据：`benchmarks/vton-benchmark-20260816.json`
- 报告：`PHASE_6B_REPORT.md`

### 变更

- `lib/db.ts`：`VtonTestRecord` 增加 `errorCode`、`quality` 字段（IndexedDB 版本仍为 2，向后兼容）
- `lib/ai/vton/registry.ts`：新增 `contractVTONProviders()`（旧 `allVTONProviders()` 保留）
- `.gitignore`：新增 `.dev.vars*`（Cloudflare Pages 本地 Secret）
- `scripts/qa-lab.mjs`：适配 Phase 6B 实验台（20 组 × 2 本地方案 = 40 条断言）

### 实测（2026-08-16，本机）

- local-layer：20/20 成功，P50 325ms，P95 355ms，$0
- hybrid-mask：20/20 成功，P50 1212ms，P95 1343ms，$0
- alibaba-vton：代码/代理/实验台就绪，真实调用待 `DASHSCOPE_API_KEY`（北京地域）+ `VTON_ALLOW_ALIBABA=true`

### 安全

- API Key 仅允许出现在服务端环境变量（Pages Secret / `.dev.vars`），未写入任何前端、Git、JSON、报告
- 云端 VTON 默认关闭（需 Key + `VTON_ALLOW_ALIBABA=true` 双条件），仅 `/lab/vton` 可用
