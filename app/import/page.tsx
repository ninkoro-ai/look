"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { IconCamera, IconTrash } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { CATEGORY_LABELS, LAYER_BY_CATEGORY } from "@/lib/constants";
import { uid } from "@/lib/format";
import { DEFAULT_ANCHOR } from "@/lib/assets";
import { detectGarments } from "@/lib/ai/garmentDetection";
import { extractGarment, cropPreview } from "@/lib/ai/garmentExtraction";
import { track } from "@/lib/beta/track";
import { useAppData } from "@/hooks/useAppData";
import { DEMO_ITEMS } from "@/lib/seed";
import type { Category, DetectedGarment, WardrobeItem } from "@/lib/types";

type Phase = "upload" | "detecting" | "review" | "extracting" | "done";

interface ReviewItem {
  garment: DetectedGarment;
  previewUrl: string;
  removed: boolean;
}

export default function ImportPage() {
  const { addItem } = useAppData();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [imported, setImported] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState<Category>("top");

  const reset = () => {
    setPhase("upload");
    setPhotoBlob(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setItems([]);
    setError("");
    setProgress(null);
    setImported(0);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    void track("garment_upload_started", { source: "outfit_photo", page: "import" });
    setError("");
    setPhase("detecting");
    const previewUrl = URL.createObjectURL(file);
    setPhotoBlob(file);
    setPhotoPreview(previewUrl);
    try {
      const detections = await detectGarments(file);
      const img = new Image();
      img.src = previewUrl;
      await img.decode();
      const review: ReviewItem[] = detections.map((garment) => ({
        garment,
        previewUrl: cropPreview(img, garment.boundingBox, 220),
        removed: false,
      }));
      setItems(review);
      setPhase("review");
      void track("garment_detection_completed", { detectedCount: detections.length, page: "import" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "识别失败，请换一张照片");
      setPhase("upload");
    }
  };

  const updateCategory = (id: string, category: Category) => {
    setItems((prev) =>
      prev.map((it) => (it.garment.id === id ? { ...it, garment: { ...it.garment, category } } : it)),
    );
  };

  const updateName = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((it) => (it.garment.id === id ? { ...it, garment: { ...it.garment, name } } : it)),
    );
  };

  const toggleRemove = (id: string) => {
    setItems((prev) => prev.map((it) => (it.garment.id === id ? { ...it, removed: !it.removed } : it)));
  };

  const kept = items.filter((it) => !it.removed);

  const confirmImport = async () => {
    if (!photoBlob || kept.length === 0) return;
    setPhase("extracting");
    setProgress({ done: 0, total: kept.length });
    let count = 0;
    for (let i = 0; i < kept.length; i++) {
      const it = kept[i];
      try {
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
        void track("garment_added", { category: it.garment.category, source: "outfit_photo", page: "import" });
        count++;
      } catch {
        // 单个失败不中断整体导入
      }
      setProgress({ done: i + 1, total: kept.length });
    }
    setImported(count);
    setPhase("done");
    void track("garment_detection_completed", {
      detectedCount: kept.length,
      confirmedCount: count,
      page: "import",
    });
  };

  const manualAdd = async () => {
    const cat = manualCategory;
    const finalName = manualName.trim() || CATEGORY_LABELS[cat];
    const placeholder = DEMO_ITEMS.find((i) => i.category === cat);
    const garment: WardrobeItem = {
      id: uid(),
      category: cat,
      name: finalName,
      imageUrl: placeholder?.transparentImageUrl ?? placeholder?.imageUrl ?? "",
      transparentImageUrl: placeholder?.transparentImageUrl,
      source: "manual",
      color: placeholder?.color,
      style: placeholder?.style,
      season: placeholder?.season,
      layer: LAYER_BY_CATEGORY[cat],
      anchor: DEFAULT_ANCHOR[cat],
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    await addItem(garment);
    void track("garment_added", { category: cat, source: "single_item", page: "import-manual" });
    setImported(1);
    setManualOpen(false);
    setPhase("done");
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <Link href="/wardrobe" prefetch={false} className="text-sm text-muted">
          ‹ 返回衣橱
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-wide text-ink">从穿搭照片添加</h1>
        <span className="w-9" />
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      <div className="px-5">
        {phase === "upload" && (
          <div className="space-y-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-line bg-surface py-14 transition active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                <IconCamera width={26} height={26} />
              </span>
              <span className="text-[15px] font-medium text-ink">上传一张穿搭照片</span>
              <span className="text-xs text-muted">AI 会自动识别照片里的上衣、外套、裤子等单品</span>
            </button>
            <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
              <p className="mb-1 font-medium text-ink">识别小贴士</p>
              <p>・衣物与背景区分明显，识别更准</p>
              <p>・全身穿搭照可以一次拆出多件</p>
              <p>・识别结果需人工确认后才会加入衣橱</p>
            </div>
            {error && (
              <div className="space-y-2">
                <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-full border border-line py-3 text-sm text-ink"
                  >
                    重新上传
                  </button>
                  <button
                    onClick={() => setManualOpen((v) => !v)}
                    className="flex-1 rounded-full border border-line py-3 text-sm text-ink"
                  >
                    手动添加一件
                  </button>
                </div>
                {manualOpen && (
                  <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
                    <p className="text-sm font-medium text-ink">手动添加衣服</p>
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="衣服名称，如：白色短袖 T 恤"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                    />
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as Category)}
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void manualAdd()}
                      className="w-full rounded-full bg-accent py-3 text-sm font-medium text-white"
                    >
                      加入衣橱
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === "detecting" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-sm text-muted">AI 正在识别衣物…</p>
          </div>
        )}

        {phase === "review" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-ink px-4 py-3 text-white">
              <p className="text-[15px] font-medium">发现 {items.length} 件单品</p>
              <p className="mt-0.5 text-xs text-white/60">确认无误后一键加入衣橱</p>
            </div>

            {items.map((it) => (
              <div
                key={it.garment.id}
                data-testid="import-item"
                className={`rounded-3xl border bg-surface p-3 transition ${
                  it.removed ? "border-line opacity-45" : "border-line"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.previewUrl} alt={it.garment.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        value={it.garment.name}
                        onChange={(e) => updateName(it.garment.id, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-[15px] font-medium text-ink outline-none focus:border-line"
                      />
                      <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[10px] text-muted">
                        {Math.round(it.garment.confidence * 100)}%
                      </span>
                      <button
                        onClick={() => toggleRemove(it.garment.id)}
                        className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-red-50 hover:text-red-500"
                        aria-label={it.removed ? "恢复" : "删除"}
                      >
                        <IconTrash width={17} height={17} />
                      </button>
                    </div>
                    <select
                      value={it.garment.category}
                      onChange={(e) => updateCategory(it.garment.id, e.target.value as Category)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {it.removed && <p className="mt-1.5 text-xs text-muted">已取消，点垃圾桶恢复</p>}
                  </div>
                </div>
              </div>
            ))}

            <div className="sticky bottom-20 z-20">
              <button
                onClick={() => void confirmImport()}
                disabled={kept.length === 0}
                data-testid="import-confirm"
                className="w-full rounded-full bg-accent py-4 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(185,106,75,0.3)] transition active:scale-[0.98] disabled:opacity-40"
              >
                全部加入衣橱（{kept.length}）
              </button>
            </div>
          </div>
        )}

        {phase === "extracting" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-sm text-muted">
              正在生成透明素材 {progress?.done ?? 0}/{progress?.total ?? 0}…
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
              ✓
            </span>
            <div>
              <p className="text-lg font-semibold text-ink">已加入 {imported} 件单品</p>
              <p className="mt-1 text-sm text-muted">可以在衣橱里查看，或在换装间里使用它们</p>
            </div>
            <Link
              href="/wardrobe"
              prefetch={false}
              className="w-full rounded-full bg-accent py-4 text-[15px] font-medium text-white"
            >
              返回衣橱
            </Link>
            <button onClick={reset} className="w-full rounded-full border border-line py-3.5 text-sm text-ink">
              再添加一张照片
            </button>
          </div>
        )}
      </div>

      {toast}
    </div>
  );
}
