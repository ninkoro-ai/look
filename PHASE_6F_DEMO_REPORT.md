# Phase 6F Demo Upgrade — Real Human Try-On Demo

## 1. 素材数量

| 素材 | 数量 | 说明 |
| --- | --: | --- |
| 虚拟模特 | 3 | 小雨 25 岁·日常休闲 / 安琪 28 岁·通勤职业 / 糖糖 23 岁·年轻甜美 |
| 透明衣物 PNG | 10 | 上衣×5 / 外套×2 / 裙子×2 / 裤子×1（PNG 透明背景） |

素材位置：

- 模特：`public/demo/real-tryon/models/model-1..3.jpg`
- 衣物：`public/demo/real-tryon/garments/{top-01,top-02,top-03,top-05,top-08,out-01,out-02,drs-01,drs-02,bot-01}.png`
- 生成脚本：`scripts/gen-demo-assets.mjs`（衣物由项目自有矢量资产栅格化，模特复用项目自有真人样例）
- 数据定义：`lib/demo/tryonDemo.ts`

> 素材说明：本会话没有可用的图像生成工具（内置 image_gen 不可用，CLI 回退需 OPENAI_API_KEY 且需明确确认），因此 3 位模特暂用项目自有真人样例照片（无版权风险）。如需换成 AI 专属生成图，可提供 OPENAI_API_KEY 走 CLI 生成，或直接把 3 张全身正面照放入 models/ 目录替换同名文件即可，无需改代码。

## 2. 页面路径

- Demo 页：`/demo/real-tryon`（公开展示页，不影响正式衣橱/用户数据/Beta 系统/原 Demo 数据）
- 流程：选择模特（3）→ 选择衣物（10）→ 点击「✨ AI 试穿」→ Before/After 对比
- 展示：生成耗时、Provider（Alibaba AITryOn / Local Segmentation 回退）、成本估算（¥0.2/次 或 ¥0）

## 3. Provider 测试

| Provider | 状态 | 说明 |
| --- | --- | --- |
| Alibaba AITryOn（主路径） | ✅ 线上 READY | 云端生成，真实效果，成本 ¥0.2/次 |
| Local Segmentation（回退） | ✅ 本地通过 | 云端未开启/失败时自动回退，成本 ¥0 |

- 回退逻辑：页面检测 `/api/vton/health`，`ready` 时走阿里云，否则走本地人像分割；
- 本地 QA：qa-demo 7/7 PASS（选模特/选衣/生成/Before-After/耗时/Provider/成本）；
- 线上验证：见第 4 节（部署后执行的真实生成）。

## 4. 截图说明

- 本地回归截图：`scripts/shots/demo-real-tryon.png`（本地回退路径：Before/After、Local Segmentation、¥0）
- 线上真实生成：部署后通过无头浏览器执行（糖糖 × 米白真丝衬衫 → Alibaba AITryOn），验证主路径。

## 5. 不影响项

- ✅ 正式衣橱（IndexedDB 主库 v3 未动）
- ✅ 用户数据 / Beta 系统（Demo 页无埋点、无登录、无写入）
- ✅ 原 Demo 数据（35 件演示单品未改）
- ✅ 核心架构（VTON 抽象层、Provider、衣橱结构均未改）

## 附：回归

qa-demo 7/7 · qa 16/16 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 13/13 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 · qa-tryon 9/9。
