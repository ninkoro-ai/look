"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { IconChevronRight, IconHeart, IconX } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { uid } from "@/lib/format";
import { emptyOutfit, slotFor, toggleItem } from "@/lib/outfitEngine";
import { useAppData } from "@/hooks/useAppData";
import type { Category, Outfit } from "@/lib/types";

function DressRoom() {
  const { userModel, wardrobe, outfits, recommendations, toggleOutfitFavorite } = useAppData();
  const searchParams = useSearchParams();
  const editId = searchParams.get("outfit");
  const { show, toast } = useToast();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [category, setCategory] = useState<Category>("top");

  // 渲染期初始化：数据就绪后自动载入初始搭配
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
    <div className="pb-6">
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch={false} className="text-sm text-muted">
            ‹ 返回
          </Link>
          <h1 className="font-display text-lg font-semibold tracking-wide text-ink">我的换装间</h1>
          <span className="w-9" />
        </div>
      </header>

      <div className="px-5">
        <div className="overflow-hidden rounded-[28px] bg-sand shadow-[inset_0_0_0_1px_rgba(42,36,32,0.04)]">
          <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={outfit} />
        </div>

        <button
          onClick={handleFavorite}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(185,106,75,0.28)] transition active:scale-[0.98]"
        >
          <IconHeart width={18} height={18} />
          收藏这套
        </button>

        {currentItems.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {currentItems.map(({ category: cat, items: slotItems }) => (
              <button
                key={cat}
                onClick={() => clearSlot(cat)}
                className="group flex items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-3 pr-2 text-xs text-ink"
              >
                <span className="text-muted">{CATEGORY_LABELS[cat]}</span>
                <span className="max-w-[8rem] truncate font-medium">
                  {slotItems.map((i) => i!.name).join("、")}
                </span>
                <IconX width={13} height={13} className="text-muted transition group-hover:text-accent" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar px-5">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition ${
              category === cat
                ? "bg-ink font-medium text-white"
                : "border border-line bg-surface text-ink"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 px-5">
        {items.map((item) => {
          const selected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              data-testid="pick-item"
              onClick={() => void handlePick(item.id)}
              className={`relative overflow-hidden rounded-2xl bg-surface p-2 transition active:scale-[0.97] ${
                selected
                  ? "ring-2 ring-accent"
                  : "border border-line shadow-[0_2px_8px_rgba(42,36,32,0.04)]"
              }`}
            >
              <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-sand p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="mt-1.5 truncate px-0.5 text-center text-[11px] text-ink">{item.name}</p>
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-muted">
            这个分类还没有衣服，去
            <Link href="/wardrobe" prefetch={false} className="mx-1 text-accent">
              衣橱
            </Link>
            添加一件吧
          </p>
        )}
      </div>

      <Link
        href="/wardrobe"
        prefetch={false}
        className="mx-5 mt-6 flex items-center justify-center gap-1 rounded-full border border-line bg-surface py-3 text-sm text-muted"
      >
        去衣橱添加更多单品
        <IconChevronRight width={15} height={15} />
      </Link>

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
