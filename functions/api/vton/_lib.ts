/**
 * 阿里云百炼 AI试衣（aitryon）服务端代理公共工具。
 * 仅运行在 Cloudflare Pages Functions（workerd）环境中，API Key 永不进入浏览器。
 */

export interface VtonEnv {
  DASHSCOPE_API_KEY?: string;
  VTON_ALLOW_ALIBABA?: string;
}

/** 兼容 Cloudflare Pages Functions 的上下文类型（项目未安装 workers-types，本地定义避免全局依赖） */
export interface PagesFunctionContext<E> {
  request: Request;
  env: E;
  params: Record<string, unknown>;
  data: unknown;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export type PagesFunction<E> = (
  context: PagesFunctionContext<E>,
) => Response | Promise<Response>;

export interface UploadPolicy {
  upload_host: string;
  upload_dir: string;
  oss_access_key_id: string;
  signature: string;
  policy: string;
  x_oss_object_acl: string;
  x_oss_forbid_overwrite: string;
  [k: string]: unknown;
}

export class DashScopeError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(init?.headers ?? {}) },
  });
}

export function alibabaEnabled(env: VtonEnv): boolean {
  return Boolean(env.DASHSCOPE_API_KEY) && env.VTON_ALLOW_ALIBABA === "true";
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

export async function getUploadPolicy(apiKey: string): Promise<UploadPolicy> {
  const url = "https://dashscope.aliyuncs.com/api/v1/uploads?action=getPolicy&model=aitryon";
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    throw new DashScopeError("UPLOAD_POLICY", resp.status, await resp.text().catch(() => ""));
  }
  const body = (await resp.json()) as { data?: Record<string, unknown> } & Record<string, unknown>;
  const data = (body.data ?? body) as Record<string, unknown>;
  return {
    upload_host: pick(data, "upload_host", "host"),
    upload_dir: pick(data, "upload_dir", "uploadDir", "dir"),
    oss_access_key_id: pick(data, "oss_access_key_id", "OSSAccessKeyId", "access_key_id"),
    signature: pick(data, "signature", "Signature"),
    policy: pick(data, "policy", "Policy"),
    x_oss_object_acl: pick(data, "x_oss_object_acl", "x-oss-object-acl"),
    x_oss_forbid_overwrite: pick(data, "x_oss_forbid_overwrite", "x-oss-forbid-overwrite"),
  };
}

export async function uploadToOss(
  policy: UploadPolicy,
  fileName: string,
  bytes: Uint8Array,
): Promise<string> {
  const key = `${policy.upload_dir}/${fileName}`;
  const form = new FormData();
  form.append("OSSAccessKeyId", policy.oss_access_key_id);
  form.append("Signature", policy.signature);
  form.append("policy", policy.policy);
  form.append("x-oss-object-acl", policy.x_oss_object_acl);
  form.append("x-oss-forbid-overwrite", policy.x_oss_forbid_overwrite);
  form.append("key", key);
  form.append("success_action_status", "200");
  form.append("file", new Blob([bytes as unknown as BlobPart], { type: "application/octet-stream" }), fileName);
  const resp = await fetch(policy.upload_host, { method: "POST", body: form });
  if (resp.status !== 200) {
    throw new DashScopeError("OSS_UPLOAD", resp.status, await resp.text().catch(() => ""));
  }
  return `oss://${key}`;
}

export interface CreateTaskResult {
  taskId: string;
  status: string;
}

export async function createTryOnTask(
  apiKey: string,
  personUrl: string,
  garmentUrl: string,
  category: string,
): Promise<CreateTaskResult> {
  const input: Record<string, string> = { person_image_url: personUrl };
  if (category === "bottom") {
    input.bottom_garment_url = garmentUrl;
  } else {
    input.top_garment_url = garmentUrl;
  }
  const resp = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
        "X-DashScope-OssResourceResolve": "enable",
      },
      body: JSON.stringify({
        model: "aitryon",
        input,
        parameters: { resolution: -1, restore_face: true },
      }),
    },
  );
  if (!resp.ok) {
    throw new DashScopeError("CREATE_TASK", resp.status, await resp.text().catch(() => ""));
  }
  const body = (await resp.json()) as {
    output?: { task_id?: string; task_status?: string };
  };
  const taskId = body.output?.task_id;
  if (!taskId) {
    throw new DashScopeError("CREATE_TASK", 200, "响应中缺少 task_id");
  }
  return { taskId, status: body.output?.task_status ?? "PENDING" };
}

export interface TaskQueryResult {
  status: string;
  imageUrl?: string;
  code?: string;
  message?: string;
}

export async function queryTask(apiKey: string, taskId: string): Promise<TaskQueryResult> {
  const resp = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!resp.ok) {
    throw new DashScopeError("QUERY_TASK", resp.status, await resp.text().catch(() => ""));
  }
  const body = (await resp.json()) as {
    output?: {
      task_status?: string;
      image_url?: string;
      code?: string;
      message?: string;
    };
  };
  return {
    status: body.output?.task_status ?? "UNKNOWN",
    imageUrl: body.output?.image_url,
    code: body.output?.code,
    message: body.output?.message,
  };
}

export function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new DashScopeError("RESULT_FETCH", resp.status, "下载生成结果失败");
  }
  const buf = new Uint8Array(await resp.arrayBuffer());
  const mime = resp.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  return `data:${mime};base64,${base64FromBytes(buf)}`;
}

export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const m = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return null;
  try {
    const binary = atob(m[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { bytes, mime: m[1].toLowerCase() };
  } catch {
    return null;
  }
}

export function validateImage(bytes: Uint8Array, mime: string): string | null {
  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/bmp", "image/heic"]);
  if (!allowed.has(mime)) return `不支持的图片格式：${mime}（支持 jpg/png/bmp/heic）`;
  if (bytes.byteLength < 5 * 1024) return "图片小于 5KB，不符合阿里云要求";
  if (bytes.byteLength > 5 * 1024 * 1024) return "图片大于 5MB，不符合阿里云要求";
  return null;
}

export function randomFileName(ext: string): string {
  return `vton-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

/** 把 DashScope 错误码/文本映射到统一 Benchmark 错误码 */
export function mapErrorCode(code: string | undefined, message: string): string {
  const text = `${code ?? ""} ${message}`.toLowerCase();
  if (text.includes("invalidapikey") || text.includes("auth") || text.includes("permission")) return "AUTH_ERROR";
  if (text.includes("throttl") || text.includes("ratelimit") || text.includes("rps") || text.includes("quota")) return "RATE_LIMIT";
  if (text.includes("timeout") || text.includes("超时")) return "TIMEOUT";
  if (
    text.includes("invalidperson") ||
    text.includes("invalidgarment") ||
    text.includes("invalidurl") ||
    text.includes("invalidinputlength") ||
    text.includes("image")
  ) {
    return "IMAGE_ERROR";
  }
  if (text.includes("invalidparameter") || text.includes("invalid")) return "INVALID_INPUT";
  return "PROVIDER_ERROR";
}
