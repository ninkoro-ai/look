import type { Category } from "@/lib/types";

/** /demo/real-tryon 演示数据（项目自有素材，无版权风险） */

export interface DemoModel {
  id: string;
  name: string;
  age: number;
  style: string;
  imageUrl: string;
}

export interface DemoGarment {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
}

export const DEMO_MODELS: DemoModel[] = [
  { id: "m1", name: "小雨", age: 25, style: "日常休闲", imageUrl: "/demo/real-tryon/models/model-1.jpg" },
  { id: "m2", name: "安琪", age: 28, style: "通勤职业", imageUrl: "/demo/real-tryon/models/model-2.jpg" },
  { id: "m3", name: "糖糖", age: 23, style: "年轻甜美", imageUrl: "/demo/real-tryon/models/model-3.jpg" },
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
