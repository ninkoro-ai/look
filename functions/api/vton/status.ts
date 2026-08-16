import {
  fetchImageAsDataUrl,
  json,
  mapErrorCode,
  type PagesFunction,
  queryTask,
  type VtonEnv,
} from "./_lib";

const TERMINAL_FAILED = new Set(["FAILED", "UNKNOWN", "CANCELED"]);

export const onRequestGet: PagesFunction<VtonEnv> = async ({ request, env }) => {
  if (!env.DASHSCOPE_API_KEY) {
    return json({ errorCode: "AUTH_ERROR", errorMessage: "服务端未配置 DASHSCOPE_API_KEY" }, { status: 503 });
  }
  if (env.VTON_ALLOW_ALIBABA !== "true") {
    return json({ errorCode: "PROVIDER_ERROR", errorMessage: "云端 VTON 未启用" }, { status: 403 });
  }
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "缺少 taskId" }, { status: 400 });
  }
  try {
    const task = await queryTask(env.DASHSCOPE_API_KEY, taskId);
    if (task.status === "SUCCEEDED") {
      if (!task.imageUrl) {
        return json({ errorCode: "PROVIDER_ERROR", errorMessage: "任务成功但缺少 image_url" }, { status: 502 });
      }
      const dataUrl = await fetchImageAsDataUrl(task.imageUrl);
      return json({ status: "succeeded", imageUrl: dataUrl });
    }
    if (TERMINAL_FAILED.has(task.status)) {
      return json({
        status: "failed",
        errorCode: mapErrorCode(task.code, task.message ?? ""),
        errorMessage: task.message ?? `任务失败（${task.status}）`,
      });
    }
    return json({ status: "processing", detail: task.status });
  } catch (e) {
    const code = e instanceof Error && "code" in e ? String((e as { code?: unknown }).code) : "PROVIDER_ERROR";
    const message = e instanceof Error ? e.message.slice(0, 300) : "查询任务失败";
    return json({ errorCode: mapErrorCode(code, message), errorMessage: message }, { status: 502 });
  }
};
