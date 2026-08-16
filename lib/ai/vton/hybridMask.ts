import { detectPersonBody } from "@/lib/pose";
import { getSegmenter } from "@/lib/ai/segmentation";
import { loadImageFromBlob } from "@/lib/ai/vton/helpers";
import type { VirtualTryOnProvider, VirtualTryOnRequest, VirtualTryOnResult } from "@/lib/ai/vton/types";

/**
 * 方案 B：人像分割蒙版合成 ——
 * 用 MediaPipe 分割出原图「衣服」区域并擦除上身衣物，
 * 再按姿势锚点叠加目标上衣，保留肤色与背景。
 */
export class HybridMaskVTONProvider implements VirtualTryOnProvider {
  id = "hybrid-mask";
  label = "人像分割蒙版合成（MediaPipe）";

  async tryOn(req: VirtualTryOnRequest): Promise<VirtualTryOnResult> {
    const start = performance.now();
    try {
      const person = await loadImageFromBlob(req.personImage);
      const garment = await loadImageFromBlob(req.garmentImage);
      const body = await detectPersonBody(person);
      if (!body) throw new Error("未检测到完整人体，请上传正面全身照");

      const segmenter = await getSegmenter();
      const result = segmenter.segment(person);
      const mask = result.categoryMask;
      if (!mask) throw new Error("分割蒙版生成失败");

      const iw = person.naturalWidth;
      const ih = person.naturalHeight;
      const scale = Math.min(1, 700 / iw);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(iw * scale));
      canvas.height = Math.max(1, Math.round(ih * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("浏览器不支持画布");

      // 全图衣服蒙版（white=clothes）
      const mw = mask.width;
      const mh = mask.height;
      const maskData = mask.getAsUint8Array();
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = mw;
      maskCanvas.height = mh;
      const mctx = maskCanvas.getContext("2d");
      if (!mctx) throw new Error("浏览器不支持画布");
      const img = mctx.createImageData(mw, mh);
      for (let i = 0; i < mw * mh; i++) {
        const p = i * 4;
        img.data[p] = 255;
        img.data[p + 1] = 255;
        img.data[p + 2] = 255;
        img.data[p + 3] = maskData[i] === 4 ? 255 : 0;
      }
      mctx.putImageData(img, 0, 0);

      // 上身区域（肩→髋）
      const torsoTop = (body.shoulderY - (body.hipY - body.shoulderY) * 0.12) * ih;
      const torsoBottom = (body.hipY + (body.hipY - body.shoulderY) * 0.06) * ih;
      const torsoW = body.shoulderWidth * iw * 1.45;
      const torsoX = (iw - torsoW) / 2;

      ctx.drawImage(person, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
      // 只保留上身矩形内的擦除
      const eraseCanvas = document.createElement("canvas");
      eraseCanvas.width = canvas.width;
      eraseCanvas.height = canvas.height;
      const ectx = eraseCanvas.getContext("2d");
      if (!ectx) throw new Error("浏览器不支持画布");
      ectx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
      ectx.globalCompositeOperation = "destination-in";
      ectx.fillRect(
        (torsoX / iw) * canvas.width,
        (torsoTop / ih) * canvas.height,
        (torsoW / iw) * canvas.width,
        ((torsoBottom - torsoTop) / ih) * canvas.height,
      );
      ctx.drawImage(eraseCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      // 叠加目标上衣
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
