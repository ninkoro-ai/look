import { getApiKey } from "@/lib/ai/config";
import { canvasToBlob, loadImageFromBlob } from "@/lib/ai/vton/helpers";
import type { VirtualTryOnProvider, VirtualTryOnRequest, VirtualTryOnResult } from "@/lib/ai/vton/types";

/**
 * 方案 C：OpenAI gpt-image-1 图像编辑 ——
 * 人像 + 衣物参考小图拼版后，提示词要求只替换上衣。
 * 需要 OpenAI API Key；浏览器直连受 CORS 限制时可用 CLI 运行。
 */
export class OpenAIEditVTONProvider implements VirtualTryOnProvider {
  id = "openai-image-edit";
  label = "OpenAI gpt-image-1 图像编辑";
  needsKey = "openai" as const;

  async tryOn(req: VirtualTryOnRequest): Promise<VirtualTryOnResult> {
    const start = performance.now();
    try {
      const key = getApiKey("openai");
      if (!key) throw new Error("缺少 OpenAI API Key");
      const person = await loadImageFromBlob(req.personImage);
      const garment = await loadImageFromBlob(req.garmentImage);

      const scale = Math.min(1, 1024 / person.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(person.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(person.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("浏览器不支持画布");
      ctx.drawImage(person, 0, 0, canvas.width, canvas.height);

      const insetW = Math.round(canvas.width * 0.28);
      const insetH = Math.round((garment.naturalHeight / garment.naturalWidth) * insetW);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(canvas.width - insetW - 12, canvas.height - insetH - 12, insetW, insetH);
      ctx.drawImage(
        garment,
        canvas.width - insetW - 12,
        canvas.height - insetH - 12,
        insetW,
        insetH,
      );

      const blob = await canvasToBlob(canvas);
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image", blob, "input.png");
      form.append(
        "prompt",
        "Keep the person, pose, face, hair and background exactly the same. Replace ONLY the top garment worn by the person with the garment shown in the white inset image at the bottom right, matching its color, pattern, texture and fit naturally.",
      );
      form.append("size", "auto");

      const resp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`OpenAI 图像编辑失败 (${resp.status}): ${text.slice(0, 160)}`);
      }
      const json = (await resp.json()) as { data?: Array<{ b64_json?: string }> };
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI 未返回图片");
      return {
        imageUrl: `data:image/png;base64,${b64}`,
        provider: this.id,
        latencyMs: performance.now() - start,
        estimatedCost: 0.06,
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
