# CHANGELOG

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
