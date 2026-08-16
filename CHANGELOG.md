# CHANGELOG

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
