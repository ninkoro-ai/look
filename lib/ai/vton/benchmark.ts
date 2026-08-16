export interface BenchmarkCase {
  id: string;
  label: string;
  personUrl: string;
  garmentItemId: string;
}

/**
 * 10 组基准测试用例（输入为本地样例图片 + 演示衣物素材）。
 * 标签描述测试意图，实际照片与标签的吻合度为近似。
 */
export const BENCHMARK_CASES: BenchmarkCase[] = [
  { id: "b01", label: "正面站立 × 白色 T 恤", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-01" },
  { id: "b02", label: "轻微侧身 × 米白衬衫", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-03" },
  { id: "b03", label: "长发 × 酒红针织衫", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-08" },
  { id: "b04", label: "短发 × 黑色打底衫", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-02" },
  { id: "b05", label: "宽松版型 × 灰色卫衣", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-05" },
  { id: "b06", label: "修身版型 × 黑色打底衫", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-02" },
  { id: "b07", label: "浅色衣物 × 白色 T 恤", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-01" },
  { id: "b08", label: "深色衣物 × 酒红针织衫", personUrl: "/lab-samples/person-2.jpg", garmentItemId: "top-08" },
  { id: "b09", label: "室内光线 × 奶油针织裙", personUrl: "/lab-samples/person-3.jpg", garmentItemId: "top-04" },
  { id: "b10", label: "室外环境 × 卡其工装", personUrl: "/lab-samples/person-1.jpg", garmentItemId: "top-09" },
];
