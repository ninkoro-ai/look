# PHASE 6A 报告：Real AI / Virtual Try-On 技术验证

## 1. Provider

已实现并可在 `/lab/vton` 选择：

| Provider | 类型 | 说明 |
|---|---|---|
| `local-layer` | 本地方案 A | 姿势锚点直接把透明上衣合成到人像（免费 / 离线） |
| `hybrid-mask` | 本地方案 B | MediaPipe 人像分割先擦除原图上身衣物，再叠加目标上衣（免费 / 离线） |
| `openai-image-edit` | 云端方案 C | gpt-image-1 图像编辑：人像 + 衣物参考图拼版，提示词仅替换上衣（需 Key） |

检测/提取侧同时新增 `RealGarmentAIProvider`（真实 Provider）：OpenAI gpt-4o-mini 结构化输出识别（category/name/confidence/bbox/color/attributes），配合 MediaPipe 多类别人像分割（clothes 类别）输出 crop / mask / 透明资产。`MockGarmentAIProvider` 保留未动。

## 2. API

- OpenAI Chat Completions：`gpt-4o-mini` + `response_format=json_object`（衣物检测）
- OpenAI Images Edits：`gpt-image-1`（Virtual Try-On 图像编辑）
- MediaPipe tasks-vision：PoseLandmarker（姿势锚点）+ ImageSegmenter selfie_multiclass（clothes 类别蒙版），全部本地 WASM
- 选择机制：`NEXT_PUBLIC_AI_PROVIDER=mock|real`；真实 Provider 无 Key 时自动回退 Mock；VTON 实验室由 `NEXT_PUBLIC_ENABLE_LAB=true` 开启（默认隐藏）

## 3. 输入限制

- 人物照片：正面全身站立、四肢完整入镜；姿势检测失败（坐姿/遮挡/画面裁切）时本地方案不可用
- 衣物照片：本阶段仅「上衣」类别；本地合成要求透明素材（Phase 5 提取产物或演示素材均可）；非透明照片会被直接覆盖合成
- 云端方案：需要 OpenAI API Key；浏览器直连受 CORS 与网络环境影响（本机实测 api.openai.com 跨境链路不稳定），生产验证建议走代理
- 基准样例：3 张正面全身人像 + 5 件演示上衣，10 组组合

## 4. 输出质量

- 本地方案：保持人物姿势/面部/背景不变，合成真实衣物像素；hybrid-mask 会先擦除原图上衣（保留肤色/头发/背景），比 local-layer 更接近“换衣”语义；仍是 2D 平面合成，领口/袖窿自然度一般
- 云端方案：gpt-image-1 理论上可生成更自然的穿着效果，需 Key 实测后给出结论
- 质量评估：当前为人工目检（实验室保存输出图），未做自动指标（SSIM/LPIPS 建议 Phase 6B）

## 5. 平均耗时

10 组基准 × 2 个本地方案（线上环境实测）：

| Provider | 平均耗时 |
|---|---|
| local-layer | 934ms |
| hybrid-mask | 720ms |
| openai-image-edit | 待 Key 实测（预计 5–20s） |

首次使用需下载 WASM/模型（姿势 ~5.7MB，分割 ~16MB），之后离线可用。

## 6. 成功率

10 组基准：local-layer 10/10（100%），hybrid-mask 10/10（100%），无失败、无控制台报错。

失败模式集中在姿势检测：早期样例（侧身/持物/画面裁切）导致“身体有部分没拍全”而失败，已更换为正面标准站姿样例后全部通过。真实场景中，坐姿、手插口袋、四肢出画等姿势会降低成功率。

## 7. 单次成本

| Provider | 估算成本 |
|---|---|
| local-layer | $0 |
| hybrid-mask | $0 |
| openai-image-edit | ~$0.06/次（gpt-image-1 1024 档估算） |

成本记录已随每次测试存入本地 IndexedDB（vtonTests），可在实验室导出 JSON。

## 8. 失败案例

- 样例 person-2/person-3（持钓鱼竿、树丛遮挡、姿态略偏）：姿势检测失败 → 方案 A/B 均无法合成（已更换样例）
- 经典历史肖像（LCCN 系列多数）：脚部/手部常被画面裁切或裙摆遮挡，检测失败
- 云端方案未实测：本机到 api.openai.com 连接不稳定（多次超时），浏览器直连 CORS 行为未能确认

## 9. 适合的服装类别

- top：已验证，效果好
- outerwear：区域与 top 重叠（肩→髋），预计可行
- dress：区域为肩→膝，姿势锚点可覆盖，预计可行（未验证）
- bottom：区域为腰→踝，平面合成可接受（未验证）

## 10. 不适合的服装类别

- shoes / bag / accessory：2D 平面合成观感差，需生成式模型或专用方案
- 复杂发型、头饰、眼镜：涉及头部/面部，风险高
- 透视姿势（大幅侧身/弯腰）：锚点与合成都会失效

## 11. 推荐方案

分档组合（不锁死单一供应商）：

1. **本地方案（免费/隐私/离线）**：local-layer + hybrid-mask 适合“快速预览”与无网环境，建议保留
2. **云端生成式方案**：gpt-image-1 编辑（已接好）与 Replicate IDM-VTON（接口预留，需公开图片 URL）二选一实测后定；推荐在 Phase 6B 通过 Cloudflare Worker 代理调用，解决 CORS 与跨境网络问题
3. 生产路径：检测用 gpt-4o-mini（结构化输出）或本地 MediaPipe；分割用 MediaPipe clothes 蒙版（已可用）；VTON 结果一律人工确认后入库

## 12. 下一阶段建议（Phase 6B）

- Cloudflare Worker 代理 + 密钥管理（避免浏览器直连与密钥暴露）
- 接入 Replicate IDM-VTON（需支持公开图片 URL 或对象存储上传）与 gpt-image-1 实测对比
- 类别扩展：outerwear → bottom → dress，逐步验证
- 自动质量评估：SSIM / LPIPS / 人工评分表，形成可复现报告
- 生成结果缓存与去重，控制成本
- VTON 结果与 Standard Person Canvas / Anchor 体系的衔接（换装间展示生成图）
