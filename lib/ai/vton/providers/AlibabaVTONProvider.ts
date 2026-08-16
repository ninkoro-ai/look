import type { VTONInput, VTONResult, VTONTask, VirtualTryOnProvider } from "@/lib/ai/vton/contract";

const DASHSCOPE_PRICE_CNY = 0.2;
const CNY_PER_USD = 7.2;
const COST_USD = Math.round((DASHSCOPE_PRICE_CNY / CNY_PER_USD) * 1000) / 1000;

interface ServerTaskResult {
  taskId: string;
}

interface ServerError {
  errorCode?: string;
  errorMessage?: string;
}

interface ServerStatus {
  status?: "succeeded" | "failed" | "processing";
  imageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 阿里云百炼 AI试衣（aitryon）Provider。
 * - 浏览器只调用同源服务端代理 /api/vton/*，API Key 永不进入前端。
 * - 服务端默认关闭；需 DASHSCOPE_API_KEY + VTON_ALLOW_ALIBABA=true 才可用。
 * - 图片在上传前本地压缩（≤1024px，JPEG/PNG），满足 5KB~5MB、150~4096px 限制。
 */
export class AlibabaVTONProvider implements VirtualTryOnProvider {
  id = "alibaba-vton";
  name = "阿里云百炼 AI试衣（aitryon）";
  isCloud = true;
  requiresServerKey = true;

  estimateCost(): number {
    return COST_USD;
  }

  async createTryOn(input: VTONInput): Promise<VTONTask> {
    try {
      const personImage = await normalizeImageForUpload(input.personImage, 1024, "jpeg");
      const garmentImage = await normalizeImageForUpload(input.garmentImage, 1024, "png");
      const resp = await fetch("/api/vton/alibaba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImage,
          garmentImage,
          garmentCategory: input.garmentCategory,
          benchmarkId: input.metadata?.benchmarkId,
        }),
      });
      const data = (await resp.json()) as ServerTaskResult & ServerError;
      if (!resp.ok || data.errorCode || !data.taskId) {
        return failedTask(this.id, data.errorCode ?? "PROVIDER_ERROR", data.errorMessage ?? `服务端代理错误（HTTP ${resp.status}）`);
      }
      return { taskId: data.taskId, provider: this.id, status: "pending" };
    } catch (e) {
      return failedTask(this.id, "UNKNOWN", e instanceof Error ? e.message : "创建任务失败");
    }
  }

  async getTaskStatus(taskId: string): Promise<VTONTask> {
    try {
      const resp = await fetch(`/api/vton/status?taskId=${encodeURIComponent(taskId)}`);
      const data = (await resp.json()) as ServerStatus & ServerError;
      if (!resp.ok || data.errorCode) {
        return {
          taskId,
          provider: this.id,
          status: "failed",
          result: failedResult(this.id, data.errorCode ?? "PROVIDER_ERROR", data.errorMessage ?? `状态查询失败（HTTP ${resp.status}）`),
        };
      }
      if (data.status === "succeeded") {
        return {
          taskId,
          provider: this.id,
          status: "succeeded",
          result: {
            success: true,
            imageUrl: data.imageUrl,
            provider: this.id,
            latencyMs: 0,
            estimatedCostUsd: COST_USD,
            metadata: { billed: true },
          },
        };
      }
      if (data.status === "failed") {
        return {
          taskId,
          provider: this.id,
          status: "failed",
          result: failedResult(this.id, data.errorCode ?? "PROVIDER_ERROR", data.errorMessage ?? "阿里云任务失败"),
        };
      }
      return { taskId, provider: this.id, status: "processing" };
    } catch (e) {
      return {
        taskId,
        provider: this.id,
        status: "failed",
        result: failedResult(this.id, "UNKNOWN", e instanceof Error ? e.message : "状态查询失败"),
      };
    }
  }
}

function failedTask(provider: string, errorCode: string, errorMessage: string): VTONTask {
  return {
    taskId: `${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    provider,
    status: "failed",
    result: failedResult(provider, errorCode, errorMessage),
  };
}

function failedResult(provider: string, errorCode: string, errorMessage: string): VTONResult {
  return {
    success: false,
    provider,
    latencyMs: 0,
    estimatedCostUsd: 0,
    errorCode,
    errorMessage,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

/**
 * 上传前规范化：
 * - SVG 素材转成 PNG（白底，保证非透明背景，符合“背景简洁”要求）
 * - 位图超过 maxSize 则等比缩小；输出 jpeg/png dataURL
 * - 最终大小目标落在 5KB~5MB（服务端还会二次校验）
 */
async function normalizeImageForUpload(
  src: string,
  maxSize: number,
  format: "jpeg" | "png",
): Promise<string> {
  const isSvg = src.startsWith("data:image/svg") || /\.svg($|\?)/.test(src);
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");
  if (isSvg || format === "png") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const mime = format === "png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(mime, 0.92);
}
