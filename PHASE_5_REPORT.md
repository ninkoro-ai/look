# PHASE 5 报告：AI 衣物资产化

## 1. 已完成

- 新增独立 AI Service Layer：`lib/ai/`（garmentDetection / garmentExtraction / backgroundRemoval / garmentNormalizer / provider / mockProvider）
- Provider 无关设计：业务层只调用 `detectGarments()` / `extractGarment()`，不感知具体 AI 服务
- `DetectedGarment` / `ExtractedGarment` 类型（含 boundingBox、confidence、attributes、originalCropUrl、transparentImageUrl、suggestedAnchor）
- 新增 `/import` 页面：上传穿搭照 → AI 识别 → 人工确认（删除 / 改名 / 改分类）→ 生成透明素材 → 加入衣橱 → 返回衣橱
- 衣橱页新增「从穿搭照片添加」入口
- 人工确认机制：AI 结果不直接写库，必须用户点击「全部加入衣橱」后才写入 IndexedDB
- `WardrobeItem` 新增 `source`（demo / manual / photo-extraction）、`originalImageUrl`、`maskUrl`、`aiMetadata`，旧数据向后兼容
- 修正 `pose.ts` 命名与注释：`detectAndStandardize` → `standardizeModelPhoto`，明确区分「模特照片」（人像裁切，保留原服装）与「透明衣物素材」（衣物资产）
- Mock 能力：`MockGarmentAIProvider` 返回固定 5 件检测结果；透明素材优先用本地抠图（边框颜色连通域 BFS），背景复杂时回退为演示 SVG 素材
- 自动建议锚点：按检测框宽高比与分类典型比例生成 `suggestedAnchor`
- 验收（本地 + 线上 look.ninkoro.com 均通过，无控制台报错）：
  1. 点击「从穿搭照片添加」 ✓
  2. 上传真实穿搭照片 ✓
  3. 看到 5 个识别单品（发现 5 件单品） ✓
  4. 删除错误识别 ✓
  5. 修改分类 / 名称 ✓
  6. 确认导入 ✓
  7. 每件生成独立透明素材 ✓
  8. 加入衣橱（photo-extraction 来源） ✓
  9. 衣橱可见导入衣物 ✓
  10. 换装间可直接穿戴 ✓
  11. Demo 衣物不受影响 ✓
  12. 刷新后数据保留 ✓

## 2. 未完成

- 真实 AI Provider（云端衣物检测 / 分割 API）未接入
- 真实「衣物级」透明抠图（如 GrabCut / CLIPSeg / 专业抠图服务）未实现：当前本地抠图为边框连通域方案，仅适合背景较干净的照片
- 识别置信度阈值、重复导入去重未实现
- 导入后衣物在换装间的精细位置微调（手动拖拽）未实现（后续阶段）
- 多张照片批量导入未实现

## 3. AI Provider 接口

```ts
interface GarmentAIProvider {
  detectGarments(image: Blob): Promise<DetectedGarment[]>;
  extractGarment(image: Blob, garment: DetectedGarment): Promise<ExtractedGarment>;
}

interface DetectedGarment {
  id: string;
  category: "top" | "outerwear" | "bottom" | "dress" | "shoes" | "bag" | "accessory";
  name: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  attributes?: { color?: string[]; style?: string[]; season?: string[] };
}

interface ExtractedGarment {
  detected: DetectedGarment;
  originalCropUrl: string;
  transparentImageUrl: string;
  maskUrl?: string;
  suggestedAnchor?: Anchor;
}
```

## 4. 当前 Mock 能力

- `MockGarmentAIProvider`（`lib/ai/mockProvider.ts`）对任意输入图片返回固定 5 件检测：牛仔外套 / 白色 T 恤 / 黑色阔腿裤 / 小白鞋 / 黑色单肩包
- 提取流程：按检测框裁出原图 → 本地背景去除（`lib/ai/backgroundRemoval.ts`，边框颜色 BFS + alpha 羽化）→ 前景占比合理时采用真实裁切透明图；否则回退该分类的演示 SVG 素材
- 建议锚点：`lib/ai/garmentNormalizer.ts` 按检测框宽高比与分类典型比例生成
- UI 与业务流程在无任何 AI API 的情况下完整可跑

## 5. 真实 AI Provider 接入位置

- 实现同一 `GarmentAIProvider` 接口（如对接 OpenAI / Gemini / 自建服务的检测与抠图）
- 在 `lib/ai/provider.ts` 的 `setGarmentProvider()` 注入真实 Provider（默认 Mock）
- 业务层与 UI 无需改动；真实 Provider 只需返回真实 `transparentImageUrl` / `maskUrl`

## 6. 已知问题

- 本地抠图对复杂背景效果有限：人物位于树木等复杂背景时，前景占比判定可能失败并回退演示素材
- Mock 检测框是固定比例，未按图片内容精确定位；不同构图（半身 / 特写）下检测框可能偏离实际衣物
- 导入衣物的锚点基于宽高比估算，首次穿戴时可能偏大/偏小，需后续手动微调能力
- `transparentImageUrl` 回退为演示 SVG 时，衣橱里显示的是演示素材而非照片原物（会在真实 Provider 接入后自然解决）
- 背景去除在主线程执行，单件耗时约数百毫秒；5 件批量导入时页面进度提示已覆盖

## 7. Phase 6 建议

- 真人 AI Virtual Try-On（上传照片生成穿着效果）属于 Phase 6，本阶段未实现
- 建议 Phase 6 前先补两块基础能力：
  1. 衣物资产手动微调：在换装间拖动/缩放单件衣物并保存锚点
  2. 真实衣物抠图 Provider：接入可靠的衣物分割服务，解决「真实衣物资产化」的最后一步
- Virtual Try-On 建议评估 on-device（MediaPipe + 生成模型）与云端 API 两条路线后再定
