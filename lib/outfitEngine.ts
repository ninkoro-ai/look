import { DEFAULT_USER_ID } from "@/lib/constants";
import { uid } from "@/lib/format";
import type { Category, Outfit, OutfitSource, WardrobeItem } from "@/lib/types";

export function slotFor(category: Category): keyof Outfit {
  switch (category) {
    case "top":
      return "topId";
    case "outerwear":
      return "outerwearId";
    case "bottom":
      return "bottomId";
    case "dress":
      return "dressId";
    case "shoes":
      return "shoesId";
    case "bag":
      return "bagId";
    case "accessory":
      return "accessoryIds";
  }
}

export function emptyOutfit(userId = DEFAULT_USER_ID, source: OutfitSource = "manual"): Outfit {
  return { id: uid(), userId, source, createdAt: new Date().toISOString() };
}

/**
 * 点击单品后的换装逻辑（纯函数）：
 * - 穿裙子时清空上衣与下装；穿上衣/下装时清空裙子
 * - 配饰在 accessoryIds 中切换
 */
export function toggleItem(outfit: Outfit, item: WardrobeItem): Outfit {
  const next = { ...outfit, accessoryIds: outfit.accessoryIds ? [...outfit.accessoryIds] : undefined };

  if (item.category === "accessory") {
    const list = next.accessoryIds ?? [];
    if (list.includes(item.id)) {
      next.accessoryIds = list.filter((id) => id !== item.id);
    } else {
      next.accessoryIds = [...list, item.id];
    }
    return next;
  }

  if (item.category === "dress") {
    next.dressId = next.dressId === item.id ? undefined : item.id;
    next.topId = undefined;
    next.bottomId = undefined;
    return next;
  }

  if (item.category === "top") {
    next.topId = next.topId === item.id ? undefined : item.id;
    next.dressId = undefined;
    return next;
  }

  if (item.category === "bottom") {
    next.bottomId = next.bottomId === item.id ? undefined : item.id;
    next.dressId = undefined;
    return next;
  }

  const slot = slotFor(item.category);
  const current = next[slot] as string | undefined;
  (next as Record<string, unknown>)[slot] = current === item.id ? undefined : item.id;
  return next;
}

export function removeSlot(outfit: Outfit, slot: keyof Outfit): Outfit {
  const next = { ...outfit };
  (next as Record<string, unknown>)[slot] = undefined;
  return next;
}

export interface OutfitSlotView {
  category: Category;
  item: WardrobeItem;
}

export function outfitSlots(outfit: Outfit, wardrobe: WardrobeItem[]): OutfitSlotView[] {
  const byId = new Map(wardrobe.map((i) => [i.id, i]));
  const views: OutfitSlotView[] = [];

  const push = (id: string | undefined, category: Category) => {
    if (!id) return;
    const found = byId.get(id);
    if (found) views.push({ category, item: found });
  };

  push(outfit.topId, "top");
  push(outfit.outerwearId, "outerwear");
  push(outfit.bottomId, "bottom");
  push(outfit.dressId, "dress");
  push(outfit.shoesId, "shoes");
  push(outfit.bagId, "bag");
  (outfit.accessoryIds ?? []).forEach((id) => push(id, "accessory"));

  return views;
}

export function outfitItemIds(outfit: Outfit): string[] {
  return [
    outfit.topId,
    outfit.outerwearId,
    outfit.bottomId,
    outfit.dressId,
    outfit.shoesId,
    outfit.bagId,
    ...(outfit.accessoryIds ?? []),
  ].filter((id): id is string => Boolean(id));
}
