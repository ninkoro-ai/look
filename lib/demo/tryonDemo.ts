import type { Category } from "@/lib/types";

/** /demo/real-tryon 演示数据（项目自有素材，无版权风险） */

export interface DemoModel {
  id: string;
  name: string;
  age?: number;
  style?: string;
  imageUrl: string;
}

export interface DemoGarment {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
}

export interface DemoGenerated {
  id: string;
  modelImageUrl: string;
  garmentName: string;
  resultUrl: string;
}

export const DEMO_MODELS: DemoModel[] = [
  { id: "a01", name: "AI 模特 01", imageUrl: "/demo/real-tryon/models/ai-01.png" },
  { id: "a02", name: "AI 模特 02", imageUrl: "/demo/real-tryon/models/ai-02.png" },
  { id: "a03", name: "AI 模特 03", imageUrl: "/demo/real-tryon/models/ai-03.png" },
  { id: "a04", name: "AI 模特 04", imageUrl: "/demo/real-tryon/models/ai-04.png" },
  { id: "a05", name: "AI 模特 05", imageUrl: "/demo/real-tryon/models/ai-05.png" },
  { id: "a06", name: "AI 模特 06", imageUrl: "/demo/real-tryon/models/ai-06.png" },
  { id: "a07", name: "AI 模特 07", imageUrl: "/demo/real-tryon/models/ai-07.png" },
  { id: "a08", name: "AI 模特 08", imageUrl: "/demo/real-tryon/models/ai-08.png" },
  { id: "a09", name: "AI 模特 09", imageUrl: "/demo/real-tryon/models/ai-09.png" },
  { id: "a10", name: "AI 模特 10", imageUrl: "/demo/real-tryon/models/ai-10.png" },
  { id: "a11", name: "AI 模特 11", imageUrl: "/demo/real-tryon/models/ai-11.png" },
  { id: "a12", name: "AI 模特 12", imageUrl: "/demo/real-tryon/models/ai-12.png" },
  { id: "a13", name: "AI 模特 13", imageUrl: "/demo/real-tryon/models/ai-13.png" },
  { id: "a14", name: "AI 模特 14", imageUrl: "/demo/real-tryon/models/ai-14.png" },
  { id: "a15", name: "AI 模特 15", imageUrl: "/demo/real-tryon/models/ai-15.png" },
  { id: "r01", name: "真实模特 01", imageUrl: "/demo/real-tryon/models/real-01.jpg" },
  { id: "r02", name: "真实模特 02", imageUrl: "/demo/real-tryon/models/real-02.jpg" },
  { id: "r03", name: "真实模特 03", imageUrl: "/demo/real-tryon/models/real-03.jpg" },
  { id: "r04", name: "真实模特 04", imageUrl: "/demo/real-tryon/models/real-04.jpg" },
  { id: "r05", name: "真实模特 05", imageUrl: "/demo/real-tryon/models/real-05.jpg" },
  { id: "r06", name: "真实模特 06", imageUrl: "/demo/real-tryon/models/real-06.jpg" },
  { id: "r07", name: "真实模特 07", imageUrl: "/demo/real-tryon/models/real-07.jpg" },
  { id: "r08", name: "真实模特 08", imageUrl: "/demo/real-tryon/models/real-08.jpg" },
  { id: "r09", name: "真实模特 09", imageUrl: "/demo/real-tryon/models/real-09.jpg" },
  { id: "r10", name: "真实模特 10", imageUrl: "/demo/real-tryon/models/real-10.jpg" },
  { id: "r11", name: "真实模特 11", imageUrl: "/demo/real-tryon/models/real-11.jpg" },
  { id: "r12", name: "真实模特 12", imageUrl: "/demo/real-tryon/models/real-12.jpg" },
  { id: "r13", name: "真实模特 13", imageUrl: "/demo/real-tryon/models/real-13.jpg" },
];

export const DEMO_GARMENTS: DemoGarment[] = [
  { id: "top-01", name: "白色短袖 T 恤", category: "top", imageUrl: "/demo/real-tryon/garments/top-01.png" },
  { id: "top-02", name: "黑色修身打底衫", category: "top", imageUrl: "/demo/real-tryon/garments/top-02.png" },
  { id: "top-03", name: "米白真丝衬衫", category: "top", imageUrl: "/demo/real-tryon/garments/top-03.png" },
  { id: "top-05", name: "灰色连帽卫衣", category: "top", imageUrl: "/demo/real-tryon/garments/top-05.png" },
  { id: "top-08", name: "酒红针织衫", category: "top", imageUrl: "/demo/real-tryon/garments/top-08.png" },
  { id: "out-01", name: "黑色西装外套", category: "outerwear", imageUrl: "/demo/real-tryon/garments/out-01.png" },
  { id: "out-02", name: "卡其风衣", category: "outerwear", imageUrl: "/demo/real-tryon/garments/out-02.png" },
  { id: "drs-01", name: "黑色吊带长裙", category: "dress", imageUrl: "/demo/real-tryon/garments/drs-01.png" },
  { id: "drs-02", name: "红色 A 字裙", category: "dress", imageUrl: "/demo/real-tryon/garments/drs-02.png" },
  { id: "bot-01", name: "浅蓝直筒牛仔裤", category: "bottom", imageUrl: "/demo/real-tryon/garments/bot-01.png" },
];

/** 由 DashScope AITryOn 预生成的真实试穿效果（真人模特 × 演示衣物） */
export const DEMO_GENERATED: DemoGenerated[] = [
  { id: "g1", modelImageUrl: "/demo/real-tryon/models/real-01.jpg", garmentName: "白色短袖 T 恤", resultUrl: "/demo/real-tryon/results/g1.jpg" },
  { id: "g2", modelImageUrl: "/demo/real-tryon/models/real-05.jpg", garmentName: "红色 A 字裙", resultUrl: "/demo/real-tryon/results/g2.jpg" },
  { id: "g3", modelImageUrl: "/demo/real-tryon/models/real-08.jpg", garmentName: "黑色西装外套", resultUrl: "/demo/real-tryon/results/g3.jpg" },
];
