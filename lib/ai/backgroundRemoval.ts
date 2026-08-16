import type { BoundingBox } from "@/lib/types";

export type ImageSource = HTMLImageElement | ImageBitmap;

function canvasFrom(image: ImageSource, bbox: BoundingBox, maxSize: number) {
  const w = Math.max(1, Math.round(bbox.width));
  const h = Math.max(1, Math.round(bbox.height));
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");
  ctx.drawImage(image, bbox.x, bbox.y, w, h, 0, 0, cw, ch);
  return canvas;
}

/** 按检测框裁出原图局部（透明 PNG data URL），用于预览与存档 */
export function cropToDataUrl(image: ImageSource, bbox: BoundingBox, maxSize = 360): string {
  return canvasFrom(image, bbox, maxSize).toDataURL("image/png");
}

export interface RemovalResult {
  transparentUrl: string;
  maskUrl?: string;
  foregroundRatio: number;
}

/**
 * 本地背景去除（Mock 能力）：
 * 从边框做颜色距离 BFS，把与边框连通的区域视为背景，其余保留，
 * 再对 alpha 做一次邻域平滑，输出透明 PNG。
 * 只适合背景相对干净的照片；复杂背景的产物请让用户/真实 AI Provider 处理。
 */
export function removeBackground(
  image: ImageSource,
  bbox: BoundingBox,
  options?: { maxSize?: number; threshold?: number },
): RemovalResult {
  const { maxSize = 420, threshold = 46 } = options ?? {};
  const canvas = canvasFrom(image, bbox, maxSize);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const push = (i: number) => {
    if (!visited[i]) {
      visited[i] = 1;
      queue[tail++] = i;
    }
  };

  // 边框种子
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + (w - 1));
  }

  const thrSq = threshold * threshold;
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i / w) | 0;
    const p = i * 4;
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    if (x > 0 && !visited[i - 1]) {
      const q = (i - 1) * 4;
      const dr = r - d[q];
      const dg = g - d[q + 1];
      const db = b - d[q + 2];
      if (dr * dr + dg * dg + db * db <= thrSq) push(i - 1);
    }
    if (x < w - 1 && !visited[i + 1]) {
      const q = (i + 1) * 4;
      const dr = r - d[q];
      const dg = g - d[q + 1];
      const db = b - d[q + 2];
      if (dr * dr + dg * dg + db * db <= thrSq) push(i + 1);
    }
    if (y > 0 && !visited[i - w]) {
      const q = (i - w) * 4;
      const dr = r - d[q];
      const dg = g - d[q + 1];
      const db = b - d[q + 2];
      if (dr * dr + dg * dg + db * db <= thrSq) push(i - w);
    }
    if (y < h - 1 && !visited[i + w]) {
      const q = (i + w) * 4;
      const dr = r - d[q];
      const dg = g - d[q + 1];
      const db = b - d[q + 2];
      if (dr * dr + dg * dg + db * db <= thrSq) push(i + w);
    }
  }

  let foreground = 0;
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) {
      d[i * 4 + 3] = 0;
    } else {
      foreground++;
    }
  }

  // alpha 邻域平滑（羽化边缘）
  const alpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (visited[i]) continue;
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (!visited[ny * w + nx]) {
            sum += 255;
          }
          n++;
        }
      }
      alpha[i] = sum / n;
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (!visited[i]) d[i * 4 + 3] = Math.round(alpha[i]);
  }

  ctx.putImageData(imageData, 0, 0);
  return {
    transparentUrl: canvas.toDataURL("image/png"),
    foregroundRatio: foreground / (w * h),
  };
}
