import {
  createTryOnTask,
  json,
  mapErrorCode,
  type PagesFunction,
  vtonBetaGate,
  type VtonEnv,
} from "./_lib";

const ALLOWED_CATEGORIES = new Set(["top", "outerwear", "bottom", "dress"]);
const DAILY_TRYON_LIMIT = 3;

/** 6F.0 成本保护：每 clientId 每日最多 3 次（优先 KV，未绑定 KV 时按实例内存计数） */
const dailyTryonCounts = new Map<string, number>();

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 用已上传的公网 URL 创建 aitryon 异步试衣任务。
 */
export const onRequestPost: PagesFunction<VtonEnv> = async ({ request, env }) => {
  const gate = vtonBetaGate(env);
  if (gate) {
    return json(
      { errorCode: gate, errorMessage: gate === "AUTH_ERROR" ? "服务端未配置 DASHSCOPE_API_KEY" : "AI真实试穿 Beta 功能未启用" },
      { status: gate === "AUTH_ERROR" ? 503 : 403 },
    );
  }

  let body: { personImageUrl?: string; garmentImageUrl?: string; garmentCategory?: string; benchmarkId?: string; clientId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "请求体不是合法 JSON" }, { status: 400 });
  }
  const category = body.garmentCategory ?? "top";
  if (!ALLOWED_CATEGORIES.has(category)) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: `不支持的类别：${category}` }, { status: 400 });
  }
  if (!body.personImageUrl || !body.garmentImageUrl) {
    return json({ errorCode: "INVALID_INPUT", errorMessage: "缺少 personImageUrl / garmentImageUrl" }, { status: 400 });
  }

  // 成本保护：先于上游调用检查，避免超限产生云端消耗
  const clientKey = `${body.clientId ?? "anonymous"}:${dayKey()}`;
  let used = 0;
  if (env.VTON_QUOTA) {
    try {
      const raw = await env.VTON_QUOTA.get(clientKey);
      used = raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      used = 0;
    }
  } else {
    used = dailyTryonCounts.get(clientKey) ?? 0;
  }
  if (used >= DAILY_TRYON_LIMIT) {
    return json({ errorCode: "RATE_LIMIT", errorMessage: "今日AI试穿次数已用完" }, { status: 429 });
  }
  if (env.VTON_QUOTA) {
    await env.VTON_QUOTA.put(clientKey, String(used + 1), { expirationTtl: 86_400 }).catch(() => {});
  } else {
    dailyTryonCounts.set(clientKey, used + 1);
  }

  try {
    const apiKey = env.DASHSCOPE_API_KEY as string;
    const task = await createTryOnTask(
      apiKey,
      body.personImageUrl,
      body.garmentImageUrl,
      category,
    );
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
