export type Occasion =
  | 'Casual'
  | 'College'
  | 'Work'
  | 'Date'
  | 'Party'
  | 'Wedding'
  | 'Formal';

export type StyleVibe =
  | 'Old Money'
  | 'Minimal'
  | 'Streetwear'
  | 'Y2K'
  | 'Soft Girl'
  | 'Clean Girl'
  | 'Classic'
  | 'Trendy';

export interface ScoreItem {
  score: number | null;
  displayText: string; // e.g. "8.5/10" or "Not visible"
  visible: boolean;
  comment: string;
}

export interface OutfitAnalysis {
  fitScore: number; // 1-10
  colorMatch: number; // 1-10
  outfitBalance: number; // 1-10
  shoes: ScoreItem; // 1-10 or "Not visible"
  accessories: ScoreItem; // 1-10 or "Not visible"
  overallStyling: number; // 1-10
  aiStylistSays: string;
  keep: [string, string, string] | string[]; // 3 recommendations
  change: [string, string] | string[]; // 2 recommendations
  add: [string, string, string] | string[]; // 3 recommendations
  glowUpPlan: [string, string, string] | string[]; // 3 numbered steps
  visibleGarments?: string[];
  colorPalette?: string[];
  vibeMatchNote?: string;
}

export interface AnalyzeRequest {
  image: string; // base64 data url or raw base64
  mimeType: string;
  occasion: Occasion;
  styleVibe: StyleVibe;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: OutfitAnalysis;
  error?: string;
}
