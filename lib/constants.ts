import type { Category } from "@/lib/types";

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 1200;

export const CATEGORY_LABELS: Record<Category, string> = {
  top: "上衣",
  outerwear: "外套",
  bottom: "下装",
  dress: "裙子",
  shoes: "鞋",
  bag: "包",
  accessory: "配饰",
};

export const CATEGORY_ORDER: Category[] = [
  "top",
  "outerwear",
  "bottom",
  "dress",
  "shoes",
  "bag",
  "accessory",
];

export const LAYER_ORDER: ("person" | Category)[] = [
  "person",
  "bottom",
  "top",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
];

export const LAYER_BY_CATEGORY: Record<Category, number> = {
  bottom: 1,
  top: 2,
  dress: 3,
  outerwear: 4,
  shoes: 5,
  bag: 6,
  accessory: 7,
};

export const DEFAULT_USER_ID = "user-demo";

export const LOOK_META: Record<
  1 | 2 | 3,
  { label: string; tagline: string; hint: string }
> = {
  1: {
    label: "LOOK 01",
    tagline: "随机灵感",
    hint: "今天随手一搭，试试新感觉",
  },
  2: {
    label: "LOOK 02",
    tagline: "穿衣法则",
    hint: "基于搭配法则生成的稳妥方案",
  },
  3: {
    label: "LOOK 03",
    tagline: "我的收藏",
    hint: "从你的收藏里挑出今天最合适的一套",
  },
};
