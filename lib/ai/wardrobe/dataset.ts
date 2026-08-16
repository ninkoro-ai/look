import type { Category } from "@/lib/types";

/** 场景类型（数据集维度） */
export type WardrobeScenario = "outfit" | "mirror" | "hanger" | "flatlay";

/** 上传方式（实验台维度） */
export type WardrobeMode = "outfit" | "single";

export interface WardrobeExpectedItem {
  category: Category;
  color: string;
}

export interface WardrobeDatasetCase {
  id: string;
  scenario: WardrobeScenario;
  /** 实验台上传方式：穿搭照片拆解 / 单品照片上传 */
  mode: WardrobeMode;
  label: string;
  imageUrl: string;
  /** 该样例的“期望识别结果”（用于统计 Mock 识别准确率） */
  expected: WardrobeExpectedItem[];
}

/**
 * Phase 6C Wardrobe Validation Dataset（20 组，全部为项目自绘演示素材，无真实用户照片）：
 * - 女生自拍穿搭 ×5（outfit）
 * - 镜子自拍 ×5（mirror）
 * - 衣架照片 ×5（hanger）
 * - 平铺照片 ×5（flatlay）
 */
export const WARDROBE_DATASET: WardrobeDatasetCase[] = [
  // ---- 场景1：女生自拍穿搭（5 组）----
  { id: "w01", scenario: "outfit", mode: "outfit", label: "女生自拍穿搭 01 · 日常牛仔", imageUrl: "/lab-samples/wardrobe/w01.png", expected: exp() },
  { id: "w02", scenario: "outfit", mode: "outfit", label: "女生自拍穿搭 02 · 通勤", imageUrl: "/lab-samples/wardrobe/w02.png", expected: exp() },
  { id: "w03", scenario: "outfit", mode: "outfit", label: "女生自拍穿搭 03 · 休闲", imageUrl: "/lab-samples/wardrobe/w03.png", expected: exp() },
  { id: "w04", scenario: "outfit", mode: "outfit", label: "女生自拍穿搭 04 · 周末", imageUrl: "/lab-samples/wardrobe/w04.png", expected: exp() },
  { id: "w05", scenario: "outfit", mode: "outfit", label: "女生自拍穿搭 05 · 出行", imageUrl: "/lab-samples/wardrobe/w05.png", expected: exp() },
  // ---- 场景2：镜子自拍（5 组）----
  { id: "w06", scenario: "mirror", mode: "outfit", label: "镜子自拍 01 · 全身镜", imageUrl: "/lab-samples/wardrobe/w06.png", expected: exp() },
  { id: "w07", scenario: "mirror", mode: "outfit", label: "镜子自拍 02 · 商场试衣镜", imageUrl: "/lab-samples/wardrobe/w07.png", expected: exp() },
  { id: "w08", scenario: "mirror", mode: "outfit", label: "镜子自拍 03 · 卧室全身镜", imageUrl: "/lab-samples/wardrobe/w08.png", expected: exp() },
  { id: "w09", scenario: "mirror", mode: "outfit", label: "镜子自拍 04 · 门口镜", imageUrl: "/lab-samples/wardrobe/w09.png", expected: exp() },
  { id: "w10", scenario: "mirror", mode: "outfit", label: "镜子自拍 05 · 试衣间", imageUrl: "/lab-samples/wardrobe/w10.png", expected: exp() },
  // ---- 场景3：衣架照片（5 组）----
  { id: "w11", scenario: "hanger", mode: "single", label: "衣架照片 01 · 外套挂拍", imageUrl: "/lab-samples/wardrobe/w11.png", expected: exp() },
  { id: "w12", scenario: "hanger", mode: "single", label: "衣架照片 02 · 全套挂拍", imageUrl: "/lab-samples/wardrobe/w12.png", expected: exp() },
  { id: "w13", scenario: "hanger", mode: "single", label: "衣架照片 03 · 衣柜内部", imageUrl: "/lab-samples/wardrobe/w13.png", expected: exp() },
  { id: "w14", scenario: "hanger", mode: "single", label: "衣架照片 04 · 阳台晾挂", imageUrl: "/lab-samples/wardrobe/w14.png", expected: exp() },
  { id: "w15", scenario: "hanger", mode: "single", label: "衣架照片 05 · 店铺挂拍", imageUrl: "/lab-samples/wardrobe/w15.png", expected: exp() },
  // ---- 场景4：平铺照片（5 组）----
  { id: "w16", scenario: "flatlay", mode: "single", label: "平铺照片 01 · 床上平铺", imageUrl: "/lab-samples/wardrobe/w16.png", expected: exp() },
  { id: "w17", scenario: "flatlay", mode: "single", label: "平铺照片 02 · 地面平铺", imageUrl: "/lab-samples/wardrobe/w17.png", expected: exp() },
  { id: "w18", scenario: "flatlay", mode: "single", label: "平铺照片 03 · 桌面平铺", imageUrl: "/lab-samples/wardrobe/w18.png", expected: exp() },
  { id: "w19", scenario: "flatlay", mode: "single", label: "平铺照片 04 · 沙发平铺", imageUrl: "/lab-samples/wardrobe/w19.png", expected: exp() },
  { id: "w20", scenario: "flatlay", mode: "single", label: "平铺照片 05 · 购物袋平铺", imageUrl: "/lab-samples/wardrobe/w20.png", expected: exp() },
];

export function getWardrobeCase(id: string): WardrobeDatasetCase | undefined {
  return WARDROBE_DATASET.find((c) => c.id === id);
}

/** 与 Mock 检测输出一致的期望结果（仅用于演示数据集的流程验证） */
function exp(): WardrobeExpectedItem[] {
  return [
    { category: "outerwear", color: "blue" },
    { category: "top", color: "white" },
    { category: "bottom", color: "black" },
    { category: "shoes", color: "white" },
    { category: "bag", color: "black" },
  ];
}
