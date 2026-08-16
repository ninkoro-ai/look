import { DEFAULT_ANCHOR } from "@/lib/assets";
import type { Anchor, BoundingBox, Category } from "@/lib/types";

const TYPICAL_ASPECT: Record<Category, number> = {
  top: 220 / 300,
  outerwear: 244 / 360,
  bottom: 120 / 540,
  dress: 220 / 540,
  shoes: 200 / 120,
  bag: 204 / 330,
  accessory: 160 / 140,
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * 根据单品检测框的宽高比，在 600×1200 标准画布上给出建议锚点。
 * 宽度围绕对应分类的典型宽度缩放，高度保持检测框比例。
 */
export function suggestAnchor(category: Category, bbox: BoundingBox): Anchor {
  const base = DEFAULT_ANCHOR[category];
  const aspect = bbox.width / Math.max(1, bbox.height);
  const k = clamp(aspect / TYPICAL_ASPECT[category], 0.55, 1.8);
  let width = Math.round(base.width * k);
  let height = Math.round(width / aspect);
  width = clamp(width, 60, 460);
  height = clamp(height, 60, 620);
  return {
    x: Math.round(300 - width / 2),
    y: base.y,
    width,
    height,
  };
}
