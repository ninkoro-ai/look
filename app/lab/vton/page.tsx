"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { labEnabled, getApiKey, setApiKey } from "@/lib/ai/config";
import { allVTONProviders, providerReady } from "@/lib/ai/vton/registry";
import { BENCHMARK_CASES } from "@/lib/ai/vton/benchmark";
import type { VirtualTryOnProvider, VirtualTryOnResult, VTONCategory } from "@/lib/ai/vton/types";
import {
  clearVtonTests,
  deleteVtonTest,
  getAllVtonTests,
  putVtonTest,
  type VtonTestRecord,
} from "@/lib/db";
import { DEMO_ITEMS } from "@/lib/seed";
import { uid } from "@/lib/format";

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob());
}

function loadThumb(blob: Blob, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("thumb fail"));
    };
    img.src = url;
  });
}

export default function VtonLabPage() {
  const enabled = labEnabled();
  const [openaiKey, setOpenaiKey] = useState(() => getApiKey("openai") ?? "");
  const [personBlob, setPersonBlob] = useState<Blob | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [category] = useState<VTONCategory>("top");
  const [results, setResults] = useState<Record<string, VirtualTryOnResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [tests, setTests] = useState<VtonTestRecord[]>([]);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchProgress, setBenchProgress] = useState("");
  const personInput = useRef<HTMLInputElement>(null);
  const garmentInput = useRef<HTMLInputElement>(null);

  const providers = allVTONProviders();

  useEffect(() => {
    void getAllVtonTests().then(setTests);
  }, []);

  const refreshTests = useCallback(() => {
    void getAllVtonTests().then(setTests);
  }, []);

  const saveKey = () => {
    setApiKey("openai", openaiKey);
  };

  const pickPerson = async (blob: Blob) => {
    setPersonBlob(blob);
    setPersonPreview(URL.createObjectURL(blob));
  };

  const pickGarment = async (blob: Blob) => {
    setGarmentBlob(blob);
    setGarmentPreview(URL.createObjectURL(blob));
  };

  const loadSamplePerson = async (n: number) => {
    const blob = await fetch(`/lab-samples/person-${n}.jpg`).then((r) => r.blob());
    await pickPerson(blob);
  };

  const loadDemoGarment = async (itemId: string) => {
    const item = DEMO_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const blob = await dataUrlToBlob(item.imageUrl);
    await pickGarment(blob);
  };

  const saveResult = async (
    p: VirtualTryOnProvider,
    res: VirtualTryOnResult,
    opts?: { caseId?: string; caseLabel?: string },
  ) => {
    const record: VtonTestRecord = {
      id: uid(),
      createdAt: new Date().toISOString(),
      caseId: opts?.caseId,
      caseLabel: opts?.caseLabel,
      provider: p.id,
      category,
      personThumb: personBlob ? await loadThumb(personBlob, 96).catch(() => undefined) : undefined,
      garmentThumb: garmentBlob ? await loadThumb(garmentBlob, 96).catch(() => undefined) : undefined,
      outputUrl: res.imageUrl ? await resizedDataUrl(res.imageUrl).catch(() => res.imageUrl) : undefined,
      latencyMs: Math.round(res.latencyMs),
      estimatedCost: res.estimatedCost,
      success: res.success,
      error: res.error,
    };
    await putVtonTest(record);
  };

  const runOne = async (p: VirtualTryOnProvider) => {
    if (!personBlob || !garmentBlob) return;
    setRunning(p.id);
    const res = await p.tryOn({ personImage: personBlob, garmentImage: garmentBlob, category });
    setResults((prev) => ({ ...prev, [p.id]: res }));
    await saveResult(p, res);
    refreshTests();
    setRunning(null);
  };

  const runBenchmark = async () => {
    if (benchRunning) return;
    setBenchRunning(true);
    let count = 0;
    const total = BENCHMARK_CASES.length * providers.length;
    for (const c of BENCHMARK_CASES) {
      const personBlob = await fetch(c.personUrl).then((r) => r.blob());
      const item = DEMO_ITEMS.find((i) => i.id === c.garmentItemId);
      if (!item) continue;
      const garmentBlob = await dataUrlToBlob(item.imageUrl);
      for (const p of providers) {
        if (!providerReady(p)) continue;
        count++;
        setBenchProgress(`(${count}/${total}) ${c.label} · ${p.label}`);
        const res = await p.tryOn({ personImage: personBlob, garmentImage: garmentBlob, category });
        await saveResult(p, res, { caseId: c.id, caseLabel: c.label });
      }
    }
    setBenchProgress(`完成 ${count} 组`);
    setBenchRunning(false);
    refreshTests();
  };

  const exportJson = () => {
    const payload = { exportedAt: new Date().toISOString(), tests };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vton-benchmark.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">VTON 实验室未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  const stats = (() => {
    const per = new Map<string, { n: number; ok: number; ms: number; cost: number }>();
    for (const t of tests) {
      const s = per.get(t.provider) ?? { n: 0, ok: 0, ms: 0, cost: 0 };
      s.n++;
      if (t.success) s.ok++;
      s.ms += t.latencyMs;
      s.cost += t.estimatedCost;
      per.set(t.provider, s);
    }
    return [...per.entries()].map(([provider, s]) => ({
      provider,
      runs: s.n,
      successRate: s.n ? (s.ok / s.n) * 100 : 0,
      avgLatencyMs: s.n ? Math.round(s.ms / s.n) : 0,
      totalCost: s.cost,
    }));
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / VTON</h1>
        <Link href="/" className="text-xs text-muted">
          ‹ 返回
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 配置</h2>
        <label className="block text-xs">
          OpenAI API Key
          <input
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            onBlur={saveKey}
            type="password"
            placeholder="sk-…（本地保存，用于 gpt-image-1 / 检测）"
            className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {providers.map((p) => (
            <span
              key={p.id}
              className={`rounded px-2 py-1 text-xs ${providerReady(p) ? "bg-green-100 text-green-800" : "bg-sand text-muted"}`}
            >
              {p.id} {providerReady(p) ? "ready" : "no-key"}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">2. 输入</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs text-muted">人物照片</p>
            <button
              onClick={() => personInput.current?.click()}
              className="h-28 w-full rounded border border-dashed border-line bg-sand text-xs"
            >
              {personPreview ? <img src={personPreview} alt="person" className="h-full w-full object-cover" /> : "上传人物照片"}
            </button>
            <input
              ref={personInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickPerson(f);
              }}
            />
            <div className="mt-1 flex gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => void loadSamplePerson(n)}
                  className="flex-1 rounded border border-line py-1 text-[10px]"
                >
                  sample {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted">衣物照片（需透明素材）</p>
            <button
              onClick={() => garmentInput.current?.click()}
              className="h-28 w-full rounded border border-dashed border-line bg-sand text-xs"
            >
              {garmentPreview ? <img src={garmentPreview} alt="garment" className="h-full w-full object-contain" /> : "上传衣物照片"}
            </button>
            <input
              ref={garmentInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickGarment(f);
              }}
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {DEMO_ITEMS.filter((i) => i.category === "top" || i.category === "outerwear")
                .slice(0, 5)
                .map((i) => (
                  <button
                    key={i.id}
                    onClick={() => void loadDemoGarment(i.id)}
                    className="rounded border border-line px-1.5 py-1 text-[10px]"
                  >
                    {i.name.slice(0, 6)}
                  </button>
                ))}
            </div>
          </div>
        </div>
        <p className="text-xs">
          类别：<strong>top（本阶段仅上衣）</strong>
        </p>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">3. 生成</h2>
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => void runOne(p)}
              disabled={!personBlob || !garmentBlob || running === p.id}
              className="rounded bg-ink px-3 py-2 text-white disabled:opacity-40"
            >
              {running === p.id ? "运行中…" : p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
          {Object.entries(results).map(([id, r]) => (
            <div key={id} className="rounded border border-line p-2">
              <p className="text-xs font-bold">{id}</p>
              {r.success ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt="tryon result" className="mt-1 w-full rounded" />
              ) : (
                <p className="mt-1 text-xs text-red-600">{r.error}</p>
              )}
              <p className="mt-1 text-[10px] text-muted">
                latency {Math.round(r.latencyMs)}ms · cost ${r.estimatedCost} · {r.success ? "ok" : "fail"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">4. Benchmark（10 组 × 可用 Provider）</h2>
        <button
          onClick={() => void runBenchmark()}
          disabled={benchRunning}
          className="rounded bg-accent px-3 py-2 text-white disabled:opacity-40"
        >
          {benchRunning ? "运行中…" : "运行 Benchmark"}
        </button>
        {benchProgress && <p className="text-xs text-muted">{benchProgress}</p>}
        {stats.length > 0 && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1">provider</th>
                <th>runs</th>
                <th>成功率</th>
                <th>平均耗时</th>
                <th>总成本</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.provider} className="border-b border-line/50">
                  <td className="py-1">{s.provider}</td>
                  <td>{s.runs}</td>
                  <td>{s.successRate.toFixed(0)}%</td>
                  <td>{s.avgLatencyMs}ms</td>
                  <td>${s.totalCost.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex gap-2">
          <button onClick={exportJson} className="rounded border border-line px-3 py-1.5 text-xs">
            导出报告 JSON
          </button>
          <button
            onClick={() => {
              void clearVtonTests().then(refreshTests);
            }}
            className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-500"
          >
            清空记录
          </button>
        </div>
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">5. 测试记录（{tests.length}）</h2>
        {[...tests].reverse().slice(0, 30).map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded border border-line/50 p-1.5 text-[10px]">
            {t.outputUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.outputUrl} alt="" className="h-10 w-8 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {t.caseLabel ?? "手动测试"} · {t.provider}
              </p>
              <p className="text-muted">
                {t.success ? "ok" : "fail"} · {t.latencyMs}ms · ${t.estimatedCost} {t.error ? `· ${t.error.slice(0, 40)}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                void deleteVtonTest(t.id).then(refreshTests);
              }}
              className="rounded border border-line px-2 py-1 text-muted"
            >
              删
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

async function resizedDataUrl(dataUrl: string): Promise<string> {
  const blob = await dataUrlToBlob(dataUrl);
  return loadThumb(blob, 512);
}
