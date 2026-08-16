/**
 * ImageAssetUploader —— 本地图片 → 临时公网 URL 的上传适配层。
 * 阿里云 AI 试衣要求输入为公网 URL；本层负责：
 * 1. 本地压缩/格式规范化（SVG→PNG、位图≤1024px、JPEG/PNG）
 * 2. 通过服务端代理（/api/vton/upload）上传到 DashScope 临时存储（48h）
 * 3. 返回 oss:// 公网 URL
 *
 * API Key 只在服务端，浏览器不接触。
 */

export interface UploadedAsset {
  url: string;
  provider: string;
  expiresInHours: number;
}

export interface ImageAssetUploader {
  upload(
    image: string | Blob,
    kind?: "person" | "garment",
  ): Promise<UploadedAsset>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

/**
 * 上传前规范化：
 * - SVG 素材转成 PNG（白底，满足“背景简洁”要求）
 * - 位图超过 maxSize 等比缩小；输出 jpeg/png dataURL
 * - 最终大小目标落在阿里云要求的 5KB~5MB、150~4096px（服务端二次校验）
 */
export async function normalizeImageForUpload(
  src: string,
  maxSize = 1024,
  format: "jpeg" | "png" = "jpeg",
): Promise<string> {
  const isSvg = src.startsWith("data:image/svg") || /\.svg($|\?)/.test(src);
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");
  if (isSvg || format === "png") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const mime = format === "png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(mime, 0.92);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 成本保护用的客户端标识：Beta 用户用 betaUserId，其余用本地随机 ID。
 * 仅用于服务端每日限额统计，不含任何身份信息。
 */
export function vtonClientId(): string {
  try {
    if (typeof window === "undefined") return "anonymous";
    const existing = window.localStorage.getItem("chuanda-vton-client");
    if (existing) return existing;
    const id = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem("chuanda-vton-client", id);
    return id;
  } catch {
    return `c-${Date.now()}`;
  }
}

/**
 * DashScope 临时存储上传器：
 * 浏览器 → /api/vton/upload（服务端 getPolicy + OSS 上传）→ oss:// URL（48h）。
 */
export class DashScopeTempUploader implements ImageAssetUploader {
  async upload(
    image: string | Blob,
    kind: "person" | "garment" = "person",
  ): Promise<UploadedAsset> {
    const dataUrl =
      typeof image === "string" ? image : await blobToDataUrl(image);
    const normalized =
      kind === "garment"
        ? await normalizeImageForUpload(dataUrl, 1024, "png")
        : await normalizeImageForUpload(dataUrl, 1024, "jpeg");
    const resp = await fetch("/api/vton/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: normalized, kind }),
    });
    const data = (await resp.json()) as Partial<UploadedAsset> & {
      errorCode?: string;
      errorMessage?: string;
    };
    if (!resp.ok || data.errorCode || !data.url) {
      throw new Error(
        data.errorMessage ?? `上传失败（HTTP ${resp.status}）`,
      );
    }
    return data as UploadedAsset;
  }
}
