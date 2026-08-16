"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { isBetaUser } from "@/lib/beta/storage";
import { track } from "@/lib/beta/track";
import { AlibabaAITryOnProvider, DASHSCOPE_PRICE_CNY } from "@/lib/ai/vton/providers/alibaba";
import type { VTONResult } from "@/lib/ai/vton/contract";
import { putVtonTest, type VtonTestRecord } from "@/lib/db";
import { uid } from "@/lib/format";
import type { Category, WardrobeItem } from "@/lib/types";

const TRYON_CATEGORIES: Category[] = ["top", "outerwear", "dress"];
const LOADING_MESSAGES = [
  "正在生成你的穿搭效果...",
  "正在调整服装比例...",
  "正在优化真实效果...",
];

function loadThumb(dataUrl: string, max = 512): Promise<string> {
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
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("thumb"));
    img.src = dataUrl;
  });
}

function friendlyError(res: VTONResult | null): string {
  if (!res) return "生成失败，请稍后重试";
  const msg = `${res.errorMessage ?? ""}`;
  if (res.errorCode === "IMAGE_ERROR" || /person|人物|image|图片/.test(msg)) {
    return "建议上传：正面全身照片";
  }
  if (res.errorCode === "TIMEOUT") return "生成超时，请稍后重试";
  return "生成失败，请稍后重试";
}

export default function TryOnPage() {
  const { userModel, wardrobe } = useAppData();
  const { show, toast } = useToast();
  const provider = useMemo(() => new AlibabaAITryOnProvider(), []);
  const [health, setHealth] = useState<{ configured: boolean } | null>(null);
  const [selected, setSelected] = useState<WardrobeItem | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "result" | "error">("idle");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<VTONResult | null>(null);
  const [error, setError] = useState("");
  const [rated, setRated] = useState<number | null>(null);
  const [payAnswered, setPayAnswered] = useState(false);
  const retried = useRef(0);
  const currentRecord = useRef<VtonTestRecord | null>(null);

  const personImage = userModel?.modelImage ?? "";
  const garments = useMemo(
    () => wardrobe.filter((i) => TRYON_CATEGORIES.includes(i.category)),
    [wardrobe],
  );

  useEffect(() => {
    fetch("/api/vton/health")
      .then((r) => r.json())
      .then((d) => setHealth(d as typeof health))
      .catch(() => setHealth(null));
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

  if (!isBetaUser()) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">AI 真实试穿仅对 Beta 测试用户开放</p>
        <Link href="/" className="text-xs text-muted">
          ‹ 返回
        </Link>
      </div>
    );
  }

  const saveResultRecord = async (res: VTONResult, category?: string) => {
    try {
      const record: VtonTestRecord = {
        id: uid(),
        createdAt: new Date().toISOString(),
        caseLabel: "AI真实试穿",
        provider: "beta-tryon",
        category: category ?? "top",
        outputUrl: res.imageUrl ? await loadThumb(res.imageUrl, 512).catch(() => res.imageUrl) : undefined,
        latencyMs: Math.round(res.latencyMs),
        estimatedCost: res.estimatedCostUsd ?? 0,
        success: res.success,
        error: res.errorMessage,
        errorCode: res.errorCode,
      };
      await putVtonTest(record);
      currentRecord.current = record;
    } catch {
      // 保存失败不影响主流程
    }
  };

  const runOnce = async (): Promise<VTONResult | null> => {
    try {
      const input = {
        personImage: personImage,
        garmentImage: selected?.transparentImageUrl ?? selected?.imageUrl ?? "",
        garmentCategory: (selected?.category ?? "top") as "top" | "outerwear" | "dress",
      };
      const task = await provider.createTryOn(input);
      if (task.status === "failed" && task.result) return task.result;
      if (task.status === "succeeded" && task.result) return task.result;
      let cur = task;
      const start = performance.now();
      while (performance.now() - start < 180_000) {
        await new Promise((r) => setTimeout(r, 3000));
        cur = await provider.getTaskStatus!(task.taskId);
        if (cur.status === "succeeded" || cur.status === "failed") break;
      }
      if (cur.result) return cur.result;
      return {
        success: false,
        provider: provider.id,
        latencyMs: performance.now() - start,
        estimatedCostUsd: 0,
        errorCode: "TIMEOUT",
        errorMessage: "生成超时",
      };
    } catch (e) {
      return {
        success: false,
        provider: provider.id,
        latencyMs: 0,
        estimatedCostUsd: 0,
        errorCode: "UNKNOWN",
        errorMessage: e instanceof Error ? e.message : "生成失败",
      };
    }
  };

  const generate = async () => {
    if (!selected || phase === "loading") return;
    retried.current = 0;
    setPhase("loading");
    setLoadingMsg(LOADING_MESSAGES[0]);
    setError("");
    setResult(null);
    setRated(null);
    await track("vton_started", { provider: "alibaba", page: "tryon" });
    let res = await runOnce();
    if (res && res.errorCode === "TIMEOUT" && retried.current < 1) {
      retried.current++;
      setLoadingMsg("网络波动，正在自动重试…");
      res = await runOnce();
    }
    if (res?.success) {
      await track("vton_completed", {
        provider: "alibaba",
        durationMs: Math.round(res.latencyMs),
        costEstimateUsd: res.estimatedCostUsd,
        costEstimateCny: DASHSCOPE_PRICE_CNY,
        success: true,
        page: "tryon",
      });
      await saveResultRecord(res, selected.category);
      setResult(res);
      setPhase("result");
    } else {
      await track("vton_completed", {
        provider: "alibaba",
        durationMs: Math.round(res?.latencyMs ?? 0),
        success: false,
        page: "tryon",
      });
      setError(friendlyError(res));
      setPhase("error");
    }
  };

  const markSaved = async (savedTo: "favorite" | "outfit") => {
    await track("vton_saved", { savedTo, page: "tryon" });
    if (currentRecord.current) {
      const rec: VtonTestRecord = {
        ...currentRecord.current,
        favorite: savedTo === "favorite" ? true : currentRecord.current.favorite,
        savedTo,
      };
      await putVtonTest(rec);
      currentRecord.current = rec;
    }
    show(savedTo === "favorite" ? "已收藏 ❤️" : "已加入我的穿搭");
  };

  const rate = async (score: number, helpful?: boolean) => {
    setRated(score);
    await track("vton_rated", { score, helpful, page: "tryon" });
  };

  const payChoice = async (choice: "A" | "B" | "C") => {
    setPayAnswered(true);
    await track("vton_pay_intent", { payChoice: choice, page: "tryon" });
    show(choice === "A" ? "收到，感谢反馈" : choice === "B" ? "收到，价格敏感" : "收到，感谢反馈");
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <Link href="/dress" prefetch={false} className="text-sm text-muted">
          ‹ 返回换装间
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-wide text-ink">AI 真实试穿</h1>
        <span className="w-9" />
      </header>

      <div className="space-y-4 px-5 pt-2">
        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">我的模特照片</p>
          <div className="mt-2 flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={personImage} alt="model" className="h-40 w-30 rounded-2xl border border-line object-cover" />
            <div className="text-[11px] leading-relaxed text-muted">
              <p>使用你在换装间的全身照</p>
              <p>建议：正面、全身、光线正常</p>
              <Link href="/dress" className="mt-1 inline-block text-accent">
                去换装间更换照片 ›
              </Link>
            </div>
          </div>
          {health?.configured === false && (
            <p className="mt-2 rounded-xl bg-sand px-3 py-2 text-[11px] text-muted">
              AI 真实试穿功能尚未开启（等待服务端配置）
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">选择要试穿的衣物（{garments.length} 件可选）</p>
          {garments.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-sand p-4 text-center text-sm text-muted">
              衣橱还没有可用衣物
              <Link href="/wardrobe" className="mt-1 block text-accent">
                去添加衣服 ›
              </Link>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {garments.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className={`rounded-2xl border p-2 transition active:scale-[0.98] ${
                    selected?.id === g.id ? "border-accent bg-accent-soft" : "border-line bg-sand/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.imageUrl} alt={g.name} className="h-20 w-full rounded-xl object-contain" />
                  <p className="mt-1 truncate text-[10px] text-ink">{g.name}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {phase === "idle" && (
          <button
            onClick={() => void generate()}
            disabled={!selected || health?.configured === false}
            className="w-full rounded-full bg-accent py-4 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(185,106,75,0.3)] transition active:scale-[0.98] disabled:opacity-40"
          >
            ✨ AI 真实试穿
          </button>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface py-12 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-sm text-muted">{loadingMsg}</p>
            <p className="text-[11px] text-muted">通常需要 15~30 秒，请稍等</p>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3 rounded-3xl border border-line bg-surface p-5 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => void generate()}
                className="flex-1 rounded-full bg-ink py-3 text-sm text-white"
              >
                再试一次
              </button>
              <Link href="/dress" className="flex-1 rounded-full border border-line py-3 text-center text-sm text-ink">
                返回换装间
              </Link>
            </div>
          </div>
        )}

        {phase === "result" && result?.success && (
          <section className="space-y-3 rounded-3xl border border-line bg-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted">原图</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={personImage} alt="original" className="mt-1 w-full rounded-2xl border border-line object-cover" />
              </div>
              <div>
                <p className="text-[10px] text-muted">AI 结果</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.imageUrl} alt="result" className="mt-1 w-full rounded-2xl border border-line object-cover" />
              </div>
            </div>
            <p className="text-center text-[10px] text-muted">
              生成耗时 {Math.round(result.latencyMs / 1000)}s · 本次体验成本 ¥{DASHSCOPE_PRICE_CNY}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void markSaved("favorite")}
                className="rounded-full border border-line py-2.5 text-sm text-ink"
              >
                ❤️ 收藏
              </button>
              <button
                onClick={() => {
                  void track("vton_retry", { page: "tryon" });
                  void generate();
                }}
                className="rounded-full border border-line py-2.5 text-sm text-ink"
              >
                🔄 再试一次
              </button>
              <button
                onClick={() => void markSaved("outfit")}
                className="col-span-2 rounded-full bg-ink py-2.5 text-sm text-white"
              >
                📂 加入我的穿搭
              </button>
            </div>
            <div className="border-t border-line/60 pt-3">
              <p className="text-center text-xs text-muted">这个效果对你有帮助吗？</p>
              <div className="mt-2 flex justify-center gap-3">
                <button
                  onClick={() => void rate(5, true)}
                  className={`rounded-full border px-5 py-1.5 text-sm ${rated === 5 ? "border-accent bg-accent-soft text-accent" : "border-line"}`}
                >
                  👍 有帮助
                </button>
                <button
                  onClick={() => void rate(1, false)}
                  className={`rounded-full border px-5 py-1.5 text-sm ${rated === 1 ? "border-accent bg-accent-soft text-accent" : "border-line"}`}
                >
                  👎 没帮助
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted">给本次效果打个分</p>
              <div className="mt-1 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => void rate(s)}
                    className={`text-xl ${rated !== null && s <= rated ? "" : "opacity-30"}`}
                    aria-label={`评分 ${s}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            {!payAnswered && (
              <div className="rounded-2xl bg-sand p-3">
                <p className="text-center text-xs text-ink">如果每天生成次数有限，你是否愿意购买 AI 试穿次数？</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button onClick={() => void payChoice("A")} className="rounded-full border border-line py-2 text-xs">
                    A 愿意
                  </button>
                  <button onClick={() => void payChoice("B")} className="rounded-full border border-line py-2 text-xs">
                    B 看价格
                  </button>
                  <button onClick={() => void payChoice("C")} className="rounded-full border border-line py-2 text-xs">
                    C 不需要
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
      {toast}
    </div>
  );
}
