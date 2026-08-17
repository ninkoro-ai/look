"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ModelCanvas } from "@/components/ModelCanvas";
import { BetaFeedback } from "@/components/BetaFeedback";
import { SectionTitle } from "@/components/ui";
import {
  IconCamera,
  IconChevronRight,
  IconCloud,
  IconHeart,
  IconRain,
  IconRefresh,
  IconSnow,
  IconSparkle,
  IconSun,
  IconUser,
} from "@/components/icons";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { outfitSlots } from "@/lib/outfitEngine";
import { formatDate, todayKey } from "@/lib/format";
import { enterBetaMode, exitBetaMode, isBetaUser, betaUserId } from "@/lib/beta/storage";
import { track } from "@/lib/beta/track";
import { deleteBetaDatabase, resetDb } from "@/lib/db";
import type { Weather } from "@/lib/types";

function WeatherIcon({ weather }: { weather: Weather }) {
  const common = { width: 20, height: 20 };
  if (weather.condition === "sunny") return <IconSun {...common} />;
  if (weather.condition === "rain") return <IconRain {...common} />;
  if (weather.condition === "snow") return <IconSnow {...common} />;
  return <IconCloud {...common} />;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

const QUICK_MODULES = [
  { href: "/import", label: "拍照识衣", desc: "从穿搭照片添加", Icon: IconCamera, accent: "from-rose-50 to-accent-soft" },
  { href: "/dress", label: "我的模特", desc: "上传自己的照片", Icon: IconUser, accent: "from-sand to-surface" },
  { href: "/dress", label: "自由换装", desc: "点击单品实时替换", Icon: IconSparkle, accent: "from-accent-soft to-surface" },
  { href: "/wardrobe", label: "我的衣橱", desc: "所有衣物分类管理", Icon: IconHeart, accent: "from-surface to-sand" },
];

function HomePage() {
  const { userModel, wardrobe, recommendations, weather, regenerateLooks } = useAppData();
  const { show, toast } = useToast();
  const beta = isBetaUser();

  const dateLabel = formatDate(todayKey());
  const looks = recommendations.slice(0, 3);
  const hero = looks[0];
  const heroSlots = hero ? outfitSlots(hero.outfit, wardrobe) : [];
  const rest = looks.slice(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("beta") === "1") {
      enterBetaMode();
      resetDb();
      window.location.replace(window.location.pathname);
    }
  }, []);

  const exitBeta = async () => {
    if (!window.confirm("退出 Beta 并删除本地测试数据？此操作不可恢复。")) return;
    await track("beta_data_deleted", { page: "home" });
    await deleteBetaDatabase();
    exitBetaMode(true);
    window.location.reload();
  };

  return (
    <div className="pb-8">
      <header className="px-5 pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] tracking-wide text-muted">{greeting()}</p>
            <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
              今天穿什么？
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">今天 · {dateLabel}</p>
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <WeatherIcon weather={weather} />
              <span className="text-[22px] font-semibold leading-none text-ink">{weather.high}°</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {weather.conditionLabel} · 体感 {weather.feelsLike}°
            </p>
          </div>
        </div>
      </header>

      {beta && wardrobe.length === 0 && (
        <section className="px-5">
          <div className="card-hairline rounded-[24px] bg-gradient-to-br from-accent-soft to-sand p-5">
            <p className="text-[13px] font-semibold text-ink">为什么需要数字衣橱？</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              上传一张穿搭照片，AI 帮你拆成单品，开始今天的灵感。
            </p>
            <Link
              href="/import"
              prefetch={false}
              onClick={() => void track("wardrobe_onboarding_started", { page: "home-banner" })}
              className="pressable mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white"
            >
              添加我的第一套穿搭
            </Link>
          </div>
        </section>
      )}

      <section className="mt-5 px-5">
        <SectionTitle
          title="今日 LOOK"
          subtitle="TODAY'S LOOK"
          action={
            <button
              onClick={() => void regenerateLooks().then(() => show("已为你重新搭配"))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted shadow-soft"
              aria-label="重新生成"
            >
              <IconRefresh width={18} height={18} />
            </button>
          }
        />

        {hero ? (
          <Link
            href={`/outfit?id=${hero.outfit.id}`}
            prefetch={false}
            onClick={() => void track("daily_outfit_viewed", { page: "home" })}
            className="pressable block overflow-hidden rounded-[28px] bg-surface shadow-float"
          >
            <div className="bg-gradient-to-b from-sand to-surface-soft">
              <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={hero.outfit} />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {hero.label}
                </span>
                <span className="text-[11px] text-muted">
                  {weather.high}° · {weather.conditionLabel}
                </span>
              </div>
              <h3 className="mt-2 text-[18px] font-semibold text-ink">{hero.tagline}</h3>
              {heroSlots.length > 0 && (
                <p className="mt-2 line-clamp-1 text-[13px] text-ink/75">
                  {heroSlots.map((s) => s.item.name).join(" + ")}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1 text-[13px] font-medium text-accent">
                查看搭配
                <IconChevronRight width={15} height={15} />
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[28px] bg-surface-soft p-8 text-center text-sm text-muted">
            先添加几件衣服，今天的第一套穿搭就会出现
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="mt-5">
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
            {rest.map((rec) => {
              const slots = outfitSlots(rec.outfit, wardrobe);
              return (
                <Link
                  key={rec.id}
                  href={`/outfit?id=${rec.outfit.id}`}
                  prefetch={false}
                  onClick={() => void track("daily_outfit_viewed", { page: "home" })}
                  className="pressable w-[220px] shrink-0 overflow-hidden rounded-[22px] bg-surface shadow-soft"
                >
                  <div className="bg-sand">
                    <ModelCanvas userModel={userModel} wardrobe={wardrobe} outfit={rec.outfit} />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                      {rec.label}
                    </p>
                    <h4 className="mt-1 text-[14px] font-semibold text-ink">{rec.tagline}</h4>
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                      {slots.length > 0
                        ? slots.map((s) => s.item.name).join(" · ")
                        : "打开看看这套搭配"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6 px-5">
        <SectionTitle title="发现" subtitle="你的时尚工具箱" />
        <div className="grid grid-cols-2 gap-3">
          {QUICK_MODULES.map(({ href, label, desc, Icon, accent }) => (
            <Link
              key={label}
              href={href}
              prefetch={false}
              className={`pressable rounded-[22px] bg-gradient-to-br ${accent} p-4 shadow-soft`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 text-accent">
                <Icon width={19} height={19} />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">{label}</p>
              <p className="mt-0.5 text-[11px] text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <BetaFeedback />

      {beta && (
        <footer className="mt-10 space-y-1 border-t border-line/60 px-5 pb-8 pt-4 text-center text-[11px] text-muted">
          <p>Beta 测试模式 · {betaUserId()}</p>
          <p>所有数据仅保存在本机浏览器，可随时删除</p>
          <button onClick={() => void exitBeta()} className="mt-1 rounded-full border border-line px-3 py-1 text-muted">
            退出并删除测试数据
          </button>
        </footer>
      )}

      {toast}
    </div>
  );
}

export default HomePage;
