"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { IconCamera, IconHeart, IconPlus, IconTrash, IconUpload, IconX } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { CATEGORY_LABELS, CATEGORY_ORDER, LAYER_BY_CATEGORY } from "@/lib/constants";
import { uid } from "@/lib/format";
import { useAppData } from "@/hooks/useAppData";
import { demoPresetsFor } from "@/lib/seed";
import { DEFAULT_ANCHOR } from "@/lib/assets";
import { track } from "@/lib/beta/track";
import type { Category, WardrobeItem } from "@/lib/types";

type Filter = "all" | Category;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  ...CATEGORY_ORDER.map((c) => ({ key: c as Filter, label: CATEGORY_LABELS[c] })),
];

export default function WardrobePage() {
  const { wardrobe, addItem, updateItem, deleteItem, toggleItemFavorite } = useAppData();
  const { show, toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [category, setCategory] = useState<Category>("top");
  const [name, setName] = useState("");
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () => (filter === "all" ? wardrobe : wardrobe.filter((i) => i.category === filter)),
    [wardrobe, filter],
  );

  const presets = useMemo(() => demoPresetsFor(category), [category]);

  const openAdd = () => {
    setEditing(null);
    setCategory("top");
    setName("");
    setUploaded(null);
    setPresetId(null);
    setSheetOpen(true);
  };

  const openEdit = (item: WardrobeItem) => {
    setEditing(item);
    setCategory(item.category);
    setName(item.name);
    setUploaded(null);
    setPresetId(item.id);
    setSheetOpen(true);
  };

  const close = () => setSheetOpen(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploaded(String(reader.result));
      setPresetId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const finalName = name.trim() || (presetId ? presets.find((p) => p.id === presetId)?.name : "") || "未命名单品";
    const imageUrl = uploaded ?? presets.find((p) => p.id === presetId)?.imageUrl;
    if (!imageUrl) {
      show("请先选择一张图片或演示单品");
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    const anchor = preset?.anchor ?? DEFAULT_ANCHOR[category];
    const now = new Date().toISOString();

    if (editing) {
      const next: WardrobeItem = {
        ...editing,
        name: finalName,
        category,
        imageUrl,
        transparentImageUrl: imageUrl,
        layer: LAYER_BY_CATEGORY[category],
        anchor,
        color: preset?.color ?? editing.color,
        style: preset?.style ?? editing.style,
        season: preset?.season ?? editing.season,
      };
      await updateItem(next);
      show("已保存");
    } else {
      const next: WardrobeItem = {
        id: uid(),
        category,
        name: finalName,
        imageUrl,
        transparentImageUrl: imageUrl,
        color: preset?.color,
        style: preset?.style,
        season: preset?.season,
        layer: LAYER_BY_CATEGORY[category],
        anchor,
        isFavorite: false,
        createdAt: now,
      };
      await addItem(next);
      show("已加入衣橱");
    }
    close();
  };

  const handleDelete = async () => {
    if (!editing) return;
    await deleteItem(editing.id);
    show("已删除");
    close();
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-5 backdrop-blur-md">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] tracking-wide text-muted">MY WARDROBE</p>
            <h1 className="mt-0.5 font-display text-[24px] font-semibold tracking-tight text-ink">
              我的衣橱
            </h1>
          </div>
          <p className="text-[13px] text-muted">{wardrobe.length} 件单品</p>
        </div>
      </header>

      {wardrobe.length === 0 ? (
        <section className="px-5 pt-10 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">把你的第一套穿搭放进来</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
            上传一张穿搭照片，AI 自动帮你拆成单品
          </p>
          <div className="mx-auto mt-5 max-w-xs space-y-2 text-left">
            {[
              ["1", "上传一张衣服照片"],
              ["2", "AI 识别，确认无误"],
              ["3", "进入衣橱开始搭配"],
            ].map(([n, label]) => (
              <div key={n} className="card-hairline flex items-center gap-3 rounded-[18px] bg-surface px-4 py-3 shadow-soft">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                  {n}
                </span>
                <span className="text-[13px] text-ink">{label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/import"
            prefetch={false}
            onClick={() => void track("wardrobe_onboarding_started", { page: "wardrobe-empty" })}
            className="pressable mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-[15px] font-medium text-white"
          >
            <IconCamera width={20} height={20} />
            添加我的第一件衣服
          </Link>
        </section>
      ) : (
        <>
          <div className="mt-1 flex gap-2 overflow-x-auto no-scrollbar px-5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`pressable shrink-0 rounded-full px-3.5 py-1.5 text-[12px] ${
                  filter === f.key
                    ? "bg-ink font-medium text-white"
                    : "card-hairline border-0 bg-surface text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 px-5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => openEdit(item)}
                className="group pressable relative overflow-hidden rounded-[18px] bg-surface p-2 text-left shadow-soft"
              >
                <div className="flex aspect-[4/5] items-center justify-center rounded-[14px] bg-surface-soft p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} draggable={false} className="h-full w-full object-contain" />
                </div>
                <p className="mt-1.5 truncate px-0.5 text-[11px] font-medium text-ink">{item.name}</p>
                <div className="flex items-center justify-between px-0.5">
                  <p className="truncate text-[10px] text-muted">{CATEGORY_LABELS[item.category]}</p>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleItemFavorite(item.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        void toggleItemFavorite(item.id);
                      }
                    }}
                    className={`rounded-full p-0.5 transition ${
                      item.isFavorite ? "text-accent" : "text-muted/40"
                    }`}
                    aria-label={item.isFavorite ? "取消收藏" : "收藏"}
                  >
                    <IconHeart
                      width={14}
                      height={14}
                      className={item.isFavorite ? "fill-accent stroke-accent" : ""}
                    />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {wardrobe.length > 0 && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-[430px] justify-end px-5">
          {fabOpen && (
            <div className="fade-up mr-3 flex flex-col gap-2 rounded-[18px] bg-surface p-2 shadow-float">
              <Link
                href="/import"
                prefetch={false}
                onClick={() => setFabOpen(false)}
                className="pressable flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-ink"
              >
                <IconCamera width={16} height={16} className="text-accent" />
                从穿搭照片添加
              </Link>
              <button
                onClick={() => {
                  setFabOpen(false);
                  openAdd();
                }}
                className="pressable flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-ink"
              >
                <IconPlus width={16} height={16} className="text-accent" />
                单件衣物添加
              </button>
            </div>
          )}
          <button
            onClick={() => setFabOpen((v) => !v)}
            className="pressable flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_28px_rgba(233,142,166,0.4)]"
            aria-label="添加衣物"
          >
            <IconPlus width={24} height={24} />
          </button>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={close} title={editing ? "编辑单品" : "添加单品"}>
        <p className="mb-2 text-xs font-medium text-muted">分类</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPresetId(null);
                setUploaded(null);
              }}
              className={`pressable rounded-full px-3.5 py-1.5 text-[13px] transition ${
                category === cat ? "bg-ink font-medium text-white" : "card-hairline border-0 bg-surface text-ink"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-medium text-muted">名称</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：白色短袖 T 恤"
          className="w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted/50 focus:border-accent"
        />

        <p className="mb-2 mt-5 text-xs font-medium text-muted">图片</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-line bg-surface-soft py-6 text-sm text-muted transition hover:border-accent hover:text-accent"
        >
          <IconUpload width={18} height={18} />
          上传一张照片
        </button>
        {uploaded && (
          <div className="relative mt-3 inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploaded} alt="已上传" className="h-24 w-20 rounded-[14px] object-cover" />
            <button
              onClick={() => setUploaded(null)}
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white"
              aria-label="移除图片"
            >
              <IconX width={12} height={12} />
            </button>
          </div>
        )}

        <p className="mb-2 mt-4 text-xs font-medium text-muted">或选择演示单品</p>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPresetId(p.id);
                setUploaded(null);
                if (!name.trim()) setName(p.name);
              }}
              className={`overflow-hidden rounded-[14px] border bg-surface p-1.5 transition ${
                presetId === p.id ? "border-accent ring-1 ring-accent" : "border-line"
              }`}
            >
              <div className="flex aspect-square items-center justify-center rounded-[10px] bg-surface-soft p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.name} draggable={false} className="h-full w-full object-contain" />
              </div>
              <p className="mt-1 truncate text-center text-[10px] text-ink">{p.name}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {editing && (
            <button
              onClick={() => void handleDelete()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-500 transition active:scale-95"
              aria-label="删除"
            >
              <IconTrash width={20} height={20} />
            </button>
          )}
          <button
            onClick={() => void handleSave()}
            className="pressable h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-white"
          >
            保存
          </button>
        </div>
      </BottomSheet>

      {toast}
    </div>
  );
}
