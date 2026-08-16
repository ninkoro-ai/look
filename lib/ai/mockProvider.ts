import { uid } from "@/lib/format";
import { DEMO_ITEMS } from "@/lib/seed";
import type { DetectedGarment, ExtractedGarment, Category } from "@/lib/types";
import { removeBackground, cropToDataUrl } from "@/lib/ai/backgroundRemoval";
import { suggestAnchor } from "@/lib/ai/garmentNormalizer";
import type { GarmentAIProvider } from "@/lib/ai/garmentDetection";

const FIXED_DETECTIONS: Array<{
  category: Category;
  name: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  color: string[];
  style: string[];
  season: string[];
}> = [
  {
    category: "outerwear",
    name: "牛仔外套",
    confidence: 0.97,
    box: { x: 0.3, y: 0.14, width: 0.4, height: 0.36 },
    color: ["blue"],
    style: ["casual"],
    season: ["spring", "autumn"],
  },
  {
    category: "top",
    name: "白色 T 恤",
    confidence: 0.95,
    box: { x: 0.36, y: 0.24, width: 0.28, height: 0.24 },
    color: ["white"],
    style: ["casual", "loose"],
    season: ["summer", "spring"],
  },
  {
    category: "bottom",
    name: "黑色阔腿裤",
    confidence: 0.96,
    box: { x: 0.38, y: 0.48, width: 0.24, height: 0.32 },
    color: ["black"],
    style: ["loose", "elegant"],
    season: ["all"],
  },
  {
    category: "shoes",
    name: "小白鞋",
    confidence: 0.94,
    box: { x: 0.36, y: 0.8, width: 0.28, height: 0.13 },
    color: ["white"],
    style: ["casual", "sporty"],
    season: ["all"],
  },
  {
    category: "bag",
    name: "黑色单肩包",
    confidence: 0.91,
    box: { x: 0.62, y: 0.38, width: 0.18, height: 0.24 },
    color: ["black"],
    style: ["elegant", "casual"],
    season: ["all"],
  },
];

function demoAssetFor(category: Category): string {
  const item = DEMO_ITEMS.find((i) => i.category === category);
  return (item?.transparentImageUrl ?? item?.imageUrl) ?? "";
}

/**
 * Mock AI Provider：在没有真实 AI API 时，
 * 返回固定 5 件检测结果；透明素材优先用本地抠图，
 * 背景复杂时回退为演示 SVG 素材，保证流程可完整跑通。
 */
export class MockGarmentAIProvider implements GarmentAIProvider {
  async detectGarments(image: Blob): Promise<DetectedGarment[]> {
    const bitmap = await createImageBitmap(image);
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();
    return FIXED_DETECTIONS.map((f) => ({
      id: uid(),
      category: f.category,
      name: f.name,
      confidence: f.confidence,
      boundingBox: {
        x: Math.round(f.box.x * w),
        y: Math.round(f.box.y * h),
        width: Math.round(f.box.width * w),
        height: Math.round(f.box.height * h),
      },
      attributes: { color: f.color, style: f.style, season: f.season },
    }));
  }

  async extractGarment(image: Blob, garment: DetectedGarment): Promise<ExtractedGarment> {
    const bitmap = await createImageBitmap(image);
    try {
      const originalCropUrl = cropToDataUrl(bitmap, garment.boundingBox, 420);
      const removal = removeBackground(bitmap, garment.boundingBox);
      const usable = removal.foregroundRatio > 0.06 && removal.foregroundRatio < 0.94;
      return {
        detected: garment,
        originalCropUrl,
        transparentImageUrl: usable ? removal.transparentUrl : demoAssetFor(garment.category),
        maskUrl: usable ? removal.transparentUrl : undefined,
        suggestedAnchor: suggestAnchor(garment.category, garment.boundingBox),
      };
    } finally {
      bitmap.close();
    }
  }
}
