import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import type { BoundingBox } from "@/lib/types";

// selfie_multiclass 输出类别：0 background / 1 hair / 2 body-skin / 3 face-skin / 4 clothes / 5 others
const CLOTHES_LABEL = 4;

let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function createSegmenter(): Promise<ImageSegmenter> {
  const fileset = await FilesetResolver.forVisionTasks("/wasm");
  const options = {
    runningMode: "IMAGE" as const,
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  };
  try {
    return await ImageSegmenter.createFromOptions(fileset, {
      ...options,
      baseOptions: {
        modelAssetPath: "/models/selfie_multiclass_256x256.tflite",
        delegate: "GPU" as const,
      },
    });
  } catch {
    return await ImageSegmenter.createFromOptions(fileset, {
      ...options,
      baseOptions: {
        modelAssetPath: "/models/selfie_multiclass_256x256.tflite",
        delegate: "CPU" as const,
      },
    });
  }
}

export function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) segmenterPromise = createSegmenter();
  return segmenterPromise;
}

export type SegmentSource = HTMLImageElement | ImageBitmap | HTMLCanvasElement;

export interface ClothesExtraction {
  cropUrl: string;
  maskUrl: string;
  transparentUrl: string;
  foregroundRatio: number;
}

/**
 * 真实衣物分割（本地 MediaPipe）：
 * 先对整图做人像多类别分割，取 clothes 类别蒙版，
 * 再按检测框裁出该衣物的 crop / mask / 透明资产。
 */
export async function extractClothesRegion(
  image: SegmentSource,
  bbox: BoundingBox,
  maxSize = 420,
): Promise<ClothesExtraction> {
  const segmenter = await getSegmenter();
  const result = segmenter.segment(image);
  const mask = result.categoryMask;
  if (!mask) throw new Error("未生成分割蒙版");

  const iw = "naturalWidth" in image ? image.naturalWidth : image.width;
  const ih = "naturalHeight" in image ? image.naturalHeight : image.height;
  const data = mask.getAsUint8Array();
  const mw = mask.width;
  const mh = mask.height;

  // 全图衣服蒙版
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = mw;
  maskCanvas.height = mh;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("浏览器不支持画布");
  const maskImg = maskCtx.createImageData(mw, mh);
  for (let i = 0; i < mw * mh; i++) {
    const p = i * 4;
    maskImg.data[p] = 255;
    maskImg.data[p + 1] = 255;
    maskImg.data[p + 2] = 255;
    maskImg.data[p + 3] = data[i] === CLOTHES_LABEL ? 255 : 0;
  }
  maskCtx.putImageData(maskImg, 0, 0);

  // 按检测框裁出蒙版与原始图
  const scaleX = mw / iw;
  const scaleY = mh / ih;
  const cw = Math.max(1, Math.min(maxSize, Math.round(bbox.width)));
  const ch = Math.max(1, Math.round((bbox.height / bbox.width) * cw));
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cw;
  cropCanvas.height = ch;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("浏览器不支持画布");
  cropCtx.drawImage(
    image,
    bbox.x,
    bbox.y,
    bbox.width,
    bbox.height,
    0,
    0,
    cw,
    ch,
  );
  const cropUrl = cropCanvas.toDataURL("image/png");

  const regionMask = document.createElement("canvas");
  regionMask.width = cw;
  regionMask.height = ch;
  const rmCtx = regionMask.getContext("2d");
  if (!rmCtx) throw new Error("浏览器不支持画布");
  rmCtx.drawImage(maskCanvas, bbox.x * scaleX, bbox.y * scaleY, bbox.width * scaleX, bbox.height * scaleY, 0, 0, cw, ch);
  const rmData = rmCtx.getImageData(0, 0, cw, ch);

  // 透明资产：原图裁切 × 蒙版 alpha
  const alphaData = cropCtx.getImageData(0, 0, cw, ch);
  let fg = 0;
  for (let i = 0; i < cw * ch; i++) {
    const a = rmData.data[i * 4 + 3];
    alphaData.data[i * 4 + 3] = a;
    if (a > 128) fg++;
  }
  cropCtx.putImageData(alphaData, 0, 0);
  const transparentUrl = cropCanvas.toDataURL("image/png");
  const maskUrl = regionMask.toDataURL("image/png");

  return { cropUrl, maskUrl, transparentUrl, foregroundRatio: fg / (cw * ch) };
}
