export type ApiKeyName = "openai" | "replicate" | "gemini";

const KEY_STORAGE = "chuanda-ai-keys";

function envVar(name: string): string | undefined {
  // 静态访问才能被 Next 在构建期内联为常量
  switch (name) {
    case "NEXT_PUBLIC_AI_PROVIDER":
      return process.env.NEXT_PUBLIC_AI_PROVIDER;
    case "NEXT_PUBLIC_ENABLE_LAB":
      return process.env.NEXT_PUBLIC_ENABLE_LAB;
    case "NEXT_PUBLIC_OPENAI_API_KEY":
      return process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    case "NEXT_PUBLIC_REPLICATE_API_TOKEN":
      return process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;
    case "NODE_ENV":
      return process.env.NODE_ENV;
    default:
      return undefined;
  }
}

/** 检测/提取 Provider 模式：AI_PROVIDER=mock|real（构建期注入） */
export function aiProviderMode(): "mock" | "real" {
  return envVar("NEXT_PUBLIC_AI_PROVIDER") === "real" ? "real" : "mock";
}

/** VTON 实验室开关：NEXT_PUBLIC_ENABLE_LAB=true（生产构建显式开启） */
export function labEnabled(): boolean {
  if (envVar("NEXT_PUBLIC_ENABLE_LAB") === "true") return true;
  return envVar("NODE_ENV") === "development";
}

export function getApiKey(name: ApiKeyName): string | undefined {
  const env = envVar(`NEXT_PUBLIC_${name.toUpperCase()}_API_KEY`);
  if (env) return env;
  try {
    const raw = window.localStorage.getItem(KEY_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed[name]) return parsed[name];
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function setApiKey(name: ApiKeyName, key: string): void {
  try {
    const raw = window.localStorage.getItem(KEY_STORAGE);
    const parsed: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (key.trim()) {
      parsed[name] = key.trim();
    } else {
      delete parsed[name];
    }
    window.localStorage.setItem(KEY_STORAGE, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function hasApiKey(name: ApiKeyName): boolean {
  return Boolean(getApiKey(name));
}
