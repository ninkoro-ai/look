import { hasApiKey } from "@/lib/ai/config";
import { LocalLayerVTONProvider } from "@/lib/ai/vton/localLayer";
import { HybridMaskVTONProvider } from "@/lib/ai/vton/hybridMask";
import { OpenAIEditVTONProvider } from "@/lib/ai/vton/openaiImage";
import type { VirtualTryOnProvider } from "@/lib/ai/vton/types";
import { adaptLegacyProvider, type VirtualTryOnProvider as ContractVTONProvider } from "@/lib/ai/vton/contract";
import { AlibabaVTONProvider } from "@/lib/ai/vton/providers/AlibabaVTONProvider";

/** Phase 6A 旧接口 Provider（保持原样，供既有调用方使用） */
export function allVTONProviders(): VirtualTryOnProvider[] {
  return [
    new LocalLayerVTONProvider(),
    new HybridMaskVTONProvider(),
    new OpenAIEditVTONProvider(),
  ];
}

export function providerReady(p: VirtualTryOnProvider): boolean {
  return !p.needsKey || hasApiKey(p.needsKey);
}

/**
 * Phase 6B 统一契约 Provider 列表：
 * Local Layer / Local Segmentation（本地，$0）+ OpenAI 图像编辑（可选）+ 阿里云百炼 aitryon（服务端代理）。
 */
export function contractVTONProviders(): ContractVTONProvider[] {
  return [
    adaptLegacyProvider(new LocalLayerVTONProvider()),
    adaptLegacyProvider(new HybridMaskVTONProvider()),
    new AlibabaVTONProvider(),
    adaptLegacyProvider(new OpenAIEditVTONProvider()),
  ];
}
