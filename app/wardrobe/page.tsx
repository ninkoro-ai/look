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
    <div className="pb-6">
      <header className="sticky top-0 z-30 bg-background/90 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide text-ink">衣橱</h1>
            <p className="mt-0.5 text-xs text-muted">共 {wardrobe.length} 件单品</p>
          </div>
          <button
            onClick={openAdd}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-md transition active:scale-95"
            aria-label="添加单品"
          >
            <IconPlus width={20} height={20} />
          </button>
        </div>
      </header>

      <Link
        href="/import"
        prefetch={false}
        className="mx-5 mt-3 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-[0_8px_20px_rgba(42,36,32,0.18)] transition active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <IconCamera width={18} height={18} />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-medium">从穿搭照片添加</span>
          <span className="block text-[11px] text-white/60">AI 自动识别上衣、外套、裤子等单品</span>
        </span>
        <span className="text-white/60">›</span>
      </Link>

      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar px-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition ${
              filter === f.key ? "bg-ink font-medium text-white" : "border border-line bg-surface text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => openEdit(item)}
            className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-3 text-left shadow-[0_2px_10px_rgba(42,36,32,0.04)] transition active:scale-[0.98]"
          >
            <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-sand p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.name} draggable={false} className="h-full w-full object-contain" />
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">{CATEGORY_LABELS[item.category]}</p>
              </div>
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
                className={`rounded-full p-1.5 transition ${
                  item.isFavorite ? "text-accent" : "text-muted/60"
                }`}
                aria-label={item.isFavorite ? "取消收藏" : "收藏"}
              >
                <IconHeart
                  width={18}
                  height={18}
                  className={item.isFavorite ? "fill-accent stroke-accent" : ""}
                />
              </span>
            </div>
          </button>
        ))}
      </div>

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
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
                category === cat ? "bg-ink font-medium text-white" : "border border-line bg-surface text-ink"
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
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted/50 focus:border-accent"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-sand/60 py-6 text-sm text-muted transition hover:border-accent hover:text-accent"
        >
          <IconUpload width={18} height={18} />
          上传一张照片
        </button>
        {uploaded && (
          <div className="relative mt-3 inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploaded} alt="已上传" className="h-24 w-20 rounded-xl object-cover" />
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
              className={`overflow-hidden rounded-2xl border bg-surface p-1.5 transition ${
                presetId === p.id ? "border-accent ring-1 ring-accent" : "border-line"
              }`}
            >
              <div className="flex aspect-square items-center justify-center rounded-xl bg-sand p-1.5">
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
            className="h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(185,106,75,0.25)] transition active:scale-[0.98]"
          >
            保存
          </button>
        </div>
      </BottomSheet>

      {toast}
    </div>
  );
}
