export type Category =
  | "top"
  | "outerwear"
  | "bottom"
  | "dress"
  | "shoes"
  | "bag"
  | "accessory";

export type OutfitSource = "random" | "rule" | "favorite" | "manual";

export interface UserModel {
  id: string;
  modelImage: string;
  modelCanvasWidth: number;
  modelCanvasHeight: number;
  source?: "demo" | "photo";
  body?: ModelBody;
  createdAt: string;
}

/** 模特体型关键点（统一在 600×1200 标准画布坐标系内） */
export interface ModelBody {
  headTop: number;
  neckY: number;
  shoulderY: number;
  waistY: number;
  hipY: number;
  kneeY: number;
  ankleY: number;
  footY: number;
  shoulderWidth: number;
  hipWidth: number;
}

export interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WardrobeItem {
  id: string;
  category: Category;
  name: string;
  imageUrl: string;
  transparentImageUrl?: string;
  color?: string[];
  style?: string[];
  season?: string[];
  layer: number;
  anchor?: Anchor;
  isFavorite?: boolean;
  createdAt: string;
}

export interface Outfit {
  id: string;
  userId: string;
  topId?: string;
  outerwearId?: string;
  bottomId?: string;
  dressId?: string;
  shoesId?: string;
  bagId?: string;
  accessoryIds?: string[];
  source: OutfitSource;
  createdAt: string;
}

export interface FavoriteOutfit {
  id: string;
  outfitId: string;
  userId: string;
  createdAt: string;
}

export interface DailyRecommendation {
  id: string;
  date: string;
  userId: string;
  look: 1 | 2 | 3;
  label: string;
  tagline: string;
  outfit: Outfit;
  createdAt: string;
}

export interface Weather {
  city: string;
  date: string;
  condition: "sunny" | "cloudy" | "rain" | "snow";
  conditionLabel: string;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
  tip: string;
}
