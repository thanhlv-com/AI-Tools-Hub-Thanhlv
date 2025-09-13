export interface WikiHistory {
  id: string;
  type: "wiki";
  title: string;
  description: string;
  result: string;
  timestamp: string;
  model: string;
  structure?: string;
  format?: string;
  metadata?: {
    contentLength: number;
    wordCount: number;
  };
}

export interface WikiGenerationRequest {
  projectDescription: string;
  structure?: string;
  model?: string;
}

export interface WikiStructure {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: WikiSection[];
  prompt: string;
}

export interface WikiSection {
  title: string;
  emoji: string;
  description: string;
  requirements: string[];
}