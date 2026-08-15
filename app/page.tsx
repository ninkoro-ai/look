"use client";

import Link from "next/link";
import { ModelCanvas } from "@/components/ModelCanvas";
import {
  IconChevronRight,
  IconCloud,
  IconRain,
  IconRefresh,
  IconSnow,
  IconSparkle,
  IconSun,
} from "@/components/icons";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { outfitSlots } from "@/lib/outfitEngine";
import { formatDate, todayKey } from "@/lib/format";
import type { Weather } from "@/lib/types";

function WeatherIcon({ weather }: { weather: Weather }) {
  const common = { width: 22, height: 22 };
  if (weather.condition === "sunny") return <IconSun {...common} />;
  if (weather.condition === "rain") return <IconRain {...common} />;
  if (weather.condition === "snow") return <IconSnow {...common} />;
  return <IconCloud {...common} />;
}

function HomePage() {
  const { userModel, wardrobe, recommendations, weather, regenerateLooks } = useAppData();
  const { show, toast } = useToast();

  const dateLabel = formatDate(todayKey());
  const looks = recommendations.slice(0, 3);

  return (
    <div className="pb-6">
      <header className="flex items-center justify-between px-5 pb-4 pt-5">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-wide text-ink">衣搭</h1>
          <p className="mt-0.5 text-xs text-muted">{dateLabel} · 3 套今日灵感</p>
        </div>
        <button
          onClick={() => {
            void regenerateLooks().then(() => show("已为你重新搭配"));
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition active:rotate-180 active:scale-95"
          aria-label="重新生成"
        >
          <IconRefresh width={19} height={19} />
        </button>
      </header>

      <section className="px-5">
        <div className="rounded-[28px] bg-gradient-to-br from-sand to-accent-soft p-5 shadow-[inset_0_0_0_1px_rgba(42,36,32,0.04)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-accent shadow-sm">
              <WeatherIcon weather={weather} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-ink">{weather.city}</span>
                <span className="text-xs text-muted">今天</span>
                <span className="ml-auto text-2xl font-semibold text-ink">{weather.high}°</span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {weather.conditionLabel} · 低 {weather.low}° · 体感 {weather.feelsLike}° · 湿度 {weather.humidity}%
              </p>
            </div>
          </div>
          <p className="mt-3 border-t border-ink/5 pt-3 text-[13px] text-ink/70">
            <IconSparkle width={14} height={14} className="mr-1 inline text-accent" />
            {weather.tip}
          </p>
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="px-1 text-[15px] font-semibold text-ink">今日 LOOK</h2>
        <div className="mt-3 space-y-3">
          {looks.map((rec) => {
            const slots = outfitSlots(rec.outfit, wardrobe);
            return (
              <Link
                key={rec.id}
                href={`/outfit?id=${rec.outfit.id}`}
                prefetch={false}
                className="flex items-center gap-4 rounded-[24px] border border-line bg-surface p-3 shadow-[0_2px_10px_rgba(42,36,32,0.04)] transition active:scale-[0.99]"
              >
                <div className="w-[84px] shrink-0 overflow-hidden rounded-2xl bg-sand">
                  <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={rec.outfit} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                    {rec.label}
                  </p>
                  <h3 className="mt-1 text-[15px] font-semibold text-ink">{rec.tagline}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {rec.look === 3 && slots.length === 0
                      ? "还没有收藏，先试试这套法则搭配吧"
                      : rec.tagline === "我的收藏"
                        ? "从收藏里挑出的今日之选"
                        : `${rec.tagline}为你挑选的 ${slots.length} 件单品`}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {slots.slice(0, 3).map((s) => (
                        <span key={s.item.id} className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-muted">
                          {s.item.name.length > 6 ? `${s.item.name.slice(0, 6)}…` : s.item.name}
                        </span>
                      ))}
                      {slots.length > 3 && (
                        <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] text-muted">
                          +{slots.length - 3}
                        </span>
                      )}
                    </div>
                    <IconChevronRight width={16} height={16} className="shrink-0 text-muted" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 px-5">
        <Link
          href="/dress"
          prefetch={false}
          className="flex items-center justify-between rounded-[24px] bg-ink px-5 py-4 text-white shadow-lg transition active:scale-[0.99]"
        >
          <div>
            <p className="text-[15px] font-medium">去我的换装间</p>
            <p className="mt-0.5 text-xs text-white/60">点击衣服，立即换装</p>
          </div>
          <IconChevronRight width={18} height={18} className="text-white/70" />
        </Link>
      </section>

      {toast}
    </div>
  );
}

export default HomePage;
