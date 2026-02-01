export enum PhotoStyle {
  RUSTIC = 'Luxury/Dark',
  MODERN = 'Bright/Modern',
  SOCIAL = 'Social Media (Flat Lay)',
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

export enum PhotoQuality {
  STANDARD = 'Standard',
  PREMIUM = 'Premium',
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  nutritionAnalysis?: string;
  isLoading: boolean;
  isEditing: boolean;
  isAnalyzing: boolean;
  error?: string;
}

export interface MenuAnalysisResult {
  dishes: { name: string; description: string }[];
}

export type GenerationConfig = {
  style: PhotoStyle;
  size: ImageSize;
  quality: PhotoQuality;
}