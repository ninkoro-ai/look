import { json, type PagesFunction, type VtonEnv } from "./_lib";

export const onRequestGet: PagesFunction<VtonEnv> = ({ env }) => {
  const configured = Boolean(env.DASHSCOPE_API_KEY) && env.VTON_ALLOW_ALIBABA === "true";
  return json({
    provider: "alibaba-vton",
    /** 6F.0：ready/disabled 状态（绝不返回 Key） */
    alibaba: configured ? "ready" : "disabled",
    keyPresent: Boolean(env.DASHSCOPE_API_KEY),
    allowEnabled: env.VTON_ALLOW_ALIBABA === "true",
    betaEnabled: env.VTON_BETA_ENABLED === "true",
    configured,
    // 注意：本接口只返回布尔状态，绝不返回 Key 本身
  });
};
