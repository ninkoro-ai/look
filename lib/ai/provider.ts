import type { GarmentAIProvider } from "@/lib/ai/garmentDetection";
import { MockGarmentAIProvider } from "@/lib/ai/mockProvider";

let activeProvider: GarmentAIProvider | null = null;

/** 切换 AI Provider（后续接入真实服务时在此替换） */
export function setGarmentProvider(provider: GarmentAIProvider): void {
  activeProvider = provider;
}

export function getActiveGarmentProvider(): GarmentAIProvider {
  if (!activeProvider) activeProvider = new MockGarmentAIProvider();
  return activeProvider;
}
