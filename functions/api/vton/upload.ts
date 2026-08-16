import {
  decodeDataUrl,
  getUploadPolicy,
  json,
  mapErrorCode,
  randomFileName,
  uploadToOss,
  validateImage,
  type PagesFunction,
  type VtonEnv,
} from "./_lib";

/**
 * 单图上传适配端点：
 * 浏览器传 dataURL → 服务端 getPolicy + OSS 上传 → 返回 oss:// 临时公网 URL（48h）。
 * API Key 永不进入浏览器。
 */
export const onRequestPost: PagesFunction<VtonEnv> = async ({ request, env }) => {
  if (!env.DASHSCOPE_API_KEY) {
    return json({ errorCode: "AUTH_ERROR", errorMessage: "服务端未配置 DASHSCOPE_API_KEY" }, { status: 503 });
  }
  if (env.VTON_ALLOW_ALIBABA !== "true") {
    return json({ errorCode: "PROVIDER_ERROR", errorMessage: "云端 VTON 未启用" }, { status: 403 });
  }

  let body: { image?: string; kind?: "person" | "garment" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "请求体不是合法 JSON" }, { status: 400 });
  }
  const decoded = body.image ? decodeDataUrl(body.image) : null;
  if (!decoded) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "image 必须是 dataURL" }, { status: 400 });
  }
  const err = validateImage(decoded.bytes, decoded.mime);
  if (err) return json({ errorCode: "IMAGE_ERROR", errorMessage: err }, { status: 400 });

  try {
    const policy = await getUploadPolicy(env.DASHSCOPE_API_KEY);
    const ext = decoded.mime === "image/png" ? "png" : "jpg";
    const url = await uploadToOss(policy, randomFileName(ext), decoded.bytes);
    return json({
      url,
      provider: "dashscope",
      expiresInHours: 48,
      kind: body.kind ?? "person",
    });
  } catch (e) {
    const code = e instanceof Error && "code" in e ? String((e as { code?: unknown }).code) : "PROVIDER_ERROR";
    const message = e instanceof Error ? e.message.slice(0, 300) : "上传失败";
    return json({ errorCode: mapErrorCode(code, message), errorMessage: message }, { status: 502 });
  }
};
