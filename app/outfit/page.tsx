"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { IconChevronRight, IconHeart, IconSparkle, IconTrash } from "@/components/icons";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = outfitIdFromPath(pathname);
  const id = searchParams.get("id") ?? pathId ?? "";
  const { userModel, wardrobe, outfits, recommendations, favorites, toggleOutfitFavorite, deleteOutfit } =
    useAppData();
  const { show, toast } = useToast();
  const [removed, setRemoved] = useState(false);

  const outfit = useMemo(
    () => [...outfits, ...recommendations.map((r) => r.outfit)].find((o) => o.id === id),
    [id, outfits, recommendations],
  );

  const rec = recommendations.find((r) => r.outfit.id === id);
  const isFavorite = useMemo(() => favorites.some((f) => f.outfitId === id), [favorites, id]);

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
    router.replace("/");
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <Link href="/" prefetch={false} className="text-sm text-muted">
          ‹ 返回
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-wide text-ink">穿搭详情</h1>
        <span className="w-9" />
      </header>

      <div className="px-5">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-b from-surface-soft to-sand shadow-soft">
          <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={outfit} />
        </div>

        <div className="mt-4">
          {rec && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {rec.label}
            </p>
          )}
          <h2 className="mt-1 font-display text-[24px] font-semibold tracking-tight text-ink">
            {rec?.tagline ?? "这套搭配"}
          </h2>
          {slots.length > 0 && (
            <p className="mt-2 text-[14px] leading-relaxed text-ink/75">
              {slots.map((s) => s.item.name).join(" + ")}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => void handleFavorite()}
            className={`pressable flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-medium ${
              isFavorite ? "bg-accent-soft text-accent-deep" : "bg-accent text-white shadow-[0_8px_20px_rgba(233,142,166,0.28)]"
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
            className="pressable flex h-12 flex-1 items-center justify-center gap-1 rounded-full border border-line bg-surface text-[14px] font-medium text-ink"
          >
            <IconSparkle width={17} height={17} className="text-accent" />
            换一件试试
          </Link>
        </div>

        {rec && (
          <div className="mt-5 rounded-[22px] bg-surface-soft p-4">
            <p className="text-[13px] font-semibold text-ink">为什么这样搭？</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {rec.look === 3
                ? "从你收藏过的搭配里，挑出今天最合适的一套。"
                : rec.look === 2
                  ? "基于穿搭法则生成，让颜色、版型和层次更协调。"
                  : "换个思路尝试新组合，今天换个不一样的自己。"}
            </p>
          </div>
        )}

        <section className="mt-6">
          <h2 className="px-1 text-[15px] font-semibold tracking-tight text-ink">搭配清单</h2>
          <p className="mt-0.5 px-1 text-[11px] text-muted">{slots.length} 件单品</p>
          <div className="mt-3 space-y-2">
            {slots.length === 0 && (
              <p className="rounded-[18px] bg-surface-soft px-4 py-6 text-center text-sm text-muted">
                这套搭配没有单品了，去换装间重新搭一套吧
              </p>
            )}
            {slots.map(({ category, item }) => (
              <div
                key={`${category}-${item.id}`}
                className="flex items-center gap-3 rounded-[18px] bg-surface p-3 shadow-soft"
              >
                <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-[12px] bg-surface-soft p-1.5">
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
                <IconChevronRight width={15} height={15} className="shrink-0 text-muted/50" />
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={() => void handleDelete()}
          className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-red-100 bg-surface py-3 text-sm text-red-400"
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
