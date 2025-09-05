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