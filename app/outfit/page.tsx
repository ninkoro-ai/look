"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { IconChevronRight, IconHeart, IconTrash } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { CATEGORY_LABELS } from "@/lib/constants";
import { outfitSlots } from "@/lib/outfitEngine";
import { useAppData } from "@/hooks/useAppData";

function outfitIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/outfit\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function OutfitDetail() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathId = outfitIdFromPath(pathname);
  const id = searchParams.get("id") ?? pathId ?? "";
  const { userModel, wardrobe, outfits, recommendations, favorites, toggleOutfitFavorite, deleteOutfit } =
    useAppData();
  const { show, toast } = useToast();
  const [removed, setRemoved] = useState(false);

  const outfit = useMemo(
    () =>
      [...outfits, ...recommendations.map((r) => r.outfit)].find((o) => o.id === id),
    [id, outfits, recommendations],
  );

  const isFavorite = useMemo(
    () => favorites.some((f) => f.outfitId === id),
    [favorites, id],
  );

  if (!id || !outfit || removed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-muted">这套搭配不存在或已删除</p>
        <Link href="/" className="text-sm text-accent">
          返回首页
        </Link>
      </div>
    );
  }

  const slots = outfitSlots(outfit, wardrobe);

  const handleFavorite = async () => {
    const faved = await toggleOutfitFavorite(outfit);
    show(faved ? "已收藏" : "已取消收藏");
  };

  const handleDelete = async () => {
    await deleteOutfit(outfit.id);
    setRemoved(true);
    show("已删除这套搭配");
    window.location.href = "/";
  };

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <Link href="/" prefetch={false} className="text-sm text-muted">
          ‹ 返回
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-wide text-ink">穿搭详情</h1>
        <span className="w-9" />
      </header>

      <div className="px-5">
        <div className="overflow-hidden rounded-[28px] bg-sand shadow-[inset_0_0_0_1px_rgba(42,36,32,0.04)]">
          <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={outfit} />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => void handleFavorite()}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition active:scale-[0.98] ${
              isFavorite
                ? "border border-accent/30 bg-accent-soft text-accent-deep"
                : "bg-accent text-white shadow-[0_8px_20px_rgba(185,106,75,0.25)]"
            }`}
          >
            <IconHeart
              width={18}
              height={18}
              className={isFavorite ? "fill-accent stroke-accent" : ""}
            />
            {isFavorite ? "已收藏" : "收藏"}
          </button>
          <Link
            href={`/dress?outfit=${outfit.id}`}
            prefetch={false}
            className="flex h-12 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-surface text-[15px] font-medium text-ink transition active:scale-[0.98]"
          >
            去换装
            <IconChevronRight width={16} height={16} />
          </Link>
        </div>

        <section className="mt-6">
          <h2 className="px-1 text-[15px] font-semibold text-ink">搭配清单</h2>
          <div className="mt-3 space-y-2">
            {slots.length === 0 && (
              <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
                这套搭配没有单品了，去换装间重新搭一套吧
              </p>
            )}
            {slots.map(({ category, item }) => (
              <div
                key={`${category}-${item.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} draggable={false} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{CATEGORY_LABELS[category]}</p>
                </div>
                {item.isFavorite && (
                  <IconHeart width={16} height={16} className="shrink-0 fill-accent stroke-accent" />
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={() => void handleDelete()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-3 text-sm text-red-500 transition active:scale-[0.98]"
        >
          <IconTrash width={17} height={17} />
          删除这套搭配
        </button>
      </div>

      {toast}
    </div>
  );
}

export default function OutfitPage() {
  return (
    <Suspense>
      <OutfitDetail />
    </Suspense>
  );
}
