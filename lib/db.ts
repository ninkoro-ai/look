import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { demoUserModel, DEMO_ITEMS } from "@/lib/seed";
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
}

let dbPromise: Promise<IDBPDatabase<ChuanDaDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<ChuanDaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChuanDaDB>("chuanda-walk-in-closet", 1, {
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
      },
    });
  }
  return dbPromise;
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
