import type { BoundingBox, DetectedGarment, ExtractedGarment } from "@/lib/types";
import { getActiveGarmentProvider } from "@/lib/ai/provider";
import { cropToDataUrl, type ImageSource } from "@/lib/ai/backgroundRemoval";

/** 提取单件衣物的透明素材 */
export async function extractGarment(
  image: Blob,
  garment: DetectedGarment,
): Promise<ExtractedGarment> {
  return getActiveGarmentProvider().extractGarment(image, garment);
}

/** 裁出检测框原图（用于识别结果预览） */
export function cropPreview(image: ImageSource, bbox: BoundingBox, maxSize = 240): string {
  return cropToDataUrl(image, bbox, maxSize);
}

export type { ExtractedGarment, DetectedGarment };
