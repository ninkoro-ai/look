"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { labEnabled } from "@/lib/ai/config";
import { enterBetaMode, exitBetaMode, isBetaUser, betaUserId } from "@/lib/beta/storage";
import { computeBetaMetrics, type BetaMetrics } from "@/lib/beta/metrics";
import { deleteBetaDatabase, getAllBetaEvents, getDb } from "@/lib/db";
import type { BetaEventRecord } from "@/lib/beta/events";
import { track } from "@/lib/beta/track";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmt(ms: number | null): string {
  if (ms === null) return "—";
  return `${Math.round(ms / 1000)}s`;
}

export default function BetaLabPage() {
  const enabled = labEnabled();
  const [events, setEvents] = useState<BetaEventRecord[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    void (async () => {
      if (!isBetaUser()) return;
      const list = await getAllBetaEvents();
      setEvents(list);
      const db = await getDb();
      setFavoritesCount(await db.count("favorites"));
    })();
  }, []);

  const metrics: BetaMetrics = computeBetaMetrics(events, { favoritesCount });

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">Beta 看板未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  if (!isBetaUser()) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-4 font-mono text-sm">
        <header className="flex items-center justify-between border-b border-line pb-3">
          <h1 className="text-lg font-bold">LAB / BETA · Phase 6D</h1>
          <Link href="/" className="text-xs text-muted">
            ‹ 返回
          </Link>
        </header>
        <section className="space-y-3 rounded border border-line p-4 text-center">
          <p className="text-sm">Beta 模式未开启</p>
          <p className="text-xs text-muted">Beta 使用独立数据库，与普通用户数据完全隔离，可一键删除。</p>
          <button
            onClick={() => {
              enterBetaMode();
              window.location.reload();
            }}
            className="rounded bg-ink px-4 py-2 text-xs text-white"
          >
            开启 Beta 模式
          </button>
        </section>
      </div>
    );
  }

  const exportJson = () => {
    download(
      `BETA_ANALYTICS_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), metrics, events }, null, 2),
      "application/json",
    );
  };

  const clearAll = async () => {
    if (!window.confirm("删除全部 Beta 数据并退出？此操作不可恢复。")) return;
    await track("beta_data_deleted", { page: "lab-beta" });
    await deleteBetaDatabase();
    exitBetaMode(true);
    window.location.reload();
  };

  const perUser = new Map<string, { added: number; views: number; vton: number }>();
  for (const e of events) {
    const s = perUser.get(e.betaUserId) ?? { added: 0, views: 0, vton: 0 };
    if (e.event === "garment_added") s.added++;
    if (e.event === "daily_outfit_viewed") s.views++;
    if (e.event === "vton_clicked") s.vton++;
    perUser.set(e.betaUserId, s);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / BETA · Phase 6D</h1>
        <Link href="/" className="text-xs text-muted">
          ‹ 返回
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 核心指标（Beta 用户：{metrics.totalUsers}）</h2>
        <table className="w-full text-left text-[11px]">
          <tbody>
            <tr>
              <td className="py-0.5">首次衣橱完成率（≥5 件）</td>
              <td>{metrics.completionRate.toFixed(0)}%（{metrics.completedUsers}/{metrics.startedUsers}）</td>
            </tr>
            <tr>
              <td className="py-0.5">平均首次完成时间</td>
              <td>{fmt(metrics.avgFirstCompletionMs)}（目标 &lt;3min）</td>
            </tr>
            <tr>
              <td className="py-0.5">平均衣物数量 Day0 / Day3 / Day7</td>
              <td>
                {metrics.itemGrowth.day0} / {metrics.itemGrowth.day3} / {metrics.itemGrowth.day7}
              </td>
            </tr>
            <tr>
              <td className="py-0.5">留存 Day1 / Day3 / Day7</td>
              <td>
                {metrics.retention.day1.toFixed(0)}% / {metrics.retention.day3.toFixed(0)}% /{" "}
                {metrics.retention.day7.toFixed(0)}%
              </td>
            </tr>
            <tr>
              <td className="py-0.5">每日推荐查看（用户占比 / 总次数）</td>
              <td>
                {metrics.viewUserRate.toFixed(0)}%（{metrics.viewUsers} 人） / {metrics.dailyOutfitViews} 次
              </td>
            </tr>
            <tr>
              <td className="py-0.5">换装间访问 / 收藏数</td>
              <td>
                {metrics.dressViews} 次 / {metrics.favoritesCount} 件
              </td>
            </tr>
            <tr>
              <td className="py-0.5">AI 试穿点击率</td>
              <td>
                {metrics.vtonClickRate.toFixed(0)}%（{metrics.vtonClickUsers} 人）
              </td>
            </tr>
            <tr>
              <td className="py-0.5">反馈 😊/😐/😞</td>
              <td>
                {metrics.feedback.like} / {metrics.feedback.neutral} / {metrics.feedback.dislike}（文字{" "}
                {metrics.feedback.textCount} 条）
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">2. 用户明细（行为统计，无隐私）</h2>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-line">
              <th className="py-1">user</th>
              <th>入库衣物</th>
              <th>推荐查看</th>
              <th>AI试穿</th>
            </tr>
          </thead>
          <tbody>
            {[...perUser.entries()].map(([userId, s]) => (
              <tr key={userId} className="border-b border-line/50">
                <td className="py-1">{userId.slice(0, 16)}</td>
                <td>{s.added}</td>
                <td>{s.views}</td>
                <td>{s.vton}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">3. 数据管理</h2>
        <p className="text-[10px] text-muted">当前用户：{betaUserId()} · 事件数 {events.length} · 仅保存在本机浏览器</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="rounded border border-line px-3 py-1.5 text-xs">
            导出 BETA_ANALYTICS JSON
          </button>
          <button
            onClick={() => void clearAll()}
            className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-500"
          >
            删除全部测试数据并退出
          </button>
        </div>
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">4. 事件流（最近 30 条）</h2>
        {[...events].reverse().slice(0, 30).map((e) => (
          <div key={e.id} className="rounded border border-line/50 p-1.5 text-[10px] text-muted">
            {e.createdAt.slice(5, 19)} · {e.event} · {e.betaUserId.slice(0, 12)}
            {e.detectedCount !== undefined ? ` · 检出${e.detectedCount}` : ""}
            {e.confirmedCount !== undefined ? ` · 确认${e.confirmedCount}` : ""}
            {e.category ? ` · ${e.category}` : ""}
            {e.feedback ? ` · ${e.feedback}` : ""}
          </div>
        ))}
      </section>
    </div>
  );
}
