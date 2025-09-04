export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface TranslationStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  model?: string;
}

export interface TranslationResult {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  model: string;
  metadata?: {
    sourceLength: number;
    translatedLength: number;
    processingTime?: number;
  };
}

export interface TranslationHistory {
  id: string;
  title: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  model: string;
  metadata?: {
    sourceLength: number;
    translatedLength: number;
  };
}