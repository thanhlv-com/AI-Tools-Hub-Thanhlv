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
  ddl: string;
  databaseType: string;
  averageRecordSize?: number;
  recordCount: number;
  result: CapacityResult;
  model: string;
  createdAt: string;
  updatedAt?: string;
}