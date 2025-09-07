export interface PromptRequest {
  promptGoal: string;
  targetAudience?: string;
  outputFormat?: string;
  task?: string;
  persona?: string;
  context?: string;
  constraints?: string[];
  examples?: string;
  model?: string;
}

export interface PromptFormData {
  prompt_goal: string;
  target_audience: string;
  output_format: string;
  task: string;
  persona: string;
  context: string;
  constraints: string[];
  examples: string;
}

export interface JSONPrompt extends PromptFormData {
  metadata: {
    created_at: string;
    version: string;
    ai_model_recommendation: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  suggestions: string[];
}

export interface PromptExample {
  id: string;
  title: string;
  description: string;
  use_case: string;
  json: JSONPrompt;
}

export interface PromptHistory {
  id: string;
  title: string;
  timestamp: number;
  request: PromptRequest;
  result: JSONPrompt;
  model: string;
}

export interface CopyFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  format: (prompt: JSONPrompt) => string;
}

export type CopyFormatType = 'json' | 'plain' | 'markdown' | 'yaml' | 'csv' | 'xml';