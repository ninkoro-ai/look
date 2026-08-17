"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { ModelSheet } from "@/components/ModelSheet";
import { IconChevronRight, IconHeart, IconSparkle, IconUser, IconX } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { uid } from "@/lib/format";
import { emptyOutfit, slotFor, toggleItem } from "@/lib/outfitEngine";
import { useAppData } from "@/hooks/useAppData";
import { track } from "@/lib/beta/track";
import { isBetaUser } from "@/lib/beta/storage";
import { vtonBetaEnabled } from "@/lib/ai/config";
import type { Category, Outfit } from "@/lib/types";

function DressRoom() {
  const { userModel, wardrobe, outfits, recommendations, toggleOutfitFavorite } = useAppData();
  const searchParams = useSearchParams();
  const editId = searchParams.get("outfit");
  const { show, toast } = useToast();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [category, setCategory] = useState<Category>("top");
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [vtonHealth, setVtonHealth] = useState<{ configured: boolean } | null>(null);

  useEffect(() => {
    void track("dress_page_viewed", { page: "dress" });
    fetch("/api/vton/health")
      .then((r) => r.json())
      .then((d) => setVtonHealth(d as typeof vtonHealth))
      .catch(() => setVtonHealth(null));
  }, []);

  const showTryOn = isBetaUser() && vtonBetaEnabled() && vtonHealth?.configured === true;

  if (!outfit) {
    const candidate = editId
      ? [...outfits, ...recommendations.map((r) => r.outfit)].find((o) => o.id === editId)
      : recommendations[0]?.outfit;
    if (candidate) {
      setOutfit({ ...candidate, id: uid(), source: "manual" });
    } else if (wardrobe.length > 0) {
      setOutfit(emptyOutfit());
    }
  }

  const currentItems = useMemo(() => {
    if (!outfit) return [];
    return CATEGORY_ORDER.map((cat) => {
      const slot = slotFor(cat);
      const ids = slot === "accessoryIds" ? (outfit.accessoryIds ?? []) : outfit[slot] ? [outfit[slot] as string] : [];
      return {
        category: cat,
        items: ids.map((id) => wardrobe.find((i) => i.id === id)).filter(Boolean),
      };
    }).filter((s) => s.items.length > 0);
  }, [outfit, wardrobe]);

  const items = useMemo(
    () => wardrobe.filter((i) => i.category === category),
    [wardrobe, category],
  );

  if (!outfit) return null;

  const selectedIds = new Set(
    [
      outfit.topId,
      outfit.outerwearId,
      outfit.bottomId,
      outfit.dressId,
      outfit.shoesId,
      outfit.bagId,
      ...(outfit.accessoryIds ?? []),
    ].filter((id): id is string => Boolean(id)),
  );

  const handlePick = async (id: string) => {
    const item = wardrobe.find((i) => i.id === id);
    if (!item) return;
    setOutfit((prev) => (prev ? toggleItem(prev, item) : prev));
  };

  const handleFavorite = async () => {
    const faved = await toggleOutfitFavorite(outfit);
    show(faved ? "已收藏这套搭配" : "已取消收藏");
  };

  const clearSlot = (cat: Category) => {
    setOutfit((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      (next as Record<string, unknown>)[slotFor(cat)] = undefined;
      return next;
    });
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch={false} className="text-sm text-muted">
            ‹ 返回
          </Link>
          <h1 className="font-display text-lg font-semibold tracking-wide text-ink">我的换装间</h1>
          <button
            onClick={() => setModelSheetOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted shadow-soft"
            aria-label="更换模特"
          >
            <IconUser width={19} height={19} />
          </button>
        </div>
      </header>

      <div className="px-5">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-b from-surface-soft to-sand shadow-soft">
          <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={outfit} />
        </div>

        {currentItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentItems.map(({ category: cat, items: slotItems }) => (
              <button
                key={cat}
                onClick={() => clearSlot(cat)}
                className="pressable group flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs text-ink shadow-soft"
              >
                <span className="text-muted">{CATEGORY_LABELS[cat]}</span>
                <span className="max-w-[8rem] truncate font-medium">
                  {slotItems.map((i) => i!.name).join("、")}
                </span>
                <IconX width={13} height={13} className="text-muted" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2.5">
          <button
            onClick={handleFavorite}
            className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(233,142,166,0.3)]"
          >
            <IconHeart width={18} height={18} />
            收藏这套
          </button>
          {showTryOn && (
            <Link
              href="/tryon"
              prefetch={false}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(23,23,23,0.18)]"
            >
              <IconSparkle width={18} height={18} />
              AI 真实试穿
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`pressable shrink-0 rounded-full px-4 py-2 text-[13px] ${
                category === cat
                  ? "bg-ink font-medium text-white"
                  : "card-hairline border-0 bg-surface text-ink"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar px-5 pb-1">
          {items.map((item) => {
            const selected = selectedIds.has(item.id);
            return (
              <button
                key={item.id}
                data-testid="pick-item"
                onClick={() => void handlePick(item.id)}
                className={`pressable relative w-[86px] shrink-0 overflow-hidden rounded-[18px] bg-surface p-2 shadow-soft ${
                  selected ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className="flex aspect-[4/5] items-center justify-center rounded-[14px] bg-surface-soft p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-1.5 truncate text-center text-[11px] text-ink">{item.name}</p>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
          {items.length === 0 && (
            <Link
              href="/wardrobe"
              prefetch={false}
              className="w-full shrink-0 rounded-[18px] bg-surface-soft py-10 text-center text-sm text-muted"
            >
              这个分类还没有衣服，去衣橱添加一件吧
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/wardrobe"
        prefetch={false}
        className="mx-5 mt-6 flex items-center justify-center gap-1 rounded-full border border-line bg-surface py-3 text-sm text-muted"
      >
        去衣橱添加更多单品
        <IconChevronRight width={15} height={15} />
      </Link>

      <ModelSheet open={modelSheetOpen} onClose={() => setModelSheetOpen(false)} onUpdated={show} />
      {toast}
    </div>
  );
}

export default function DressPage() {
  return (
    <Suspense>
      <DressRoom />
    </Suspense>
  );
}
