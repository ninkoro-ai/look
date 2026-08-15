import { LOOK_META } from "@/lib/constants";
import { todayKey, uid } from "@/lib/format";
import { emptyOutfit } from "@/lib/outfitEngine";
import type {
  DailyRecommendation,
  FavoriteOutfit,
  Outfit,
  OutfitSource,
  WardrobeItem,
  Weather,
} from "@/lib/types";
import { weatherTags } from "@/lib/weather";

const COLOR_FAMILIES: Record<string, string> = {
  white: "neutral",
  black: "neutral",
  gray: "neutral",
  cream: "neutral",
  beige: "neutral",
  blue: "blue",
  green: "green",
  red: "red",
  pink: "red",
  yellow: "yellow",
  brown: "brown",
};

function familyOf(colors: string[] | undefined): string | null {
  if (!colors || colors.length === 0) return null;
  const f = COLOR_FAMILIES[colors[0]];
  return f ?? null;
}

function seasonOk(item: WardrobeItem, tags: Set<string>): boolean {
  if (!item.season || item.season.length === 0) return true;
  if (item.season.includes("all")) return true;
  return item.season.some((s) => tags.has(s));
}

function pool(items: WardrobeItem[], category: WardrobeItem["category"], tags: Set<string>): WardrobeItem[] {
  return items.filter((i) => i.category === category && seasonOk(i, tags));
}

function pick<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.abs(Math.floor(seed * 9301 + 49297) % 233280) % arr.length];
}

function rand(seed: number): number {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

function styleHas(styles: string[] | undefined, tag: string): boolean {
  return Boolean(styles && styles.includes(tag));
}

function fitOf(item: WardrobeItem): "loose" | "tight" | "neutral" {
  if (styleHas(item.style, "loose")) return "loose";
  if (styleHas(item.style, "tight")) return "tight";
  return "neutral";
}

function buildOutfit(
  userId: string,
  wardrobe: WardrobeItem[],
  tags: Set<string>,
  seed: number,
  prefer: "random" | "rule",
): Outfit {
  const outfit = emptyOutfit(userId, prefer === "random" ? "random" : "rule");
  const tops = pool(wardrobe, "top", tags);
  const bottoms = pool(wardrobe, "bottom", tags);
  const dresses = pool(wardrobe, "dress", tags);
  const outers = pool(wardrobe, "outerwear", tags);
  const shoes = pool(wardrobe, "shoes", tags);
  const bags = pool(wardrobe, "bag", tags);
  const accessories = pool(wardrobe, "accessory", tags);

  const cold = tags.has("cold") || tags.has("winter");
  const hot = tags.has("hot") || tags.has("summer");

  if (prefer === "random") {
    const useDress = dresses.length > 0 && rand(seed) < 0.5;
    if (useDress) {
      outfit.dressId = pick(dresses, seed + 1)?.id;
    } else {
      outfit.topId = pick(tops, seed + 2)?.id;
      outfit.bottomId = pick(bottoms, seed + 3)?.id;
    }
    if (outers.length > 0 && (cold ? rand(seed + 4) < 0.85 : rand(seed + 4) < 0.25)) {
      outfit.outerwearId = pick(outers, seed + 5)?.id;
    }
    outfit.shoesId = pick(shoes, seed + 6)?.id;
    if (bags.length > 0 && rand(seed + 7) < 0.5) outfit.bagId = pick(bags, seed + 8)?.id;
    if (accessories.length > 0 && rand(seed + 9) < 0.4) {
      outfit.accessoryIds = [pick(accessories, seed + 10)!.id];
    }
    return outfit;
  }

  // ---- 穿衣法则 ----
  const heroDress = dresses.length > 0 && (hot ? rand(seed + 1) < 0.55 : rand(seed + 1) < 0.3);
  let hero: WardrobeItem | undefined;
  if (heroDress) {
    hero = pick(dresses, seed + 2);
    outfit.dressId = hero?.id;
  } else {
    hero = pick(tops, seed + 2);
    outfit.topId = hero?.id;
    if (hero && bottoms.length > 0) {
      const heroFit = fitOf(hero);
      const desired = heroFit === "loose" ? "tight" : heroFit === "tight" ? "loose" : "neutral";
      const family = familyOf(hero.color);
      const scored = bottoms
        .map((b, idx) => {
          let score = 0;
          const bFit = fitOf(b);
          if (desired !== "neutral" && bFit === desired) score += 8;
          if (bFit === "neutral") score += 3;
          if (family && familyOf(b.color) === family) score += 6;
          if (family === "neutral" && familyOf(b.color) !== "neutral") score += 2;
          if (family === "blue" && familyOf(b.color) === "blue") score += 4;
          if (family === "red" && familyOf(b.color) === "green") score -= 10;
          if (hero && styleHas(hero.style, "long") && styleHas(b.style, "long")) score -= 4;
          if (hero && styleHas(hero.style, "short") && styleHas(b.style, "short")) score -= 3;
          score += rand(seed + 20 + idx) * 2;
          return { b, score };
        })
        .sort((a, b) => b.score - a.score);
      outfit.bottomId = scored[0]?.b.id;
    }
  }

  if (outers.length > 0) {
    const needOuter = cold || (!hot && rand(seed + 3) < 0.35);
    if (needOuter) {
      const heroFamily = familyOf(hero?.color);
      const scored = outers
        .map((o, idx) => {
          let score = 0;
          if (heroFamily && familyOf(o.color) === heroFamily) score += 5;
          if (familyOf(o.color) === "neutral") score += 3;
          score += rand(seed + 40 + idx) * 2;
          return { o, score };
        })
        .sort((a, b) => b.score - a.score);
      outfit.outerwearId = scored[0]?.o.id;
    }
  }

  if (shoes.length > 0) {
    const elegant = hero ? styleHas(hero.style, "elegant") || styleHas(hero.style, "office") : false;
    const shoePool = elegant
      ? shoes.filter((s) => styleHas(s.style, "elegant"))
      : shoes.filter((s) => !styleHas(s.style, "office") && !styleHas(s.style, "elegant"));
    outfit.shoesId = pick(shoePool.length > 0 ? shoePool : shoes, seed + 4)?.id;
  }

  if (bags.length > 0 && rand(seed + 5) < 0.55) {
    const neutralBags = bags.filter((b) => familyOf(b.color) === "neutral");
    outfit.bagId = pick(neutralBags.length > 0 ? neutralBags : bags, seed + 6)?.id;
  }

  if (accessories.length > 0) {
    const seasonal = accessories.filter((a) => (hot ? styleHas(a.style, "cool") || a.season?.includes("summer") : cold ? a.season?.includes("winter") : a.season?.includes("spring") || a.season?.includes("autumn")));
    const accPool = seasonal.length > 0 ? seasonal : accessories;
    if (rand(seed + 7) < 0.5) {
      outfit.accessoryIds = [pick(accPool, seed + 8)!.id];
    }
  }

  return outfit;
}

export interface RecommendationPlan {
  look: 1 | 2 | 3;
  outfit: Outfit;
}

export function buildDailyRecommendations(
  userId: string,
  wardrobe: WardrobeItem[],
  favorites: FavoriteOutfit[],
  allOutfits: Outfit[],
  weather: Weather,
  date = todayKey(),
): DailyRecommendation[] {
  const tags = new Set(weatherTags(weather));
  const favoriteOutfitIds = new Set(favorites.map((f) => f.outfitId));
  const favoriteOutfits = allOutfits.filter((o) => favoriteOutfitIds.has(o.id));

  const ruleOutfit = buildOutfit(userId, wardrobe, tags, 11, "rule");
  const randomOutfit = buildOutfit(userId, wardrobe, tags, 7, "random");

  let look3Outfit: Outfit | undefined;
  if (favoriteOutfits.length > 0) {
    const scored = favoriteOutfits
      .map((o, idx) => {
        let score = 0;
        outfitItemSeasons(o, wardrobe).forEach((s) => {
          if (s.includes("all")) score += 1;
          else if (Array.from(tags).some((t) => s.includes(t))) score += 4;
          else score -= 2;
        });
        score += rand(3 + idx) * 3;
        return { o, score };
      })
      .sort((a, b) => b.score - a.score);
    look3Outfit = { ...scored[0]!.o, id: uid() };
  }
  if (!look3Outfit) {
    look3Outfit = buildOutfit(userId, wardrobe, tags, 23, "rule");
  }

  const plans: RecommendationPlan[] = [
    { look: 1, outfit: randomOutfit },
    { look: 2, outfit: ruleOutfit },
    { look: 3, outfit: { ...look3Outfit, source: "favorite" as OutfitSource } },
  ];

  const now = new Date().toISOString();
  return plans.map((p) => {
    const meta = LOOK_META[p.look];
    return {
      id: `${date}-look${p.look}`,
      date,
      userId,
      look: p.look,
      label: meta.label,
      tagline: meta.tagline,
      outfit: p.outfit,
      createdAt: now,
    };
  });
}

function outfitItemSeasons(outfit: Outfit, wardrobe: WardrobeItem[]): string[][] {
  const byId = new Map(wardrobe.map((i) => [i.id, i]));
  const ids = [
    outfit.topId,
    outfit.outerwearId,
    outfit.bottomId,
    outfit.dressId,
    outfit.shoesId,
    outfit.bagId,
    ...(outfit.accessoryIds ?? []),
  ].filter((id): id is string => Boolean(id));
  return ids.map((id) => byId.get(id)?.season ?? ["all"]);
}
