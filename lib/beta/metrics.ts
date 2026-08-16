import type { BetaEventRecord } from "@/lib/beta/events";

export interface BetaMetrics {
  totalUsers: number;
  startedUsers: number;
  completedUsers: number;
  /** 首次衣橱建立完成率：至少加入 5 件衣物的用户 / 开始上传的用户 */
  completionRate: number;
  /** 首次完成时间（首次上传 → 第 5 件入库），毫秒 */
  avgFirstCompletionMs: number | null;
  /** Day0/3/7 平均衣物数量（garment_added 按用户首日偏移统计） */
  itemGrowth: { day0: number; day3: number; day7: number };
  /** 留存：Day1/3/7 是否有 session_started */
  retention: { day1: number; day3: number; day7: number };
  dailyOutfitViews: number;
  viewUsers: number;
  viewUserRate: number;
  dressViews: number;
  favoritesCount: number;
  vtonClickUsers: number;
  vtonClickRate: number;
  feedback: { like: number; neutral: number; dislike: number; textCount: number };
  deletedDataCount: number;
}

/** Phase 6E：AI真实试穿价值指标（仅行为统计） */
export interface VtonMetrics {
  users: number;
  started: number;
  completed: number;
  successRate: number;
  avgDurationMs: number;
  avgCostUsd: number;
  avgCostCny: number;
  totalCostCny: number;
  avgRating: number | null;
  ratedCount: number;
  retryRate: number;
  retries: number;
  saveCount: number;
  saveRate: number;
  payIntent: { A: number; B: number; C: number };
}

function dayOffsetMs(createdAt: string, base: number): number {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return -1;
  return Math.floor((t - base) / 86_400_000);
}

function pct(a: number, b: number): number {
  return b > 0 ? (a / b) * 100 : 0;
}

export function computeBetaMetrics(
  events: BetaEventRecord[],
  opts?: { favoritesCount?: number },
): BetaMetrics {
  const users = new Set(events.map((e) => e.betaUserId));
  const perUser = new Map<string, BetaEventRecord[]>();
  for (const e of events) {
    const list = perUser.get(e.betaUserId) ?? [];
    list.push(e);
    perUser.set(e.betaUserId, list);
  }

  const started = events.filter((e) => e.event === "wardrobe_onboarding_started");
  const startedUsers = new Set(started.map((e) => e.betaUserId));

  // 首次完成：按用户收集 garment_added 时间，取第 5 件
  const completionMsList: number[] = [];
  const completedUsers = new Set<string>();
  for (const [userId, list] of perUser) {
    const added = list
      .filter((e) => e.event === "garment_added")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (added.length >= 5) {
      completedUsers.add(userId);
      const fifth = new Date(added[4].createdAt).getTime();
      const onboarding = list
        .filter((e) => e.event === "wardrobe_onboarding_started")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (onboarding.length > 0) {
        const start = new Date(onboarding[0].createdAt).getTime();
        completionMsList.push(fifth - start);
      }
    }
  }

  // Day0/3/7 平均衣物数 + 留存
  let day0Sum = 0;
  let day3Sum = 0;
  let day7Sum = 0;
  let day1Ret = 0;
  let day3Ret = 0;
  let day7Ret = 0;
  for (const list of perUser.values()) {
    const times = list.map((e) => new Date(e.createdAt).getTime()).filter((t) => !Number.isNaN(t));
    if (times.length === 0) continue;
    const base = Math.min(...times);
    const sessions = new Set(
      list.filter((e) => e.event === "session_started").map((e) => dayOffsetMs(e.createdAt, base)),
    );
    day0Sum += list.filter((e) => e.event === "garment_added" && dayOffsetMs(e.createdAt, base) === 0).length;
    day3Sum += list.filter((e) => e.event === "garment_added" && dayOffsetMs(e.createdAt, base) === 3).length;
    day7Sum += list.filter((e) => e.event === "garment_added" && dayOffsetMs(e.createdAt, base) === 7).length;
    if (sessions.has(1)) day1Ret++;
    if (sessions.has(3)) day3Ret++;
    if (sessions.has(7)) day7Ret++;
  }

  const viewEvents = events.filter((e) => e.event === "daily_outfit_viewed");
  const viewUsers = new Set(viewEvents.map((e) => e.betaUserId));
  const vtonUsers = new Set(
    events.filter((e) => e.event === "vton_clicked").map((e) => e.betaUserId),
  );
  const feedback = { like: 0, neutral: 0, dislike: 0, textCount: 0 };
  for (const e of events) {
    if (e.event !== "feedback_submitted") continue;
    if (e.feedback === "like") feedback.like++;
    else if (e.feedback === "neutral") feedback.neutral++;
    else if (e.feedback === "dislike") feedback.dislike++;
    if (e.feedbackText?.trim()) feedback.textCount++;
  }

  const total = users.size;
  return {
    totalUsers: total,
    startedUsers: startedUsers.size,
    completedUsers: completedUsers.size,
    completionRate: pct(completedUsers.size, startedUsers.size),
    avgFirstCompletionMs:
      completionMsList.length > 0
        ? Math.round(completionMsList.reduce((a, b) => a + b, 0) / completionMsList.length)
        : null,
    itemGrowth: {
      day0: total ? Math.round((day0Sum / total) * 10) / 10 : 0,
      day3: total ? Math.round((day3Sum / total) * 10) / 10 : 0,
      day7: total ? Math.round((day7Sum / total) * 10) / 10 : 0,
    },
    retention: {
      day1: pct(day1Ret, total),
      day3: pct(day3Ret, total),
      day7: pct(day7Ret, total),
    },
    dailyOutfitViews: viewEvents.length,
    viewUsers: viewUsers.size,
    viewUserRate: pct(viewUsers.size, total),
    dressViews: events.filter((e) => e.event === "dress_page_viewed").length,
    favoritesCount: opts?.favoritesCount ?? 0,
    vtonClickUsers: vtonUsers.size,
    vtonClickRate: pct(vtonUsers.size, total),
    feedback,
    deletedDataCount: events.filter((e) => e.event === "beta_data_deleted").length,
  };
}

export function computeVtonMetrics(events: BetaEventRecord[]): VtonMetrics {
  const started = events.filter((e) => e.event === "vton_started");
  const completed = events.filter((e) => e.event === "vton_completed" && e.success === true);
  const rated = events.filter((e) => e.event === "vton_rated" && typeof e.score === "number");
  const saves = events.filter((e) => e.event === "vton_saved");
  const retries = events.filter((e) => e.event === "vton_retry").length;
  const pay = events.filter((e) => e.event === "vton_pay_intent");
  const payIntent = { A: 0, B: 0, C: 0 };
  for (const e of pay) {
    if (e.payChoice === "A") payIntent.A++;
    else if (e.payChoice === "B") payIntent.B++;
    else if (e.payChoice === "C") payIntent.C++;
  }

  const startedUsers = new Set(started.map((e) => e.betaUserId));
  const secondTimeUsers = new Set<string>();
  const perUser = new Map<string, number>();
  for (const e of started) {
    perUser.set(e.betaUserId, (perUser.get(e.betaUserId) ?? 0) + 1);
    if ((perUser.get(e.betaUserId) ?? 0) >= 2) secondTimeUsers.add(e.betaUserId);
  }

  const durations = completed.map((e) => e.durationMs ?? 0).filter((n) => n > 0);
  const costsUsd = completed.map((e) => e.costEstimateUsd ?? 0);
  const costsCny = completed.map((e) => e.costEstimateCny ?? 0);
  const scores = rated.map((e) => e.score ?? 0);

  return {
    users: new Set(events.filter((e) => e.event.startsWith("vton_")).map((e) => e.betaUserId)).size,
    started: started.length,
    completed: completed.length,
    successRate: started.length > 0 ? (completed.length / started.length) * 100 : 0,
    avgDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    avgCostUsd: costsUsd.length
      ? Math.round((costsUsd.reduce((a, b) => a + b, 0) / costsUsd.length) * 1000) / 1000
      : 0,
    avgCostCny: costsCny.length
      ? Math.round((costsCny.reduce((a, b) => a + b, 0) / costsCny.length) * 100) / 100
      : 0,
    totalCostCny: Math.round(costsCny.reduce((a, b) => a + b, 0) * 100) / 100,
    avgRating: scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : null,
    ratedCount: rated.length,
    retryRate:
      startedUsers.size > 0 ? (secondTimeUsers.size / startedUsers.size) * 100 : 0,
    retries,
    saveCount: saves.length,
    saveRate: completed.length > 0 ? (saves.length / completed.length) * 100 : 0,
    payIntent,
  };
}
