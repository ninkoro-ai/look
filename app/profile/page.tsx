"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SectionTitle } from "@/components/ui";
import { IconChevronRight, IconSparkle, IconUser } from "@/components/icons";
import { useAppData } from "@/hooks/useAppData";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";

const COLOR_LABELS: Record<string, string> = {
  white: "白",
  black: "黑",
  gray: "灰",
  cream: "米白",
  beige: "米",
  blue: "蓝",
  green: "绿",
  red: "红",
  pink: "粉",
  yellow: "黄",
  brown: "棕",
};

const STYLE_LABELS: Record<string, string> = {
  casual: "休闲",
  loose: "宽松",
  tight: "修身",
  elegant: "优雅",
  office: "通勤",
  soft: "柔和",
  sporty: "运动",
  formal: "正式",
  warm: "保暖",
};

function topPairs(map: Map<string, number>, labels: Record<string, string>, limit: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }));
}

export default function ProfilePage() {
  const { userModel, wardrobe, outfits, favorites } = useAppData();

  const profile = useMemo(() => {
    const colors = new Map<string, number>();
    const styles = new Map<string, number>();
    const cats = new Map<string, number>();
    for (const item of wardrobe) {
      cats.set(item.category, (cats.get(item.category) ?? 0) + 1);
      for (const c of item.color ?? []) colors.set(c, (colors.get(c) ?? 0) + 1);
      for (const s of item.style ?? []) styles.set(s, (styles.get(s) ?? 0) + 1);
    }
    return {
      colors: topPairs(colors, COLOR_LABELS, 6),
      styles: topPairs(styles, STYLE_LABELS, 5),
      cats,
    };
  }, [wardrobe]);

  const maxStyle = profile.styles[0]?.count ?? 1;

  return (
    <div className="pb-8">
      <header className="px-5 pb-4 pt-6">
        <p className="text-[12px] tracking-wide text-muted">MY STYLE</p>
        <h1 className="mt-0.5 font-display text-[24px] font-semibold tracking-tight text-ink">
          我的风格
        </h1>
      </header>

      <section className="px-5">
        <div className="card-hairline flex items-center gap-4 rounded-[24px] bg-gradient-to-br from-accent-soft to-surface p-4 shadow-soft">
          <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-surface-soft">
            {userModel ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userModel.modelImage} alt="我的模特" className="h-full w-full object-cover" />
            ) : (
              <IconUser width={22} height={22} className="text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink">
              {userModel?.source === "photo" ? "我的照片模特" : "我的虚拟模特"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {wardrobe.length} 件衣服 · 收藏 {favorites.length} 套 · 保存 {outfits.length} 套
            </p>
          </div>
          <Link href="/dress" prefetch={false} className="text-accent">
            <IconChevronRight width={18} height={18} />
          </Link>
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle title="我偏爱" subtitle="根据你的衣橱统计" />
        {wardrobe.length === 0 ? (
          <div className="rounded-[24px] bg-surface-soft px-6 py-12 text-center">
            <p className="text-sm text-muted">还没有风格数据</p>
            <p className="mt-1 text-xs text-muted">先添加几件衣服，这里会慢慢认识你的风格</p>
            <Link
              href="/wardrobe"
              prefetch={false}
              className="pressable mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white"
            >
              去添加衣服
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.styles.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-[12px] text-ink">{s.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.round((s.count / maxStyle) * 100)}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-[11px] text-muted">
                  {Math.round((s.count / wardrobe.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 px-5">
        <SectionTitle title="你常穿" />
        {profile.colors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.colors.map((c) => (
              <span
                key={c.key}
                className="card-hairline rounded-full bg-surface px-3 py-1.5 text-[12px] text-ink shadow-soft"
              >
                {c.label}
                <span className="ml-1 text-[10px] text-muted">×{c.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">暂无颜色数据</p>
        )}
      </section>

      <section className="mt-6 px-5">
        <SectionTitle title="衣橱构成" />
        <div className="grid grid-cols-4 gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="card-hairline rounded-[18px] bg-surface px-2 py-3 text-center shadow-soft">
              <p className="text-[16px] font-semibold text-ink">{profile.cats.get(cat) ?? 0}</p>
              <p className="mt-0.5 text-[10px] text-muted">{CATEGORY_LABELS[cat]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <SectionTitle title="快速体验" />
        <div className="space-y-2.5">
          <Link
            href="/tryon"
            prefetch={false}
            className="pressable card-hairline flex items-center gap-3 rounded-[18px] bg-surface p-4 shadow-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <IconSparkle width={18} height={18} />
            </span>
            <span className="flex-1 text-[14px] font-medium text-ink">AI 真实试穿</span>
            <IconChevronRight width={16} height={16} className="text-muted/50" />
          </Link>
          <Link
            href="/demo/real-tryon"
            prefetch={false}
            className="pressable card-hairline flex items-center gap-3 rounded-[18px] bg-surface p-4 shadow-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-muted">
              <IconSparkle width={18} height={18} />
            </span>
            <span className="flex-1 text-[14px] font-medium text-ink">真人试穿 Demo</span>
            <IconChevronRight width={16} height={16} className="text-muted/50" />
          </Link>
        </div>
      </section>
    </div>
  );
}
