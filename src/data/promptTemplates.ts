export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  template: {
    promptGoal: string;
    targetAudience?: string;
    outputFormat?: string;
    task?: string;
    persona?: string;
    context?: string;
    constraints?: string[];
    examples?: string;
  };
};
