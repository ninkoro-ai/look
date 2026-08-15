import {
  accessoryAsset,
  bagAsset,
  bottomAsset,
  DEFAULT_ANCHOR,
  dressAsset,
  modelSvg,
  outerAsset,
  shoeAsset,
  topAsset,
  type AccessoryVariant,
  type BagVariant,
  type BottomVariant,
  type DressVariant,
  type OuterVariant,
  type Palette,
  type ShoeVariant,
  type TopVariant,
} from "@/lib/assets";
import { DEFAULT_USER_ID, LAYER_BY_CATEGORY } from "@/lib/constants";
import { REF_BODY } from "@/lib/body";
import type { Anchor, Category, UserModel, WardrobeItem } from "@/lib/types";

interface ItemSeed {
  id: string;
  category: Category;
  name: string;
  color?: string[];
  style?: string[];
  season?: string[];
  imageUrl: string;
  anchor: Anchor;
}

function item(seed: ItemSeed): WardrobeItem {
  return {
    id: seed.id,
    category: seed.category,
    name: seed.name,
    imageUrl: seed.imageUrl,
    transparentImageUrl: seed.imageUrl,
    color: seed.color,
    style: seed.style,
    season: seed.season,
    layer: LAYER_BY_CATEGORY[seed.category],
    anchor: seed.anchor,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };
}

function p(base: string, shade: string, accent?: string, light?: string): Palette {
  return { base, shade, accent, light };
}

const TOP_ANCHOR = DEFAULT_ANCHOR.top;
const OUTER_ANCHOR = DEFAULT_ANCHOR.outerwear;
const PANTS_ANCHOR = DEFAULT_ANCHOR.bottom;
const SHORTS_ANCHOR: Anchor = { x: 240, y: 545, width: 120, height: 180 };
const DRESS_ANCHOR = DEFAULT_ANCHOR.dress;
const SHOE_ANCHOR = DEFAULT_ANCHOR.shoes;
const BOOT_ANCHOR: Anchor = { x: 236, y: 838, width: 128, height: 300 };
const BAG_ANCHOR = DEFAULT_ANCHOR.bag;
const HAT_ANCHOR: Anchor = { x: 220, y: 56, width: 160, height: 140 };
const SUNGLASS_ANCHOR: Anchor = { x: 246, y: 146, width: 108, height: 48 };
const SCARF_ANCHOR: Anchor = { x: 252, y: 246, width: 96, height: 96 };
const NECKLACE_ANCHOR: Anchor = { x: 272, y: 272, width: 56, height: 96 };

const TOP_SEEDS: WardrobeItem[] = [
  item({
    id: "top-01",
    category: "top",
    name: "纯白短袖 T 恤",
    color: ["white"],
    style: ["casual", "loose"],
    season: ["summer", "spring", "all"],
    imageUrl: topAsset("tee", p("#F8F5EF", "#DED6C7", "#E7E0D2"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-02",
    category: "top",
    name: "黑色修身打底衫",
    color: ["black"],
    style: ["tight", "casual", "elegant"],
    season: ["all"],
    imageUrl: topAsset("long", p("#2C2C30", "#19191C"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-03",
    category: "top",
    name: "米白真丝衬衫",
    color: ["cream", "white"],
    style: ["elegant", "office", "loose"],
    season: ["spring", "summer", "autumn"],
    imageUrl: topAsset("blouse", p("#F1E9DC", "#DACBB4", "#C3A87F"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-04",
    category: "top",
    name: "奶油黄针织毛衣",
    color: ["beige", "yellow"],
    style: ["soft", "loose"],
    season: ["autumn", "winter"],
    imageUrl: topAsset("sweater", p("#EBDAA9", "#D5BE84", "#F7EED4"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-05",
    category: "top",
    name: "灰色连帽卫衣",
    color: ["gray"],
    style: ["casual", "sporty", "loose"],
    season: ["spring", "autumn", "winter"],
    imageUrl: topAsset("hoodie", p("#9B9BA2", "#7C7C84", "#E8E4DB"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-06",
    category: "top",
    name: "浅粉短袖",
    color: ["pink"],
    style: ["soft", "loose"],
    season: ["summer", "spring"],
    imageUrl: topAsset("tee", p("#F3D0CB", "#DDADA5", "#F9E6E1"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-07",
    category: "top",
    name: "藏蓝条纹长袖",
    color: ["blue"],
    style: ["casual", "tight"],
    season: ["spring", "autumn"],
    imageUrl: topAsset("long", p("#33506B", "#22394D", "#DDE7F0"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-08",
    category: "top",
    name: "酒红针织衫",
    color: ["red", "brown"],
    style: ["elegant", "soft", "tight"],
    season: ["autumn", "winter"],
    imageUrl: topAsset("sweater", p("#8E3B46", "#6D2B34", "#B25A64"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-09",
    category: "top",
    name: "卡其工装短袖",
    color: ["beige", "brown"],
    style: ["casual", "loose"],
    season: ["summer", "spring"],
    imageUrl: topAsset("tee", p("#B7A68F", "#9B8871", "#C9BBAA"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
  item({
    id: "top-10",
    category: "top",
    name: "白色雪纺衬衫",
    color: ["white"],
    style: ["elegant", "office", "loose"],
    season: ["spring", "summer"],
    imageUrl: topAsset("blouse", p("#FCFBF7", "#E3E1D7", "#C9B392"), TOP_ANCHOR.width, TOP_ANCHOR.height),
    anchor: TOP_ANCHOR,
  }),
];

const OUTER_SEEDS: WardrobeItem[] = [
  item({
    id: "out-01",
    category: "outerwear",
    name: "黑色西装外套",
    color: ["black"],
    style: ["office", "formal", "elegant"],
    season: ["spring", "autumn"],
    imageUrl: outerAsset("blazer", p("#34343A", "#232328", "#C0AA83"), OUTER_ANCHOR.width, OUTER_ANCHOR.height),
    anchor: OUTER_ANCHOR,
  }),
  item({
    id: "out-02",
    category: "outerwear",
    name: "卡其风衣",
    color: ["beige", "brown"],
    style: ["elegant", "office"],
    season: ["spring", "autumn"],
    imageUrl: outerAsset("trench", p("#C9B594", "#AD9673", "#8E6F4C"), OUTER_ANCHOR.width, OUTER_ANCHOR.height),
    anchor: OUTER_ANCHOR,
  }),
  item({
    id: "out-03",
    category: "outerwear",
    name: "燕麦色开衫",
    color: ["beige", "cream"],
    style: ["soft", "casual"],
    season: ["spring", "autumn"],
    imageUrl: outerAsset("cardigan", p("#E5D9C7", "#CDBCA4", "#BFA582"), OUTER_ANCHOR.width, OUTER_ANCHOR.height),
    anchor: OUTER_ANCHOR,
  }),
  item({
    id: "out-04",
    category: "outerwear",
    name: "米白羽绒服",
    color: ["white", "cream"],
    style: ["casual", "soft", "warm"],
    season: ["winter"],
    imageUrl: outerAsset("puffer", p("#EFE9DF", "#D6CDBF", "#D9A46A"), OUTER_ANCHOR.width, OUTER_ANCHOR.height),
    anchor: OUTER_ANCHOR,
  }),
  item({
    id: "out-05",
    category: "outerwear",
    name: "军绿夹克",
    color: ["green", "brown"],
    style: ["casual", "sporty"],
    season: ["spring", "autumn"],
    imageUrl: outerAsset("blazer", p("#6E7259", "#53563F", "#9AA17E"), OUTER_ANCHOR.width, OUTER_ANCHOR.height),
    anchor: OUTER_ANCHOR,
  }),
];

const BOTTOM_SEEDS: WardrobeItem[] = [
  item({
    id: "bot-01",
    category: "bottom",
    name: "浅蓝直筒牛仔裤",
    color: ["blue"],
    style: ["casual", "tight"],
    season: ["all"],
    imageUrl: bottomAsset("pants", p("#7E9BB8", "#5E7A96", "#B7C6D6"), PANTS_ANCHOR.width, PANTS_ANCHOR.height),
    anchor: PANTS_ANCHOR,
  }),
  item({
    id: "bot-02",
    category: "bottom",
    name: "黑色西装裤",
    color: ["black"],
    style: ["office", "elegant", "tight"],
    season: ["spring", "autumn", "winter"],
    imageUrl: bottomAsset("pants", p("#3A3A40", "#25252B", "#55555C"), PANTS_ANCHOR.width, PANTS_ANCHOR.height),
    anchor: PANTS_ANCHOR,
  }),
  item({
    id: "bot-03",
    category: "bottom",
    name: "米白阔腿裤",
    color: ["cream", "white"],
    style: ["elegant", "loose"],
    season: ["spring", "summer"],
    imageUrl: bottomAsset("pants", p("#EAE2D3", "#D1C4AD", "#F6F0E4"), PANTS_ANCHOR.width, PANTS_ANCHOR.height),
    anchor: PANTS_ANCHOR,
  }),
  item({
    id: "bot-04",
    category: "bottom",
    name: "牛仔短裤",
    color: ["blue"],
    style: ["casual"],
    season: ["summer"],
    imageUrl: bottomAsset("shorts", p("#7E9BB8", "#5E7A96"), SHORTS_ANCHOR.width, SHORTS_ANCHOR.height),
    anchor: SHORTS_ANCHOR,
  }),
  item({
    id: "bot-05",
    category: "bottom",
    name: "卡其短裤",
    color: ["beige", "brown"],
    style: ["casual"],
    season: ["summer"],
    imageUrl: bottomAsset("shorts", p("#C2B08F", "#A58F6E"), SHORTS_ANCHOR.width, SHORTS_ANCHOR.height),
    anchor: SHORTS_ANCHOR,
  }),
];

const DRESS_SEEDS: WardrobeItem[] = [
  item({
    id: "drs-01",
    category: "dress",
    name: "黑色吊带长裙",
    color: ["black"],
    style: ["elegant", "tight"],
    season: ["spring", "summer", "autumn"],
    imageUrl: dressAsset("slip", p("#3B3B42", "#26262D", "#C8A77B"), DRESS_ANCHOR.width, DRESS_ANCHOR.height),
    anchor: DRESS_ANCHOR,
  }),
  item({
    id: "drs-02",
    category: "dress",
    name: "红色 A 字裙",
    color: ["red"],
    style: ["soft", "elegant", "loose"],
    season: ["spring", "summer"],
    imageUrl: dressAsset("a", p("#BA4A50", "#93383D", "#D97E82"), DRESS_ANCHOR.width, DRESS_ANCHOR.height),
    anchor: DRESS_ANCHOR,
  }),
  item({
    id: "drs-03",
    category: "dress",
    name: "奶油针织连衣裙",
    color: ["cream", "beige"],
    style: ["soft", "loose"],
    season: ["autumn", "winter"],
    imageUrl: dressAsset("a", p("#E8DDCB", "#D1C0A5", "#F4ECDE"), DRESS_ANCHOR.width, DRESS_ANCHOR.height),
    anchor: DRESS_ANCHOR,
  }),
];

const SHOE_SEEDS: WardrobeItem[] = [
  item({
    id: "sh-01",
    category: "shoes",
    name: "白色运动鞋",
    color: ["white"],
    style: ["casual", "sporty"],
    season: ["all"],
    imageUrl: shoeAsset("sneakers", p("#F2F0EA", "#D7D1C6", "#E0A76E"), SHOE_ANCHOR.width, SHOE_ANCHOR.height),
    anchor: SHOE_ANCHOR,
  }),
  item({
    id: "sh-02",
    category: "shoes",
    name: "黑色高跟鞋",
    color: ["black"],
    style: ["elegant", "office"],
    season: ["spring", "autumn"],
    imageUrl: shoeAsset("heels", p("#3A3A40", "#242429", "#6A6A72"), SHOE_ANCHOR.width, SHOE_ANCHOR.height),
    anchor: SHOE_ANCHOR,
  }),
  item({
    id: "sh-03",
    category: "shoes",
    name: "米色平底鞋",
    color: ["beige", "cream"],
    style: ["soft", "elegant"],
    season: ["spring", "summer"],
    imageUrl: shoeAsset("flats", p("#D9CAB1", "#BFAE8F", "#F0E8D8"), SHOE_ANCHOR.width, SHOE_ANCHOR.height),
    anchor: SHOE_ANCHOR,
  }),
  item({
    id: "sh-04",
    category: "shoes",
    name: "棕色短靴",
    color: ["brown"],
    style: ["casual", "cool"],
    season: ["autumn", "winter"],
    imageUrl: shoeAsset("boots", p("#8A6B50", "#6D5039", "#A58564"), BOOT_ANCHOR.width, BOOT_ANCHOR.height),
    anchor: BOOT_ANCHOR,
  }),
];

const BAG_SEEDS: WardrobeItem[] = [
  item({
    id: "bag-01",
    category: "bag",
    name: "米白托特包",
    color: ["cream", "beige"],
    style: ["office", "casual"],
    season: ["all"],
    imageUrl: bagAsset("tote", p("#E8DDC9", "#CAB9A0", "#F4EDE0"), BAG_ANCHOR.width, BAG_ANCHOR.height),
    anchor: BAG_ANCHOR,
  }),
  item({
    id: "bag-02",
    category: "bag",
    name: "黑色腋下包",
    color: ["black"],
    style: ["elegant"],
    season: ["all"],
    imageUrl: bagAsset("shoulder", p("#35353B", "#202026", "#C9A87C"), BAG_ANCHOR.width, BAG_ANCHOR.height),
    anchor: BAG_ANCHOR,
  }),
  item({
    id: "bag-03",
    category: "bag",
    name: "棕色链条小包",
    color: ["brown"],
    style: ["elegant", "casual"],
    season: ["all"],
    imageUrl: bagAsset("mini", p("#A0714C", "#7E5736", "#C79B6E"), BAG_ANCHOR.width, BAG_ANCHOR.height),
    anchor: BAG_ANCHOR,
  }),
];

const ACCESSORY_SEEDS: WardrobeItem[] = [
  item({
    id: "acc-01",
    category: "accessory",
    name: "米色遮阳帽",
    color: ["beige", "cream"],
    style: ["soft", "casual"],
    season: ["summer", "spring"],
    imageUrl: accessoryAsset("sunhat", p("#E5D4B9", "#C8B191", "#B98A5A"), HAT_ANCHOR.width, HAT_ANCHOR.height),
    anchor: HAT_ANCHOR,
  }),
  item({
    id: "acc-02",
    category: "accessory",
    name: "黑色墨镜",
    color: ["black"],
    style: ["cool"],
    season: ["summer", "spring"],
    imageUrl: accessoryAsset("sunglasses", p("#2F2F34", "#1B1B1F", "#D9D2C4"), SUNGLASS_ANCHOR.width, SUNGLASS_ANCHOR.height),
    anchor: SUNGLASS_ANCHOR,
  }),
  item({
    id: "acc-03",
    category: "accessory",
    name: "酒红丝巾",
    color: ["red", "brown"],
    style: ["elegant", "soft"],
    season: ["autumn", "winter", "spring"],
    imageUrl: accessoryAsset("scarf", p("#8E3B46", "#6C2B34", "#B25A64"), SCARF_ANCHOR.width, SCARF_ANCHOR.height),
    anchor: SCARF_ANCHOR,
  }),
  item({
    id: "acc-04",
    category: "accessory",
    name: "珍珠项链",
    color: ["white", "cream"],
    style: ["elegant"],
    season: ["all"],
    imageUrl: accessoryAsset("necklace", p("#D9CCB9", "#B7A68E", "#F3E9D8"), NECKLACE_ANCHOR.width, NECKLACE_ANCHOR.height),
    anchor: NECKLACE_ANCHOR,
  }),
  item({
    id: "acc-05",
    category: "accessory",
    name: "黑色贝雷帽",
    color: ["black"],
    style: ["elegant", "cool"],
    season: ["autumn", "winter"],
    imageUrl: accessoryAsset("beret", p("#3B3B40", "#26262C", "#C9A87C"), HAT_ANCHOR.width, HAT_ANCHOR.height),
    anchor: HAT_ANCHOR,
  }),
];

export const DEMO_ITEMS: WardrobeItem[] = [
  ...TOP_SEEDS,
  ...OUTER_SEEDS,
  ...BOTTOM_SEEDS,
  ...DRESS_SEEDS,
  ...SHOE_SEEDS,
  ...BAG_SEEDS,
  ...ACCESSORY_SEEDS,
];

export function demoUserModel(): UserModel {
  return {
    id: DEFAULT_USER_ID,
    modelImage: `data:image/svg+xml;utf8,${encodeURIComponent(modelSvg())}`,
    modelCanvasWidth: 600,
    modelCanvasHeight: 1200,
    source: "demo",
    body: REF_BODY,
    createdAt: new Date().toISOString(),
  };
}

/** 新增单品时的演示素材（按品类挑选） */
export function demoPresetsFor(category: Category): WardrobeItem[] {
  return DEMO_ITEMS.filter((i) => i.category === category);
}

export type { TopVariant, OuterVariant, BottomVariant, DressVariant, ShoeVariant, BagVariant, AccessoryVariant };
