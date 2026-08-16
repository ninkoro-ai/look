import {
  createTryOnTask,
  decodeDataUrl,
  getUploadPolicy,
  json,
  mapErrorCode,
  type PagesFunction,
  randomFileName,
  uploadToOss,
  validateImage,
  type VtonEnv,
} from "./_lib";

const ALLOWED_CATEGORIES = new Set(["top", "outerwear", "bottom", "dress"]);

export const onRequestPost: PagesFunction<VtonEnv> = async ({ request, env }) => {
  if (!env.DASHSCOPE_API_KEY) {
    return json(
      { errorCode: "AUTH_ERROR", errorMessage: "服务端未配置 DASHSCOPE_API_KEY，阿里云 VTON 不可用" },
      { status: 503 },
    );
  }
  if (env.VTON_ALLOW_ALIBABA !== "true") {
    return json(
      { errorCode: "PROVIDER_ERROR", errorMessage: "服务端未启用 VTON_ALLOW_ALIBABA=true，云端 VTON 默认关闭" },
      { status: 403 },
    );
  }

  let body: { personImage?: string; garmentImage?: string; garmentCategory?: string; benchmarkId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "请求体不是合法 JSON" }, { status: 400 });
  }

  const category = body.garmentCategory ?? "top";
  if (!ALLOWED_CATEGORIES.has(category)) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: `不支持的类别：${category}` }, { status: 400 });
  }
  const person = body.personImage ? decodeDataUrl(body.personImage) : null;
  const garment = body.garmentImage ? decodeDataUrl(body.garmentImage) : null;
  if (!person || !garment) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "personImage/garmentImage 必须是 dataURL" }, { status: 400 });
  }
  const personErr = validateImage(person.bytes, person.mime);
  if (personErr) return json({ errorCode: "IMAGE_ERROR", errorMessage: `人物图：${personErr}` }, { status: 400 });
  const garmentErr = validateImage(garment.bytes, garment.mime);
  if (garmentErr) return json({ errorCode: "IMAGE_ERROR", errorMessage: `服饰图：${garmentErr}` }, { status: 400 });

  try {
    const policy = await getUploadPolicy(env.DASHSCOPE_API_KEY);
    const ext = person.mime === "image/png" ? "png" : "jpg";
    const garmentExt = garment.mime === "image/png" ? "png" : "jpg";
    const personUrl = await uploadToOss(policy, randomFileName(ext), person.bytes);
    const garmentUrl = await uploadToOss(policy, randomFileName(garmentExt), garment.bytes);
    const task = await createTryOnTask(env.DASHSCOPE_API_KEY, personUrl, garmentUrl, category);
    return json({
      taskId: task.taskId,
      status: task.status,
      provider: "alibaba-vton",
      model: "aitryon",
      benchmarkId: body.benchmarkId,
    });
  } catch (e) {
    const code = e instanceof Error && "code" in e ? String((e as { code?: unknown }).code) : "PROVIDER_ERROR";
    const message = e instanceof Error ? e.message.slice(0, 300) : "创建任务失败";
    return json({ errorCode: mapErrorCode(code, message), errorMessage: message }, { status: 502 });
  }
};
