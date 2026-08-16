"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { labEnabled } from "@/lib/ai/config";
import { detectGarments } from "@/lib/ai/garmentDetection";
import { extractGarment, cropPreview } from "@/lib/ai/garmentExtraction";
import { WARDROBE_DATASET, type WardrobeMode } from "@/lib/ai/wardrobe/dataset";
import { computeWardrobeStats, sessionId, type WardrobeStats } from "@/lib/ai/wardrobe/analytics";
import {
  clearOnboardingEvents,
  getAllOnboardingEvents,
  putOnboardingEvent,
  type OnboardingEvent,
} from "@/lib/db";
import { CATEGORY_LABELS, LAYER_BY_CATEGORY } from "@/lib/constants";
import { uid } from "@/lib/format";
import { DEFAULT_ANCHOR } from "@/lib/assets";
import { useAppData } from "@/hooks/useAppData";
import type { Category, DetectedGarment, WardrobeItem } from "@/lib/types";

type Phase = "upload" | "detecting" | "review" | "importing" | "done";

interface ReviewItem {
  garment: DetectedGarment;
  previewUrl: string;
  removed: boolean;
  edited: boolean;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WardrobeLabPage() {
  const enabled = labEnabled();
  const { addItem } = useAppData();
  const sess = useRef(sessionId()).current;
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<WardrobeMode>("outfit");
  const [phase, setPhase] = useState<Phase>("upload");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedSingleId, setSelectedSingleId] = useState<string>("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<string>("");
  const [events, setEvents] = useState<OnboardingEvent[]>([]);
  const [eventsDirty, setEventsDirty] = useState(0);
  const [runAllBusy, setRunAllBusy] = useState(false);
  const [runAllProgress, setRunAllProgress] = useState("");
  const flowStart = useRef(0);
  const reviewStart = useRef(0);
  const detectStart = useRef(0);
  const [selectedCaseId, setSelectedCaseId] = useState(WARDROBE_DATASET[0].id);
  const [activeCase, setActiveCase] = useState<{ caseId?: string; scenario?: string }>({});

  const stats: WardrobeStats = useMemo(() => computeWardrobeStats(events), [events]);

  useEffect(() => {
    void getAllOnboardingEvents().then(setEvents);
  }, [eventsDirty]);

  const refreshEvents = useCallback(() => setEventsDirty((n) => n + 1), []);

  const record = useCallback(
    async (e: Omit<OnboardingEvent, "id" | "sessionId" | "createdAt" | "mode">) => {
      await putOnboardingEvent({
        ...e,
        id: uid(),
        sessionId: sess,
        createdAt: new Date().toISOString(),
        mode,
      });
      refreshEvents();
    },
    [mode, refreshEvents, sess],
  );

  const reset = () => {
    setPhase("upload");
    setPhotoBlob(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setItems([]);
    setSelectedSingleId("");
    setError("");
    setActiveCase({});
  };

  const runDetection = async (blob: Blob, previewUrl: string, caseId?: string, scenario?: string) => {
    setActiveCase({ caseId, scenario });
    flowStart.current = performance.now();
    setError("");
    setPhase("detecting");
    await record({
      event: "upload_started",
      caseId,
      scenario,
      detectedCount: 0,
    });
    detectStart.current = performance.now();
    try {
      const detections = await detectGarments(blob);
      const aiMs = Math.round(performance.now() - detectStart.current);
      const img = new Image();
      img.src = previewUrl;
      await img.decode();
      const review: ReviewItem[] = detections.map((garment) => ({
        garment,
        previewUrl: cropPreview(img, garment.boundingBox, 220),
        removed: false,
        edited: false,
      }));
      setItems(review);
      setSelectedSingleId(review[0]?.garment.id ?? "");
      setPhotoBlob(blob);
      setPhotoPreview(previewUrl);
      await record({
        event: "detect_completed",
        caseId,
        scenario,
        detectedCount: detections.length,
        detectedCategories: detections.map((d) => d.category),
        detectedColors: detections
          .map((d) => d.attributes?.color?.[0])
          .filter((c): c is string => Boolean(c)),
        aiMs,
      });
      reviewStart.current = performance.now();
      setPhase("review");
    } catch (e) {
      await record({ event: "import_aborted", caseId, scenario, detectedCount: 0 });
      setError(e instanceof Error ? e.message : "识别失败，请换一张照片");
      setPhase("upload");
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    void runDetection(file, url);
  };

  const loadSample = async (caseId: string) => {
    const c = WARDROBE_DATASET.find((x) => x.id === caseId);
    if (!c) return;
    setMode(c.mode);
    const blob = await fetch(c.imageUrl).then((r) => r.blob());
    const url = URL.createObjectURL(blob);
    await runDetection(blob, url, c.id, c.label);
  };

  const runAllSamples = async () => {
    if (runAllBusy) return;
    setRunAllBusy(true);
    let done = 0;
    const total = WARDROBE_DATASET.length;
    try {
      for (const c of WARDROBE_DATASET) {
        setRunAllProgress(`(${++done}/${total}) ${c.label}`);
        const blob = await fetch(c.imageUrl).then((r) => r.blob());
        const url = URL.createObjectURL(blob);
        await runDetection(blob, url, c.id, c.label);
        setItems([]);
        setPhase("upload");
      }
      setRunAllProgress(`完成 ${total} 组识别（仅识别，未入库）`);
    } finally {
      setRunAllBusy(false);
    }
  };

  const updateName = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.garment.id === id ? { ...it, garment: { ...it.garment, name }, edited: true } : it,
      ),
    );
  };

  const updateCategory = (id: string, category: Category) => {
    setItems((prev) =>
      prev.map((it) =>
        it.garment.id === id
          ? { ...it, garment: { ...it.garment, category }, edited: true }
          : it,
      ),
    );
  };

  const toggleRemove = (id: string) => {
    setItems((prev) => prev.map((it) => (it.garment.id === id ? { ...it, removed: !it.removed } : it)));
  };

  const confirmImport = async () => {
    const confirmMs = Math.round(performance.now() - reviewStart.current);
    let kept: ReviewItem[];
    if (mode === "outfit") {
      kept = items.filter((it) => !it.removed);
    } else {
      kept = items.filter((it) => it.garment.id === selectedSingleId);
    }
    if (kept.length === 0) return;
    const deletedCount = mode === "outfit" ? items.length - kept.length : 0;
    const modifiedCount = kept.filter((it) => it.edited).length;
    await record({
      event: "import_started",
      ...activeCase,
      detectedCount: items.length,
      confirmedCount: kept.length,
      deletedCount,
      modifiedCount,
    });
    setPhase("importing");
    let added = 0;
    for (const it of kept) {
      try {
        if (!photoBlob) continue;
        const extracted = await extractGarment(photoBlob, it.garment);
        const garment: WardrobeItem = {
          id: uid(),
          category: it.garment.category,
          name: it.garment.name.trim() || CATEGORY_LABELS[it.garment.category],
          imageUrl: extracted.transparentImageUrl,
          transparentImageUrl: extracted.transparentImageUrl,
          originalImageUrl: extracted.originalCropUrl,
          maskUrl: extracted.maskUrl,
          source: "photo-extraction",
          aiMetadata: {
            confidence: it.garment.confidence,
            detectedCategory: it.garment.category,
          },
          color: it.garment.attributes?.color,
          style: it.garment.attributes?.style,
          season: it.garment.attributes?.season,
          layer: LAYER_BY_CATEGORY[it.garment.category],
          anchor: extracted.suggestedAnchor ?? DEFAULT_ANCHOR[it.garment.category],
          isFavorite: false,
          createdAt: new Date().toISOString(),
        };
        await addItem(garment);
        added++;
      } catch {
        // 单个失败不中断
      }
    }
    const totalMs = Math.round(performance.now() - flowStart.current);
    await record({
      event: "import_completed",
      ...activeCase,
      detectedCount: items.length,
      confirmedCount: kept.length,
      addedCount: added,
      deletedCount,
      modifiedCount,
      confirmMs,
      totalMs,
    });
    setLastResult(
      `加入衣橱 ${added} 件 · 识别/确认/入库共 ${totalMs}ms · 修改 ${modifiedCount} · 删除 ${deletedCount}`,
    );
    setPhase("done");
  };

  const abortImport = async () => {
    await record({
      event: "import_aborted",
      ...activeCase,
      detectedCount: items.length,
      confirmedCount: 0,
      deletedCount: items.length,
    });
    reset();
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      dataset: "WARDROBE_VALIDATION_20",
      stats: computeWardrobeStats(events),
      events,
    };
    download("WARDROBE_ONBOARDING.json", JSON.stringify(payload, null, 2), "application/json");
  };

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">衣橱实验室未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  const selectedCase = WARDROBE_DATASET.find((c) => c.id === selectedCaseId);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / WARDROBE · Phase 6C</h1>
        <Link href="/" className="text-xs text-muted">
          ‹ 返回
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 上传方式</h2>
        <div className="flex gap-3">
          {(
            [
              ["outfit", "穿搭照片（拆解多件）"],
              ["single", "单品照片（单件）"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5 rounded border border-line px-2 py-1 text-xs">
              <input
                type="radio"
                name="wardrobe-mode"
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-[10px] text-muted">
          演示数据集：女生自拍穿搭×5 / 镜子自拍×5 / 衣架照片×5 / 平铺照片×5（全部为自绘演示素材）
        </p>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">2. {mode === "outfit" ? "添加我的第一件衣服" : "单品照片上传"}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded bg-ink px-3 py-2 text-white"
          >
            {mode === "outfit" ? "上传一张穿搭照片" : "上传一张单品照片"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="rounded border border-line bg-surface px-2 py-1.5 text-xs"
          >
            {WARDROBE_DATASET.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => void loadSample(selectedCaseId)}
            disabled={runAllBusy}
            className="rounded border border-line px-3 py-1.5 text-xs"
          >
            加载该样例
          </button>
          <button
            onClick={() => void runAllSamples()}
            disabled={runAllBusy}
            className="rounded bg-accent px-3 py-1.5 text-xs text-white disabled:opacity-40"
          >
            运行全部 20 组（仅识别）
          </button>
        </div>
        {runAllProgress && <p className="text-xs text-muted">{runAllProgress}</p>}
        {photoPreview && (
          <div className="mt-2 flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="upload" className="h-40 w-30 rounded border border-line object-cover" />
            <div className="text-[10px] text-muted">
              <p>上传源：{selectedCase ? `${selectedCase.id} · ${selectedCase.label}` : "本地照片"}</p>
              <p>模式：{mode === "outfit" ? "穿搭照片拆解" : "单品照片"}</p>
            </div>
          </div>
        )}
        {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}
      </section>

      {phase === "detecting" && (
        <section className="space-y-2 rounded border border-line p-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-xs text-muted">AI 正在识别衣物…</p>
        </section>
      )}

      {phase === "review" && (
        <section className="space-y-2 rounded border border-line p-3">
          <h2 className="font-bold">3. 识别结果（发现 {items.length} 件单品）</h2>
          {mode === "outfit" && (
            <p className="text-[10px] text-muted">可修改名称/分类，删除多余识别，确认后加入衣橱。</p>
          )}
          {mode === "single" && (
            <p className="text-[10px] text-muted">选择其中一件作为本次添加的单品。</p>
          )}
          <div className="space-y-1.5">
            {items.map((it) => (
              <div
                key={it.garment.id}
                className={`flex items-center gap-2 rounded border border-line/60 p-1.5 ${it.removed ? "opacity-40" : ""}`}
              >
                {mode === "single" && (
                  <input
                    type="radio"
                    name="single-item"
                    checked={selectedSingleId === it.garment.id}
                    onChange={() => setSelectedSingleId(it.garment.id)}
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="h-12 w-9 rounded border border-line object-cover" />
                <div className="min-w-0 flex-1">
                  <input
                    value={it.garment.name}
                    onChange={(e) => updateName(it.garment.id, e.target.value)}
                    className="w-full rounded border border-line bg-surface px-1.5 py-0.5 text-xs"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={it.garment.category}
                      onChange={(e) => updateCategory(it.garment.id, e.target.value as Category)}
                      className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-muted">{Math.round(it.garment.confidence * 100)}%</span>
                    {mode === "outfit" && (
                      <button
                        onClick={() => toggleRemove(it.garment.id)}
                        className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted"
                      >
                        {it.removed ? "恢复" : "删除"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void confirmImport()}
              disabled={mode === "outfit" ? items.every((i) => i.removed) : !selectedSingleId}
              className="rounded bg-accent px-3 py-2 text-white disabled:opacity-40"
            >
              {mode === "outfit" ? `全部加入衣橱（${items.filter((i) => !i.removed).length}）` : "加入衣橱"}
            </button>
            <button
              onClick={() => void abortImport()}
              className="rounded border border-line px-3 py-2 text-xs text-muted"
            >
              放弃
            </button>
          </div>
        </section>
      )}

      {phase === "importing" && (
        <section className="space-y-2 rounded border border-line p-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-xs text-muted">正在生成透明素材并加入衣橱…</p>
        </section>
      )}

      {phase === "done" && (
        <section className="space-y-2 rounded border border-line p-3">
          <h2 className="font-bold">✓ 已加入衣橱</h2>
          <p className="text-xs text-muted">{lastResult}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                reset();
                setLastResult("");
              }}
              className="rounded bg-ink px-3 py-1.5 text-xs text-white"
            >
              继续添加
            </button>
          </div>
        </section>
      )}

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">4. Onboarding 统计</h2>
        <table className="w-full text-left text-[11px]">
          <tbody>
            <tr>
              <td className="py-0.5">上传次数 / 会话数</td>
              <td>{stats.uploads} / {stats.uploadSessions}</td>
              <td className="py-0.5">首次建立衣橱成功率</td>
              <td>{stats.firstWardrobeSuccessRate.toFixed(0)}%（{stats.successSessions} 会话成功）</td>
            </tr>
            <tr>
              <td className="py-0.5">平均识别耗时</td>
              <td>{stats.avgDetectMs}ms</td>
              <td className="py-0.5">平均整单处理耗时</td>
              <td>{stats.avgImportTotalMs}ms</td>
            </tr>
            <tr>
              <td className="py-0.5">类别准确率（样例比对）</td>
              <td>{stats.categoryAccuracy === null ? "—" : `${stats.categoryAccuracy.toFixed(0)}%`}</td>
              <td className="py-0.5">颜色准确率（样例比对）</td>
              <td>{stats.colorAccuracy === null ? "—" : `${stats.colorAccuracy.toFixed(0)}%`}</td>
            </tr>
            <tr>
              <td className="py-0.5">平均修改次数</td>
              <td>{stats.avgModifiedCount.toFixed(2)}</td>
              <td className="py-0.5">平均删除数</td>
              <td>{stats.avgDeletedCount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-0.5">继续添加率（同会话≥2次上传）</td>
              <td>{stats.continueAddRate.toFixed(0)}%</td>
              <td className="py-0.5">放弃导入次数</td>
              <td>{stats.abortedImports}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex gap-2 pt-1">
          <button onClick={exportJson} className="rounded border border-line px-3 py-1.5 text-xs">
            导出事件 JSON
          </button>
          <button
            onClick={() => {
              if (window.confirm("清空全部 onboarding 事件记录？")) {
                void clearOnboardingEvents().then(() => {
                  setEvents([]);
                  refreshEvents();
                });
              }
            }}
            className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-500"
          >
            清空事件
          </button>
        </div>
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">5. 事件记录（{events.length}，无隐私数据）</h2>
        {[...events].reverse().slice(0, 30).map((e) => (
          <div key={e.id} className="rounded border border-line/50 p-1.5 text-[10px]">
            <p className="text-muted">
              {e.createdAt.slice(11, 19)} · {e.event} · {e.mode}
              {e.caseId ? ` · ${e.caseId}` : ""}
            </p>
            <p className="text-muted">
              检出 {e.detectedCount ?? 0} · 确认 {e.confirmedCount ?? 0} · 加入 {e.addedCount ?? 0} ·
              删 {e.deletedCount ?? 0} · 改 {e.modifiedCount ?? 0}
              {e.aiMs !== undefined ? ` · AI ${e.aiMs}ms` : ""}
              {e.totalMs !== undefined ? ` · 全程 ${e.totalMs}ms` : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
