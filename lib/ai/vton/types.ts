export type VTONCategory = "top" | "outerwear" | "bottom" | "dress";

export interface VirtualTryOnRequest {
  personImage: Blob;
  garmentImage: Blob;
  category: VTONCategory;
}

export interface VirtualTryOnResult {
  imageUrl: string;
  provider: string;
  latencyMs: number;
  estimatedCost: number;
  success: boolean;
  error?: string;
}

export interface VirtualTryOnProvider {
  id: string;
  label: string;
  needsKey?: "openai" | "replicate" | "gemini";
  tryOn(params: VirtualTryOnRequest): Promise<VirtualTryOnResult>;
}
