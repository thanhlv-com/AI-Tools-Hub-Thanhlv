export interface ConfluenceTemplateRequest {
  title: string;
  description: string;
  purpose: string;
  targetAudience: string;
  contentStructure: string[];
  templateType: string;
  includeTableOfContents: boolean;
  includeMacros: boolean;
  languages?: string[];
  style: string;
  tone: string;
}

export interface ConfluenceTemplateResult {
  title: string;
  content: string;
  macros: string[];
  tableOfContents?: string[];
  metadata: {
    templateType: string;
    createdAt: string;
    languages?: string[];
    style: string;
    tone: string;
  };
}

export interface ConfluenceHistory {
  id: string;
  title: string;
  description: string;
  templateType: string;
  style: string;
  tone: string;
  languages?: string[];
  result: ConfluenceTemplateResult;
  createdAt: string;
}

export interface TemplateType {
  id: string;
  name: string;
  description: string;
  defaultStructure: string[];
}

export interface TemplateStyle {
  id: string;
  name: string;
  description: string;
}

export interface TemplateTone {
  id: string;
  name: string;
  description: string;
}