import { hasApiKey } from "@/lib/ai/config";
import { LocalLayerVTONProvider } from "@/lib/ai/vton/localLayer";
import { HybridMaskVTONProvider } from "@/lib/ai/vton/hybridMask";
import { OpenAIEditVTONProvider } from "@/lib/ai/vton/openaiImage";
import type { VirtualTryOnProvider } from "@/lib/ai/vton/types";

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
