"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { labEnabled, getApiKey, setApiKey, hasApiKey } from "@/lib/ai/config";
import { contractVTONProviders } from "@/lib/ai/vton/registry";
import { BENCHMARK_CASES } from "@/lib/ai/vton/benchmark";
import { runVTONToCompletion, type VTONCategory, type VirtualTryOnProvider, type VTONResult } from "@/lib/ai/vton/contract";
import { computeProviderStats, compositeQuality, errorCodeList, type VtonQualityScore } from "@/lib/ai/vton/stats";
import {
  clearVtonTests,
  deleteVtonTest,
  getAllVtonTests,
  putVtonTest,
  type VtonTestRecord,
} from "@/lib/db";
import { blobToDataUrl } from "@/lib/ai/vton/helpers";
import { DEMO_ITEMS } from "@/lib/seed";
import { uid } from "@/lib/format";

const CATEGORIES: VTONCategory[] = ["top", "outerwear", "bottom", "dress"];

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

async function resizedDataUrl(dataUrl: string): Promise<string> {
  const blob = await dataUrlToBlob(dataUrl);
  return loadThumb(blob, 512);
}

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
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

function isCloud(p: VirtualTryOnProvider): boolean {
  return Boolean(p.isCloud);
}

export default function VtonLabPage() {
  const enabled = labEnabled();
  const [openaiKey, setOpenaiKey] = useState(() => getApiKey("openai") ?? "");
  const [personBlob, setPersonBlob] = useState<Blob | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [garmentBlob, setGarmentBlob] = useState<Blob | null>(null);
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<VTONCategory>("top");
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => contractVTONProviders()[0]?.id ?? "");
  const [results, setResults] = useState<Record<string, VTONResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [tests, setTests] = useState<VtonTestRecord[]>([]);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchProgress, setBenchProgress] = useState("");
  const [alibabaHealth, setAlibabaHealth] = useState<{
    configured: boolean;
    keyPresent: boolean;
    allowEnabled: boolean;
  } | null>(null);
  const [qualityDrafts, setQualityDrafts] = useState<Record<string, VtonQualityScore>>({});
  const [editingQuality, setEditingQuality] = useState<string | null>(null);
  const personInput = useRef<HTMLInputElement>(null);
  const garmentInput = useRef<HTMLInputElement>(null);

  const providers = useMemo(() => contractVTONProviders(), []);
  const selectedProvider = providers.find((p) => p.id === selectedProviderId) ?? providers[0];

  useEffect(() => {
    void getAllVtonTests().then(setTests);
    fetch("/api/vton/health")
      .then((r) => r.json())
      .then((d) => setAlibabaHealth(d as typeof alibabaHealth))
      .catch(() => setAlibabaHealth(null));
  }, []);

  const refreshTests = useCallback(() => {
    void getAllVtonTests().then(setTests);
  }, []);

  const providerReady = (p: VirtualTryOnProvider): boolean => {
    if (p.id === "openai-image-edit") return hasApiKey("openai");
    if (p.id === "alibaba-vton") return alibabaHealth?.configured === true;
    return true;
  };

  const providerStatus = (p: VirtualTryOnProvider): string => {
    if (p.id === "openai-image-edit") return providerReady(p) ? "已配置 Key" : "无 Key";
    if (p.id === "alibaba-vton") {
      if (alibabaHealth === null) return "未连接代理";
      if (alibabaHealth.configured) return "服务端已启用";
      if (!alibabaHealth.keyPresent) return "服务端缺 Key";
      if (!alibabaHealth.allowEnabled) return "服务端默认关闭";
    }
    return "就绪";
  };

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
    res: VTONResult,
    opts?: { caseId?: string; caseLabel?: string; category?: string },
  ) => {
    const record: VtonTestRecord = {
      id: uid(),
      createdAt: new Date().toISOString(),
      caseId: opts?.caseId,
      caseLabel: opts?.caseLabel,
      provider: p.id,
      category: opts?.category ?? category,
      personThumb: personBlob ? await loadThumb(personBlob, 96).catch(() => undefined) : undefined,
      garmentThumb: garmentBlob ? await loadThumb(garmentBlob, 96).catch(() => undefined) : undefined,
      outputUrl: res.imageUrl ? await resizedDataUrl(res.imageUrl).catch(() => res.imageUrl) : undefined,
      latencyMs: Math.round(res.latencyMs),
      estimatedCost: res.estimatedCostUsd ?? 0,
      success: res.success,
      error: res.errorMessage,
      errorCode: res.errorCode,
    };
    await putVtonTest(record);
  };

  const runOne = async (p: VirtualTryOnProvider) => {
    if (!personBlob || !garmentBlob) return;
    setRunning(p.id);
    try {
      const input = {
        personImage: await blobToDataUrl(personBlob),
        garmentImage: await blobToDataUrl(garmentBlob),
        garmentCategory: category,
      };
      const res = await runVTONToCompletion(p, input);
      setResults((prev) => ({ ...prev, [p.id]: res }));
      await saveResult(p, res);
      refreshTests();
    } finally {
      setRunning(null);
    }
  };

  const runCases = async (providerList: VirtualTryOnProvider[], label: string) => {
    if (benchRunning) return;
    const cloud = providerList.filter(isCloud);
    if (cloud.length) {
      const costCny = cloud.length * BENCHMARK_CASES.length * 0.2;
      if (
        !window.confirm(
          `运行全部 20 组将调用云端 Provider（${cloud.map((c) => c.name).join("、")}），预计费用约 ¥${costCny.toFixed(1)}，是否继续？`,
        )
      ) {
        return;
      }
    }
    setBenchRunning(true);
    let count = 0;
    const total = BENCHMARK_CASES.length * providerList.length;
    try {
      for (const c of BENCHMARK_CASES) {
        const personBlob = await fetch(c.personUrl).then((r) => r.blob());
        const item = DEMO_ITEMS.find((i) => i.id === c.garmentItemId);
        if (!item) continue;
        const garmentBlob = await dataUrlToBlob(item.imageUrl);
        const personImage = await blobToDataUrl(personBlob);
        const garmentImage = await blobToDataUrl(garmentBlob);
        for (const p of providerList) {
          if (!providerReady(p)) continue;
          count++;
          setBenchProgress(`(${count}/${total}) ${c.label} · ${p.name}`);
          const res = await runVTONToCompletion(p, {
            personImage,
            garmentImage,
            garmentCategory: c.category,
            metadata: { caseId: c.id, caseLabel: c.label },
          });
          await saveResult(p, res, { caseId: c.id, caseLabel: c.label, category: c.category });
        }
      }
      setBenchProgress(`完成 ${count} 组（${label}）`);
    } finally {
      setBenchRunning(false);
      refreshTests();
    }
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      dataset: "VTON_BENCHMARK_20",
      categories: CATEGORIES,
      providers: providers.map((p) => ({ id: p.id, name: p.name, isCloud: Boolean(p.isCloud) })),
      stats: computeProviderStats(tests),
      tests,
    };
    download(`VTON_BENCHMARK_${todayStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportMd = () => {
    const stats = computeProviderStats(tests);
    const rows = stats
      .map(
        (s) =>
          `| ${s.provider} | ${s.successRate.toFixed(0)}% (${s.success}/${s.runs}) | ${s.p50LatencyMs}ms | ${s.p95LatencyMs}ms | $${s.avgCostUsdPerSuccess.toFixed(3)} | ${s.avgQualityComposite ? s.avgQualityComposite.toFixed(2) : "—"} |`,
      )
      .join("\n");
    const errRows = errorCodeList()
      .map((code) => {
        const n = tests.filter((t) => !t.success && (t.errorCode ?? "UNKNOWN") === code).length;
        return `| ${code} | ${n} |`;
      })
      .join("\n");
    const md = `# VTON Benchmark 报告（${todayStamp()}）

## 测试环境
- 日期：${new Date().toISOString()}
- 数据集：VTON_BENCHMARK_20（T恤×5 / 衬衫×5 / 外套×5 / 连衣裙×5）
- Provider：${providers.map((p) => `${p.id}（${p.name}）`).join("、")}

## 汇总
| Provider | 成功率 | P50 | P95 | 平均成本 | 质量评分 |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows || "| （暂无数据） | - | - | - | - | - |"}

## 失败原因
| 错误码 | 次数 |
| --- | ---: |
${errRows}

## 备注
- 云端 Provider 仅在 /lab/vton 使用；默认 VTON_PROVIDER=mock，生产不调用云端 VTON。
- 人工质量评分权重：人脸保持20% + 人体保持15% + 衣服还原25% + 边缘自然度10% + 遮挡关系10% + 颜色/纹理10% + 速度5% + 成本5%。
`;
    download(`VTON_BENCHMARK_${todayStamp()}.md`, md, "text/markdown; charset=utf-8");
  };

  const saveQuality = async (recordId: string) => {
    const draft = qualityDrafts[recordId];
    const rec = tests.find((t) => t.id === recordId);
    if (!draft || !rec) return;
    const composite = compositeQuality(draft, rec.latencyMs, rec.estimatedCost);
    const updated: VtonTestRecord = { ...rec, quality: { ...draft, composite } };
    await putVtonTest(updated);
    setEditingQuality(null);
    refreshTests();
  };

  if (!enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">VTON 实验室未启用</p>
        <p className="text-xs text-muted">需要 NEXT_PUBLIC_ENABLE_LAB=true 构建</p>
      </div>
    );
  }

  const stats = computeProviderStats(tests);
  const readyCount = providers.filter(providerReady).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 font-mono text-sm">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <h1 className="text-lg font-bold">LAB / VTON · Phase 6B</h1>
        <Link href="/" className="text-xs text-muted">
          ‹ 返回
        </Link>
      </header>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">1. 配置</h2>
        <label className="block text-xs">
          OpenAI API Key（仅本地保存，用于 gpt-image-1 / 检测）
          <input
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            onBlur={saveKey}
            type="password"
            placeholder="sk-…"
            className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {providers.map((p) => (
            <span
              key={p.id}
              className={`rounded px-2 py-1 text-xs ${providerReady(p) ? "bg-green-100 text-green-800" : "bg-sand text-muted"}`}
            >
              {p.id} · {providerStatus(p)}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-muted">
          阿里云 Key 仅存在于服务端环境变量；云端 VTON 默认关闭，仅实验室可用。
        </p>
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
              {personPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={personPreview} alt="person" className="h-full w-full object-cover" />
              ) : (
                "上传人物照片"
              )}
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
              {garmentPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={garmentPreview} alt="garment" className="h-full w-full object-contain" />
              ) : (
                "上传衣物照片"
              )}
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
        <label className="block text-xs">
          类别（手动运行）
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VTONCategory)}
            className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">3. Provider 与生成</h2>
        <div className="space-y-1">
          {providers.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded border border-line/60 px-2 py-1.5 text-xs">
              <input
                type="radio"
                name="vton-provider"
                checked={selectedProviderId === p.id}
                onChange={() => setSelectedProviderId(p.id)}
              />
              <span className="flex-1">{p.name}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${providerReady(p) ? "bg-green-100 text-green-800" : "bg-sand text-muted"}`}
              >
                {providerReady(p) ? "ready" : providerStatus(p)}
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => void runOne(selectedProvider)}
            disabled={!personBlob || !garmentBlob || running === selectedProvider.id || benchRunning}
            className="rounded bg-ink px-3 py-2 text-white disabled:opacity-40"
          >
            {running === selectedProvider.id ? "运行中…" : "运行当前 Provider"}
          </button>
          <button
            onClick={() => void runCases([selectedProvider], "当前 Provider")}
            disabled={benchRunning}
            className="rounded bg-accent px-3 py-2 text-white disabled:opacity-40"
          >
            运行当前 Provider × 全部 20 组
          </button>
          <button
            onClick={() => void runCases(providers.filter(providerReady), "全部可用 Provider")}
            disabled={benchRunning || readyCount === 0}
            className="rounded bg-accent px-3 py-2 text-white disabled:opacity-40"
          >
            运行全部 Benchmark（20 组 × {readyCount} 可用）
          </button>
        </div>
        {benchProgress && <p className="text-xs text-muted">{benchProgress}</p>}
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
          {Object.entries(results).map(([id, r]) => (
            <div key={id} className="rounded border border-line p-2">
              <p className="text-xs font-bold">{id}</p>
              {r.success ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt="tryon result" className="mt-1 w-full rounded" />
              ) : (
                <p className="mt-1 text-xs text-red-600">
                  {r.errorCode ? `[${r.errorCode}] ` : ""}
                  {r.errorMessage ?? "生成失败"}
                </p>
              )}
              <p className="mt-1 text-[10px] text-muted">
                latency {Math.round(r.latencyMs)}ms · cost ${(r.estimatedCostUsd ?? 0).toFixed(3)} ·{" "}
                {r.success ? "ok" : "fail"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded border border-line p-3">
        <h2 className="font-bold">4. Benchmark 统计（20 组固定数据集）</h2>
        {stats.length > 0 && (
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-line">
                <th className="py-1">provider</th>
                <th>成功率</th>
                <th>P50</th>
                <th>P95</th>
                <th>最快/最慢</th>
                <th>总成本</th>
                <th>质量</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.provider} className="border-b border-line/50">
                  <td className="py-1">{s.provider}</td>
                  <td>
                    {s.successRate.toFixed(0)}% ({s.success}/{s.runs})
                  </td>
                  <td>{s.p50LatencyMs}ms</td>
                  <td>{s.p95LatencyMs}ms</td>
                  <td>
                    {s.fastestMs}/{s.slowestMs}ms
                  </td>
                  <td>${s.totalCostUsd.toFixed(3)}</td>
                  <td>{s.avgQualityComposite ? s.avgQualityComposite.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {stats.some((s) => s.failed > 0) && (
          <div className="text-[11px]">
            <p className="font-bold">失败原因统计</p>
            {errorCodeList()
              .map((code) => ({ code, n: tests.filter((t) => !t.success && (t.errorCode ?? "UNKNOWN") === code).length }))
              .filter((x) => x.n > 0)
              .map((x) => (
                <span key={x.code} className="mr-2 rounded bg-red-50 px-1.5 py-0.5 text-red-600">
                  {x.code} × {x.n}
                </span>
              ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="rounded border border-line px-3 py-1.5 text-xs">
            导出 VTON_BENCHMARK JSON
          </button>
          <button onClick={exportMd} className="rounded border border-line px-3 py-1.5 text-xs">
            导出 VTON_BENCHMARK MD
          </button>
          <button
            onClick={() => {
              if (window.confirm("清空全部 Benchmark 记录？")) void clearVtonTests().then(refreshTests);
            }}
            className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-500"
          >
            清空记录
          </button>
        </div>
      </section>

      <section className="space-y-1 rounded border border-line p-3">
        <h2 className="font-bold">5. 测试记录（{tests.length}）</h2>
        {[...tests].reverse().slice(0, 40).map((t) => (
          <div key={t.id} className="rounded border border-line/50 p-1.5 text-[10px]">
            <div className="flex items-center gap-2">
              {t.outputUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.outputUrl} alt="" className="h-10 w-8 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {t.caseLabel ?? "手动测试"} · {t.provider} · {t.category}
                </p>
                <p className="text-muted">
                  {t.success ? "ok" : "fail"} · {t.latencyMs}ms · ${t.estimatedCost.toFixed(3)}
                  {t.errorCode ? ` · [${t.errorCode}]` : ""}
                  {t.quality?.composite ? ` · Q=${t.quality.composite.toFixed(2)}` : ""}
                  {t.error ? ` · ${t.error.slice(0, 48)}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {t.success && (
                  <button
                    onClick={() => {
                      setEditingQuality(editingQuality === t.id ? null : t.id);
                      setQualityDrafts((prev) => ({
                        ...prev,
                        [t.id]: t.quality
                          ? { ...t.quality }
                          : { face: 3, body: 3, garment: 3, edge: 3, occlusion: 3, texture: 3 },
                      }));
                    }}
                    className="rounded border border-line px-2 py-0.5 text-muted"
                  >
                    {editingQuality === t.id ? "收起" : t.quality?.composite ? "改分" : "评分"}
                  </button>
                )}
                <button
                  onClick={() => {
                    void deleteVtonTest(t.id).then(refreshTests);
                  }}
                  className="rounded border border-line px-2 py-0.5 text-muted"
                >
                  删
                </button>
              </div>
            </div>
            {editingQuality === t.id && t.success && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line/50 pt-2">
                {(
                  [
                    ["face", "人脸保持"],
                    ["body", "人体保持"],
                    ["garment", "衣服还原"],
                    ["edge", "边缘自然度"],
                    ["occlusion", "遮挡关系"],
                    ["texture", "颜色/纹理"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1 text-[10px]">
                    <span className="flex-1">{label}</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={qualityDrafts[t.id]?.[key] ?? 3}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                        setQualityDrafts((prev) => ({
                          ...prev,
                          [t.id]: {
                            ...(prev[t.id] ?? { face: 3, body: 3, garment: 3, edge: 3, occlusion: 3, texture: 3 }),
                            [key]: v,
                          },
                        }));
                      }}
                      className="w-12 rounded border border-line bg-surface px-1 py-0.5 text-right"
                    />
                  </label>
                ))}
                <div className="col-span-2 flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted">
                    综合分（自动）：
                    {qualityDrafts[t.id] ? compositeQuality(qualityDrafts[t.id], t.latencyMs, t.estimatedCost).toFixed(2) : "—"}
                  </span>
                  <button onClick={() => void saveQuality(t.id)} className="rounded bg-ink px-3 py-1 text-[10px] text-white">
                    保存评分
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
