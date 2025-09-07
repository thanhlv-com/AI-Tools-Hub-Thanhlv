export interface DDLCapacityRequest {
  ddl: string;
  databaseType: string;
  averageRecordSize?: number;
  recordCount: number;
  customModel?: string;
}

export interface CapacityResult {
  averageRecordSize: number;
  maximumRecordSize: number;
  totalSizeAverage: {
    bytes: number;
    mb: number;
    gb: number;
  };
  totalSizeMaximum: {
    bytes: number;
    mb: number;
    gb: number;
  };
  indexSize?: {
    bytes: number;
    mb: number;
    gb: number;
  };
  totalWithIndexAverage?: {
    bytes: number;
    mb: number;
    gb: number;
  };
  totalWithIndexMaximum?: {
    bytes: number;
    mb: number;
    gb: number;
  };
  recommendations?: string[];
  breakdown?: TableCapacityBreakdown[];
}

export interface FieldCapacityDetail {
  fieldName: string;
  dataType: string;
  maxLength?: number;
  nullable: boolean;
  averageSize: number;
  maximumSize: number;
  overhead: number;
  description: string;
  storageNotes?: string;
}

export interface TableCapacityBreakdown {
  tableName: string;
  averageRecordSize: number;
  maximumRecordSize: number;
  totalSizeAverage: {
    bytes: number;
    mb: number;
  };
  totalSizeMaximum: {
    bytes: number;
    mb: number;
  };
  recordCount: number;
  indexSize?: {
    bytes: number;
    mb: number;
  };
  fieldDetails?: FieldCapacityDetail[];
  rowOverhead?: {
    nullBitmap: number;
    rowHeader: number;
    alignment: number;
    total: number;
  };
  recommendations?: string[];
}

export interface CapacityAnalysisHistory {
  id: string;
  title: string;
  timestamp: number;
  ddl: string;
  databaseType: string;
  recordCount: number;
  result: CapacityResult;
  model: string;
  useMultiCall: boolean;
  metadata?: {
    ddlLength: number;
    analysisTime?: number;
    resultSize: number;
    tableCount?: number;
    fieldCount?: number;
  };
}

export interface CapacityHistoryFilters {
  databaseType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  model?: string;
}

// New types for 3-step workflow
export interface ParsedField {
  id: string;
  fieldName: string;
  dataType: string;
  maxLength?: number;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isIndex?: boolean;
  defaultValue?: string;
  description?: string;
  estimatedAverageSize?: number;
  estimatedMaximumSize?: number;
  confidence?: number; // AI confidence in analysis (0-1)
}

export interface ParsedTable {
  id: string;
  tableName: string;
  fields: ParsedField[];
  indexes?: string[];
  constraints?: string[];
  estimatedRecordCount?: number;
  notes?: string;
}

export interface DDLStructureAnalysis {
  tables: ParsedTable[];
  databaseType: string;
  totalTables: number;
  totalFields: number;
  analysisConfidence: number; // Overall confidence (0-1)
  warnings?: string[];
  suggestions?: string[];
}

export interface CapacityWorkflowStep {
  step: 1 | 2 | 3;
  completed: boolean;
  data?: unknown;
}

export interface CapacityWorkflowState {
  currentStep: 1 | 2 | 3;
  steps: {
    ddlInput: CapacityWorkflowStep;
    structureAnalysis: CapacityWorkflowStep;
    finalCalculation: CapacityWorkflowStep;
  };
  ddl: string;
  databaseType: string;
  recordCount: number;
  structureAnalysis?: DDLStructureAnalysis;
  finalResult?: CapacityResult;
}