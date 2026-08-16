import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { demoUserModel, DEMO_ITEMS } from "@/lib/seed";
import { BETA_DB_NAME, currentDbName } from "@/lib/beta/storage";
import type { BetaEventRecord } from "@/lib/beta/events";
import type {
  DailyRecommendation,
  FavoriteOutfit,
  Outfit,
  UserModel,
  WardrobeItem,
} from "@/lib/types";

interface ChuanDaDB extends DBSchema {
  models: {
    key: string;
    value: UserModel;
  };
  wardrobe: {
    key: string;
    value: WardrobeItem;
    indexes: { "by-category": string };
  };
  outfits: {
    key: string;
    value: Outfit;
  };
  favorites: {
    key: string;
    value: FavoriteOutfit;
    indexes: { "by-outfit": string };
  };
  recommendations: {
    key: string;
    value: DailyRecommendation;
    indexes: { "by-date": string };
  };
  vtonTests: {
    key: string;
    value: VtonTestRecord;
    indexes: { "by-created": string };
  };
  onboardingEvents: {
    key: string;
    value: OnboardingEvent;
    indexes: { "by-created": string };
  };
  betaEvents: {
    key: string;
    value: BetaEventRecord;
    indexes: { "by-created": string };
  };
}

export interface VtonTestRecord {
  id: string;
  createdAt: string;
  caseId?: string;
  caseLabel?: string;
  provider: string;
  category: string;
  personThumb?: string;
  garmentThumb?: string;
  outputUrl?: string;
  latencyMs: number;
  estimatedCost: number;
  success: boolean;
  error?: string;
  errorCode?: string;
  quality?: {
    face: number;
    body: number;
    garment: number;
    edge: number;
    occlusion: number;
    texture: number;
    composite?: number;
  };
  note?: string;
}

/**
 * 衣橱 onboarding 分析事件。
 * 只记录行为指标，绝不包含照片、缩略图、姓名、手机号等隐私数据。
 */
export type OnboardingEventType =
  | "upload_started"
  | "detect_completed"
  | "review_updated"
  | "import_started"
  | "import_completed"
  | "import_aborted";

export interface OnboardingEvent {
  id: string;
  sessionId: string;
  createdAt: string;
  event: OnboardingEventType;
  mode: "outfit" | "single";
  caseId?: string;
  scenario?: string;
  detectedCount?: number;
  confirmedCount?: number;
  addedCount?: number;
  deletedCount?: number;
  modifiedCount?: number;
  detectedCategories?: string[];
  detectedColors?: string[];
  aiMs?: number;
  confirmMs?: number;
  totalMs?: number;
}

let dbPromise: Promise<IDBPDatabase<ChuanDaDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<ChuanDaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChuanDaDB>(currentDbName(), 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("wardrobe")) {
          const store = db.createObjectStore("wardrobe", { keyPath: "id" });
          store.createIndex("by-category", "category");
        }
        if (!db.objectStoreNames.contains("outfits")) {
          db.createObjectStore("outfits", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("favorites")) {
          const store = db.createObjectStore("favorites", { keyPath: "id" });
          store.createIndex("by-outfit", "outfitId");
        }
        if (!db.objectStoreNames.contains("recommendations")) {
          const store = db.createObjectStore("recommendations", { keyPath: "id" });
          store.createIndex("by-date", "date");
        }
        if (!db.objectStoreNames.contains("vtonTests")) {
          const store = db.createObjectStore("vtonTests", { keyPath: "id" });
          store.createIndex("by-created", "createdAt");
        }
        if (!db.objectStoreNames.contains("onboardingEvents")) {
          const store = db.createObjectStore("onboardingEvents", { keyPath: "id" });
          store.createIndex("by-created", "createdAt");
        }
        // Beta 事件只存在于 Beta 数据库，主库保持 v3 不变
        if (db.name === BETA_DB_NAME && !db.objectStoreNames.contains("betaEvents")) {
          const store = db.createObjectStore("betaEvents", { keyPath: "id" });
          store.createIndex("by-created", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

/** 切换 Beta 模式后重置数据库连接缓存（页面会 reload，一般不需要手动调用） */
export function resetDb(): void {
  dbPromise = null;
}

export async function getAllWardrobe(): Promise<WardrobeItem[]> {
  const db = await getDb();
  return db.getAll("wardrobe");
}

export async function getWardrobeItem(id: string): Promise<WardrobeItem | undefined> {
  const db = await getDb();
  return db.get("wardrobe", id);
}

export async function putWardrobeItem(item: WardrobeItem): Promise<void> {
  const db = await getDb();
  await db.put("wardrobe", item);
}

export async function putWardrobeItems(items: WardrobeItem[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("wardrobe", "readwrite");
  await Promise.all(items.map((i) => tx.store.put(i)));
  await tx.done;
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("wardrobe", id);
}

export async function getUserModel(id: string): Promise<UserModel | undefined> {
  const db = await getDb();
  return db.get("models", id);
}

export async function putUserModel(model: UserModel): Promise<void> {
  const db = await getDb();
  await db.put("models", model);
}

export async function getAllOutfits(): Promise<Outfit[]> {
  const db = await getDb();
  return db.getAll("outfits");
}

export async function getOutfit(id: string): Promise<Outfit | undefined> {
  const db = await getDb();
  return db.get("outfits", id);
}

export async function putOutfit(outfit: Outfit): Promise<void> {
  const db = await getDb();
  await db.put("outfits", outfit);
}

export async function putOutfits(outfits: Outfit[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("outfits", "readwrite");
  await Promise.all(outfits.map((o) => tx.store.put(o)));
  await tx.done;
}

export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("outfits", id);
}

export async function getAllFavorites(): Promise<FavoriteOutfit[]> {
  const db = await getDb();
  return db.getAll("favorites");
}

export async function putFavorite(favorite: FavoriteOutfit): Promise<void> {
  const db = await getDb();
  await db.put("favorites", favorite);
}

export async function deleteFavorite(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("favorites", id);
}

export async function getRecommendationsForDate(date: string): Promise<DailyRecommendation[]> {
  const db = await getDb();
  const index = db.transaction("recommendations").store.index("by-date");
  return index.getAll(date);
}

export async function putRecommendations(items: DailyRecommendation[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("recommendations", "readwrite");
  await Promise.all(items.map((r) => tx.store.put(r)));
  await tx.done;
}

export async function getAllVtonTests(): Promise<VtonTestRecord[]> {
  const db = await getDb();
  const index = db.transaction("vtonTests").store.index("by-created");
  return index.getAll();
}

export async function putVtonTest(record: VtonTestRecord): Promise<void> {
  const db = await getDb();
  await db.put("vtonTests", record);
}

export async function deleteVtonTest(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("vtonTests", id);
}

export async function clearVtonTests(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("vtonTests", "readwrite");
  await tx.store.clear();
  await tx.done;
}

export async function getAllOnboardingEvents(): Promise<OnboardingEvent[]> {
  const db = await getDb();
  const index = db.transaction("onboardingEvents").store.index("by-created");
  return index.getAll();
}

export async function putOnboardingEvent(event: OnboardingEvent): Promise<void> {
  const db = await getDb();
  await db.put("onboardingEvents", event);
}

export async function clearOnboardingEvents(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("onboardingEvents", "readwrite");
  await tx.store.clear();
  await tx.done;
}

export async function getAllBetaEvents(): Promise<BetaEventRecord[]> {
  const db = await getDb();
  const index = db.transaction("betaEvents").store.index("by-created");
  return index.getAll();
}

export async function putBetaEvent(event: BetaEventRecord): Promise<void> {
  const db = await getDb();
  await db.put("betaEvents", event);
}

export async function clearBetaEvents(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("betaEvents", "readwrite");
  await tx.store.clear();
  await tx.done;
}

/** 删除整个 Beta 数据库（不可恢复，用于“退出并删除测试数据”） */
export async function deleteBetaDatabase(): Promise<void> {
  resetDb();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(BETA_DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

/** 首次启动时写入演示模特与演示衣橱 */
export async function ensureSeeded(): Promise<void> {
  const db = await getDb();
  const count = await db.count("wardrobe");
  if (count === 0) {
    const model = demoUserModel();
    await db.put("models", model);
    await putWardrobeItems(DEMO_ITEMS);
  }
}

/** Beta 数据库：只种入演示模特，不种演示衣物（保证空衣橱首启流程可用） */
export async function ensureBetaSeeded(): Promise<void> {
  const db = await getDb();
  const count = await db.count("models");
  if (count === 0) {
    await db.put("models", demoUserModel());
  }
}
