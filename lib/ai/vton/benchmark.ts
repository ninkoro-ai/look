import type { VTONCategory } from "@/lib/ai/vton/contract";

export interface BenchmarkCase {
  id: string;
  label: string;
  /** 分组：A 上衣（T恤）/ B 衬衫 / C 外套 / D 连衣裙 */
  group: "A-tee" | "B-shirt" | "C-outerwear" | "D-dress";
  category: VTONCategory;
  personUrl: string;
  garmentItemId: string;
}

/**
 * Phase 6B 固定基准数据集（20 组）：
 * A. T恤 ×5 / B. 衬衫 ×5 / C. 外套 ×5 / D. 连衣裙 ×5。
 * 输入固定为本地样例人物图 + 演示衣物素材，所有 Provider 使用完全相同的输入。
 * 人物样例仅 3 张（正面站立/轻微侧身/长发，均为合法测试素材），标签为描述性意图。
 */
export const BENCHMARK_CASES: BenchmarkCase[] = [
  // ---- A. T恤（5 组）----
  { id: "b01", label: "A-T恤 正面站立 × 纯白短袖 T 恤", group: "A-tee", category: "top", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-01" },
  { id: "b02", label: "A-T恤 轻微侧身 × 浅粉短袖", group: "A-tee", category: "top", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-06" },
  { id: "b03", label: "A-T恤 长发 × 卡其工装短袖", group: "A-tee", category: "top", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-09" },
  { id: "b04", label: "A-T恤 浅色衣物 × 纯白短袖 T 恤", group: "A-tee", category: "top", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-01" },
  { id: "b05", label: "A-T恤 室外环境 × 浅粉短袖", group: "A-tee", category: "top", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-06" },
  // ---- B. 衬衫（5 组）----
  { id: "b06", label: "B-衬衫 长发 × 米白真丝衬衫", group: "B-shirt", category: "top", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-03" },
  { id: "b07", label: "B-衬衫 短发 × 白色雪纺衬衫", group: "B-shirt", category: "top", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-10" },
  { id: "b08", label: "B-衬衫 修身版型 × 藏蓝条纹长袖", group: "B-shirt", category: "top", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-07" },
  { id: "b09", label: "B-衬衫 深色衣物 × 藏蓝条纹长袖", group: "B-shirt", category: "top", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-07" },
  { id: "b10", label: "B-衬衫 室内光线 × 米白真丝衬衫", group: "B-shirt", category: "top", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-03" },
  // ---- C. 外套（5 组）----
  { id: "b11", label: "C-外套 正面站立 × 黑色西装外套", group: "C-outerwear", category: "outerwear", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "out-01" },
  { id: "b12", label: "C-外套 轻微侧身 × 卡其风衣", group: "C-outerwear", category: "outerwear", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "out-02" },
  { id: "b13", label: "C-外套 长发 × 燕麦色开衫", group: "C-outerwear", category: "outerwear", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "out-03" },
  { id: "b14", label: "C-外套 短发 × 米白羽绒服", group: "C-outerwear", category: "outerwear", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "out-04" },
  { id: "b15", label: "C-外套 宽松版型 × 军绿夹克", group: "C-outerwear", category: "outerwear", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "out-05" },
  // ---- D. 连衣裙（5 组）----
  { id: "b16", label: "D-连衣裙 正面站立 × 黑色吊带长裙", group: "D-dress", category: "dress", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "drs-01" },
  { id: "b17", label: "D-连衣裙 轻微侧身 × 红色 A 字裙", group: "D-dress", category: "dress", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "drs-02" },
  { id: "b18", label: "D-连衣裙 长发 × 奶油针织连衣裙", group: "D-dress", category: "dress", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "drs-03" },
  { id: "b19", label: "D-连衣裙 室内光线 × 黑色吊带长裙", group: "D-dress", category: "dress", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "drs-01" },
  { id: "b20", label: "D-连衣裙 室外环境 × 红色 A 字裙", group: "D-dress", category: "dress", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "drs-02" },
];
