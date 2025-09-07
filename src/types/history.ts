export interface DDLAnalysisHistory {
  id: string;
  title: string;
  timestamp: number;
  currentDDL: string;
  newDDL: string;
  databaseType: string;
  model: string;
  migrationScript: string;
  metadata?: {
    currentDDLLength: number;
    newDDLLength: number;
    scriptLength: number;
  };
}

export interface HistoryFilters {
  databaseType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  model?: string;
}