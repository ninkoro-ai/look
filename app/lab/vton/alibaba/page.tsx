"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { labEnabled } from "@/lib/ai/config";
import { AlibabaAITryOnProvider, DASHSCOPE_COST_USD, DASHSCOPE_PRICE_CNY } from "@/lib/ai/vton/providers/alibaba";
import { runVTONToCompletion, sleep, type VTONCategory, type VTONResult } from "@/lib/ai/vton/contract";
import { ALIBABA_BENCH_CASES, alibabaBenchUniqueAssets } from "@/lib/ai/vton/alibabaBenchmark";
import { blobToDataUrl } from "@/lib/ai/vton/uploader";
import { getAllVtonTests, putVtonTest, deleteVtonTestsByProvider, type VtonTestRecord } from "@/lib/db";
import { uid } from "@/lib/format";
import { DEMO_ITEMS } from "@/lib/seed";

const CATEGORIES: VTONCategory[] = ["top", "outerwear", "bottom", "dress"];

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

export default function AlibabaLabPage() {
  const enabled = labEnabled();
  const provider = useMemo(() => new AlibabaAITryOnProvider(), []);
  const [health, setHealth] = useState<{ alibaba?: "ready" | "disabled"; configured: boolean; keyPresent: boolean; allowEnabled: boolean } | null>(null);
  const [personBlob, setPersonBlob] = useState<Blob | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<VTONCategory>("top");
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<VTONResult | null>(null);
  const [records, setRecords] = useState<VtonTestRecord[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [benchBusy, setBenchBusy] = useState(false);
  const [benchProgress, setBenchProgress] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const personInput = useRef<HTMLInputElement>(null);
  const garmentInput = useRef<HTMLInputElement>(null);

  const refreshRecords = useCallback(() => {
    void getAllVtonTests().then((all) =>
      setRecords(all.filter((r) => r.provider === "alibaba-vton" && (r.caseId ?? "").startsWith("ab"))),
    );
  }, []);

  useEffect(() => {
    void refreshRecords();
    fetch("/api/vton/health")
      .then((r) => r.json())
      .then((d) => setHealth(d as typeof health))
      .catch(() => setHealth(null));
    // 探测 20 组真实图片是否就绪
    void (async () => {
      const map: Record<string, boolean> = {};
      for (const path of alibabaBenchUniqueAssets()) {
        try {
          const r = await fetch(path, { method: "HEAD" });
          map[path] = r.ok;
        } catch {
          map[path] = false;
        }
      }
      setReady(map);
    })();
  }, [refreshRecords]);

  const pick = async (blob: Blob, kind: "person" | "garment") => {
    const url = URL.createObjectURL(blob);
    if (kind === "person") {
      setPersonBlob(blob);
      setPersonPreview(url);
    } else {
      setGarmentBlob(blob);
      setGarmentPreview(url);
    }
  };

  const loadSamplePerson = async (n: number) => {
    const blob = await fetch(`/lab-samples/person-${n}.jpg`).then((r) => r.blob());
    await pick(blob, "person");
  };

  const loadDemoGarment = async (itemId: string) => {
    const item = DEMO_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const blob = await dataUrlToBlob(item.imageUrl);
    await pick(blob, "garment");
  };

  const generate = async () => {
    if (!personBlob || !garmentBlob || running) return;
    setRunning(true);
    setResult(null);
    setTaskId("");
    setHistory([]);
    const start = performance.now();
    try {
      const input = {
        personImage: await blobToDataUrl(personBlob),
        garmentImage: await blobToDataUrl(garmentBlob),
        garmentCategory: category,
      };
      const task = await provider.createTryOn(input);
      setTaskId(task.taskId);
      if (task.status === "failed" && task.result) {
        setResult({ ...task.result, latencyMs: performance.now() - start });
        return;
      }
      if (task.status === "succeeded" && task.result) {
        setResult({ ...task.result, latencyMs: performance.now() - start });
        return;
      }
      let cur = task;
      setHistory(["PENDING"]);
      while (performance.now() - start < 180_000) {
        await sleep(3000);
        cur = await provider.getTaskStatus!(task.taskId);
        setHistory((h) => [...h, cur.status]);
        if (cur.status === "succeeded" || cur.status === "failed") break;
      }
      if (cur.result) {
        setResult({ ...cur.result, latencyMs: performance.now() - start });
      } else {
        setResult({
          success: false,
          provider: provider.id,
          latencyMs: performance.now() - start,
          estimatedCostUsd: 0,
          errorCode: "TIMEOUT",
          errorMessage: "180s 内未完成",
        });
      }
    } catch (e) {
      setResult({
        success: false,
        provider: provider.id,
        latencyMs: performance.now() - start,
        estimatedCostUsd: 0,
        errorCode: "UNKNOWN",
        errorMessage: e instanceof Error ? e.message : "生成失败",
      });
    } finally {
      setRunning(false);
    }
  };

  const runBenchmark = async () => {
    if (benchBusy) return;
    const cases = ALIBABA_BENCH_CASES.filter((c) => ready[c.personPath] && ready[c.garmentPath]);
    if (cases.length === 0) return;
    const cost = cases.length * DASHSCOPE_PRICE_CNY;
    if (!window.confirm(`将调用真实云端 AI试衣（${cases.length} 组 × ¥0.2 ≈ ¥${cost.toFixed(1)}），确认？`)) return;
    setBenchBusy(true);
    let done = 0;
    try {
      for (const c of cases) {
        setBenchProgress(`(${++done}/${cases.length}) ${c.label}`);
        const personBlob = await fetch(c.personPath).then((r) => r.blob());
        const garmentBlob = await fetch(c.garmentPath).then((r) => r.blob());
        const res = await runVTONToCompletion(
          provider,
          {
            personImage: await blobToDataUrl(personBlob),
            garmentImage: await blobToDataUrl(garmentBlob),
            garmentCategory: c.category,
            metadata: { caseId: c.id, caseLabel: c.label },
          },
          { pollIntervalMs: 3000, timeoutMs: 180_000 },
        );
        await putVtonTest({
          id: uid(),
          createdAt: new Date().toISOString(),
          caseId: c.id,
          caseLabel: c.label,
          provider: "alibaba-vton",
          category: c.category,
          latencyMs: Math.round(res.latencyMs),
          estimatedCost: res.estimatedCostUsd ?? 0,
          success: res.success,
          error: res.errorMessage,
          errorCode: res.errorCode,
        });
      }
      setBenchProgress(`完成 ${done} 组（${cases.length}）`);
    } finally {
      setBenchBusy(false);
      refreshRecords();
    }
  };

  const saveScore = async (recordId: string) => {
    const rec = records.find((r) => r.id === recordId);
    const score = scores[recordId];
    if (!rec || !score) return;
    await putVtonTest({ ...rec, qualityScore: score });
    refreshRecords();
  };

  const exportJson = () => {
    const payload = {
      provider: "alibaba",
      exportedAt: new Date().toISOString(),
      dataset: "ALIBABA_20_REAL",
      results: records.map((r) => ({
        caseId: r.caseId,
        success: r.success,
        duration_ms: r.latencyMs,
        cost: r.success ? "0.2" : "0",
        quality_score: r.qualityScore ?? null,
        error: r.error ?? null,
      })),
    };
    download("ALIBABA_BENCHMARK.json", JSON.stringify(payload, null, 2), "application/json");
  };

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">实验台未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  const readyCases = ALIBABA_BENCH_CASES.filter((c) => ready[c.personPath] && ready[c.garmentPath]);
  const readyCount = readyCases.length;
  const missingFiles = alibabaBenchUniqueAssets().filter((p) => ready[p] === false).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / VTON / ALIBABA · 6B.1</h1>
        <Link href="/lab/vton" className="text-xs text-muted">
          ‹ 返回 VTON 实验台
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 配置状态</h2>
        <p className="text-xs">
          {health === null
            ? "服务端代理：未连接（静态预览环境）"
            : `Alibaba AITryOn：${health.alibaba === "ready" ? "READY ✅" : "DISABLED ⛔"}（${
                health.configured
                  ? "Key + Beta 开关 + Allow 开关已启用"
                  : !health.keyPresent
                    ? "服务端缺 DASHSCOPE_API_KEY"
                    : "VTON_BETA_ENABLED / VTON_ALLOW_ALIBABA 未开启"
              }）`}
        </p>
        <p className="text-[10px] text-muted">
          计费：aitryon ¥0.2/张（≈${DASHSCOPE_COST_USD}/张，仅成功计费）· 图片 5KB~5MB / 150~4096px · Key 仅在服务端
        </p>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">2. 输入与生成</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs text-muted">人物照片（全身正面）</p>
            <button
              onClick={() => personInput.current?.click()}
              className="h-28 w-full rounded border border-dashed border-line bg-sand text-xs"
            >
              {personPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={personPreview} alt="person" className="h-full w-full object-cover" />
              ) : (
                "上传人物照片"
              )}
            </button>
            <input ref={personInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f, "person");
            }} />
            <div className="mt-1 flex gap-1">
              {[1, 2, 3].map((n) => (
                <button key={n} onClick={() => void loadSamplePerson(n)} className="flex-1 rounded border border-line py-1 text-[10px]">
                  sample {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">衣物照片（白底平铺最佳）</p>
            <button
              onClick={() => garmentInput.current?.click()}
              className="h-28 w-full rounded border border-dashed border-line bg-sand text-xs"
            >
              {garmentPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={garmentPreview} alt="garment" className="h-full w-full object-contain" />
              ) : (
                "上传衣物照片"
              )}
            </button>
            <input ref={garmentInput} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f, "garment");
            }} />
            <div className="mt-1 flex flex-wrap gap-1">
              {DEMO_ITEMS.filter((i) => i.category === "top" || i.category === "outerwear")
                .slice(0, 3)
                .map((i) => (
                  <button key={i.id} onClick={() => void loadDemoGarment(i.id)} className="rounded border border-line px-1.5 py-1 text-[10px]">
                    {i.name.slice(0, 6)}
                  </button>
                ))}
            </div>
          </div>
        </div>
        <label className="block text-xs">
          类别
          <select value={category} onChange={(e) => setCategory(e.target.value as VTONCategory)} className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => void generate()}
          disabled={!personBlob || !garmentBlob || running}
          className="rounded bg-ink px-4 py-2 text-white disabled:opacity-40"
        >
          {running ? "生成中…" : "Generate（真实 AI 试衣）"}
        </button>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">3. 运行详情</h2>
        {taskId && <p className="text-xs">task_id：<span className="break-all">{taskId}</span></p>}
        {history.length > 0 && <p className="text-xs">状态流转：{history.join(" → ")}</p>}
        {result && (
          <div className="rounded border border-line/60 p-2">
            {result.success ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.imageUrl} alt="result" className="max-h-80 rounded border border-line" />
            ) : (
              <p className="text-xs text-red-600">
                [{result.errorCode ?? "UNKNOWN"}] {result.errorMessage ?? "生成失败"}
              </p>
            )}
            <p className="mt-1 text-[10px] text-muted">
              耗时 {Math.round(result.latencyMs)}ms · 成本 {result.success ? `¥${DASHSCOPE_PRICE_CNY}（$${DASHSCOPE_COST_USD}）` : "¥0"} ·{" "}
              {result.success ? "成功" : "失败"}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">4. 20 组真实图片 Benchmark</h2>
        <p className="text-[10px] text-muted">
          数据集：真人自拍 ×8 / 衣服照片 ×8 / 复杂场景 ×4（共 20 组）。
          图片请放入 <span className="break-all">public/bench-assets/alibaba/（person-01..08.jpg + garment-01..20.jpg）</span>，
          未就绪的 case 自动跳过。
        </p>
        <p className="text-xs">
          当前就绪：{readyCount}/20 组 · 待补充文件 {missingFiles} 个
          {readyCount === 0 && "（等待真实图片）"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void runBenchmark()}
            disabled={benchBusy || readyCount === 0}
            className="rounded bg-accent px-3 py-2 text-white disabled:opacity-40"
          >
            {benchBusy ? "运行中…" : `运行 Benchmark（${readyCount} 组）`}
          </button>
          <button onClick={exportJson} className="rounded border border-line px-3 py-2 text-xs">
            导出 ALIBABA_BENCHMARK JSON
          </button>
          <button
            onClick={() => {
              if (window.confirm("清空阿里云 Benchmark 记录？")) {
                void deleteVtonTestsByProvider("alibaba-vton").then(refreshRecords);
              }
            }}
            className="rounded border border-red-200 px-3 py-2 text-xs text-red-500"
          >
            清空记录
          </button>
        </div>
        {benchProgress && <p className="text-xs text-muted">{benchProgress}</p>}
        {records.length > 0 && (
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1">case</th>
                <th>成功</th>
                <th>耗时</th>
                <th>成本</th>
                <th>质量分</th>
              </tr>
            </thead>
            <tbody>
              {[...records].sort((a, b) => (a.caseId ?? "").localeCompare(b.caseId ?? "")).map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="py-1">{r.caseId}</td>
                  <td>{r.success ? "✓" : "✗"}</td>
                  <td>{r.latencyMs}ms</td>
                  <td>{r.success ? `¥${DASHSCOPE_PRICE_CNY}` : "¥0"}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={scores[r.id] ?? r.qualityScore ?? ""}
                      onChange={(e) => setScores((prev) => ({ ...prev, [r.id]: Number(e.target.value) || 1 }))}
                      onBlur={() => void saveScore(r.id)}
                      className="w-12 rounded border border-line bg-surface px-1 py-0.5 text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">5. 安全说明</h2>
        <ul className="list-inside list-disc space-y-1 text-[10px] text-muted">
          <li>API Key 仅存在于服务端环境变量，浏览器与 Git 均不接触；日志不打印 Key</li>
          <li>图片经 DashScope 临时存储（48h）上传，服务端不持久化用户图片</li>
          <li>默认 VTON_ALLOW_ALIBABA 关闭，仅本实验台可调用云端</li>
        </ul>
      </section>
    </div>
  );
}
