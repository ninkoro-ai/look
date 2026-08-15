"use client";

import { CANVAS_HEIGHT, CANVAS_WIDTH, LAYER_ORDER } from "@/lib/constants";
import { slotFor } from "@/lib/outfitEngine";
import type { Outfit, UserModel, WardrobeItem } from "@/lib/types";

interface ModelCanvasProps {
  userModel: UserModel | null;
  wardrobe: WardrobeItem[];
  outfit: Outfit;
  className?: string;
}

/**
 * 换装渲染器：基于 Standard Person Canvas（600×1200）的 DOM 分层。
 * 所有单品通过 anchor 以画布比例定位，替换时只更新对应 Layer 的图片。
 */
export function ModelCanvas({ userModel, wardrobe, outfit, className }: ModelCanvasProps) {
  const byId = new Map(wardrobe.map((i) => [i.id, i]));

  const layers = LAYER_ORDER.filter((layer) => layer !== "person").flatMap((category) => {
    const slot = slotFor(category);
    const ids =
      slot === "accessoryIds" ? (outfit.accessoryIds ?? []) : outfit[slot] ? [outfit[slot] as string] : [];
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is WardrobeItem => Boolean(item))
      .map((item) => ({ category, item }));
  });

  return (
    <div
      data-testid="model-canvas"
      className={`relative w-full select-none overflow-hidden ${className ?? ""}`}
    >
      <div className="relative aspect-[600/1200] w-full">
        {userModel && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userModel.modelImage}
            alt="我的模特"
            draggable={false}
            data-model
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: "fill" }}
          />
        )}
        {layers.map(({ category, item }) => {
          const a = item.anchor ?? { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${category}-${item.id}`}
              src={item.transparentImageUrl ?? item.imageUrl}
              alt={item.name}
              draggable={false}
              data-layer={category}
              className="pointer-events-none absolute"
              style={{
                left: `${(a.x / CANVAS_WIDTH) * 100}%`,
                top: `${(a.y / CANVAS_HEIGHT) * 100}%`,
                width: `${(a.width / CANVAS_WIDTH) * 100}%`,
                height: `${(a.height / CANVAS_HEIGHT) * 100}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
