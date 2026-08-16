import type { DetectedGarment, ExtractedGarment } from "@/lib/types";
import { getActiveGarmentProvider } from "@/lib/ai/provider";

/** AI Provider 统一接口：可替换为任何真实 AI 服务，业务层不感知 */
export interface GarmentAIProvider {
  detectGarments(image: Blob): Promise<DetectedGarment[]>;
  extractGarment(image: Blob, garment: DetectedGarment): Promise<ExtractedGarment>;
}

/** 识别穿搭照片中的服装单品 */
export async function detectGarments(image: Blob): Promise<DetectedGarment[]> {
  return getActiveGarmentProvider().detectGarments(image);
}

export type { DetectedGarment, ExtractedGarment };
