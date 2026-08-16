import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { ModelBody } from "@/lib/types";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function createLandmarker(): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks("/wasm");
  const options = {
    runningMode: "IMAGE" as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    return await PoseLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "GPU" as const },
    });
  } catch {
    return await PoseLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "CPU" as const },
    });
  }
}

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) landmarkerPromise = createLandmarker();
  return landmarkerPromise;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export interface ModelPhoto {
  dataUrl: string;
  body: ModelBody;
  warnings: string[];
}

/**
 * 模特照片标准化：人体检测 → 全身裁剪 → 归一化到 600×1200 标准画布。
 * 注意：这是「模特照片」（人像裁切，仍保留原照片中的服装），
 * 不是「透明衣物素材」；衣物资产的提取见 lib/ai/。
 * 返回照片 PNG 与体型关键点（画布坐标系）。
 */
export async function standardizeModelPhoto(image: HTMLImageElement): Promise<ModelPhoto> {
  const landmarker = await getPoseLandmarker();
  const result = landmarker.detect(image);
  const lm = result.landmarks[0];
  if (!lm || lm.length < 33) throw new Error("未检测到完整人体");

  const at = (i: number) => lm[i];
  const mid = (a: number, b: number) => ({ x: (at(a).x + at(b).x) / 2, y: (at(a).y + at(b).y) / 2 });
  const visible = (i: number) => (at(i).visibility ?? 0) > 0.45;

  // 必需关键点：肩/髋/膝/踝
  if (![11, 12, 23, 24, 25, 26, 27, 28].every(visible)) {
    throw new Error("身体有部分没拍全，请让全身完整入镜");
  }

  const shoulder = mid(11, 12);
  const hip = mid(23, 24);
  const knee = mid(25, 26);
  const ankle = mid(27, 28);
  const eye = mid(2, 5);
  const shoulderW = Math.abs(at(11).x - at(12).x);
  const hipW = Math.abs(at(23).x - at(24).x);
  const footY = Math.max(at(29).y, at(30).y, at(31).y, at(32).y);

  const warnings: string[] = [];
  if (shoulderW < 0.035) throw new Error("没能确定肩部位置，请正对镜头站立");
  if (knee.y <= hip.y || ankle.y <= hip.y + 0.05) throw new Error("请站直并完整露出腿部");
  if (Math.abs(at(11).y - at(12).y) > shoulderW * 0.7) {
    warnings.push("肩膀有点倾斜，尽量站直、正对镜头");
  }
  if (ankle.y - shoulder.y < 0.45) warnings.push("画面里的人物偏小，请靠近一点或使用全身照");

  const headTop = Math.max(0, eye.y - (shoulder.y - eye.y) * 0.55);
  const neckY = shoulder.y - (shoulder.y - eye.y) * 0.22;
  const waistY = hip.y - (hip.y - shoulder.y) * 0.52;

  // 全身包围盒（含少量留边）
  const armMargin = shoulderW * 0.38;
  const xMin = Math.max(0, Math.min(at(11).x, at(12).x, at(23).x, at(24).x) - armMargin);
  const xMax = Math.min(1, Math.max(at(11).x, at(12).x, at(23).x, at(24).x) + armMargin);
  const yMin = Math.max(0, headTop - shoulderW * 0.1);
  const yMax = Math.min(1, footY + shoulderW * 0.08);

  // 1:2 取景框，保证人物完整包含
  let viewW = Math.max(xMax - xMin, (yMax - yMin) * 0.5);
  let viewH = viewW * 2;
  if (viewW > 1) {
    viewW = 1;
    viewH = 2;
  }
  if (viewH > 1) {
    viewH = 1;
    viewW = 0.5;
  }
  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;
  const cropX = clamp(cx - viewW / 2, 0, Math.max(0, 1 - viewW));
  const cropY = clamp(cy - viewH / 2, 0, Math.max(0, 1 - viewH));

  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");
  ctx.drawImage(
    image,
    cropX * iw,
    cropY * ih,
    viewW * iw,
    viewH * ih,
    0,
    0,
    600,
    1200,
  );

  const toX = (x: number) => ((x - cropX) / viewW) * 600;
  const toY = (y: number) => ((y - cropY) / viewH) * 1200;

  const body: ModelBody = {
    headTop: toY(headTop),
    neckY: toY(neckY),
    shoulderY: toY(shoulder.y),
    waistY: toY(waistY),
    hipY: toY(hip.y),
    kneeY: toY(knee.y),
    ankleY: toY(ankle.y),
    footY: toY(footY),
    shoulderWidth: toX(shoulder.x + shoulderW / 2) - toX(shoulder.x - shoulderW / 2),
    hipWidth: toX(hip.x + hipW / 2) - toX(hip.x - hipW / 2),
  };

  return { dataUrl: canvas.toDataURL("image/png"), body, warnings };
}
