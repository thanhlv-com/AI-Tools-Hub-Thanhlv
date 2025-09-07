export interface DiagramType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  supportedFormats: string[];
  prompt: string;
}

export interface DiagramFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  fileExtension: string;
  syntax: string;
}

export interface DiagramStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface DiagramComplexity {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  prompt: string;
}

export interface DiagramRequest {
  description: string;
  diagramType: string;
  outputFormat: string;
  outputLanguage: string;
  style: string;
  complexity: string;
  includeIcons?: boolean;
  includeColors?: boolean;
  includeNotes?: boolean;
  model?: string;
}

export interface DiagramResult {
  diagramCode: string;
  error?: string;
  metadata?: {
    processingTime?: number;
    codeLength: number;
  };
}

export interface DiagramHistory {
  id: string;
  title: string;
  timestamp: number;
  description: string;
  diagramType: string;
  outputFormat: string;
  outputLanguage: string;
  style: string;
  complexity: string;
  includeIcons: boolean;
  includeColors: boolean;
  includeNotes: boolean;
  diagramCode: string;
  model: string;
  error?: string;
  metadata?: {
    descriptionLength: number;
    codeLength: number;
    processingTime?: number;
  };
}