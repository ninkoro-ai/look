import { detectPersonBody } from "@/lib/pose";
import { loadImageFromBlob } from "@/lib/ai/vton/helpers";
import type { VirtualTryOnProvider, VirtualTryOnRequest, VirtualTryOnResult } from "@/lib/ai/vton/types";

/** 方案 A：本地图层拼接 —— 按姿势锚点把透明衣物贴到人像上 */
export class LocalLayerVTONProvider implements VirtualTryOnProvider {
  id = "local-layer";
  label = "本地图层拼接（姿势锚点）";

  async tryOn(req: VirtualTryOnRequest): Promise<VirtualTryOnResult> {
    const start = performance.now();
    try {
      const person = await loadImageFromBlob(req.personImage);
      const garment = await loadImageFromBlob(req.garmentImage);
      const body = await detectPersonBody(person);
      if (!body) throw new Error("未检测到完整人体，请上传正面全身照");

      const scale = Math.min(1, 700 / person.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(person.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(person.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("浏览器不支持画布");
      ctx.drawImage(person, 0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;
      const shoulderY = body.shoulderY * H;
      const hipY = body.hipY * H;
      const shoulderW = body.shoulderWidth * W;
      const top = shoulderY - (hipY - shoulderY) * 0.12;
      const height = (hipY - shoulderY) * 1.08;
      const width = shoulderW * 1.72;
      ctx.drawImage(garment, W / 2 - width / 2, top, width, height);

      return {
        imageUrl: canvas.toDataURL("image/png"),
        provider: this.id,
        latencyMs: performance.now() - start,
        estimatedCost: 0,
        success: true,
      };
    } catch (e) {
      return {
        imageUrl: "",
        provider: this.id,
        latencyMs: performance.now() - start,
        estimatedCost: 0,
        success: false,
        error: e instanceof Error ? e.message : "生成失败",
      };
    }
  }
}
