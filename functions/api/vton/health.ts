import { json, type PagesFunction, type VtonEnv } from "./_lib";

export const onRequestGet: PagesFunction<VtonEnv> = ({ env }) => {
  return json({
    provider: "alibaba-vton",
    keyPresent: Boolean(env.DASHSCOPE_API_KEY),
    allowEnabled: env.VTON_ALLOW_ALIBABA === "true",
    configured: Boolean(env.DASHSCOPE_API_KEY) && env.VTON_ALLOW_ALIBABA === "true",
    // 注意：本接口只返回布尔状态，绝不返回 Key 本身
  });
};
