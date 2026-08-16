/**
 * 生成 Phase 6C Wardrobe Validation Dataset 的 20 张演示样例 SVG。
 * 全部为项目自绘矢量素材（无真实人物照片），输出到 public/lab-samples/wardrobe/。
 */
import fs from "node:fs";
import path from "node:path";

const W = 480;
const H = 640;

const BG = [
  "#F4E8DC",
  "#EAF0F4",
  "#F1E9F0",
  "#EAF2E6",
  "#F5EFE0",
];

function jacket(x, y, w, h) {
  const b = "#5B7FA6";
  const s = "#3F5F85";
  const a = "#C0AA83";
  return `
  <path d="M ${x + w * 0.08} ${y + h * 0.08} L ${x + w * 0.32} ${y + h * 0.3} L ${x + w * 0.26} ${y + h * 0.84} L ${x + w * 0.46} ${y + h * 0.7} L ${x + w * 0.54} ${y + h * 0.7} L ${x + w * 0.74} ${y + h * 0.84} L ${x + w * 0.68} ${y + h * 0.3} L ${x + w * 0.92} ${y + h * 0.08} L ${x + w * 0.74} ${y + h * 0.92} L ${x + w * 0.26} ${y + h * 0.92} Z" fill="${b}" stroke="${s}" stroke-width="3"/>
  <path d="M ${x + w * 0.46} ${y + h * 0.32} L ${x + w * 0.36} ${y + h * 0.08} L ${x + w * 0.5} ${y + h * 0.48} L ${x + w * 0.64} ${y + h * 0.08} L ${x + w * 0.54} ${y + h * 0.32} Z" fill="${a}" opacity="0.85"/>
  <circle cx="${x + w * 0.5}" cy="${y + h * 0.42}" r="4" fill="${s}"/>`;
}

function tee(x, y, w, h) {
  const b = "#F8F5EF";
  const s = "#DED6C7";
  return `
  <path d="M ${x + w * 0.14} ${y + h * 0.08} L ${x + w * 0.32} ${y + h * 0.02} L ${x + w * 0.68} ${y + h * 0.02} L ${x + w * 0.86} ${y + h * 0.08} L ${x + w * 0.8} ${y + h * 0.28} L ${x + w * 0.72} ${y + h * 0.22} L ${x + w * 0.7} ${y + h * 0.92} L ${x + w * 0.3} ${y + h * 0.92} L ${x + w * 0.28} ${y + h * 0.22} L ${x + w * 0.2} ${y + h * 0.28} Z" fill="${b}" stroke="${s}" stroke-width="3"/>`;
}

function pants(x, y, w, h) {
  const b = "#2C2C30";
  const s = "#19191C";
  return `
  <rect x="${x + w * 0.28}" y="${y}" width="${w * 0.44}" height="${h * 0.42}" fill="${b}" stroke="${s}" stroke-width="3"/>
  <path d="M ${x + w * 0.7} ${y + h * 0.42} L ${x + w * 0.78} ${y + h} L ${x + w * 0.56} ${y + h} L ${x + w * 0.5} ${y + h * 0.55} L ${x + w * 0.44} ${y + h} L ${x + w * 0.22} ${y + h} L ${x + w * 0.3} ${y + h * 0.42} Z" fill="${b}" stroke="${s}" stroke-width="3"/>`;
}

function shoes(x, y, w, h) {
  const b = "#F2F0EA";
  const s = "#D7D1C6";
  return `
  <ellipse cx="${x + w * 0.3}" cy="${y + h * 0.5}" rx="${w * 0.22}" ry="${h * 0.3}" fill="${b}" stroke="${s}" stroke-width="3"/>
  <ellipse cx="${x + w * 0.7}" cy="${y + h * 0.5}" rx="${w * 0.22}" ry="${h * 0.3}" fill="${b}" stroke="${s}" stroke-width="3"/>
  <path d="M ${x + w * 0.14} ${y + h * 0.55} L ${x + w * 0.46} ${y + h * 0.55} M ${x + w * 0.54} ${y + h * 0.55} L ${x + w * 0.86} ${y + h * 0.55}" stroke="${s}" stroke-width="4"/>`;
}

function bag(x, y, w, h) {
  const b = "#2C2C30";
  const s = "#19191C";
  return `
  <path d="M ${x + w * 0.36} ${y + h * 0.28} Q ${x + w * 0.5} ${y - h * 0.2} ${x + w * 0.64} ${y + h * 0.28}" fill="none" stroke="${s}" stroke-width="5"/>
  <rect x="${x + w * 0.12}" y="${y + h * 0.28}" width="${w * 0.76}" height="${h * 0.6}" rx="${h * 0.14}" fill="${b}" stroke="${s}" stroke-width="3"/>`;
}

function hanger(x, y, w, h) {
  return `
  <path d="M ${x + w * 0.2} ${y + h * 0.12} L ${x + w * 0.5} ${y + h * 0.04} L ${x + w * 0.8} ${y + h * 0.12}" fill="none" stroke="#B9A894" stroke-width="5" stroke-linecap="round"/>
  <path d="M ${x + w * 0.5} ${y + h * 0.04} L ${x + w * 0.5} ${y + h * 0.16}" stroke="#B9A894" stroke-width="5"/>`;
}

function figureOutfit(idx) {
  const skin = "#EAB892";
  const skinShade = "#DDA37D";
  const hair = idx % 2 === 0 ? "#46302A" : "#6B4A32";
  return `
  <ellipse cx="240" cy="118" rx="70" ry="82" fill="${skin}"/>
  <path d="M 172 118 C 176 52 210 30 240 30 C 270 30 304 52 308 118 C 304 66 274 52 240 52 C 206 52 176 66 172 118 Z" fill="${hair}"/>
  <rect x="222" y="196" width="36" height="56" rx="16" fill="${skinShade}"/>
  <path d="M 168 216 C 138 258 128 322 130 372 C 132 406 146 424 164 424 C 178 424 186 408 184 382 C 180 328 184 268 196 230 Z" fill="${skin}"/>
  <path d="M 312 216 C 342 258 352 322 350 372 C 348 406 334 424 316 424 C 302 424 294 408 296 382 C 300 328 296 268 284 230 Z" fill="${skin}"/>
  <ellipse cx="162" cy="428" rx="22" ry="15" fill="${skin}"/>
  <ellipse cx="318" cy="428" rx="22" ry="15" fill="${skin}"/>`;
}

function scenePerson(idx, mirror) {
  const bg = BG[idx % BG.length];
  const mirrorEl = mirror
    ? `<rect x="18" y="14" width="444" height="612" rx="28" fill="none" stroke="#C9BDAE" stroke-width="8"/>
       <path d="M 40 40 L 110 70 M 440 600 L 390 560" stroke="#FFFFFF" stroke-width="8" opacity="0.6" stroke-linecap="round"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${mirrorEl}
  <text x="24" y="40" font-family="sans-serif" font-size="16" fill="#8A7F74">${mirror ? "镜子自拍场景" : "女生自拍穿搭场景"}</text>
  <ellipse cx="240" cy="608" rx="150" ry="14" fill="#2A201A" opacity="0.07"/>
  ${figureOutfit(idx)}
  ${pants(150, 330, 180, 210)}
  ${tee(148, 215, 190, 135)}
  ${jacket(128, 168, 224, 190)}
  ${bag(306, 240, 104, 118)}
  ${shoes(148, 532, 190, 66)}
</svg>`;
}

function sceneHanger(idx) {
  const bg = BG[(idx + 2) % BG.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="24" y="40" font-family="sans-serif" font-size="16" fill="#8A7F74">衣架照片场景</text>
  <rect x="30" y="72" width="420" height="10" rx="5" fill="#B9A894"/>
  <path d="M 90 72 L 90 90 M 250 72 L 250 90 M 350 72 L 350 90" stroke="#B9A894" stroke-width="6"/>
  ${hanger(110, 84, 150, 200)}
  ${jacket(120, 110, 240, 150)}
  ${hanger(300, 96, 110, 150)}
  ${tee(300, 120, 150, 110)}
  ${pants(150, 292, 180, 190)}
  ${bag(290, 240, 110, 100)}
  ${shoes(168, 520, 210, 68)}
</svg>`;
}

function sceneFlatlay(idx) {
  const bg = BG[(idx + 3) % BG.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="24" y="40" font-family="sans-serif" font-size="16" fill="#8A7F74">平铺照片场景</text>
  <g stroke="#C9BDAE" stroke-width="1" opacity="0.35">
    <path d="M 0 120 L 480 120 M 0 240 L 480 240 M 0 360 L 480 360 M 0 480 L 480 480 M 0 560 L 480 560"/>
    <path d="M 120 0 L 120 640 M 240 0 L 240 640 M 360 0 L 360 640"/>
  </g>
  ${jacket(96, 66, 260, 160)}
  ${tee(280, 64, 170, 120)}
  ${pants(150, 260, 190, 185)}
  ${bag(286, 242, 118, 108)}
  ${shoes(166, 500, 214, 70)}
</svg>`;
}

const outDir = path.resolve("public/lab-samples/wardrobe");
fs.mkdirSync(outDir, { recursive: true });

let n = 0;
for (let i = 1; i <= 20; i++) {
  let svg;
  if (i <= 5) svg = scenePerson(i - 1, false);
  else if (i <= 10) svg = scenePerson(i - 1, true);
  else if (i <= 15) svg = sceneHanger(i - 1);
  else svg = sceneFlatlay(i - 1);
  const file = path.join(outDir, `w${String(i).padStart(2, "0")}.svg`);
  fs.writeFileSync(file, svg);
  n++;
}
console.log(`generated ${n} svg samples in ${outDir}`);
