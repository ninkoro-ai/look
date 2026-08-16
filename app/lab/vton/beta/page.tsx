"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { labEnabled } from "@/lib/ai/config";
import { computeVtonMetrics, type VtonMetrics } from "@/lib/beta/metrics";
import { isBetaUser } from "@/lib/beta/storage";
import { getAllBetaEvents, getAllVtonTests } from "@/lib/db";
import type { BetaEventRecord } from "@/lib/beta/events";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VtonBetaLabPage() {
  const enabled = labEnabled();
  const [events, setEvents] = useState<BetaEventRecord[]>([]);
  const [costs, setCosts] = useState<Array<{ createdAt: string; success: boolean; durationMs: number; costCny: number }>>([]);

  useEffect(() => {
    void (async () => {
      if (!isBetaUser()) return;
      const [beta, tests] = await Promise.all([getAllBetaEvents(), getAllVtonTests()]);
      setEvents(beta);
      setCosts(
        tests
          .filter((t) => t.provider === "beta-tryon")
          .map((t) => ({
            createdAt: t.createdAt,
            success: t.success,
            durationMs: t.latencyMs,
            costCny: t.success ? 0.2 : 0,
          })),
      );
    })();
  }, []);

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">看板未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  if (!isBetaUser()) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-4 font-mono text-sm">
        <header className="flex items-center justify-between border-b border-line pb-3">
          <h1 className="text-lg font-bold">LAB / VTON / BETA · 6E</h1>
          <Link href="/" className="text-xs text-muted">
            ‹ 返回
          </Link>
        </header>
        <p className="rounded border border-line p-4 text-center text-sm text-muted">
          Beta 模式未开启，无法查看 AI 试穿数据。
        </p>
      </div>
    );
  }

  const m: VtonMetrics = computeVtonMetrics(events);
  const estimate10UsersMonthly = () => {
    // 假设：10 用户 × 平均每天 1 次试穿 × 30 天
    const perGenCny = m.completed > 0 ? m.totalCostCny / m.completed : 0.2;
    return {
      assumption: "10 用户 × 1 次/天 × 30 天（全量真实试穿）",
      monthlyCny: Math.round(perGenCny * 10 * 30 * 100) / 100,
      monthlyUsd: Math.round((perGenCny * 10 * 30) / 7.2 * 100) / 100,
    };
  };
  const est = estimate10UsersMonthly();

  const exportCost = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      provider: "alibaba-aitryon",
      calls: costs,
      stats: {
        totalCalls: costs.length,
        success: costs.filter((c) => c.success).length,
        totalCostCny: Math.round(costs.reduce((a, c) => a + c.costCny, 0) * 100) / 100,
      },
      estimate10UsersMonthly: est,
    };
    download("vton-cost-report.json", JSON.stringify(payload, null, 2), "application/json");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / VTON / BETA · 6E</h1>
        <Link href="/tryon" className="text-xs text-muted">
          AI 真实试穿入口 ›
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 实时指标</h2>
        <table className="w-full text-left text-[11px]">
          <tbody>
            <tr>
              <td className="py-0.5">生成次数 / 用户数</td>
              <td>{m.started} / {m.users}</td>
              <td className="py-0.5">成功率</td>
              <td>{m.successRate.toFixed(0)}%（{m.completed}/{m.started}）</td>
            </tr>
            <tr>
              <td className="py-0.5">平均耗时</td>
              <td>{m.avgDurationMs ? `${Math.round(m.avgDurationMs / 1000)}s` : "—"}</td>
              <td className="py-0.5">平均成本</td>
              <td>{m.completed ? `¥${m.avgCostCny.toFixed(2)}（$${m.avgCostUsd.toFixed(3)}）` : "—"}</td>
            </tr>
            <tr>
              <td className="py-0.5">平均评分</td>
              <td>{m.avgRating ?? "—"}（{m.ratedCount} 次评分）</td>
              <td className="py-0.5">二次生成率</td>
              <td>{m.retryRate.toFixed(0)}%</td>
            </tr>
            <tr>
              <td className="py-0.5">收藏率</td>
              <td>{m.saveRate.toFixed(0)}%（{m.saveCount} 次）</td>
              <td className="py-0.5">手动重试</td>
              <td>{m.retries} 次</td>
            </tr>
            <tr>
              <td className="py-0.5">付费意愿</td>
              <td colSpan={3}>
                A 愿意 {m.payIntent.A} · B 看价格 {m.payIntent.B} · C 不需要 {m.payIntent.C}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">2. 成本监控</h2>
        <p className="text-[10px] text-muted">
          累计 {costs.length} 次调用 · 成功 {costs.filter((c) => c.success).length} 次 · 成本 ¥
          {Math.round(costs.reduce((a, c) => a + c.costCny, 0) * 100) / 100}
        </p>
        <p className="text-[10px] text-muted">
          10 用户月成本估算（{est.assumption}）：约 ¥{est.monthlyCny}（≈${est.monthlyUsd}）
        </p>
        <button onClick={exportCost} className="rounded border border-line px-3 py-1.5 text-xs">
          导出 vton-cost-report.json
        </button>
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">3. 事件流（最近 20 条，无隐私）</h2>
        {[...events].reverse().filter((e) => e.event.startsWith("vton_")).slice(0, 20).map((e) => (
          <div key={e.id} className="rounded border border-line/50 p-1.5 text-[10px] text-muted">
            {e.createdAt.slice(5, 19)} · {e.event}
            {e.durationMs !== undefined ? ` · ${e.durationMs}ms` : ""}
            {e.score !== undefined ? ` · 评分 ${e.score}` : ""}
            {e.payChoice ? ` · 付费 ${e.payChoice}` : ""}
          </div>
        ))}
      </section>

      <p className="text-[10px] text-muted">
        说明：真实数据需 DASHSCOPE_API_KEY + 真人测试用户；当前为模拟/空数据状态。
      </p>
    </div>
  );
}
