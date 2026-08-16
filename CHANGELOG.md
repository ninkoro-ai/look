# CHANGELOG

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
