import { uid } from "@/lib/format";
import { extractClothesRegion } from "@/lib/ai/segmentation";
import { suggestAnchor } from "@/lib/ai/garmentNormalizer";
import { getApiKey } from "@/lib/ai/config";
import type { GarmentAIProvider } from "@/lib/ai/garmentDetection";
import type { Category, DetectedGarment, ExtractedGarment } from "@/lib/types";

const DETECT_PROMPT = `你是一个服装检测助手。请识别图片中人物的服装单品，输出 JSON：
{"garments":[{"category":"top|outerwear|bottom|dress|shoes|bag|accessory","name":"简短中文名","confidence":0-1,"box":{"x":0-1,"y":0-1,"width":0-1,"height":0-1},"color":["中文颜色词"],"style":["casual|elegant|sporty|soft|office"],"season":["spring|summer|autumn|winter"]}]}
box 使用 0-1 归一化坐标（相对原图宽高）。只识别明确可见的服装单品，最多 8 件，box 必须准确覆盖对应衣物。`;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 真实 AI Garment Provider：
 * - 检测：OpenAI 视觉模型（结构化 JSON 输出 category/name/confidence/bbox/color/attributes）
 * - 分割：本地 MediaPipe 人像多类别分割 → clothes 蒙版 → crop/mask/透明资产
 * 需要 NEXT_PUBLIC_OPENAI_API_KEY 或实验室里填入的 Key，否则请使用 Mock。
 */
export class RealGarmentAIProvider implements GarmentAIProvider {
  async detectGarments(image: Blob): Promise<DetectedGarment[]> {
    const key = getApiKey("openai");
    if (!key) throw new Error("RealGarmentAIProvider 需要 OpenAI API Key");
    const dataUrl = await blobToDataUrl(image);
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: DETECT_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenAI 检测失败 (${resp.status}): ${text.slice(0, 200)}`);
    }
    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      garments?: Array<{
        category?: string;
        name?: string;
        confidence?: number;
        box?: { x: number; y: number; width: number; height: number };
        color?: string[];
        style?: string[];
        season?: string[];
      }>;
    };
    const bitmap = await createImageBitmap(image);
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();

    const CATS: Category[] = ["top", "outerwear", "bottom", "dress", "shoes", "bag", "accessory"];
    return (parsed.garments ?? [])
      .filter((g) => g.box && g.category && CATS.includes(g.category as Category))
      .map((g) => ({
        id: uid(),
        category: g.category as Category,
        name: g.name ?? "未命名",
        confidence: Math.min(1, Math.max(0, g.confidence ?? 0.5)),
        boundingBox: {
          x: Math.round(g.box!.x * w),
          y: Math.round(g.box!.y * h),
          width: Math.round(g.box!.width * w),
          height: Math.round(g.box!.height * h),
        },
        attributes: {
          color: g.color,
          style: g.style,
          season: g.season,
        },
      }));
  }

  async extractGarment(image: Blob, garment: DetectedGarment): Promise<ExtractedGarment> {
    const bitmap = await createImageBitmap(image);
    try {
      const result = await extractClothesRegion(bitmap, garment.boundingBox);
      return {
        detected: garment,
        originalCropUrl: result.cropUrl,
        transparentImageUrl: result.transparentUrl,
        maskUrl: result.maskUrl,
        suggestedAnchor: suggestAnchor(garment.category, garment.boundingBox),
      };
    } finally {
      bitmap.close();
    }
  }
}
