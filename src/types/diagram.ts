export type DiagramTypeId = 
  | 'sequence'
  | 'usecase' 
  | 'component'
  | 'deployment'
  | 'class'
  | 'activity'
  | 'state';

export interface DiagramType {
  id: DiagramTypeId;
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
  diagramType: DiagramTypeId;
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
  pumlCode: string;
  explanation: string;
  model: string;
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
  diagramType: DiagramTypeId;
  outputFormat: string;
  outputLanguage: string;
  style: string;
  complexity: string;
  includeIcons: boolean;
  includeColors: boolean;
  includeNotes: boolean;
  diagramCode: string; // Generic field that works for all formats
  pumlCode?: string; // Legacy field for backwards compatibility
  explanation?: string; // Optional explanation (mainly for PlantUML)
  model: string;
  error?: string;
  metadata?: {
    descriptionLength: number;
    codeLength: number;
    processingTime?: number;
  };
}

export const DIAGRAM_TYPES: DiagramType[] = [
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    description: 'Mô tả luồng tương tác theo thứ tự thời gian',
    icon: '🔄',
    category: 'Behavioral',
    supportedFormats: ['puml'],
    prompt: 'Tạo sequence diagram với autonumber, icons thích hợp, và styling chuyên nghiệp'
  },
  {
    id: 'usecase',
    name: 'Use Case Diagram',
    description: 'Mô tả các use case của hệ thống',
    icon: '👤',
    category: 'Behavioral',
    supportedFormats: ['puml'],
    prompt: 'Tạo use case diagram với actors, use cases, và relationships rõ ràng'
  },
  {
    id: 'component',
    name: 'Component Diagram',
    description: 'Mô tả cấu trúc các thành phần',
    icon: '📦',
    category: 'Structural',
    supportedFormats: ['puml'],
    prompt: 'Tạo component diagram với components, interfaces, và dependencies'
  },
  {
    id: 'deployment',
    name: 'Deployment Diagram',
    description: 'Mô tả triển khai vật lý của hệ thống',
    icon: '🚀',
    category: 'Structural',
    supportedFormats: ['puml'],
    prompt: 'Tạo deployment diagram với nodes, artifacts, và deployment relationships'
  },
  {
    id: 'class',
    name: 'Class Diagram',
    description: 'Mô tả cấu trúc lớp và mối quan hệ',
    icon: '🏗️',
    category: 'Structural',
    supportedFormats: ['puml'],
    prompt: 'Tạo class diagram với classes, attributes, methods, và relationships'
  },
  {
    id: 'activity',
    name: 'Activity Diagram',
    description: 'Mô tả luồng hoạt động và quy trình',
    icon: '⚡',
    category: 'Behavioral',
    supportedFormats: ['puml'],
    prompt: 'Tạo activity diagram với activities, decisions, và control flows'
  },
  {
    id: 'state',
    name: 'State Diagram',
    description: 'Mô tả trạng thái và chuyển đổi trạng thái',
    icon: '🔀',
    category: 'Behavioral',
    supportedFormats: ['puml'],
    prompt: 'Tạo state diagram với states, transitions, và events'
  }
];