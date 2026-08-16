import type { OnboardingEvent } from "@/lib/db";
import { getWardrobeCase } from "@/lib/ai/wardrobe/dataset";

export interface WardrobeStats {
  uploads: number;
  uploadSessions: number;
  successSessions: number;
  firstWardrobeSuccessRate: number;
  avgDetectMs: number;
  avgImportTotalMs: number;
  categoryAccuracy: number | null;
  colorAccuracy: number | null;
  avgModifiedCount: number;
  avgDeletedCount: number;
  continueAddRate: number;
  abortedImports: number;
}

/** 从 onboarding 事件计算 Phase 6C 核心指标（仅行为数据，无隐私字段） */
export function computeWardrobeStats(events: OnboardingEvent[]): WardrobeStats {
  const uploadSessions = new Set(
    events.filter((e) => e.event === "upload_started").map((e) => e.sessionId),
  );
  const successSessions = new Set(
    events
      .filter((e) => e.event === "import_completed" && (e.addedCount ?? 0) > 0)
      .map((e) => e.sessionId),
  );

  const detects = events.filter((e) => e.event === "detect_completed");
  const imports = events.filter((e) => e.event === "import_completed");
  const continues = new Set(
    events
      .filter((e) => e.event === "upload_started")
      .reduce<Map<string, number>>((m, e) => {
        m.set(e.sessionId, (m.get(e.sessionId) ?? 0) + 1);
        return m;
      }, new Map()),
  );
  let continueSessions = 0;
  for (const [sid, n] of continues) {
    if (n >= 2 && uploadSessions.has(sid)) continueSessions++;
  }

  // 识别准确率：仅统计带 caseId 的样例检测事件（Mock 演示数据）
  let catMatched = 0;
  let catTotal = 0;
  let colorMatched = 0;
  let colorTotal = 0;
  for (const d of detects) {
    const c = d.caseId ? getWardrobeCase(d.caseId) : undefined;
    if (!c) continue;
    const detected = d.detectedCategories ?? [];
    const colors = d.detectedColors ?? [];
    for (let i = 0; i < c.expected.length; i++) {
      const exp = c.expected[i];
      catTotal++;
      if (detected.includes(exp.category)) catMatched++;
      colorTotal++;
      if (colors[i] === exp.color) colorMatched++;
    }
  }

  return {
    uploads: events.filter((e) => e.event === "upload_started").length,
    uploadSessions: uploadSessions.size,
    successSessions: successSessions.size,
    firstWardrobeSuccessRate:
      uploadSessions.size > 0 ? (successSessions.size / uploadSessions.size) * 100 : 0,
    avgDetectMs:
      detects.length > 0
        ? Math.round(detects.reduce((a, e) => a + (e.aiMs ?? 0), 0) / detects.length)
        : 0,
    avgImportTotalMs:
      imports.length > 0
        ? Math.round(imports.reduce((a, e) => a + (e.totalMs ?? 0), 0) / imports.length)
        : 0,
    categoryAccuracy: catTotal > 0 ? (catMatched / catTotal) * 100 : null,
    colorAccuracy: colorTotal > 0 ? (colorMatched / colorTotal) * 100 : null,
    avgModifiedCount:
      imports.length > 0
        ? imports.reduce((a, e) => a + (e.modifiedCount ?? 0), 0) / imports.length
        : 0,
    avgDeletedCount:
      imports.length > 0
        ? imports.reduce((a, e) => a + (e.deletedCount ?? 0), 0) / imports.length
        : 0,
    continueAddRate:
      uploadSessions.size > 0 ? (continueSessions / uploadSessions.size) * 100 : 0,
    abortedImports: events.filter((e) => e.event === "import_aborted").length,
  };
}

export function sessionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
