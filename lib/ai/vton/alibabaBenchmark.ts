import type { VTONCategory } from "@/lib/ai/vton/contract";

/** 20 组真实图片基准：三类图片（真人自拍 / 衣服照片 / 复杂场景） */
export type AlibabaBenchGroup = "real-selfie" | "flat-lay" | "complex";

export interface AlibabaBenchCase {
  id: string;
  group: AlibabaBenchGroup;
  label: string;
  /** 人物照片路径（public/bench-assets/alibaba/ 下） */
  personPath: string;
  /** 衣服照片路径 */
  garmentPath: string;
  category: VTONCategory;
}

/**
 * 真实图片约定（文件需由测试人员放入 public/bench-assets/alibaba/）：
 * - person-01..08.jpg：真人自拍（全身、正面、光线正常，或复杂场景）
 * - garment-01..20.jpg：衣服照片（白底平铺/挂拍/商品图）
 * 实验台会自动探测文件是否就绪；未就绪的 case 不执行、不计入结果。
 */
export const ALIBABA_BENCH_CASES: AlibabaBenchCase[] = [
  // ---- A. 真人自拍（8 组）----
  { id: "ab01", group: "real-selfie", label: "真人自拍 01 · 正面全身", personPath: "/bench-assets/alibaba/person-01.jpg", garmentPath: "/bench-assets/alibaba/garment-01.jpg", category: "top" },
  { id: "ab02", group: "real-selfie", label: "真人自拍 02 · 白T 试穿", personPath: "/bench-assets/alibaba/person-02.jpg", garmentPath: "/bench-assets/alibaba/garment-02.jpg", category: "top" },
  { id: "ab03", group: "real-selfie", label: "真人自拍 03 · 衬衫试穿", personPath: "/bench-assets/alibaba/person-03.jpg", garmentPath: "/bench-assets/alibaba/garment-03.jpg", category: "top" },
  { id: "ab04", group: "real-selfie", label: "真人自拍 04 · 外套试穿", personPath: "/bench-assets/alibaba/person-04.jpg", garmentPath: "/bench-assets/alibaba/garment-04.jpg", category: "outerwear" },
  { id: "ab05", group: "real-selfie", label: "真人自拍 05 · 连衣裙试穿", personPath: "/bench-assets/alibaba/person-05.jpg", garmentPath: "/bench-assets/alibaba/garment-05.jpg", category: "dress" },
  { id: "ab06", group: "real-selfie", label: "真人自拍 06 · 深色衣物", personPath: "/bench-assets/alibaba/person-06.jpg", garmentPath: "/bench-assets/alibaba/garment-06.jpg", category: "top" },
  { id: "ab07", group: "real-selfie", label: "真人自拍 07 · 浅色衣物", personPath: "/bench-assets/alibaba/person-07.jpg", garmentPath: "/bench-assets/alibaba/garment-07.jpg", category: "top" },
  { id: "ab08", group: "real-selfie", label: "真人自拍 08 · 宽松版型", personPath: "/bench-assets/alibaba/person-08.jpg", garmentPath: "/bench-assets/alibaba/garment-08.jpg", category: "top" },
  // ---- B. 衣服照片（8 组）----
  { id: "ab09", group: "flat-lay", label: "衣服照片 01 · 白底平铺", personPath: "/bench-assets/alibaba/person-01.jpg", garmentPath: "/bench-assets/alibaba/garment-09.jpg", category: "top" },
  { id: "ab10", group: "flat-lay", label: "衣服照片 02 · 挂拍", personPath: "/bench-assets/alibaba/person-02.jpg", garmentPath: "/bench-assets/alibaba/garment-10.jpg", category: "top" },
  { id: "ab11", group: "flat-lay", label: "衣服照片 03 · 商品图", personPath: "/bench-assets/alibaba/person-03.jpg", garmentPath: "/bench-assets/alibaba/garment-11.jpg", category: "top" },
  { id: "ab12", group: "flat-lay", label: "衣服照片 04 · 套装", personPath: "/bench-assets/alibaba/person-04.jpg", garmentPath: "/bench-assets/alibaba/garment-12.jpg", category: "outerwear" },
  { id: "ab13", group: "flat-lay", label: "衣服照片 05 · 浅色系", personPath: "/bench-assets/alibaba/person-05.jpg", garmentPath: "/bench-assets/alibaba/garment-13.jpg", category: "top" },
  { id: "ab14", group: "flat-lay", label: "衣服照片 06 · 深色系", personPath: "/bench-assets/alibaba/person-06.jpg", garmentPath: "/bench-assets/alibaba/garment-14.jpg", category: "top" },
  { id: "ab15", group: "flat-lay", label: "衣服照片 07 · 条纹图案", personPath: "/bench-assets/alibaba/person-07.jpg", garmentPath: "/bench-assets/alibaba/garment-15.jpg", category: "top" },
  { id: "ab16", group: "flat-lay", label: "衣服照片 08 · 针织材质", personPath: "/bench-assets/alibaba/person-08.jpg", garmentPath: "/bench-assets/alibaba/garment-16.jpg", category: "top" },
  // ---- C. 复杂场景（4 组）----
  { id: "ab17", group: "complex", label: "复杂场景 01 · 镜子自拍", personPath: "/bench-assets/alibaba/person-05.jpg", garmentPath: "/bench-assets/alibaba/garment-17.jpg", category: "top" },
  { id: "ab18", group: "complex", label: "复杂场景 02 · 衣物遮挡", personPath: "/bench-assets/alibaba/person-06.jpg", garmentPath: "/bench-assets/alibaba/garment-18.jpg", category: "top" },
  { id: "ab19", group: "complex", label: "复杂场景 03 · 复杂背景", personPath: "/bench-assets/alibaba/person-07.jpg", garmentPath: "/bench-assets/alibaba/garment-19.jpg", category: "top" },
  { id: "ab20", group: "complex", label: "复杂场景 04 · 光线不足", personPath: "/bench-assets/alibaba/person-08.jpg", garmentPath: "/bench-assets/alibaba/garment-20.jpg", category: "top" },
];

export function alibabaBenchUniqueAssets(cases: AlibabaBenchCase[] = ALIBABA_BENCH_CASES): string[] {
  return [...new Set(cases.flatMap((c) => [c.personPath, c.garmentPath]))];
}
