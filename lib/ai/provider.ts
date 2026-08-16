import type { GarmentAIProvider } from "@/lib/ai/garmentDetection";
import { MockGarmentAIProvider } from "@/lib/ai/mockProvider";
import { RealGarmentAIProvider } from "@/lib/ai/realGarmentProvider";
import { aiProviderMode, hasApiKey } from "@/lib/ai/config";

let activeProvider: GarmentAIProvider | null = null;

/** 切换 AI Provider（后续接入真实服务时在此替换） */
export function setGarmentProvider(provider: GarmentAIProvider): void {
  activeProvider = provider;
}

export function getActiveGarmentProvider(): GarmentAIProvider {
  if (!activeProvider) {
    // 无 Key 时自动回退 Mock
    if (aiProviderMode() === "real" && hasApiKey("openai")) {
      activeProvider = new RealGarmentAIProvider();
    } else {
      activeProvider = new MockGarmentAIProvider();
    }
  }
  return activeProvider;
}

export function resetGarmentProvider(): void {
  activeProvider = null;
}
