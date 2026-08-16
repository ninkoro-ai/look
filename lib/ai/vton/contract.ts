import type { VirtualTryOnProvider as LegacyVirtualTryOnProvider } from "@/lib/ai/vton/types";

/** 统一 VTON 类别（Phase 6B 仅验证 top/outerwear/dress，bottom 预留） */
export type VTONCategory = "top" | "outerwear" | "bottom" | "dress";

/** 统一错误码（Benchmark 统计口径） */
export type VTONErrorCode =
  | "TIMEOUT"
  | "AUTH_ERROR"
  | "INVALID_INPUT"
  | "RATE_LIMIT"
  | "PROVIDER_ERROR"
  | "IMAGE_ERROR"
  | "UNKNOWN";

/** 统一输入：图片统一使用字符串（dataURL / URL），方便跨 Provider 复用同一份输入 */
export interface VTONInput {
  personImage: string;
  garmentImage: string;
  garmentCategory: VTONCategory;
  personPose?: string;
  metadata?: {
    benchmarkId?: string;
    caseId?: string;
    caseLabel?: string;
    userId?: string;
  };
}

export type VTONTaskStatus = "pending" | "processing" | "succeeded" | "failed";

export interface VTONTask {
  taskId: string;
  provider: string;
  status: VTONTaskStatus;
  result?: VTONResult;
}

/** 统一输出（与 Phase 6B 报告口径一致） */
export interface VTONResult {
  success: boolean;
  imageUrl?: string;
  provider: string;
  latencyMs: number;
  estimatedCostUsd?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 6B 统一 Provider 契约。
 * 旧 Provider（Phase 6A 的 tryOn(Blob) 接口）通过 adaptLegacyProvider 包装，不重写核心逻辑。
 */
export interface VirtualTryOnProvider {
  id: string;
  name: string;
  /** 是否云端 Provider（Benchmark 会提示成本） */
  isCloud?: boolean;
  /** 是否需要服务端 API Key（不经过前端） */
  requiresServerKey?: boolean;

  createTryOn(input: VTONInput): Promise<VTONTask>;

  getTaskStatus?(taskId: string): Promise<VTONTask>;

  estimateCost?(input: VTONInput): number;
}

function toErrorCode(message: string): VTONErrorCode {
  const m = message.toLowerCase();
  if (m.includes("timeout") || m.includes("超时")) return "TIMEOUT";
  if (m.includes("key") || m.includes("auth") || m.includes("鉴权") || m.includes("密钥")) return "AUTH_ERROR";
  if (m.includes("rate") || m.includes("限流") || m.includes("throttl")) return "RATE_LIMIT";
  if (m.includes("image") || m.includes("图片") || m.includes("person") || m.includes("garment")) return "IMAGE_ERROR";
  if (m.includes("invalid") || m.includes("参数")) return "INVALID_INPUT";
  return "UNKNOWN";
}

function blobFromDataUrl(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

/**
 * 把 Phase 6A 旧接口 Provider 包装为统一契约（最小兼容，不修改旧文件）。
 */
export function adaptLegacyProvider(legacy: LegacyVirtualTryOnProvider): VirtualTryOnProvider {
  return {
    id: legacy.id,
    name: legacy.label,
    createTryOn: async (input: VTONInput): Promise<VTONTask> => {
      const taskId = `${legacy.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const personBlob = await blobFromDataUrl(input.personImage);
        const garmentBlob = await blobFromDataUrl(input.garmentImage);
        const res = await legacy.tryOn({
          personImage: personBlob,
          garmentImage: garmentBlob,
          category: input.garmentCategory,
        });
        return {
          taskId,
          provider: legacy.id,
          status: res.success ? "succeeded" : "failed",
          result: {
            success: res.success,
            imageUrl: res.imageUrl || undefined,
            provider: legacy.id,
            latencyMs: res.latencyMs,
            estimatedCostUsd: res.estimatedCost,
            errorCode: res.success ? undefined : toErrorCode(res.error ?? ""),
            errorMessage: res.error,
          },
        };
      } catch (e) {
        return {
          taskId,
          provider: legacy.id,
          status: "failed",
          result: {
            success: false,
            provider: legacy.id,
            latencyMs: 0,
            estimatedCostUsd: 0,
            errorCode: "UNKNOWN",
            errorMessage: e instanceof Error ? e.message : "生成失败",
          },
        };
      }
    },
    estimateCost: () => 0,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 统一执行入口：创建任务并（如为异步云端任务）轮询至完成。
 * 返回统一 VTONResult，latencyMs 为从创建到完成的完整耗时。
 */
export async function runVTONToCompletion(
  provider: VirtualTryOnProvider,
  input: VTONInput,
  opts?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<VTONResult> {
  const start = performance.now();
  let task: VTONTask;
  try {
    task = await provider.createTryOn(input);
  } catch (e) {
    return {
      success: false,
      provider: provider.id,
      latencyMs: performance.now() - start,
      estimatedCostUsd: 0,
      errorCode: "UNKNOWN",
      errorMessage: e instanceof Error ? e.message : "创建任务失败",
    };
  }

  if (task.status === "succeeded" && task.result) {
    return { ...task.result, latencyMs: performance.now() - start };
  }
  if (task.status === "failed" && task.result) {
    return { ...task.result, latencyMs: performance.now() - start };
  }
  if (!provider.getTaskStatus) {
    return {
      success: false,
      provider: provider.id,
      latencyMs: performance.now() - start,
      estimatedCostUsd: 0,
      errorCode: "PROVIDER_ERROR",
      errorMessage: "Provider 不支持异步任务轮询",
    };
  }

  const deadline = start + (opts?.timeoutMs ?? 180_000);
  while (performance.now() < deadline) {
    await sleep(opts?.pollIntervalMs ?? 3000);
    try {
      task = await provider.getTaskStatus(task.taskId);
    } catch (e) {
      return {
        success: false,
        provider: provider.id,
        latencyMs: performance.now() - start,
        estimatedCostUsd: 0,
        errorCode: "UNKNOWN",
        errorMessage: e instanceof Error ? e.message : "轮询任务失败",
      };
    }
    if (task.status === "succeeded" || task.status === "failed") break;
  }

  const latencyMs = performance.now() - start;
  if (task.status === "succeeded" && task.result) {
    return { ...task.result, latencyMs };
  }
  if (task.status === "failed" && task.result) {
    return { ...task.result, latencyMs };
  }
  return {
    success: false,
    provider: provider.id,
    latencyMs,
    estimatedCostUsd: 0,
    errorCode: "TIMEOUT",
    errorMessage: `任务在 ${Math.round((opts?.timeoutMs ?? 180_000) / 1000)}s 内未完成`,
  };
}
