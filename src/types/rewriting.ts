export interface WritingStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface WritingTone {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface WritingLength {
  id: string;
  name: string;
  description: string;
  icon: string;
  multiplier: number; // 0.5 = shorter, 1.0 = same, 1.5 = longer
  prompt: string;
}

export interface WritingComplexity {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  prompt: string;
}

export interface RewritingRequest {
  text: string;
  style: string;
  tone: string;
  length: string;
  complexity: string;
  outputLanguage: string;
  customInstructions?: string;
  model?: string;
}

export interface RewritingResult {
  originalText: string;
  rewrittenText: string;
  style: string;
  tone: string;
  length: string;
  complexity: string;
  outputLanguage: string;
  customInstructions?: string;
  error?: string;
  metadata?: {
    originalLength: number;
    rewrittenLength: number;
    processingTime?: number;
    model: string;
  };
}

export interface RewritingHistory {
  id: string;
  title: string;
  timestamp: number;
  originalText: string;
  rewrittenText: string;
  style: string;
  tone: string;
  length: string;
  complexity: string;
  outputLanguage: string;
  customInstructions?: string;
  model: string;
  metadata?: {
    originalLength: number;
    rewrittenLength: number;
    processingTime?: number;
  };
}

export interface RewritingPreference {
  id: string;
  name: string;
  description?: string;
  style: string;
  tone: string;
  length: string;
  complexity: string;
  outputLanguage: string;
  customInstructions?: string;
  model?: string;
  timestamp: number;
}

export interface RewritingPreferences {
  [id: string]: RewritingPreference;
}