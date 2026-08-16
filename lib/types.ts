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

export type GarmentSource = "demo" | "manual" | "photo-extraction";

export interface WardrobeItem {
  id: string;
  category: Category;
  name: string;
  imageUrl: string;
  transparentImageUrl?: string;
  source?: GarmentSource;
  originalImageUrl?: string;
  maskUrl?: string;
  aiMetadata?: {
    confidence?: number;
    detectedCategory?: string;
  };
  color?: string[];
  style?: string[];
  season?: string[];
  /** Phase 6C：仅补充必要字段，保持向后兼容 */
  subCategory?: string[];
  occasion?: string[];
  layer: number;
  anchor?: Anchor;
  isFavorite?: boolean;
  createdAt: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** AI 从穿搭照中识别出的单个服装单品 */
export interface DetectedGarment {
  id: string;
  category: Category;
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: {
    color?: string[];
    style?: string[];
    season?: string[];
  };
}

/** 提取完成、可加入衣橱的透明衣物资产 */
export interface ExtractedGarment {
  detected: DetectedGarment;
  originalCropUrl: string;
  transparentImageUrl: string;
  maskUrl?: string;
  suggestedAnchor?: Anchor;
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
