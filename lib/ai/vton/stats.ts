import type { VTONErrorCode } from "@/lib/ai/vton/contract";

export interface VtonBenchmarkRecord {
  id: string;
  createdAt: string;
  caseId?: string;
  caseLabel?: string;
  provider: string;
  category: string;
  latencyMs: number;
  estimatedCost: number;
  success: boolean;
  error?: string;
  errorCode?: string;
  quality?: VtonQualityScore;
  imageWidth?: number;
  imageHeight?: number;
  note?: string;
}

export interface VtonQualityScore {
  /** 人脸保持 1~5 */
  face: number;
  /** 人体保持 1~5 */
  body: number;
  /** 衣服还原 1~5 */
  garment: number;
  /** 边缘自然度 1~5 */
  edge: number;
  /** 遮挡关系 1~5 */
  occlusion: number;
  /** 颜色/纹理 1~5 */
  texture: number;
  /** 综合分（公式计算） */
  composite?: number;
}

export interface ProviderStats {
  provider: string;
  runs: number;
  success: number;
  failed: number;
  successRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  fastestMs: number;
  slowestMs: number;
  totalCostUsd: number;
  avgCostUsdPerSuccess: number;
  avgQualityComposite: number | null;
  errors: Record<string, number>;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function computeProviderStats(records: VtonBenchmarkRecord[]): ProviderStats[] {
  const per = new Map<string, VtonBenchmarkRecord[]>();
  for (const r of records) {
    const list = per.get(r.provider) ?? [];
    list.push(r);
    per.set(r.provider, list);
  }

  return [...per.entries()].map(([provider, list]) => {
    const ok = list.filter((r) => r.success);
    const latencies = ok.map((r) => r.latencyMs).sort((a, b) => a - b);
    const costs = ok.map((r) => r.estimatedCost);
    const errors: Record<string, number> = {};
    for (const r of list) {
      if (!r.success) {
        const code = r.errorCode || "UNKNOWN";
        errors[code] = (errors[code] ?? 0) + 1;
      }
    }
    const scored = ok
      .map((r) => r.quality?.composite)
      .filter((v): v is number => typeof v === "number" && v > 0);
    return {
      provider,
      runs: list.length,
      success: ok.length,
      failed: list.length - ok.length,
      successRate: list.length ? (ok.length / list.length) * 100 : 0,
      avgLatencyMs: latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      p50LatencyMs: percentile(latencies, 50),
      p95LatencyMs: percentile(latencies, 95),
      fastestMs: latencies.length ? latencies[0] : 0,
      slowestMs: latencies.length ? latencies[latencies.length - 1] : 0,
      totalCostUsd: costs.reduce((a, b) => a + b, 0),
      avgCostUsdPerSuccess: ok.length
        ? costs.reduce((a, b) => a + b, 0) / ok.length
        : 0,
      avgQualityComposite: scored.length
        ? scored.reduce((a, b) => a + b, 0) / scored.length
        : null,
      errors,
    };
  });
}

/**
 * 综合质量评分（1~5）：
 * 人脸保持 20% + 人体保持 15% + 衣服还原 25% + 边缘自然度 10% +
 * 遮挡关系 10% + 颜色/纹理 10% + 速度 5% + 成本 5%
 */
export function compositeQuality(
  q: Omit<VtonQualityScore, "composite">,
  latencyMs: number,
  costUsd: number,
): number {
  const speed =
    latencyMs <= 1000 ? 5 : latencyMs <= 3000 ? 4 : latencyMs <= 10000 ? 3 : latencyMs <= 30000 ? 2 : 1;
  const cost = costUsd <= 0 ? 5 : costUsd <= 0.01 ? 4 : costUsd <= 0.05 ? 3 : costUsd <= 0.15 ? 2 : 1;
  const score =
    q.face * 0.2 +
    q.body * 0.15 +
    q.garment * 0.25 +
    q.edge * 0.1 +
    q.occlusion * 0.1 +
    q.texture * 0.1 +
    speed * 0.05 +
    cost * 0.05;
  return Math.round(score * 100) / 100;
}

export function errorCodeList(): VTONErrorCode[] {
  return ["TIMEOUT", "AUTH_ERROR", "INVALID_INPUT", "RATE_LIMIT", "PROVIDER_ERROR", "IMAGE_ERROR", "UNKNOWN"];
}
