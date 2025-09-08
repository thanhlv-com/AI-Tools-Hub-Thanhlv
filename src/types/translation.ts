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

export interface TranslationProficiency {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  prompt: string;
}

export interface EmoticonOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface EmoticonFrequency {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  prompt: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  style: string;
  proficiency?: string;
  emoticonOption?: string;
  emoticonFrequency?: string;
  model?: string;
}

export interface MultiTranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguages: string[];
  style: string;
  proficiency?: string;
  emoticonOption?: string;
  emoticonFrequency?: string;
  model?: string;
}

export interface MultiTranslationResult {
  language: string;
  translatedText: string;
  error?: string;
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
  translations: {
    [languageCode: string]: {
      text: string;
      error?: string;
    };
  };
  sourceLanguage: string;
  targetLanguages: string[];
  style: string;
  proficiency?: string;
  emoticonOption?: string;
  emoticonFrequency?: string;
  model: string;
  metadata?: {
    sourceLength: number;
    totalTranslations: number;
    successfulTranslations: number;
    failedTranslations: number;
  };
}

export interface TranslationPreference {
  id: string;
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguages: string[];
  style: string;
  proficiency?: string;
  emoticonOption?: string;
  emoticonFrequency?: string;
  model?: string;
  timestamp: number;
}

export interface TranslationPreferences {
  [id: string]: TranslationPreference;
}