# Phase 6B.1 — Alibaba DashScope AITryOn Integration

## 1. 接入方式

保持现有 VTON 抽象层与调用方式不变（`createTryOn / getTaskStatus / estimateCost`），新增：

| 组件 | 位置 | 说明 |
| --- | --- | --- |
| `AlibabaAITryOnProvider` | `lib/ai/vton/providers/alibaba.ts` | 实现统一契约；本地素材经上传层转公网 URL 后创建任务 |
| `ImageAssetUploader` | `lib/ai/vton/uploader.ts` | 本地图片 → 临时公网 URL（压缩/格式规范化 + 上传） |
| 服务端上传端点 | `functions/api/vton/upload.ts` | getPolicy + OSS 上传 → `oss://` URL（48h） |
| 服务端建任务端点 | `functions/api/vton/tryon.ts` | 用公网 URL 创建 aitryon 异步任务 |
| 状态轮询端点 | `functions/api/vton/status.ts` | 轮询任务并把结果转 dataURL 返回 |
| 实验台 | `/lab/vton/alibaba` | 上传人物/衣物 → Generate → task_id/状态/耗时/成本 |

兼容：旧类名 `AlibabaVTONProvider` 保留为别名；`/lab/vton` 原阿里云选项不受影响；Local Layer / Local Segmentation / Mock / OpenAI Provider 零改动。

## 2. API 调用流程

```
浏览器（本地图片）
  ↓ 压缩/规范化（SVG→PNG、≤1024px）
  ↓ POST /api/vton/upload（服务端 getPolicy → OSS 上传 → oss:// 临时 URL，48h）
  ↓
POST /api/vton/tryon（model=aitryon，person_image_url + top_garment_url）
  ↓ 返回 task_id（异步，X-DashScope-Async: enable）
  ↓
GET /api/vton/status?taskId=...（3 秒轮询）
  ↓ PENDING / RUNNING / SUCCEEDED / FAILED
  ↓ SUCCEEDED：服务端下载 image_url → dataURL 返回浏览器（结果 24h 过期，及时取回）
```

- 输入必须为公网 URL：本阶段通过 DashScope 临时存储（48h）满足，生产建议改用自有 OSS；
- 图片要求：5KB~5MB、150~4096px、JPG/PNG/BMP/HEIC；人物图需全身正面单人，服饰图建议白底平铺；
- 失败兜底已内置：AUTH_ERROR / IMAGE_ERROR / TIMEOUT / RATE_LIMIT / PROVIDER_ERROR 统一错误码。

## 3. 成功率

| 状态 | 结果 |
| --- | --- |
| 真实调用 | 未实测（缺少 `DASHSCOPE_API_KEY` + 20 组真实图片） |
| 代理链路 | ✅ 本机 wrangler 验证：upload/tryon/status/health 全部编译运行，无 Key 时安全返回 AUTH_ERROR |
| 官方口径 | 失败不收费；免费额度 400 张/90 天 |

## 4. 平均耗时

| 阶段 | 预期 |
| --- | ---: |
| 官方任务耗时（文档口径） | 15–30 秒 |
| 上传 + 建任务 | 1–3 秒 |
| 客户端轮询间隔 | 3 秒 |
| 实测 | 待 Key 后补充 |

## 5. 成本

| 项 | 值 |
| --- | ---: |
| 单价 | ¥0.20/张（≈ $0.028/张） |
| 计费规则 | 仅成功计费 |
| 免费额度 | 400 张 / 90 天 |
| 20 组 Benchmark 全量成本 | ≈ ¥4（$0.56） |

## 6. 图片质量

未实测（待真实图片）。已固化的输入规范：

- 人物图：全身、正面、光线正常、单人、手部完整；
- 衣服图：白底平铺/挂拍、单一主体、无遮挡、占比大；
- 复杂场景（镜子自拍/遮挡/复杂背景/光线不足）已在 20 组基准中列为专项（ab17–ab20）。

⚠️ 演示 SVG 素材为矢量插画，不代表真实平铺照效果；真实质量分需人工在实验台逐条填写（1~5）。

## 7. 与 Local 方案比较

| 维度 | Local Layer / Local Segmentation | Alibaba aitryon |
| --- | --- | --- |
| 延迟 | 0.3–1.3s | 15–30s |
| 成本 | ¥0 | ¥0.2/张 |
| 隐私 | 100% 本地 | 图片上传云端（临时 48h） |
| 真实感 | 贴图感强 | 生成式融合，真实度高 |
| 网络 | 离线可用 | 需国内网络（实测直连可达） |
| 定位 | 高频免费换装 | 低频高价值“AI 真实试穿” |

## 8. 是否推荐 Beta 开放

**推荐的产品策略：**

```
普通用户 → Local Layer / Local Segmentation（免费，即时）
    ↓ 点击「AI 真实试穿」（高级体验按钮）
Alibaba aitryon（按次消耗额度，¥0.2/张）
```

**结论：架构上推荐，暂缓开放。** 前置条件：
1. 提供 `DASHSCOPE_API_KEY`（北京地域）并在 Cloudflare Pages 配置 Secret + `VTON_ALLOW_ALIBABA=true`；
2. 放入 20 组真实图片（`public/bench-assets/alibaba/`：person-01..08.jpg + garment-01..20.jpg，三类场景齐全）；
3. 在 `/lab/vton/alibaba` 跑完 20 组真实基准、完成人工质量评分后，再决定 Beta 是否开放“AI真实试穿”。

在真实数据出来前，保持云端 VTON 默认关闭（仅实验台可用），不让普通用户产生云端消耗。

---

## 附：安全清单

- ✅ API Key 仅服务端环境变量（从未进入前端、Git、日志、JSON）
- ✅ 用户图片不持久化：临时存储 48h，结果即取即回
- ✅ 云端默认关闭：`VTON_ALLOW_ALIBABA=true` + Key 双条件
- ✅ 回归：qa 17/17 · qa-lab 13/13 · qa-wardrobe 11/11 · qa-import 10/10 · qa-model 10/10 · qa-beta 16/16 · qa-alibaba 8/8 全过
