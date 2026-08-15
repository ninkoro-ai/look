import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/constants";
import type { Category } from "@/lib/types";

export interface Palette {
  base: string;
  shade: string;
  accent?: string;
  light?: string;
}

function dataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
}

/* ------------------------------------------------------------------ */
/* 模特：标准 600×1200 人体插画                                         */
/* ------------------------------------------------------------------ */

export function modelSvg(): string {
  const skin = "#EAB892";
  const skinShade = "#DDA37D";
  const hair = "#46302A";
  const hairLight = "#5B4138";
  const tank = "#F4E9DB";
  const tankShade = "#E4D3BE";

  const body = `
  <defs>
    <linearGradient id="tank" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tank}"/>
      <stop offset="1" stop-color="${tankShade}"/>
    </linearGradient>
  </defs>

  <!-- 地面阴影 -->
  <ellipse cx="300" cy="1150" rx="132" ry="16" fill="#2A201A" opacity="0.07"/>

  <!-- 头发（后层） -->
  <path d="M 214 176 C 210 102 250 72 300 72 C 350 72 390 102 386 176 C 383 224 365 248 351 255 C 347 232 352 210 356 192 C 361 142 336 112 300 112 C 264 112 239 142 244 192 C 248 210 253 232 249 255 C 235 248 217 224 214 176 Z" fill="${hair}"/>

  <!-- 脸 -->
  <ellipse cx="300" cy="176" rx="72" ry="86" fill="${skin}"/>

  <!-- 刘海 -->
  <path d="M 228 176 C 230 128 262 108 300 108 C 338 108 370 128 372 176 C 367 146 338 136 300 136 C 262 136 233 146 228 176 Z" fill="${hairLight}"/>

  <!-- 脖子 -->
  <rect x="280" y="242" width="40" height="62" rx="16" fill="${skinShade}"/>

  <!-- 背心 -->
  <path d="M 234 312 C 256 286 280 279 300 279 C 320 279 344 286 366 312 L 373 350 L 344 352 C 341 426 333 468 333 534 C 333 554 267 554 267 534 C 267 468 259 426 256 352 L 227 350 Z" fill="url(#tank)"/>
  <path d="M 240 316 C 256 294 276 287 300 287" fill="none" stroke="${tankShade}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>

  <!-- 手臂 -->
  <path d="M 233 306 C 206 348 196 420 198 494 C 199 542 214 566 231 566 C 245 566 253 546 251 506 C 248 442 249 374 259 330 Z" fill="${skin}"/>
  <path d="M 367 306 C 394 348 404 420 402 494 C 401 542 386 566 369 566 C 355 566 347 546 349 506 C 352 442 351 374 341 330 Z" fill="${skin}"/>
  <ellipse cx="224" cy="572" rx="20" ry="15" fill="${skin}"/>
  <ellipse cx="376" cy="572" rx="20" ry="15" fill="${skin}"/>

  <!-- 腿 -->
  <path d="M 258 546 C 250 680 246 820 248 950 C 249 1020 254 1052 264 1068 C 276 1086 293 1084 298 1064 C 302 1044 300 1000 298 950 C 295 830 293 700 295 546 Z" fill="${skin}"/>
  <path d="M 342 546 C 350 680 354 820 352 950 C 351 1020 346 1052 336 1068 C 324 1086 307 1084 302 1064 C 298 1044 300 1000 302 950 C 305 830 307 700 305 546 Z" fill="${skin}"/>
  <path d="M 258 546 C 250 680 246 820 248 950 C 249 1010 253 1040 260 1058" fill="none" stroke="${skinShade}" stroke-width="3" opacity="0.55"/>
  <path d="M 342 546 C 350 680 354 820 352 950 C 351 1010 347 1040 340 1058" fill="none" stroke="${skinShade}" stroke-width="3" opacity="0.55"/>

  <!-- 脚 -->
  <ellipse cx="276" cy="1098" rx="33" ry="21" fill="${skinShade}"/>
  <ellipse cx="324" cy="1098" rx="33" ry="21" fill="${skinShade}"/>
  `;
  return svg(CANVAS_WIDTH, CANVAS_HEIGHT, body);
}

/* ------------------------------------------------------------------ */
/* 通用小工具                                                          */
/* ------------------------------------------------------------------ */

function toDataUrl(w: number, h: number, body: string): string {
  return dataUrl(svg(w, h, body));
}

function tee(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.23} ${h * 0.1} C ${w * 0.34} ${h * 0.05} ${w * 0.66} ${h * 0.05} ${w * 0.77} ${h * 0.1} L ${w * 0.9} ${h * 0.4} L ${w * 0.7} ${h * 0.45} L ${w * 0.67} ${h * 0.8} C ${w * 0.58} ${h * 0.87} ${w * 0.42} ${h * 0.87} ${w * 0.33} ${h * 0.8} L ${w * 0.3} ${h * 0.45} L ${w * 0.1} ${h * 0.4} Z" fill="${c.base}"/>
  <path d="M ${w * 0.1} ${h * 0.4} L ${w * 0.23} ${h * 0.1} L ${w * 0.23} ${h * 0.38} L ${w * 0.1} ${h * 0.4} Z" fill="${c.shade}" opacity="0.9"/>
  <path d="M ${w * 0.9} ${h * 0.4} L ${w * 0.77} ${h * 0.1} L ${w * 0.77} ${h * 0.38} L ${w * 0.9} ${h * 0.4} Z" fill="${c.shade}" opacity="0.9"/>
  <path d="M ${w * 0.4} ${h * 0.14} Q ${w * 0.5} ${h * 0.2} ${w * 0.6} ${h * 0.14} Q ${w * 0.5} ${h * 0.22} ${w * 0.4} ${h * 0.14} Z" fill="${c.shade}"/>
  <rect x="${w * 0.31}" y="${h * 0.82}" width="${w * 0.38}" height="${h * 0.09}" rx="${h * 0.045}" fill="${c.shade}" opacity="0.55"/>
  <rect x="${w * 0.36}" y="${h * 0.42}" width="${w * 0.28}" height="3" rx="1.5" fill="${c.shade}" opacity="0.35"/>
  ${c.accent ? `<path d="M ${w * 0.23} ${h * 0.1} C ${w * 0.34} ${h * 0.05} ${w * 0.5} ${h * 0.07} ${w * 0.5} ${h * 0.12} L ${w * 0.5} ${h * 0.4} L ${w * 0.23} ${h * 0.1} Z" fill="${c.accent}" opacity="0.85"/>` : ""}
  `;
}

function longSleeveTop(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.22} ${h * 0.09} C ${w * 0.34} ${h * 0.04} ${w * 0.66} ${h * 0.04} ${w * 0.78} ${h * 0.09} L ${w * 0.94} ${h * 0.12} L ${w * 0.9} ${h * 0.92} L ${w * 0.78} ${h * 0.82} L ${w * 0.69} ${h * 0.8} L ${w * 0.69} ${h * 0.3} L ${w * 0.31} ${h * 0.3} L ${w * 0.31} ${h * 0.8} L ${w * 0.22} ${h * 0.82} L ${w * 0.1} ${h * 0.92} L ${w * 0.06} ${h * 0.12} Z" fill="${c.base}"/>
  <path d="M ${w * 0.06} ${h * 0.12} L ${w * 0.22} ${h * 0.09} L ${w * 0.22} ${h * 0.78} L ${w * 0.06} ${h * 0.92} Z" fill="${c.shade}" opacity="0.55"/>
  <path d="M ${w * 0.94} ${h * 0.12} L ${w * 0.78} ${h * 0.09} L ${w * 0.78} ${h * 0.78} L ${w * 0.94} ${h * 0.92} Z" fill="${c.shade}" opacity="0.55"/>
  <path d="M ${w * 0.4} ${h * 0.12} Q ${w * 0.5} ${h * 0.2} ${w * 0.6} ${h * 0.12} Q ${w * 0.5} ${h * 0.22} ${w * 0.4} ${h * 0.12} Z" fill="${c.shade}"/>
  <rect x="${w * 0.3}" y="${h * 0.84}" width="${w * 0.4}" height="${h * 0.08}" rx="${h * 0.04}" fill="${c.shade}" opacity="0.5"/>
  ${c.accent ? `<rect x="${w * 0.46}" y="${h * 0.34}" width="${w * 0.08}" height="${h * 0.5}" rx="4" fill="${c.accent}" opacity="0.9"/>` : ""}
  `;
}

function blouse(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.24} ${h * 0.08} C ${w * 0.38} ${h * 0.02} ${w * 0.62} ${h * 0.02} ${w * 0.76} ${h * 0.08} L ${w * 0.9} ${h * 0.16} L ${w * 0.82} ${h * 0.24} L ${w * 0.72} ${h * 0.2} L ${w * 0.68} ${h * 0.82} C ${w * 0.56} ${h * 0.9} ${w * 0.44} ${h * 0.9} ${w * 0.32} ${h * 0.82} L ${w * 0.28} ${h * 0.2} L ${w * 0.18} ${h * 0.24} L ${w * 0.1} ${h * 0.16} Z" fill="${c.base}"/>
  <ellipse cx="${w * 0.22}" cy="${h * 0.16}" rx="${w * 0.07}" ry="${h * 0.06}" fill="${c.shade}"/>
  <ellipse cx="${w * 0.78}" cy="${h * 0.16}" rx="${w * 0.07}" ry="${h * 0.06}" fill="${c.shade}"/>
  <path d="M ${w * 0.43} ${h * 0.08} L ${w * 0.5} ${h * 0.24} L ${w * 0.57} ${h * 0.08} Q ${w * 0.5} ${h * 0.02} ${w * 0.43} ${h * 0.08} Z" fill="${c.shade}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.36}" r="2.5" fill="${c.accent || c.shade}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.5}" r="2.5" fill="${c.accent || c.shade}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.64}" r="2.5" fill="${c.accent || c.shade}"/>
  <rect x="${w * 0.3}" y="${h * 0.83}" width="${w * 0.4}" height="${h * 0.07}" rx="${h * 0.035}" fill="${c.shade}" opacity="0.45"/>
  `;
}

function sweater(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.2} ${h * 0.09} C ${w * 0.34} ${h * 0.04} ${w * 0.66} ${h * 0.04} ${w * 0.8} ${h * 0.09} L ${w * 0.95} ${h * 0.13} L ${w * 0.88} ${h * 0.92} L ${w * 0.77} ${h * 0.83} L ${w * 0.68} ${h * 0.8} L ${w * 0.68} ${h * 0.32} L ${w * 0.32} ${h * 0.32} L ${w * 0.32} ${h * 0.8} L ${w * 0.23} ${h * 0.83} L ${w * 0.12} ${h * 0.92} L ${w * 0.05} ${h * 0.13} Z" fill="${c.base}"/>
  <path d="M ${w * 0.05} ${h * 0.13} L ${w * 0.2} ${h * 0.09} L ${w * 0.2} ${h * 0.8} L ${w * 0.05} ${h * 0.92} Z" fill="${c.shade}" opacity="0.45"/>
  <path d="M ${w * 0.95} ${h * 0.13} L ${w * 0.8} ${h * 0.09} L ${w * 0.8} ${h * 0.8} L ${w * 0.95} ${h * 0.92} Z" fill="${c.shade}" opacity="0.45"/>
  <path d="M ${w * 0.42} ${h * 0.13} Q ${w * 0.5} ${h * 0.22} ${w * 0.58} ${h * 0.13} Q ${w * 0.5} ${h * 0.24} ${w * 0.42} ${h * 0.13} Z" fill="${c.shade}"/>
  <rect x="${w * 0.22}" y="${h * 0.84}" width="${w * 0.56}" height="${h * 0.08}" rx="${h * 0.04}" fill="${c.shade}" opacity="0.5"/>
  ${Array.from({ length: 9 }, (_, i) => `<line x1="${w * (0.26 + i * 0.06)}" y1="${h * 0.85}" x2="${w * (0.26 + i * 0.06)}" y2="${h * 0.9}" stroke="${c.accent || "#fff"}" stroke-width="1.5" opacity="0.35"/>`).join("")}
  `;
}

function hoodie(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.17} ${h * 0.14} C ${w * 0.34} ${h * 0.05} ${w * 0.66} ${h * 0.05} ${w * 0.83} ${h * 0.14} L ${w * 0.95} ${h * 0.18} L ${w * 0.88} ${h * 0.92} L ${w * 0.75} ${h * 0.84} L ${w * 0.67} ${h * 0.82} L ${w * 0.67} ${h * 0.34} L ${w * 0.33} ${h * 0.34} L ${w * 0.33} ${h * 0.82} L ${w * 0.25} ${h * 0.84} L ${w * 0.12} ${h * 0.92} L ${w * 0.05} ${h * 0.18} Z" fill="${c.base}"/>
  <path d="M ${w * 0.33} ${h * 0.05} C ${w * 0.4} ${h * 0.0} ${w * 0.6} ${h * 0.0} ${w * 0.67} ${h * 0.05} C ${w * 0.74} ${h * 0.12} ${w * 0.78} ${h * 0.2} ${w * 0.75} ${h * 0.28} C ${w * 0.6} ${h * 0.22} ${w * 0.4} ${h * 0.22} ${w * 0.25} ${h * 0.28} C ${w * 0.22} ${h * 0.2} ${w * 0.26} ${h * 0.12} ${w * 0.33} ${h * 0.05} Z" fill="${c.accent || c.shade}"/>
  <path d="M ${w * 0.28} ${h * 0.2} L ${w * 0.3} ${h * 0.34} M ${w * 0.72} ${h * 0.2} L ${w * 0.7} ${h * 0.34}" stroke="${c.shade}" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="${w * 0.4}" y="${h * 0.5}" width="${w * 0.2}" height="${h * 0.16}" rx="${w * 0.03}" fill="${c.shade}" opacity="0.5"/>
  <rect x="${w * 0.17}" y="${h * 0.84}" width="${w * 0.66}" height="${h * 0.08}" rx="${h * 0.04}" fill="${c.shade}" opacity="0.5"/>
  `;
}

function blazer(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.2} ${h * 0.07} C ${w * 0.36} ${h * 0.02} ${w * 0.64} ${h * 0.02} ${w * 0.8} ${h * 0.07} L ${w * 0.95} ${h * 0.1} L ${w * 0.92} ${h * 0.86} L ${w * 0.78} ${h * 0.8} L ${w * 0.7} ${h * 0.78} L ${w * 0.7} ${h * 0.3} L ${w * 0.3} ${h * 0.3} L ${w * 0.3} ${h * 0.78} L ${w * 0.22} ${h * 0.8} L ${w * 0.08} ${h * 0.86} L ${w * 0.05} ${h * 0.1} Z" fill="${c.base}"/>
  <path d="M ${w * 0.05} ${h * 0.1} L ${w * 0.2} ${h * 0.07} L ${w * 0.2} ${h * 0.78} L ${w * 0.05} ${h * 0.86} Z" fill="${c.shade}" opacity="0.5"/>
  <path d="M ${w * 0.95} ${h * 0.1} L ${w * 0.8} ${h * 0.07} L ${w * 0.8} ${h * 0.78} L ${w * 0.95} ${h * 0.86} Z" fill="${c.shade}" opacity="0.5"/>
  <path d="M ${w * 0.38} ${h * 0.1} L ${w * 0.5} ${h * 0.3} L ${w * 0.38} ${h * 0.3} Z" fill="${c.accent || c.shade}"/>
  <path d="M ${w * 0.62} ${h * 0.1} L ${w * 0.5} ${h * 0.3} L ${w * 0.62} ${h * 0.3} Z" fill="${c.shade}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.44}" r="3" fill="${c.accent || "#2A2420"}"/>
  <rect x="${w * 0.24}" y="${h * 0.82}" width="${w * 0.52}" height="${h * 0.05}" rx="${h * 0.025}" fill="${c.shade}" opacity="0.45"/>
  `;
}

function trench(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.2} ${h * 0.07} C ${w * 0.36} ${h * 0.02} ${w * 0.64} ${h * 0.02} ${w * 0.8} ${h * 0.07} L ${w * 0.95} ${h * 0.1} L ${w * 0.92} ${h * 0.9} L ${w * 0.76} ${h * 0.84} L ${w * 0.68} ${h * 0.82} L ${w * 0.68} ${h * 0.3} L ${w * 0.32} ${h * 0.3} L ${w * 0.32} ${h * 0.82} L ${w * 0.24} ${h * 0.84} L ${w * 0.08} ${h * 0.9} L ${w * 0.05} ${h * 0.1} Z" fill="${c.base}"/>
  <path d="M ${w * 0.34} ${h * 0.08} L ${w * 0.48} ${h * 0.3} L ${w * 0.34} ${h * 0.3} Z" fill="${c.shade}"/>
  <path d="M ${w * 0.66} ${h * 0.08} L ${w * 0.52} ${h * 0.3} L ${w * 0.66} ${h * 0.3} Z" fill="${c.shade}"/>
  <rect x="${w * 0.3}" y="${h * 0.52}" width="${w * 0.4}" height="${h * 0.04}" rx="4" fill="${c.accent || c.shade}" opacity="0.8"/>
  <circle cx="${w * 0.5}" cy="${h * 0.58}" r="3" fill="${c.accent || "#2A2420"}"/>
  <rect x="${w * 0.24}" y="${h * 0.86}" width="${w * 0.52}" height="${h * 0.05}" rx="${h * 0.025}" fill="${c.shade}" opacity="0.45"/>
  `;
}

function cardigan(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.18} ${h * 0.08} C ${w * 0.34} ${h * 0.03} ${w * 0.66} ${h * 0.03} ${w * 0.82} ${h * 0.08} L ${w * 0.95} ${h * 0.12} L ${w * 0.9} ${h * 0.9} L ${w * 0.78} ${h * 0.84} L ${w * 0.68} ${h * 0.82} L ${w * 0.68} ${h * 0.26} L ${w * 0.32} ${h * 0.26} L ${w * 0.32} ${h * 0.82} L ${w * 0.22} ${h * 0.84} L ${w * 0.1} ${h * 0.9} L ${w * 0.05} ${h * 0.12} Z" fill="${c.base}"/>
  <path d="M ${w * 0.4} ${h * 0.1} Q ${w * 0.5} ${h * 0.18} ${w * 0.6} ${h * 0.1} Q ${w * 0.5} ${h * 0.2} ${w * 0.4} ${h * 0.1} Z" fill="${c.shade}"/>
  <line x1="${w * 0.48}" y1="${h * 0.28}" x2="${w * 0.48}" y2="${h * 0.8}" stroke="${c.shade}" stroke-width="3" stroke-dasharray="8 10" opacity="0.7"/>
  <circle cx="${w * 0.48}" cy="${h * 0.3}" r="3" fill="${c.accent || "#2A2420"}"/>
  <circle cx="${w * 0.48}" cy="${h * 0.5}" r="3" fill="${c.accent || "#2A2420"}"/>
  <circle cx="${w * 0.48}" cy="${h * 0.7}" r="3" fill="${c.accent || "#2A2420"}"/>
  `;
}

function puffer(w: number, h: number, c: Palette): string {
  const cols = 4;
  const rows = 6;
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      cells.push(`<rect x="${w * (0.15 + (col * 0.18))}" y="${h * (0.24 + r * 0.11)}" width="${w * 0.14}" height="${h * 0.09}" rx="6" fill="${c.shade}" opacity="0.4"/>`);
    }
  }
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.18} ${h * 0.08} C ${w * 0.34} ${h * 0.03} ${w * 0.66} ${h * 0.03} ${w * 0.82} ${h * 0.08} L ${w * 0.95} ${h * 0.12} L ${w * 0.9} ${h * 0.9} L ${w * 0.76} ${h * 0.84} L ${w * 0.68} ${h * 0.82} L ${w * 0.68} ${h * 0.3} L ${w * 0.32} ${h * 0.3} L ${w * 0.32} ${h * 0.82} L ${w * 0.24} ${h * 0.84} L ${w * 0.1} ${h * 0.9} L ${w * 0.05} ${h * 0.12} Z" fill="${c.base}"/>
  <rect x="${w * 0.38}" y="${h * 0.05}" width="${w * 0.24}" height="${h * 0.2}" rx="10" fill="${c.accent || c.shade}"/>
  ${cells.join("")}
  <rect x="${w * 0.18}" y="${h * 0.86}" width="${w * 0.64}" height="${h * 0.06}" rx="${h * 0.03}" fill="${c.shade}" opacity="0.5"/>
  `;
}

function pants(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <rect x="${w * 0.08}" y="6" width="${w * 0.84}" height="${h * 0.055}" rx="8" fill="${c.shade}"/>
  <path d="M ${w * 0.16} 32 C ${w * 0.17} ${h * 0.26} ${w * 0.14} ${h * 0.52} ${w * 0.11} ${h * 0.74} C ${w * 0.09} ${h * 0.88} ${w * 0.13} ${h * 0.94} ${w * 0.2} ${h * 0.95} C ${w * 0.27} ${h * 0.96} ${w * 0.36} ${h * 0.92} ${w * 0.4} ${h * 0.82} C ${w * 0.44} ${h * 0.66} ${w * 0.44} ${h * 0.4} ${w * 0.44} 32 Z" fill="${c.base}"/>
  <path d="M ${w * 0.84} 32 C ${w * 0.83} ${h * 0.26} ${w * 0.86} ${h * 0.52} ${w * 0.89} ${h * 0.74} C ${w * 0.91} ${h * 0.88} ${w * 0.87} ${h * 0.94} ${w * 0.8} ${h * 0.95} C ${w * 0.73} ${h * 0.96} ${w * 0.64} ${h * 0.92} ${w * 0.6} ${h * 0.82} C ${w * 0.56} ${h * 0.66} ${w * 0.56} ${h * 0.4} ${w * 0.56} 32 Z" fill="${c.base}"/>
  <rect x="${w * 0.4}" y="30" width="${w * 0.2}" height="${h * 0.05}" fill="${c.base}"/>
  <line x1="${w * 0.5}" y1="38" x2="${w * 0.5}" y2="${h * 0.8}" stroke="${c.shade}" stroke-width="2" opacity="0.45"/>
  <path d="M ${w * 0.18} 44 C ${w * 0.22} 70 ${w * 0.28} 92 ${w * 0.36} 110" stroke="${c.shade}" stroke-width="2.5" fill="none" opacity="0.4"/>
  <path d="M ${w * 0.82} 44 C ${w * 0.78} 70 ${w * 0.72} 92 ${w * 0.64} 110" stroke="${c.shade}" stroke-width="2.5" fill="none" opacity="0.4"/>
  <rect x="${w * 0.13}" y="${h * 0.86}" width="${w * 0.28}" height="${h * 0.08}" rx="4" fill="${c.shade}" opacity="0.6"/>
  <rect x="${w * 0.59}" y="${h * 0.86}" width="${w * 0.28}" height="${h * 0.08}" rx="4" fill="${c.shade}" opacity="0.6"/>
  `;
}

function shorts(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <rect x="${w * 0.08}" y="6" width="${w * 0.84}" height="${h * 0.17}" rx="8" fill="${c.shade}"/>
  <path d="M ${w * 0.16} 32 C ${w * 0.16} 90 ${w * 0.14} ${h * 0.62} ${w * 0.12} ${h * 0.8} C ${w * 0.11} ${h * 0.9} ${w * 0.16} ${h * 0.94} ${w * 0.23} ${h * 0.92} C ${w * 0.32} ${h * 0.9} ${w * 0.4} ${h * 0.78} ${w * 0.42} ${h * 0.58} L ${w * 0.42} 32 Z" fill="${c.base}"/>
  <path d="M ${w * 0.84} 32 C ${w * 0.84} 90 ${w * 0.86} ${h * 0.62} ${w * 0.88} ${h * 0.8} C ${w * 0.89} ${h * 0.9} ${w * 0.84} ${h * 0.94} ${w * 0.77} ${h * 0.92} C ${w * 0.68} ${h * 0.9} ${w * 0.6} ${h * 0.78} ${w * 0.58} ${h * 0.58} L ${w * 0.58} 32 Z" fill="${c.base}"/>
  <rect x="${w * 0.4}" y="28" width="${w * 0.2}" height="${h * 0.12}" fill="${c.base}"/>
  <line x1="${w * 0.5}" y1="36" x2="${w * 0.5}" y2="${h * 0.7}" stroke="${c.shade}" stroke-width="2" opacity="0.4"/>
  `;
}

function skirt(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <rect x="${w * 0.18}" y="8" width="${w * 0.64}" height="${h * 0.1}" rx="7" fill="${c.shade}"/>
  <path d="M ${w * 0.2} 30 C ${w * 0.28} 90 ${w * 0.3} ${h * 0.62} ${w * 0.22} ${h * 0.86} C ${w * 0.16} ${h * 0.97} ${w * 0.84} ${h * 0.97} ${w * 0.78} ${h * 0.86} C ${w * 0.7} ${h * 0.62} ${w * 0.72} 90 ${w * 0.8} 30 Z" fill="${c.base}"/>
  <path d="M ${w * 0.34} 32 C ${w * 0.36} 80 ${w * 0.36} ${h * 0.5} ${w * 0.32} ${h * 0.84}" stroke="${c.shade}" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M ${w * 0.5} 32 L ${w * 0.5} ${h * 0.88}" stroke="${c.shade}" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M ${w * 0.66} 32 C ${w * 0.64} 80 ${w * 0.64} ${h * 0.5} ${w * 0.68} ${h * 0.84}" stroke="${c.shade}" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M ${w * 0.2} 30 C ${w * 0.28} 90 ${w * 0.3} ${h * 0.62} ${w * 0.22} ${h * 0.86}" fill="none" stroke="${c.shade}" stroke-width="2.5" opacity="0.5"/>
  `;
}

function dressA(w: number, h: number, c: Palette, flareAt = 0.42, hem = 0.92): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.24} ${h * 0.05} C ${w * 0.38} ${h * 0.01} ${w * 0.62} ${h * 0.01} ${w * 0.76} ${h * 0.05} L ${w * 0.88} ${h * 0.1} L ${w * 0.8} ${h * 0.14} L ${w * 0.76} ${h * 0.4} C ${w * 0.9} ${h * 0.62} ${w * 0.95} ${h * 0.8} ${w * 0.88} ${h * hem} C ${w * 0.78} ${h * 0.98} ${w * 0.22} ${h * 0.98} ${w * 0.12} ${h * hem} C ${w * 0.05} ${h * 0.8} ${w * 0.1} ${h * 0.62} ${w * 0.24} ${h * 0.4} L ${w * 0.2} ${h * 0.14} L ${w * 0.12} ${h * 0.1} Z" fill="${c.base}"/>
  <path d="M ${w * 0.42} ${h * 0.05} Q ${w * 0.5} ${h * 0.14} ${w * 0.58} ${h * 0.05} Q ${w * 0.5} ${h * 0.16} ${w * 0.42} ${h * 0.05} Z" fill="${c.shade}"/>
  <path d="M ${w * 0.26} ${h * 0.32} L ${w * 0.24} ${h * flareAt} C ${w * 0.42} ${h * 0.5} ${w * 0.58} ${h * 0.5} ${w * 0.76} ${h * flareAt} L ${w * 0.74} ${h * 0.32}" fill="none" stroke="${c.shade}" stroke-width="2.5" opacity="0.5"/>
  <path d="M ${w * 0.36} ${h * 0.4} C ${w * 0.4} ${h * 0.6} ${w * 0.4} ${h * 0.76} ${w * 0.35} ${h * 0.9}" stroke="${c.shade}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M ${w * 0.64} ${h * 0.4} C ${w * 0.6} ${h * 0.6} ${w * 0.6} ${h * 0.76} ${w * 0.65} ${h * 0.9}" stroke="${c.shade}" stroke-width="2" fill="none" opacity="0.35"/>
  ${c.accent ? `<path d="M ${w * 0.3} ${h * 0.14} L ${w * 0.5} ${h * 0.22} L ${w * 0.7} ${h * 0.14}" fill="none" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` : ""}
  `;
}

function slipDress(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M ${w * 0.3} ${h * 0.03} L ${w * 0.22} ${h * 0.08} L ${w * 0.26} ${h * 0.24} C ${w * 0.3} ${h * 0.5} ${w * 0.3} ${h * 0.7} ${w * 0.24} ${h * 0.9} C ${w * 0.2} ${h * 0.96} ${w * 0.8} ${h * 0.96} ${w * 0.76} ${h * 0.9} C ${w * 0.7} ${h * 0.7} ${w * 0.7} ${h * 0.5} ${w * 0.74} ${h * 0.24} L ${w * 0.78} ${h * 0.08} L ${w * 0.7} ${h * 0.03} L ${w * 0.5} ${h * 0.1} Z" fill="${c.base}"/>
  <path d="M ${w * 0.42} ${h * 0.03} Q ${w * 0.5} ${h * 0.08} ${w * 0.58} ${h * 0.03} Q ${w * 0.5} ${h * 0.1} ${w * 0.42} ${h * 0.03} Z" fill="${c.shade}"/>
  <rect x="${w * 0.2}" y="${h * 0.08}" width="${w * 0.05}" height="${h * 0.7}" rx="4" fill="${c.shade}" opacity="0.5"/>
  <rect x="${w * 0.75}" y="${h * 0.08}" width="${w * 0.05}" height="${h * 0.7}" rx="4" fill="${c.shade}" opacity="0.5"/>
  <path d="M ${w * 0.28} ${h * 0.24} L ${w * 0.72} ${h * 0.24}" stroke="${c.shade}" stroke-width="2" opacity="0.4"/>
  ${c.accent ? `<path d="M ${w * 0.22} ${h * 0.12} L ${w * 0.32} ${h * 0.16} L ${w * 0.26} ${h * 0.24} Z" fill="${c.accent}"/>` : ""}
  `;
}

function sneakers(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <g>
    <rect x="8" y="${h - 28}" width="84" height="20" rx="9" fill="#F2EFE9"/>
    <rect x="8" y="${h - 14}" width="84" height="7" rx="3.5" fill="#D8D2C8"/>
    <path d="M 12 ${h - 32} C 12 ${h - 64} 20 ${h - 78} 34 ${h - 80} C 52 ${h - 82} 70 ${h - 66} 74 ${h - 34} Z" fill="${c.base}"/>
    <path d="M 30 ${h - 80} C 34 ${h - 64} 38 ${h - 48} 40 ${h - 34} L 70 ${h - 34} C 68 ${h - 58} 58 ${h - 72} 44 ${h - 78} Z" fill="${c.light || c.shade}" opacity="0.85"/>
    <path d="M 12 ${h - 34} L 74 ${h - 34} M 20 ${h - 52} L 66 ${h - 52}" stroke="${c.shade}" stroke-width="2.5" opacity="0.6"/>
    <circle cx="22" cy="${h - 42}" r="4" fill="${c.accent || c.base}"/>
  </g>
  <g>
    <rect x="108" y="${h - 28}" width="84" height="20" rx="9" fill="#F2EFE9"/>
    <rect x="108" y="${h - 14}" width="84" height="7" rx="3.5" fill="#D8D2C8"/>
    <path d="M 112 ${h - 32} C 112 ${h - 64} 120 ${h - 78} 134 ${h - 80} C 152 ${h - 82} 170 ${h - 66} 174 ${h - 34} Z" fill="${c.base}"/>
    <path d="M 130 ${h - 80} C 134 ${h - 64} 138 ${h - 48} 140 ${h - 34} L 170 ${h - 34} C 168 ${h - 58} 158 ${h - 72} 144 ${h - 78} Z" fill="${c.light || c.shade}" opacity="0.85"/>
    <path d="M 112 ${h - 34} L 174 ${h - 34} M 120 ${h - 52} L 166 ${h - 52}" stroke="${c.shade}" stroke-width="2.5" opacity="0.6"/>
    <circle cx="122" cy="${h - 42}" r="4" fill="${c.accent || c.base}"/>
  </g>
  `;
}

function heels(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <g>
    <path d="M 10 ${h - 26} L 82 ${h - 26} L 70 ${h - 16} C 58 ${h - 6} 34 ${h - 6} 22 ${h - 16} Z" fill="${c.base}"/>
    <path d="M 22 ${h - 22} C 24 ${h - 60} 34 ${h - 78} 52 ${h - 80} C 62 ${h - 81} 70 ${h - 70} 72 ${h - 56} C 74 ${h - 42} 74 ${h - 32} 78 ${h - 26} C 60 ${h - 40} 40 ${h - 42} 22 ${h - 22} Z" fill="${c.base}"/>
    <path d="M 58 ${h - 16} L 46 ${h - 16} L 48 ${h - 2} L 56 ${h - 2} Z" fill="${c.shade}"/>
    <path d="M 30 ${h - 30} C 34 ${h - 56} 44 ${h - 70} 56 ${h - 72}" stroke="${c.light || c.shade}" stroke-width="2.5" fill="none" opacity="0.7"/>
  </g>
  <g>
    <path d="M 118 ${h - 26} L 190 ${h - 26} L 178 ${h - 16} C 166 ${h - 6} 142 ${h - 6} 130 ${h - 16} Z" fill="${c.base}"/>
    <path d="M 130 ${h - 22} C 132 ${h - 60} 142 ${h - 78} 160 ${h - 80} C 170 ${h - 81} 178 ${h - 70} 180 ${h - 56} C 182 ${h - 42} 182 ${h - 32} 186 ${h - 26} C 168 ${h - 40} 148 ${h - 42} 130 ${h - 22} Z" fill="${c.base}"/>
    <path d="M 166 ${h - 16} L 154 ${h - 16} L 156 ${h - 2} L 164 ${h - 2} Z" fill="${c.shade}"/>
    <path d="M 138 ${h - 30} C 142 ${h - 56} 152 ${h - 70} 164 ${h - 72}" stroke="${c.light || c.shade}" stroke-width="2.5" fill="none" opacity="0.7"/>
  </g>
  `;
}

function flats(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <g>
    <path d="M 10 ${h - 16} C 10 ${h - 56} 20 ${h - 74} 36 ${h - 76} C 58 ${h - 78} 76 ${h - 60} 82 ${h - 18} Z" fill="${c.base}"/>
    <ellipse cx="46" cy="${h - 12}" rx="38" ry="8" fill="${c.shade}"/>
    <path d="M 20 ${h - 28} C 24 ${h - 52} 34 ${h - 64} 48 ${h - 64}" stroke="${c.light || c.shade}" stroke-width="2.5" fill="none" opacity="0.7"/>
  </g>
  <g>
    <path d="M 118 ${h - 16} C 118 ${h - 56} 128 ${h - 74} 144 ${h - 76} C 166 ${h - 78} 184 ${h - 60} 190 ${h - 18} Z" fill="${c.base}"/>
    <ellipse cx="154" cy="${h - 12}" rx="38" ry="8" fill="${c.shade}"/>
    <path d="M 128 ${h - 28} C 132 ${h - 52} 142 ${h - 64} 156 ${h - 64}" stroke="${c.light || c.shade}" stroke-width="2.5" fill="none" opacity="0.7"/>
  </g>
  `;
}

function boots(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <g>
    <path d="M 12 12 C 12 ${h * 0.42} 10 ${h * 0.68} 12 ${h * 0.82} C 14 ${h * 0.9} 24 ${h * 0.92} 32 ${h * 0.88} C 40 ${h * 0.84} 46 ${h * 0.72} 47 ${h * 0.58} L 46 12 Z" fill="${c.base}"/>
    <path d="M 12 ${h * 0.84} L 46 ${h * 0.84} L 46 ${h - 12} C 46 ${h - 4} 40 ${h - 2} 34 ${h - 4} L 20 ${h - 8} C 14 ${h - 10} 12 ${h - 6} 12 ${h * 0.84} Z" fill="${c.base}"/>
    <rect x="12" y="6" width="35" height="14" rx="5" fill="${c.shade}"/>
    <rect x="12" y="${h * 0.5}" width="35" height="10" rx="4" fill="${c.shade}" opacity="0.45"/>
    <path d="M 12 ${h * 0.86} L 46 ${h * 0.86}" stroke="${c.shade}" stroke-width="2.5" opacity="0.7"/>
  </g>
  <g>
    <path d="M 81 12 C 81 ${h * 0.42} 79 ${h * 0.68} 81 ${h * 0.82} C 83 ${h * 0.9} 93 ${h * 0.92} 101 ${h * 0.88} C 109 ${h * 0.84} 115 ${h * 0.72} 116 ${h * 0.58} L 115 12 Z" fill="${c.base}"/>
    <path d="M 81 ${h * 0.84} L 115 ${h * 0.84} L 115 ${h - 12} C 115 ${h - 4} 109 ${h - 2} 103 ${h - 4} L 89 ${h - 8} C 83 ${h - 10} 81 ${h - 6} 81 ${h * 0.84} Z" fill="${c.base}"/>
    <rect x="81" y="6" width="35" height="14" rx="5" fill="${c.shade}"/>
    <rect x="81" y="${h * 0.5}" width="35" height="10" rx="4" fill="${c.shade}" opacity="0.45"/>
    <path d="M 81 ${h * 0.86} L 115 ${h * 0.86}" stroke="${c.shade}" stroke-width="2.5" opacity="0.7"/>
  </g>
  `;
}

function tote(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M 58 30 C 70 12 84 12 96 26" stroke="${c.shade}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M 58 30 C 70 12 84 12 96 26" stroke="${c.light || c.base}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M 46 ${h * 0.58} L 54 40 L 144 40 L 152 ${h * 0.58} C 158 ${h * 0.72} 154 ${h * 0.88} 140 ${h * 0.9} L 60 ${h * 0.9} C 44 ${h * 0.88} 40 ${h * 0.72} 46 ${h * 0.58} Z" fill="${c.base}"/>
  <rect x="54" y="40" width="90" height="${h * 0.16}" rx="6" fill="${c.shade}" opacity="0.55"/>
  <rect x="40" y="${h * 0.82}" width="118" height="${h * 0.1}" rx="10" fill="${c.shade}" opacity="0.5"/>
  `;
}

function shoulderBag(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M 128 16 C 172 90 176 160 148 210" stroke="${c.shade}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M 128 16 C 172 90 176 160 148 210" stroke="${c.light || c.base}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M 104 ${h * 0.5} C 108 ${h * 0.62} 114 ${h * 0.7} 126 ${h * 0.74} L 158 ${h * 0.74} C 172 ${h * 0.7} 176 ${h * 0.6} 174 ${h * 0.5} C 170 ${h * 0.36} 158 ${h * 0.3} 144 ${h * 0.3} C 118 ${h * 0.3} 100 ${h * 0.36} 104 ${h * 0.5} Z" fill="${c.base}"/>
  <rect x="120" y="${h * 0.3}" width="44" height="${h * 0.42}" rx="8" fill="${c.shade}" opacity="0.5"/>
  <circle cx="140" cy="${h * 0.7}" r="7" fill="${c.accent || "#fff"}" opacity="0.9"/>
  `;
}

function miniBag(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M 30 10 C 90 90 140 130 152 190" stroke="${c.shade}" stroke-width="3" fill="none" stroke-dasharray="7 7" stroke-linecap="round"/>
  <path d="M 118 ${h * 0.62} C 122 ${h * 0.76} 132 ${h * 0.84} 150 ${h * 0.86} C 166 ${h * 0.88} 174 ${h * 0.78} 170 ${h * 0.64} C 166 ${h * 0.5} 150 ${h * 0.44} 134 ${h * 0.46} C 124 ${h * 0.48} 116 ${h * 0.52} 118 ${h * 0.62} Z" fill="${c.base}"/>
  <path d="M 132 ${h * 0.48} C 140 ${h * 0.44} 156 ${h * 0.46} 166 ${h * 0.58} L 156 ${h * 0.82} C 148 ${h * 0.78} 140 ${h * 0.7} 136 ${h * 0.6} Z" fill="${c.shade}" opacity="0.5"/>
  `;
}

function sunHat(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <ellipse cx="${w / 2}" cy="${h * 0.78}" rx="${w * 0.48}" ry="${h * 0.17}" fill="${c.base}"/>
  <path d="M ${w * 0.26} ${h * 0.58} C ${w * 0.2} ${h * 0.24} ${w * 0.36} ${h * 0.04} ${w * 0.5} ${h * 0.05} C ${w * 0.64} ${h * 0.04} ${w * 0.8} ${h * 0.24} ${w * 0.74} ${h * 0.58} Z" fill="${c.base}"/>
  <path d="M ${w * 0.26} ${h * 0.58} C ${w * 0.2} ${h * 0.24} ${w * 0.36} ${h * 0.04} ${w * 0.5} ${h * 0.05} C ${w * 0.64} ${h * 0.04} ${w * 0.8} ${h * 0.24} ${w * 0.74} ${h * 0.58} Z" fill="none" stroke="${c.shade}" stroke-width="2" opacity="0.5"/>
  <path d="M ${w * 0.27} ${h * 0.46} C ${w * 0.32} ${h * 0.6} ${w * 0.68} ${h * 0.6} ${w * 0.73} ${h * 0.46}" fill="none" stroke="${c.accent || c.shade}" stroke-width="5"/>
  `;
}

function beret(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <ellipse cx="${w * 0.52}" cy="${h * 0.42}" rx="${w * 0.42}" ry="${h * 0.3}" fill="${c.base}" transform="rotate(-8 ${w * 0.52} ${h * 0.42})"/>
  <ellipse cx="${w * 0.52}" cy="${h * 0.42}" rx="${w * 0.42}" ry="${h * 0.3}" fill="none" stroke="${c.shade}" stroke-width="2" opacity="0.55" transform="rotate(-8 ${w * 0.52} ${h * 0.42})"/>
  <ellipse cx="${w * 0.52}" cy="${h * 0.62}" rx="${w * 0.36}" ry="${h * 0.09}" fill="${c.shade}" opacity="0.7" transform="rotate(-8 ${w * 0.52} ${h * 0.62})"/>
  <circle cx="${w * 0.66}" cy="${h * 0.3}" r="4" fill="${c.accent || c.shade}"/>
  `;
}

function sunglasses(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <line x1="2" y1="${h * 0.42}" x2="${w * 0.12}" y2="${h * 0.38}" stroke="${c.shade}" stroke-width="5" stroke-linecap="round"/>
  <line x1="${w * 0.88}" y1="${h * 0.38}" x2="${w * 0.98}" y2="${h * 0.42}" stroke="${c.shade}" stroke-width="5" stroke-linecap="round"/>
  <path d="M ${w * 0.18} ${h * 0.18} L ${w * 0.42} ${h * 0.12} Q ${w * 0.5} ${h * 0.18} ${w * 0.58} ${h * 0.12} L ${w * 0.82} ${h * 0.18} C ${w * 0.92} ${h * 0.42} ${w * 0.88} ${h * 0.78} ${w * 0.72} ${h * 0.86} C ${w * 0.5} ${h * 0.94} ${w * 0.3} ${h * 0.86} ${w * 0.2} ${h * 0.62} C ${w * 0.13} ${h * 0.45} ${w * 0.12} ${h * 0.3} ${w * 0.18} ${h * 0.18} Z" fill="${c.shade}"/>
  <path d="M ${w * 0.18} ${h * 0.18} L ${w * 0.42} ${h * 0.12} Q ${w * 0.5} ${h * 0.18} ${w * 0.58} ${h * 0.12} L ${w * 0.82} ${h * 0.18}" fill="none" stroke="${c.base}" stroke-width="3" opacity="0.9"/>
  <line x1="${w * 0.3}" y1="${h * 0.34}" x2="${w * 0.34}" y2="${h * 0.7}" stroke="${c.light || "#fff"}" stroke-width="3" opacity="0.55"/>
  `;
}

function scarf(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <rect x="8" y="8" width="${w - 16}" height="${h * 0.34}" rx="12" fill="${c.base}"/>
  <path d="M 30 24 L 22 36 L 46 32 Z" fill="${c.shade}"/>
  <path d="M 18 ${h * 0.36} L 26 ${h * 0.9} C 28 ${h * 0.94} 36 ${h * 0.94} 38 ${h * 0.88} L 44 ${h * 0.4}" fill="none" stroke="${c.base}" stroke-width="14" stroke-linecap="round"/>
  <path d="M 30 40 L 32 78 M 36 40 L 38 76" stroke="${c.shade}" stroke-width="2" opacity="0.6"/>
  <path d="M 60 24 L 68 36 L 76 24 Z" fill="${c.shade}" opacity="0.7"/>
  `;
}

function necklace(w: number, h: number, c: Palette): string {
  return `
  <rect width="${w}" height="${h}" fill="none"/>
  <path d="M 8 16 C 24 46 36 58 50 46 C 52 64 52 70 48 76" stroke="${c.base}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 8 16 C 24 46 36 58 50 46 C 52 64 52 70 48 76" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
  <path d="M 40 66 L 56 66 L 48 84 Z" fill="${c.accent || c.base}"/>
  <circle cx="48" cy="86" r="3" fill="${c.accent || c.base}"/>
  `;
}

/* ------------------------------------------------------------------ */
/* 对外接口：按品类生成素材                                            */
/* ------------------------------------------------------------------ */

export type TopVariant = "tee" | "long" | "blouse" | "sweater" | "hoodie";
export type OuterVariant = "blazer" | "trench" | "cardigan" | "puffer";
export type BottomVariant = "pants" | "shorts" | "skirt";
export type DressVariant = "a" | "slip";
export type ShoeVariant = "sneakers" | "heels" | "flats" | "boots";
export type BagVariant = "tote" | "shoulder" | "mini";
export type AccessoryVariant = "sunhat" | "beret" | "sunglasses" | "scarf" | "necklace";

export function topAsset(variant: TopVariant, c: Palette, w = 220, h = 300): string {
  const body =
    variant === "tee"
      ? tee(w, h, c)
      : variant === "long"
        ? longSleeveTop(w, h, c)
        : variant === "blouse"
          ? blouse(w, h, c)
          : variant === "sweater"
            ? sweater(w, h, c)
            : hoodie(w, h, c);
  return toDataUrl(w, h, body);
}

export function outerAsset(variant: OuterVariant, c: Palette, w = 244, h = 360): string {
  const body =
    variant === "blazer"
      ? blazer(w, h, c)
      : variant === "trench"
        ? trench(w, h, c)
        : variant === "cardigan"
          ? cardigan(w, h, c)
          : puffer(w, h, c);
  return toDataUrl(w, h, body);
}

export function bottomAsset(variant: BottomVariant, c: Palette, w = 120, h = 540): string {
  const body = variant === "pants" ? pants(w, h, c) : variant === "shorts" ? shorts(w, h, c) : skirt(w, h, c);
  return toDataUrl(w, h, body);
}

export function dressAsset(variant: DressVariant, c: Palette, w = 220, h = 540): string {
  const body = variant === "a" ? dressA(w, h, c) : slipDress(w, h, c);
  return toDataUrl(w, h, body);
}

export function shoeAsset(variant: ShoeVariant, c: Palette, w = 200, h = 120): string {
  const body =
    variant === "sneakers"
      ? sneakers(w, h, c)
      : variant === "heels"
        ? heels(w, h, c)
        : variant === "flats"
          ? flats(w, h, c)
          : boots(w, h, c);
  return toDataUrl(w, h, body);
}

export function bagAsset(variant: BagVariant, c: Palette, w = 204, h = 330): string {
  const body = variant === "tote" ? tote(w, h, c) : variant === "shoulder" ? shoulderBag(w, h, c) : miniBag(w, h, c);
  return toDataUrl(w, h, body);
}

export function accessoryAsset(variant: AccessoryVariant, c: Palette, w = 160, h = 140): string {
  const body =
    variant === "sunhat"
      ? sunHat(w, h, c)
      : variant === "beret"
        ? beret(w, h, c)
        : variant === "sunglasses"
          ? sunglasses(w, h, c)
          : variant === "scarf"
            ? scarf(w, h, c)
            : necklace(w, h, c);
  return toDataUrl(w, h, body);
}

export const DEFAULT_ANCHOR: Record<Category, { x: number; y: number; width: number; height: number }> = {
  top: { x: 190, y: 285, width: 220, height: 300 },
  outerwear: { x: 178, y: 278, width: 244, height: 360 },
  bottom: { x: 240, y: 540, width: 120, height: 540 },
  dress: { x: 190, y: 285, width: 220, height: 540 },
  shoes: { x: 200, y: 1042, width: 200, height: 120 },
  bag: { x: 296, y: 320, width: 204, height: 330 },
  accessory: { x: 220, y: 56, width: 160, height: 140 },
};
