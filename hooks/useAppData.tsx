"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deleteFavorite,
  deleteOutfit as deleteOutfitRecord,
  deleteWardrobeItem,
  ensureSeeded,
  getAllFavorites,
  getAllOutfits,
  getAllWardrobe,
  getRecommendationsForDate,
  getUserModel,
  putFavorite,
  putOutfit,
  putRecommendations,
  putUserModel,
  putWardrobeItem,
  putWardrobeItems,
} from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { REF_BODY, retuneAnchor } from "@/lib/body";
import { todayKey, uid } from "@/lib/format";
import { buildDailyRecommendations } from "@/lib/recommendations";
import { DEFAULT_ANCHOR } from "@/lib/assets";
import { getMockWeather } from "@/lib/weather";
import type {
  DailyRecommendation,
  FavoriteOutfit,
  Outfit,
  UserModel,
  WardrobeItem,
  Weather,
} from "@/lib/types";

interface AppData {
  ready: boolean;
  userModel: UserModel | null;
  wardrobe: WardrobeItem[];
  outfits: Outfit[];
  favorites: FavoriteOutfit[];
  recommendations: DailyRecommendation[];
  weather: Weather;
  addItem: (item: WardrobeItem) => Promise<void>;
  updateItem: (item: WardrobeItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemFavorite: (id: string) => Promise<void>;
  saveOutfit: (outfit: Outfit) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  toggleOutfitFavorite: (outfit: Outfit) => Promise<boolean>;
  regenerateLooks: () => Promise<void>;
  replaceUserModel: (model: UserModel) => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

async function loadAll(userId: string, date: string) {
  let userModel = await getUserModel(userId);
  const [wardrobe, outfits, favorites] = await Promise.all([
    getAllWardrobe(),
    getAllOutfits(),
    getAllFavorites(),
  ]);
  if (userModel && !userModel.body) {
    // 旧版本数据迁移：补充演示体型
    userModel = { ...userModel, source: "demo", body: REF_BODY };
    await putUserModel(userModel);
  }
  let recommendations = await getRecommendationsForDate(date);
  const weather = getMockWeather();

  if (recommendations.length === 0 && wardrobe.length > 0) {
    recommendations = buildDailyRecommendations(userId, wardrobe, favorites, outfits, weather, date);
    await putRecommendations(recommendations);
  }
  return { userModel, wardrobe, outfits, favorites, recommendations, weather };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userModel, setUserModel] = useState<UserModel | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [favorites, setFavorites] = useState<FavoriteOutfit[]>([]);
  const [recommendations, setRecommendations] = useState<DailyRecommendation[]>([]);
  const [weather, setWeather] = useState<Weather>(() => getMockWeather());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeeded();
        const data = await loadAll(DEFAULT_USER_ID, todayKey());
        if (cancelled) return;
        setUserModel(data.userModel ?? null);
        setWardrobe(data.wardrobe);
        setOutfits(data.outfits);
        setFavorites(data.favorites);
        setRecommendations(data.recommendations);
        setWeather(data.weather);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback(async (item: WardrobeItem) => {
    await putWardrobeItem(item);
    setWardrobe((prev) => [item, ...prev]);
  }, []);

  const updateItem = useCallback(async (item: WardrobeItem) => {
    await putWardrobeItem(item);
    setWardrobe((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await deleteWardrobeItem(id);
    setWardrobe((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleItemFavorite = useCallback(async (id: string) => {
    setWardrobe((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        const next = { ...target, isFavorite: !target.isFavorite };
        void putWardrobeItem(next);
        return prev.map((i) => (i.id === id ? next : i));
      }
      return prev;
    });
  }, []);

  const saveOutfit = useCallback(async (outfit: Outfit) => {
    await putOutfit(outfit);
    setOutfits((prev) => {
      const exists = prev.some((o) => o.id === outfit.id);
      return exists ? prev.map((o) => (o.id === outfit.id ? outfit : o)) : [outfit, ...prev];
    });
  }, []);

  const deleteOutfit = useCallback(
    async (id: string) => {
      await deleteOutfitRecord(id);
      setOutfits((prev) => prev.filter((o) => o.id !== id));
      const favs = favorites.filter((f) => f.outfitId === id);
      for (const f of favs) {
        await deleteFavorite(f.id);
      }
      setFavorites((prev) => prev.filter((f) => f.outfitId !== id));
    },
    [favorites],
  );

  const toggleOutfitFavorite = useCallback(
    async (outfit: Outfit): Promise<boolean> => {
      await putOutfit(outfit);
      setOutfits((prev) => {
        const exists = prev.some((o) => o.id === outfit.id);
        return exists ? prev.map((o) => (o.id === outfit.id ? outfit : o)) : [outfit, ...prev];
      });

      const existing = favorites.find((f) => f.outfitId === outfit.id);
      if (existing) {
        await deleteFavorite(existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        return false;
      }
      const fav: FavoriteOutfit = {
        id: uid(),
        outfitId: outfit.id,
        userId: outfit.userId,
        createdAt: new Date().toISOString(),
      };
      await putFavorite(fav);
      setFavorites((prev) => [...prev, fav]);
      return true;
    },
    [favorites],
  );

  const regenerateLooks = useCallback(async () => {
    const date = todayKey();
    const next = buildDailyRecommendations(DEFAULT_USER_ID, wardrobe, favorites, outfits, weather, date);
    await putRecommendations(next);
    setRecommendations(next);
  }, [wardrobe, favorites, outfits, weather]);

  /** 更换模特：更新模特图与体型，并按新体型重算所有衣物锚点 */
  const replaceUserModel = useCallback(async (model: UserModel) => {
    const body = model.body ?? REF_BODY;
    const retuned = wardrobe.map((item) => ({
      ...item,
      anchor: retuneAnchor(item.anchor ?? DEFAULT_ANCHOR[item.category], body, item.category),
    }));
    await putUserModel(model);
    await putWardrobeItems(retuned);
    setUserModel(model);
    setWardrobe(retuned);
  }, [wardrobe]);

  const value = useMemo<AppData>(
    () => ({
      ready,
      userModel,
      wardrobe,
      outfits,
      favorites,
      recommendations,
      weather,
      addItem,
      updateItem,
      deleteItem,
      toggleItemFavorite,
      saveOutfit,
      deleteOutfit,
      toggleOutfitFavorite,
      regenerateLooks,
      replaceUserModel,
    }),
    [
      ready,
      userModel,
      wardrobe,
      outfits,
      favorites,
      recommendations,
      weather,
      addItem,
      updateItem,
      deleteItem,
      toggleItemFavorite,
      saveOutfit,
      deleteOutfit,
      toggleOutfitFavorite,
      regenerateLooks,
      replaceUserModel,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData 必须在 AppDataProvider 内使用");
  return ctx;
}
