"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlibabaAITryOnProvider, DASHSCOPE_PRICE_CNY } from "@/lib/ai/vton/providers/alibaba";
import { adaptLegacyProvider, runVTONToCompletion, type VTONResult } from "@/lib/ai/vton/contract";
import { HybridMaskVTONProvider } from "@/lib/ai/vton/hybridMask";
import { blobToDataUrl } from "@/lib/ai/vton/uploader";
import { DEMO_MODELS, DEMO_GARMENTS, type DemoGarment, type DemoModel } from "@/lib/demo/tryonDemo";

const LOADING_MESSAGES = [
  "正在生成你的穿搭效果...",
  "正在调整服装比例...",
  "正在优化真实效果...",
];

function loadThumb(dataUrl: string, max = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("thumb"));
    img.src = dataUrl;
  });
}

export default function RealTryOnDemoPage() {
  const [models] = useState<DemoModel[]>(DEMO_MODELS);
  const [garments] = useState<DemoGarment[]>(DEMO_GARMENTS);
  const [model, setModel] = useState<DemoModel>(DEMO_MODELS[0]);
  const [garment, setGarment] = useState<DemoGarment>(DEMO_GARMENTS[0]);
  const [alibabaReady, setAlibabaReady] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "result" | "error">("idle");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<VTONResult | null>(null);
  const [error, setError] = useState("");
  const [providerUsed, setProviderUsed] = useState<"alibaba" | "local">("local");
  const provider = useMemo(() => new AlibabaAITryOnProvider(), []);
  const localProvider = useMemo(
    () => adaptLegacyProvider(new HybridMaskVTONProvider()),
    [],
  );

  useEffect(() => {
    fetch("/api/vton/health")
      .then((r) => r.json())
      .then((d) => setAlibabaReady(d?.alibaba === "ready"))
      .catch(() => setAlibabaReady(false));
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => {
      setLoadingMsg((m) => {
        const idx = LOADING_MESSAGES.indexOf(m);
        return LOADING_MESSAGES[(idx + 1) % LOADING_MESSAGES.length];
      });
    }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  const generate = async () => {
    if (phase === "loading") return;
    setPhase("loading");
    setLoadingMsg(LOADING_MESSAGES[0]);
    setError("");
    setResult(null);
    try {
      const personBlob = await fetch(model.imageUrl).then((r) => r.blob());
      const garmentBlob = await fetch(garment.imageUrl).then((r) => r.blob());
      const input = {
        personImage: await blobToDataUrl(personBlob),
        garmentImage: await blobToDataUrl(garmentBlob),
        garmentCategory: garment.category as "top" | "outerwear" | "bottom" | "dress",
        metadata: { caseLabel: `${model.name} × ${garment.name}` },
      };
      const useAlibaba = alibabaReady === true;
      setProviderUsed(useAlibaba ? "alibaba" : "local");
      const res = useAlibaba
        ? await runVTONToCompletion(provider, input, { pollIntervalMs: 3000, timeoutMs: 180_000 })
        : await runVTONToCompletion(localProvider, input, { pollIntervalMs: 3000, timeoutMs: 60_000 });
      if (res.success) {
        const thumb = res.imageUrl ? await loadThumb(res.imageUrl, 720).catch(() => res.imageUrl) : undefined;
        setResult({ ...res, imageUrl: thumb });
        setPhase("result");
      } else {
        setError(res.errorMessage ?? "生成失败，请稍后重试");
        setPhase("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请稍后重试");
      setPhase("error");
    }
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <Link href="/" prefetch={false} className="text-sm text-muted">
          ‹ 返回首页
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-wide text-ink">AI 真实试穿 · Demo</h1>
        <span className="w-9" />
      </header>

      <div className="space-y-4 px-5 pt-2">
        <section className="rounded-3xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">选择虚拟模特</p>
            <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-muted">
              云端 AI：{alibabaReady === true ? "READY" : alibabaReady === false ? "本地回退" : "检测中…"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m)}
                className={`rounded-2xl border p-2 text-center transition active:scale-[0.98] ${
                  model.id === m.id ? "border-accent bg-accent-soft" : "border-line bg-sand/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.name} className="h-32 w-full rounded-xl object-cover" />
                <p className="mt-1 text-[11px] font-medium text-ink">
                  {m.name} · {m.age}岁
                </p>
                <p className="text-[10px] text-muted">{m.style}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">选择衣物（{garments.length} 件透明素材）</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {garments.map((g) => (
              <button
                key={g.id}
                onClick={() => setGarment(g)}
                className={`rounded-2xl border p-1.5 transition active:scale-[0.98] ${
                  garment.id === g.id ? "border-accent bg-accent-soft" : "border-line bg-sand/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.name} className="h-14 w-full rounded-xl object-contain" />
                <p className="mt-0.5 truncate text-[9px] text-ink">{g.name}</p>
              </button>
            ))}
          </div>
        </section>

        {phase === "idle" && (
          <button
            onClick={() => void generate()}
            className="w-full rounded-full bg-accent py-4 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(185,106,75,0.3)] transition active:scale-[0.98]"
          >
            ✨ AI 试穿：{model.name} × {garment.name}
          </button>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface py-12 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-sm text-muted">{loadingMsg}</p>
            <p className="text-[11px] text-muted">
              {alibabaReady === true ? "云端 AI 生成中，通常 15~30 秒" : "本地演示生成中…"}
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3 rounded-3xl border border-line bg-surface p-5 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => void generate()}
              className="w-full rounded-full bg-ink py-3 text-sm text-white"
            >
              再试一次
            </button>
          </div>
        )}

        {phase === "result" && result?.success && (
          <section className="space-y-3 rounded-3xl border border-line bg-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-center text-[10px] text-muted">Before · 原图</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={model.imageUrl} alt="before" className="mt-1 w-full rounded-2xl border border-line object-cover" />
              </div>
              <div>
                <p className="text-center text-[10px] text-accent">After · AI 结果</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.imageUrl} alt="after" className="mt-1 w-full rounded-2xl border border-line object-cover" />
              </div>
            </div>
            <div className="rounded-2xl bg-sand p-3 text-center text-[11px] text-muted">
              <p>
                生成耗时：{Math.round(result.latencyMs / 1000)}s · Provider：
                {providerUsed === "alibaba" ? "Alibaba AITryOn" : "Local Segmentation（回退）"} · 成本估算：
                {providerUsed === "alibaba" ? `¥${DASHSCOPE_PRICE_CNY}/次` : "¥0"}
              </p>
              {providerUsed === "local" && (
                <p className="mt-1 text-[10px] text-muted">云端 AI 未开启，本次展示本地演示效果</p>
              )}
            </div>
            <button
              onClick={() => void generate()}
              className="w-full rounded-full bg-ink py-3 text-sm text-white"
            >
              🔄 换一套再试
            </button>
          </section>
        )}

        <p className="px-2 text-center text-[10px] leading-relaxed text-muted">
          演示素材为项目自有素材（虚拟模特照 + 透明衣物资产），无版权风险；不影响正式衣橱与用户数据。
        </p>
      </div>
    </div>
  );
}
