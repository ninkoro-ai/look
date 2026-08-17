"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { SectionTitle } from "@/components/ui";
import { IconHeart } from "@/components/icons";
import { useAppData } from "@/hooks/useAppData";

export default function FavoritesPage() {
  const { userModel, wardrobe, outfits, recommendations, favorites } = useAppData();

  const favoriteOutfits = useMemo(
    () =>
      favorites
        .map((f) => {
          const outfit =
            outfits.find((o) => o.id === f.outfitId) ??
            recommendations.find((r) => r.outfit.id === f.outfitId)?.outfit;
          return outfit ? { favorite: f, outfit } : null;
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [favorites, outfits, recommendations],
  );

  return (
    <div className="pb-8">
      <header className="px-5 pb-4 pt-6">
        <p className="text-[12px] tracking-wide text-muted">MY FAVORITES</p>
        <h1 className="mt-0.5 font-display text-[24px] font-semibold tracking-tight text-ink">
          我的收藏
        </h1>
      </header>

      <section className="px-5">
        <SectionTitle title="穿搭画廊" subtitle={`${favoriteOutfits.length} 套喜欢的搭配`} />

        {favoriteOutfits.length === 0 ? (
          <div className="rounded-[24px] bg-surface-soft px-6 py-14 text-center">
            <IconHeart width={28} height={28} className="mx-auto text-accent/60" />
            <p className="mt-3 text-sm text-muted">还没有收藏任何搭配</p>
            <p className="mt-1 text-xs text-muted">在换装间点「收藏这套」，喜欢的搭配会出现在这里</p>
            <Link
              href="/dress"
              prefetch={false}
              className="pressable mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white"
            >
              去换装间
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {favoriteOutfits.map(({ favorite, outfit }) => (
              <Link
                key={favorite.id}
                href={`/outfit?id=${outfit.id}`}
                prefetch={false}
                className="pressable relative overflow-hidden rounded-[18px] bg-surface shadow-soft"
              >
                <div className="bg-gradient-to-b from-surface-soft to-sand">
                  <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={outfit} />
                </div>
                <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                  <IconHeart width={15} height={15} className="fill-accent stroke-accent" />
                </span>
                <div className="px-2 py-1.5">
                  <p className="truncate text-[10px] text-muted">
                    {new Date(favorite.createdAt).getMonth() + 1}月
                    {new Date(favorite.createdAt).getDate()}日 收藏
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
