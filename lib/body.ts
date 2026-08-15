import type { Anchor, Category, ModelBody } from "@/lib/types";

/** 演示模特（SVG 插画）的体型参考值，所有衣物锚点最初基于它 */
export const REF_BODY: ModelBody = {
  headTop: 72,
  neckY: 290,
  shoulderY: 306,
  waistY: 470,
  hipY: 545,
  kneeY: 810,
  ankleY: 1050,
  footY: 1100,
  shoulderWidth: 128,
  hipWidth: 90,
};

const Y_SEGMENTS: (keyof ModelBody)[] = [
  "headTop",
  "neckY",
  "shoulderY",
  "waistY",
  "hipY",
  "kneeY",
  "ankleY",
  "footY",
];

/** 按参考体型到新体型的分段线性映射（保持相对身材比例） */
function mapY(y: number, from: ModelBody, to: ModelBody): number {
  const segs = Y_SEGMENTS;
  if (y <= from[segs[0]]) return to[segs[0]];
  if (y >= from[segs[segs.length - 1]]) return to[segs[segs.length - 1]];
  for (let i = 0; i < segs.length - 1; i++) {
    const a = from[segs[i]];
    const b = from[segs[i + 1]];
    if (y >= a && y <= b) {
      const t = b === a ? 0 : (y - a) / (b - a);
      return to[segs[i]] + (to[segs[i + 1]] - to[segs[i]]) * t;
    }
  }
  return y;
}

/**
 * 把一件衣服的锚点从参考体型重算到新模特体型：
 * - 上下位置按身体关键点分段缩放（衣服长短比例不变）
 * - 宽度按肩宽/臀宽缩放
 * - 左右位置保持以画布中线为基准（包等偏置单品保留偏移比例）
 */
export function retuneAnchor(anchor: Anchor, body: ModelBody, category: Category): Anchor {
  const fx =
    category === "bottom" || category === "shoes"
      ? body.hipWidth / REF_BODY.hipWidth
      : body.shoulderWidth / REF_BODY.shoulderWidth;

  const top = mapY(anchor.y, REF_BODY, body);
  const bottom = mapY(anchor.y + anchor.height, REF_BODY, body);
  const height = bottom - top;
  const width = anchor.width * fx;
  const centerX = anchor.x + anchor.width / 2;
  const x = 300 + (centerX - 300) * fx - width / 2;

  return {
    x: Math.round(x),
    y: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
  };
}
