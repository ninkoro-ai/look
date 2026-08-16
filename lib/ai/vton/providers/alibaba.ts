import type { VTONInput, VTONResult, VTONTask, VirtualTryOnProvider } from "@/lib/ai/vton/contract";
import { DashScopeTempUploader } from "@/lib/ai/vton/uploader";

export const DASHSCOPE_PRICE_CNY = 0.2;
const CNY_PER_USD = 7.2;
export const DASHSCOPE_COST_USD = Math.round((DASHSCOPE_PRICE_CNY / CNY_PER_USD) * 1000) / 1000;

interface ServerError {
  errorCode?: string;
  errorMessage?: string;
}

interface ServerTaskResult {
  taskId: string;
  status?: string;
}

interface ServerStatus {
  status?: "succeeded" | "failed" | "processing";
  imageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 阿里云百炼 AI试衣（aitryon）Provider（Phase 6B.1）。
 * - 实现统一 VirtualTryOnProvider 契约，调用方式不变（createTryOn / getTaskStatus / estimateCost）。
 * - 输入可为 dataURL / 公网 URL；本地素材先经 ImageAssetUploader 上传为临时公网 URL。
 * - API Key 只在服务端（/api/vton/* 代理），浏览器不接触。
 */
export class AlibabaAITryOnProvider implements VirtualTryOnProvider {
  id = "alibaba-vton";
  name = "阿里云百炼 AI试衣（aitryon）";
  isCloud = true;
  requiresServerKey = true;

  private uploader = new DashScopeTempUploader();

  estimateCost(): number {
    return DASHSCOPE_COST_USD;
  }

  async createTryOn(input: VTONInput): Promise<VTONTask> {
    try {
      // 1. 本地图片 → 临时公网 URL（上传适配层）
      const [personUrl, garmentUrl] = await Promise.all([
        this.uploader.upload(input.personImage, "person"),
        this.uploader.upload(input.garmentImage, "garment"),
      ]);
      // 2. 用公网 URL 创建异步任务
      const resp = await fetch("/api/vton/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageUrl: personUrl.url,
          garmentImageUrl: garmentUrl.url,
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
            estimatedCostUsd: DASHSCOPE_COST_USD,
            metadata: { billed: true, priceCny: DASHSCOPE_PRICE_CNY },
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
