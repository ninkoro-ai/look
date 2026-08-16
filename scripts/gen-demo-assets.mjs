/**
 * 生成 /demo/real-tryon 素材：
 * - 3 张模特照：复用项目自有真人样例（person-1/2/3.jpg，无版权风险）
 * - 10 件透明衣物 PNG：从应用内种子数据（SVG 资产）栅格化导出
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.QA_BASE || "http://localhost:4173";

const GARMENTS = [
  ["top-01", "白色短袖 T 恤", "top"],
  ["top-02", "黑色修身打底衫", "top"],
  ["top-03", "米白真丝衬衫", "top"],
  ["top-05", "灰色连帽卫衣", "top"],
  ["top-08", "酒红针织衫", "top"],
  ["out-01", "黑色西装外套", "outerwear"],
  ["out-02", "卡其风衣", "outerwear"],
  ["drs-01", "黑色吊带长裙", "dress"],
  ["drs-02", "红色 A 字裙", "dress"],
  ["bot-01", "浅蓝直筒牛仔裤", "bottom"],
];

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(
  () =>
    new Promise((resolve) => {
      const r = indexedDB.open("chuanda-walk-in-closet", 3);
      r.onsuccess = () => {
        const db = r.result;
        const tx = db.transaction("wardrobe").objectStore("wardrobe").count();
        tx.onsuccess = () => {
          db.close();
          resolve(tx.result > 0);
        };
        tx.onerror = () => {
          db.close();
          resolve(false);
        };
      };
      r.onerror = () => resolve(false);
    }),
  undefined,
  { timeout: 60000 },
);

const pngs = await page.evaluate(async (ids) => {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open("chuanda-walk-in-closet", 3);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const all = await new Promise((resolve) => {
    const tx = db.transaction("wardrobe").objectStore("wardrobe").getAll();
    tx.onsuccess = () => resolve(tx.result);
  });
  db.close();
  const out = {};
  for (const id of ids) {
    const item = all.find((i) => i.id === id);
    if (!item) continue;
    const src = item.transparentImageUrl ?? item.imageUrl;
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
    const scale = Math.min(2, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    out[id] = canvas.toDataURL("image/png");
  }
  return out;
}, GARMENTS.map((g) => g[0]));

const root = path.resolve("public/demo/real-tryon");
fs.mkdirSync(path.join(root, "garments"), { recursive: true });
fs.mkdirSync(path.join(root, "models"), { recursive: true });

let count = 0;
for (const [id] of GARMENTS) {
  if (!pngs[id]) {
    console.log(`skip ${id}: not found`);
    continue;
  }
  const base64 = pngs[id].split(",")[1];
  fs.writeFileSync(path.join(root, "garments", `${id}.png`), Buffer.from(base64, "base64"));
  count++;
}

for (let i = 1; i <= 3; i++) {
  fs.copyFileSync(
    path.resolve(`public/lab-samples/person-${i}.jpg`),
    path.join(root, "models", `model-${i}.jpg`),
  );
}

console.log(`garments: ${count}/10 png`);
console.log("models: 3 jpg copied");
await browser.close();
