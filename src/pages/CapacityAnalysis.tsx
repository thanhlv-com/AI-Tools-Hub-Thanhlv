import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { CapacityHistory } from "@/components/CapacityHistory";
import { CapacityResult, DDLCapacityRequest, FieldCapacityDetail, CapacityAnalysisHistory, CapacityWorkflowState, DDLStructureAnalysis, ParsedField, ParsedTable } from "@/types/capacity";
import { generateConfluenceWikiMarkup, generateFieldAnalysisMarkup, generateSummaryTable, ConfluenceExportOptions } from "@/utils/confluenceExport";
import { 
  Database, 
  Calculator, 
  Play, 
  Copy, 
  FileText,
  HardDrive,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Download,
  FileDown,
  Table,
  Settings,
  Eye,
  EyeOff,
  History,
  X,
  ArrowRight,
  CheckCircle,
  Edit,
  Save,
  RefreshCw,
  Search,
  Filter,
  ChevronUp,
  ChevronDown
} from "lucide-react";

const databases = [
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "sqlserver", name: "SQL Server", icon: "🏢" },
  { id: "oracle", name: "Oracle", icon: "🔴" },
  { id: "sqlite", name: "SQLite", icon: "💎" }
];

const PAGE_ID = "capacity-analysis";

export default function CapacityAnalysis() {
  const { t } = useTranslation();
  const [ddl, setDdl] = useState("");
  const [databaseType, setDatabaseType] = useState("mysql");
  const [recordCount, setRecordCount] = useState<number>(1000000);
  const [result, setResult] = useState<CapacityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [useMultiCall, setUseMultiCall] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFieldDetails, setShowFieldDetails] = useState(true);
  const [showOverheadAnalysis, setShowOverheadAnalysis] = useState(true);
  const [confluenceExportOptions, setConfluenceExportOptions] = useState<ConfluenceExportOptions>({
    includeFieldDetails: true,
    includeRecommendations: true,
    includeOverheadAnalysis: true
  });

  // New 3-step workflow state
  const [workflowMode, setWorkflowMode] = useState<'classic' | '3-step'>('classic');
  const [workflowState, setWorkflowState] = useState<CapacityWorkflowState>({
    currentStep: 1,
    steps: {
      ddlInput: { step: 1, completed: false },
      structureAnalysis: { step: 2, completed: false },
      finalCalculation: { step: 3, completed: false }
    },
    ddl: "",
    databaseType: "mysql",
    recordCount: 1000000
  });
  const [structureAnalysis, setStructureAnalysis] = useState<DDLStructureAnalysis | null>(null);
  const [isAnalyzingStructure, setIsAnalyzingStructure] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const { config, getPageModel, addToCapacityHistory } = useConfig();
  const { toast } = useToast();

  const handleLoadFromHistory = (historyItem: CapacityAnalysisHistory) => {
    setDdl(historyItem.ddl);
    setDatabaseType(historyItem.databaseType);
    setRecordCount(historyItem.recordCount);
    setUseMultiCall(historyItem.useMultiCall);
    setResult(historyItem.result);
    setError("");
    setShowHistory(false);
    
    toast({
      title: t("capacity.success.loadedFromHistory"),
      description: t("capacity.success.loadedFromHistoryDesc", { title: historyItem.title }),
    });
  };

  const handleAnalyze = async () => {
    if (!ddl.trim()) {
      toast({
        title: t("capacity.errors.missingDDL"),
        description: t("capacity.errors.missingDDL"),
        variant: "destructive"
      });
      return;
    }

    if (!recordCount || recordCount <= 0) {
      toast({
        title: t("capacity.errors.invalidRecordCount"),
        description: t("capacity.errors.invalidRecordCount"),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t("capacity.errors.missingApiKey"),
        description: t("capacity.errors.missingApiKey"),
        variant: "destructive"
      });
      return;
    }

    // Reset all states properly before starting new analysis
    setIsAnalyzing(true);
    setError("");
    setResult(null);
    setProgress(0);
    setCurrentStep("");
    setRetryCount(0);
    setIsRetrying(false);
    
    try {
      // Create a new ChatGPT service instance to ensure clean state
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const request: DDLCapacityRequest = {
        ddl: ddl.trim(),
        databaseType,
        recordCount,
        customModel: pageModel || undefined
      };
      
      let analysisResult: CapacityResult;
      
      if (useMultiCall) {
        // Use multi-call approach with progress tracking
        analysisResult = await chatGPT.analyzeCapacityMultiCall(request, (step: string, progress: number) => {
          setCurrentStep(step);
          setProgress(progress);
          
          // Detect retry attempts from progress messages
          if (step.includes('retrying') || step.includes('thử lại') || step.includes('Đang thử lại')) {
            setIsRetrying(true);
            // Extract retry count from step message if available
            const retryMatch = step.match(/attempt (\d+)/i) || step.match(/lần (\d+)/i);
            if (retryMatch) {
              setRetryCount(parseInt(retryMatch[1]));
            } else {
              setRetryCount(retryCount + 1);
            }
          } else if (!step.includes('API call failed') && !step.includes('timeout') && !step.includes('error')) {
            setIsRetrying(false);
          }
        });
      } else {
        // Use single call approach
        setCurrentStep(t("capacity.progress.singleCallStep"));
        setProgress(50);
        analysisResult = await chatGPT.analyzeCapacity(request);
        setProgress(100);
      }
      
      // Validate result before setting it
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error(t("capacity.errors.invalidResult"));
      }
      
      setResult(analysisResult);
      
      // Save to history
      const historyTitle = `${databaseType.toUpperCase()} Capacity Analysis - ${recordCount.toLocaleString()} records - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      addToCapacityHistory({
        title: historyTitle,
        ddl: ddl.trim(),
        databaseType,
        recordCount,
        result: analysisResult,
        model: pageModel || config.model,
        useMultiCall
      });
      
      toast({
        title: t("capacity.success.analysisComplete"),
        description: useMultiCall 
          ? t("capacity.success.detailedAnalysisComplete") 
          : t("capacity.success.quickAnalysisComplete"),
      });
      
    } catch (err) {
      console.error('Capacity analysis error:', err);
      
      let errorMessage = t("capacity.errors.unknownError");
      let canRetry = false;
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide more user-friendly error messages and retry suggestions
        if (errorMessage.includes('JSON') || errorMessage.includes('định dạng')) {
          errorMessage = t("capacity.errors.jsonFormatError");
          canRetry = true;
        } else if (errorMessage.includes('API Error') || errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = t("capacity.errors.authError");
        } else if (errorMessage.includes('429')) {
          errorMessage = t("capacity.errors.rateLimitError");
          canRetry = true;
        } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
          errorMessage = t("capacity.errors.timeoutError");
          canRetry = true;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = t("capacity.errors.networkError");
          canRetry = true;
        } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
          errorMessage = t("capacity.errors.serverError");
          canRetry = true;
        }
      }
      
      setError(errorMessage);
      setResult(null); // Clear any previous results
      
      // Show different toast messages based on error type
      toast({
        title: canRetry ? t("capacity.errors.temporaryError") : t("capacity.errors.analysisError"),
        description: errorMessage + (canRetry ? " " + t("capacity.errors.retryHint") : ""),
        variant: "destructive",
        duration: canRetry ? 7000 : 5000, // Show longer for retryable errors
      });
      
      // Suggest switching methods if multi-call failed
      if (useMultiCall && canRetry) {
        setTimeout(() => {
          toast({
            title: t("capacity.errors.switchMethodTitle"),
            description: t("capacity.errors.switchMethodHint"),
            duration: 5000,
          });
        }, 2000);
      }
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentStep("");
      setIsRetrying(false);
      setRetryCount(0);
    }
  };

  // New 3-step workflow functions
  const handleAnalyzeStructure = async () => {
    if (!ddl.trim()) {
      toast({
        title: t("capacity.errors.missingDDL"),
        description: t("capacity.errors.missingDDL"),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t("capacity.errors.missingApiKey"),
        description: t("capacity.errors.missingApiKey"),
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzingStructure(true);
    setError("");
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const analysis = await chatGPT.analyzeDDLStructure(ddl, databaseType, pageModel);
      
      setStructureAnalysis(analysis);
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 2,
        ddl: ddl.trim(),
        databaseType,
        recordCount,
        structureAnalysis: analysis,
        steps: {
          ...prev.steps,
          ddlInput: { step: 1, completed: true, data: { ddl: ddl.trim(), databaseType, recordCount } },
          structureAnalysis: { step: 2, completed: true, data: analysis }
        }
      }));
      
      toast({
        title: t("capacity.success.structureAnalysisComplete"),
        description: t("capacity.success.structureAnalysisDesc", {
          tableCount: analysis.totalTables,
          fieldCount: analysis.totalFields
        }),
      });
      
    } catch (err) {
      console.error('Structure analysis error:', err);
      setError(err instanceof Error ? err.message : t("capacity.errors.unknownError"));
      toast({
        title: t("capacity.errors.structureAnalysisError"),
        description: err instanceof Error ? err.message : t("capacity.errors.unknownError"),
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingStructure(false);
    }
  };

  const handleFinalCalculation = async () => {
    if (!structureAnalysis) {
      toast({
        title: t("capacity.errors.noStructureAnalysis"),
        description: t("capacity.errors.noStructureAnalysisDesc"),
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setProgress(0);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      setProgress(50);
      const analysisResult = await chatGPT.calculateCapacityFromStructure(
        structureAnalysis, 
        recordCount, 
        pageModel
      );
      setProgress(100);
      
      setResult(analysisResult);
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 3,
        finalResult: analysisResult,
        steps: {
          ...prev.steps,
          finalCalculation: { step: 3, completed: true, data: analysisResult }
        }
      }));
      
      // Save to history
      const historyTitle = `${databaseType.toUpperCase()} 3-Step Analysis - ${recordCount.toLocaleString()} records - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      addToCapacityHistory({
        title: historyTitle,
        ddl: ddl.trim(),
        databaseType,
        recordCount,
        result: analysisResult,
        model: pageModel || config.model,
        useMultiCall: false
      });
      
      toast({
        title: t("capacity.success.calculationComplete"),
        description: t("capacity.success.threeStepComplete"),
      });
      
    } catch (err) {
      console.error('Final calculation error:', err);
      setError(err instanceof Error ? err.message : t("capacity.errors.unknownError"));
      toast({
        title: t("capacity.errors.calculationError"),
        description: err instanceof Error ? err.message : t("capacity.errors.unknownError"),
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const updateFieldEstimate = (tableId: string, fieldId: string, field: Partial<ParsedField>) => {
    if (!structureAnalysis) return;
    
    const updatedAnalysis = {
      ...structureAnalysis,
      tables: structureAnalysis.tables.map(table => 
        table.id === tableId 
          ? {
              ...table,
              fields: table.fields.map(f => 
                f.id === fieldId ? { ...f, ...field } : f
              )
            }
          : table
      )
    };
    
    setStructureAnalysis(updatedAnalysis);
    setWorkflowState(prev => ({
      ...prev,
      structureAnalysis: updatedAnalysis,
      steps: {
        ...prev.steps,
        structureAnalysis: { step: 2, completed: true, data: updatedAnalysis }
      }
    }));
  };

  const resetWorkflow = () => {
    setWorkflowState({
      currentStep: 1,
      steps: {
        ddlInput: { step: 1, completed: false },
        structureAnalysis: { step: 2, completed: false },
        finalCalculation: { step: 3, completed: false }
      },
      ddl: "",
      databaseType: "mysql",
      recordCount: 1000000
    });
    setStructureAnalysis(null);
    setResult(null);
    setError("");
  };

  const handleCopy = (text: string, format: string = "JSON") => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: t("capacity.success.copied"),
        description: t("capacity.success.copiedDesc", { format }),
      });
    });
  };

  const handleCopyConfluence = () => {
    if (!result) return;
    
    const confluenceMarkup = generateConfluenceWikiMarkup(
      result,
      ddl,
      databaseType,
      recordCount,
      confluenceExportOptions
    );
    
    handleCopy(confluenceMarkup, "Confluence Wiki");
  };

  const handleCopyFieldAnalysis = () => {
    if (!result?.breakdown) return;
    
    const allFields: FieldCapacityDetail[] = [];
    result.breakdown.forEach(table => {
      if (table.fieldDetails) {
        allFields.push(...table.fieldDetails);
      }
    });
    
    if (allFields.length > 0) {
      const fieldMarkup = generateFieldAnalysisMarkup(allFields);
      handleCopy(fieldMarkup, "Field Analysis");
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    
    const summaryMarkup = generateSummaryTable(result, recordCount);
    handleCopy(summaryMarkup, "Summary Table");
  };

  const handleCopyDetailedFieldReport = () => {
    if (!result?.breakdown) return;
    
    const allFields: FieldCapacityDetail[] = [];
    const tableData: { [tableName: string]: FieldCapacityDetail[] } = {};
    
    result.breakdown.forEach(table => {
      if (table.fieldDetails) {
        allFields.push(...table.fieldDetails);
        tableData[table.tableName] = table.fieldDetails;
      }
    });
    
    if (allFields.length > 0) {
      let report = `# ${t("capacity.fieldAnalysisReport.title")}\n\n`;
      
      // Overall summary
      const totalDataSize = allFields.reduce((sum, field) => sum + field.averageSize, 0);
      const totalOverhead = allFields.reduce((sum, field) => sum + field.overhead, 0);
      const efficiency = totalDataSize > 0 ? ((totalDataSize / (totalDataSize + totalOverhead)) * 100) : 0;
      
      report += `## ${t("capacity.fieldAnalysisReport.summary.totalDataSize")}\n`;
      report += `- **${t("capacity.fieldAnalysisReport.tableHeaders.field")}:** ${allFields.length}\n`;
      report += `- **${t("capacity.fieldAnalysisReport.summary.totalDataSize")}:** ${formatBytes(totalDataSize)}\n`;
      report += `- **${t("capacity.fieldAnalysisReport.summary.totalOverhead")}:** ${formatBytes(totalOverhead)}\n`;
      report += `- **${t("capacity.fieldAnalysisReport.summary.storageEfficiency")}:** ${efficiency.toFixed(1)}%\n\n`;
      
      // Per-table analysis
      Object.entries(tableData).forEach(([tableName, fields]) => {
        report += `## ${t("capacity.results.tableBreakdown.title")}: ${tableName}\n\n`;
        report += `| ${t("capacity.fieldAnalysisReport.tableHeaders.field")} | ${t("capacity.fieldAnalysisReport.tableHeaders.dataType")} | ${t("capacity.fieldAnalysisReport.tableHeaders.averageSize")} | ${t("capacity.fieldAnalysisReport.tableHeaders.maximumSize")} | ${t("capacity.fieldAnalysisReport.tableHeaders.overhead")} | ${t("capacity.fieldAnalysisReport.tableHeaders.overheadPercent")} | ${t("capacity.fieldAnalysisReport.tableHeaders.nullable")} | ${t("capacity.fieldAnalysisReport.storageNotes.title")} |\n`;
        report += `|-------|-----------|---------------|----------------|----------|------------|----------|----------|\n`;
        
        fields
          .sort((a, b) => (b.averageSize + b.overhead) - (a.averageSize + a.overhead))
          .forEach(field => {
            const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
            const nullable = field.nullable ? "✓" : "✗";
            
            const notes = [];
            if (overheadPercent > 30) notes.push("High Overhead");
            if (field.averageSize > 1000) notes.push("Large Field");
            if (field.maximumSize / field.averageSize > 5) notes.push("Variable Size");
            
            report += `| ${field.fieldName} | \`${field.dataType}\` | ${formatBytes(field.averageSize)} | ${formatBytes(field.maximumSize)} | ${formatBytes(field.overhead)} | ${overheadPercent.toFixed(1)}% | ${nullable} | ${notes.join(", ")} |\n`;
          });
        
        report += `\n`;
        
        // Table-specific recommendations
        const tableDataSize = fields.reduce((sum, field) => sum + field.averageSize, 0);
        const tableOverhead = fields.reduce((sum, field) => sum + field.overhead, 0);
        const tableEfficiency = tableDataSize > 0 ? ((tableDataSize / (tableDataSize + tableOverhead)) * 100) : 0;
        const nullableFields = fields.filter(f => f.nullable).length;
        const highOverheadFields = fields.filter(f => 
          f.averageSize > 0 ? (f.overhead / f.averageSize * 100) > 20 : false
        ).length;
        
        report += `### Thống kê bảng ${tableName}:\n`;
        report += `- **Hiệu quả lưu trữ:** ${tableEfficiency.toFixed(1)}%\n`;
        report += `- **Fields có overhead cao:** ${highOverheadFields}/${fields.length}\n`;
        report += `- **Nullable fields:** ${nullableFields}/${fields.length}\n\n`;
        
        if (nullableFields / fields.length > 0.7) {
          report += `⚠️ **Khuyến nghị:** Bảng có quá nhiều nullable fields (${nullableFields}/${fields.length}). Xem xét sắp xếp lại thứ tự columns để tối ưu null bitmap.\n\n`;
        }
        
        if (highOverheadFields > fields.length * 0.3) {
          report += `⚠️ **Khuyến nghị:** ${highOverheadFields}/${fields.length} fields có overhead cao. Xem xét review data types và padding.\n\n`;
        }
      });
      
      // Top optimization opportunities
      const optimizationFields = allFields
        .filter(field => {
          const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
          return overheadPercent > 20 || field.averageSize > 1000 || (field.maximumSize / field.averageSize > 5);
        })
        .sort((a, b) => {
          const aOverheadPercent = a.averageSize > 0 ? (a.overhead / a.averageSize * 100) : 0;
          const bOverheadPercent = b.averageSize > 0 ? (b.overhead / b.averageSize * 100) : 0;
          return bOverheadPercent - aOverheadPercent;
        })
        .slice(0, 5);
        
      if (optimizationFields.length > 0) {
        report += `## Top 5 Khuyến Nghị Tối Ưu Hóa\n\n`;
        optimizationFields.forEach((field, idx) => {
          const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
          report += `${idx + 1}. **${field.fieldName}** (\`${field.dataType}\`):\n`;
          
          if (overheadPercent > 30) {
            report += `   - Overhead cao: ${overheadPercent.toFixed(1)}%\n`;
            report += `   - 💡 Xem xét tối ưu hóa data type\n`;
          } else if (field.averageSize > 1000) {
            report += `   - Kích thước lớn: ${formatBytes(field.averageSize)}\n`;
            report += `   - 💡 Xem xét nén hoặc tách riêng\n`;
          } else if (field.maximumSize / field.averageSize > 5) {
            report += `   - Độ biến thiên cao: ${field.maximumSize / field.averageSize}x\n`;
            report += `   - 💡 Xem xét sử dụng VARCHAR thay vì CHAR\n`;
          }
          report += `\n`;
        });
      }
      
      handleCopy(report, "Detailed Field Report");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedDb = databases.find(db => db.id === databaseType);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Calculator className="w-8 h-8 text-primary" />
                  {t("capacity.title")}
                </h1>
                <p className="text-muted-foreground">
                  {t("capacity.description")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2"
                >
                  <History className="w-4 h-4" />
                  <span>{t("capacity.buttons.history")}</span>
                </Button>
                <ModelSelector pageId={PAGE_ID} />
              </div>
            </div>

            {/* Workflow Mode Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {t("capacity.workflowMode.title")}
                </CardTitle>
                <CardDescription>
                  {t("capacity.workflowMode.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={workflowMode === 'classic' ? "default" : "outline"}
                    onClick={() => setWorkflowMode('classic')}
                    className="h-auto p-4 flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-medium">{t("capacity.workflowMode.classic.title")}</span>
                    </div>
                    <div className="text-xs text-left opacity-80">
                      {t("capacity.workflowMode.classic.description")}
                    </div>
                  </Button>
                  
                  <Button
                    variant={workflowMode === '3-step' ? "default" : "outline"}
                    onClick={() => setWorkflowMode('3-step')}
                    className="h-auto p-4 flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{t("capacity.workflowMode.threeStep.title")}</span>
                    </div>
                    <div className="text-xs text-left opacity-80">
                      {t("capacity.workflowMode.threeStep.description")}
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {workflowMode === '3-step' && (
              /* 3-Step Workflow Progress */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {t("capacity.workflowProgress.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    {[
                      { step: 1, label: t("capacity.workflowProgress.steps.ddlInput"), icon: Database, completed: workflowState.steps.ddlInput.completed },
                      { step: 2, label: t("capacity.workflowProgress.steps.structureAnalysis"), icon: Search, completed: workflowState.steps.structureAnalysis.completed },
                      { step: 3, label: t("capacity.workflowProgress.steps.finalCalculation"), icon: Calculator, completed: workflowState.steps.finalCalculation.completed }
                    ].map((item, index) => (
                      <div key={item.step} className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          item.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : workflowState.currentStep === item.step 
                              ? 'border-blue-500 text-blue-500' 
                              : 'border-gray-300 text-gray-300'
                        }`}>
                          {item.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <item.icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className={`text-sm font-medium ${
                            item.completed 
                              ? 'text-green-700' 
                              : workflowState.currentStep === item.step 
                                ? 'text-blue-700' 
                                : 'text-gray-500'
                          }`}>
                            {t("capacity.workflowProgress.stepNumber", { number: item.step })}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                        {index < 2 && (
                          <ArrowRight className={`w-4 h-4 mx-4 ${
                            item.completed ? 'text-green-500' : 'text-gray-300'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {workflowState.currentStep > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetWorkflow}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("capacity.workflowProgress.restart")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-6">
                {workflowMode === 'classic' ? (
                  /* Classic Mode Input */
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        {t("capacity.input.title")}
                      </CardTitle>
                      <CardDescription>
                        {t("capacity.input.description")}
                      </CardDescription>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="database-type">{t("capacity.input.databaseType")}</Label>
                      <Select value={databaseType} onValueChange={setDatabaseType}>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span>{selectedDb?.icon}</span>
                              <span>{selectedDb?.name}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {databases.map((db) => (
                            <SelectItem key={db.id} value={db.id}>
                              <div className="flex items-center gap-2">
                                <span>{db.icon}</span>
                                <span>{db.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ddl">DDL Schema</Label>
                      <Textarea
                        id="ddl"
                        placeholder={t("capacity.input.ddlPlaceholder")}
                        value={ddl}
                        onChange={(e) => setDdl(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="record-count">{t("capacity.input.recordCount")}</Label>
                      
                      {/* Quick Preset Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "1K", value: 1000 },
                          { label: "10K", value: 10000 },
                          { label: "100K", value: 100000 },
                          { label: "1M", value: 1000000 },
                          { label: "10M", value: 10000000 },
                          { label: "100M", value: 100000000 },
                          { label: "1B",   value: 1000000000 },
                          { label: "10B",  value: 10000000000 },
                          { label: "100B", value: 100000000000 }
                        ].map(preset => (
                          <Button
                            key={preset.value}
                            variant={recordCount === preset.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRecordCount(preset.value)}
                            className="text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Enhanced Input with Formatting */}
                      <div className="space-y-2">
                        <Input
                          id="record-count"
                          type="text"
                          placeholder="1,000,000"
                          value={recordCount ? recordCount.toLocaleString() : ''}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                            setRecordCount(parseInt(numericValue) || 0);
                          }}
                          className="font-mono"
                        />
                        
                        {/* Visual Helper */}
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <div>
                            {recordCount > 0 && (
                              <span>
                                {recordCount >= 1000000 ? `${(recordCount / 1000000).toFixed(1)}M` :
                                 recordCount >= 1000 ? `${(recordCount / 1000).toFixed(1)}K` :
                                 t("capacity.input.recordCountHelper", { count: recordCount.toString() })}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div>{t("capacity.input.recordCountHint")}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Validation Warning */}
                      {recordCount > 0 && recordCount < 100 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          {t("capacity.input.recordCountWarningSmall")}
                        </div>
                      )}
                      
                      {recordCount > 1000000000 && (
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          {t("capacity.input.recordCountWarningLarge")}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{t("capacity.input.analysisMethod")}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUseMultiCall(!useMultiCall)}
                          className="text-xs"
                        >
                          {useMultiCall ? (
                            <>
                              <Layers className="w-3 h-3 mr-1" />
                              {t("capacity.input.multiCall")}
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              {t("capacity.input.singleCall")}
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          {useMultiCall 
                            ? t("capacity.input.multiCallDesc")
                            : t("capacity.input.singleCallDesc")
                          }
                        </div>
                        {useMultiCall && (
                          <div className="text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                            {t("capacity.input.multiCallNote")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracking */}
                    {isAnalyzing && (
                      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 text-blue-600 ${isRetrying ? 'animate-spin' : 'animate-pulse'}`} />
                          <Label className="text-blue-800 font-medium">
                            {isRetrying ? t("capacity.progress.retryTitle", { count: retryCount }) : t("capacity.progress.title")}
                          </Label>
                          {isRetrying && (
                            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                              Retry
                            </div>
                          )}
                        </div>
                        <Progress value={progress} className={`h-2 ${isRetrying ? 'animate-pulse' : ''}`} />
                        <div className="text-sm text-blue-700">
                          {currentStep || t("capacity.progress.preparing")}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-blue-600">
                            {t("capacity.progress.completed", { progress })}
                          </div>
                          {retryCount > 0 && (
                            <div className="text-xs text-yellow-700">
                              {t("capacity.progress.retryCount", { count: retryCount })}
                            </div>
                          )}
                        </div>
                        {isRetrying && (
                          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                            {t("capacity.progress.retryNote")}
                          </div>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing} 
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          {t("capacity.buttons.analyzing")}
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {useMultiCall ? t("capacity.buttons.analyzeDetailed") : t("capacity.buttons.analyzeQuick")}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
                ) : (
                  /* 3-Step Workflow Input */
                  <>
                    {/* Step 1: DDL Input */}
                    {workflowState.currentStep === 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            {t("capacity.threeStepWorkflow.step1.title")}
                          </CardTitle>
                          <CardDescription>
                            {t("capacity.threeStepWorkflow.step1.description")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="database-type-3step">{t("capacity.input.databaseType")}</Label>
                            <Select value={databaseType} onValueChange={setDatabaseType}>
                              <SelectTrigger>
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <span>{selectedDb?.icon}</span>
                                    <span>{selectedDb?.name}</span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {databases.map((db) => (
                                  <SelectItem key={db.id} value={db.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{db.icon}</span>
                                      <span>{db.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="ddl-3step">DDL Schema</Label>
                            <Textarea
                              id="ddl-3step"
                              placeholder={t("capacity.input.ddlPlaceholder")}
                              value={ddl}
                              onChange={(e) => setDdl(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="record-count-3step">{t("capacity.input.recordCount")}</Label>
                            
                            {/* Quick Preset Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: "1K", value: 1000 },
                                { label: "10K", value: 10000 },
                                { label: "100K", value: 100000 },
                                { label: "1M", value: 1000000 },
                                { label: "10M", value: 10000000 },
                                { label: "100M", value: 100000000 },
                                { label: "1B",   value: 1000000000 },
                                { label: "10B",  value: 10000000000 },
                                { label: "100B", value: 100000000000 }
                              ].map(preset => (
                                <Button
                                  key={preset.value}
                                  variant={recordCount === preset.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setRecordCount(preset.value)}
                                  className="text-xs"
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                            
                            {/* Enhanced Input with Formatting */}
                            <div className="space-y-2">
                              <Input
                                id="record-count-3step"
                                type="text"
                                placeholder="1,000,000"
                                value={recordCount ? recordCount.toLocaleString() : ''}
                                onChange={(e) => {
                                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                  setRecordCount(parseInt(numericValue) || 0);
                                }}
                                className="font-mono"
                              />
                              
                              {/* Visual Helper */}
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div>
                                  {recordCount > 0 && (
                                    <span>
                                      {recordCount >= 1000000 ? `${(recordCount / 1000000).toFixed(1)}M` :
                                       recordCount >= 1000 ? `${(recordCount / 1000).toFixed(1)}K` :
                                       t("capacity.input.recordCountHelper", { count: recordCount.toString() })}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div>{t("capacity.input.recordCountHint")}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Validation Warning */}
                            {recordCount > 0 && recordCount < 100 && (
                              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                {t("capacity.input.recordCountWarningSmall")}
                              </div>
                            )}
                            
                            {recordCount > 1000000000 && (
                              <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                                {t("capacity.input.recordCountWarningLarge")}
                              </div>
                            )}
                          </div>

                          <Button 
                            onClick={handleAnalyzeStructure} 
                            disabled={isAnalyzingStructure || !ddl.trim()}
                            className="w-full"
                            size="lg"
                          >
                            {isAnalyzingStructure ? (
                              <>
                                <Search className="w-4 h-4 mr-2 animate-spin" />
                                {t("capacity.buttons.analyzingStructure")}
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4 mr-2" />
                                {t("capacity.buttons.analyzeStructure")}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Step 2: Structure Analysis & Editing */}
                    {workflowState.currentStep === 2 && structureAnalysis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            {t("capacity.threeStepWorkflow.step2.title")}
                          </CardTitle>
                          <CardDescription>
                            {t("capacity.threeStepWorkflow.step2.description")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{structureAnalysis.totalTables}</div>
                              <div className="text-sm text-blue-700">{t("capacity.threeStepWorkflow.step2.summary.tables")}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{structureAnalysis.totalFields}</div>
                              <div className="text-sm text-blue-700">Fields</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{Math.round(structureAnalysis.analysisConfidence * 100)}%</div>
                              <div className="text-sm text-blue-700">{t("capacity.threeStepWorkflow.step2.summary.confidence")}</div>
                            </div>
                          </div>

                          {/* Tables and Fields */}
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {structureAnalysis.tables.map((table) => (
                              <div key={table.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <Table className="w-4 h-4" />
                                    {table.tableName}
                                  </h4>
                                  <Badge variant="secondary">{table.fields.length} fields</Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  {table.fields.map((field) => (
                                    <div key={field.id} className="grid grid-cols-4 gap-2 p-2 border rounded text-sm">
                                      <div>
                                        <div className="font-medium">{field.fieldName}</div>
                                        <div className="text-xs text-muted-foreground">{field.dataType}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground">{t("capacity.threeStepWorkflow.step2.fieldLabels.averageSize")}</div>
                                        <Input
                                          type="number"
                                          value={field.estimatedAverageSize || 0}
                                          onChange={(e) => updateFieldEstimate(table.id, field.id, {
                                            estimatedAverageSize: parseInt(e.target.value) || 0
                                          })}
                                          className="h-6 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground">{t("capacity.threeStepWorkflow.step2.fieldLabels.maximumSize")}</div>
                                        <Input
                                          type="number"
                                          value={field.estimatedMaximumSize || 0}
                                          onChange={(e) => updateFieldEstimate(table.id, field.id, {
                                            estimatedMaximumSize: parseInt(e.target.value) || 0
                                          })}
                                          className="h-6 text-xs"
                                        />
                                      </div>
                                      <div className="flex items-center justify-center">
                                        {field.nullable && <Badge variant="outline" className="text-xs">Nullable</Badge>}
                                        {field.isPrimaryKey && <Badge variant="default" className="text-xs">PK</Badge>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Warnings and Suggestions */}
                          {(structureAnalysis.warnings?.length || structureAnalysis.suggestions?.length) && (
                            <div className="space-y-2">
                              {structureAnalysis.warnings?.length > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <h5 className="font-medium text-yellow-800 mb-2">{t("capacity.threeStepWorkflow.step2.warnings")}</h5>
                                  {structureAnalysis.warnings.map((warning, idx) => (
                                    <div key={idx} className="text-sm text-yellow-700">{warning}</div>
                                  ))}
                                </div>
                              )}
                              
                              {structureAnalysis.suggestions?.length > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <h5 className="font-medium text-blue-800 mb-2">{t("capacity.threeStepWorkflow.step2.suggestions")}</h5>
                                  {structureAnalysis.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="text-sm text-blue-700">{suggestion}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <Button 
                            onClick={handleFinalCalculation}
                            disabled={isAnalyzing}
                            className="w-full"
                            size="lg"
                          >
                            {isAnalyzing ? (
                              <>
                                <Calculator className="w-4 h-4 mr-2 animate-spin" />
                                {t("capacity.buttons.calculating")}
                              </>
                            ) : (
                              <>
                                <Calculator className="w-4 h-4 mr-2" />
                                {t("capacity.buttons.calculateCapacity")}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-destructive">{t("capacity.results.errorDisplay.title")}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{error}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {t("capacity.results.title")}
                      </CardTitle>
                      <CardDescription>
                        {t("capacity.results.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Record Size Analysis */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          {t("capacity.results.recordSizeAnalysis.title")}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm text-blue-700">{t("capacity.results.recordSizeAnalysis.averageSize")}</Label>
                            <div className="text-xl font-bold text-blue-900">
                              {formatBytes(result.averageRecordSize)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-blue-700">{t("capacity.results.recordSizeAnalysis.maximumSize")}</Label>
                            <div className="text-xl font-bold text-blue-900">
                              {formatBytes(result.maximumRecordSize)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Capacity - Average vs Maximum */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          {t("capacity.results.totalCapacity.title", { recordCount: recordCount.toLocaleString() })}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <Label className="text-sm font-medium text-green-700">{t("capacity.results.totalCapacity.averageCase")}</Label>
                            <div className="text-2xl font-bold text-green-900 mt-1">
                              {formatBytes(result.totalSizeAverage.bytes)}
                            </div>
                            <div className="text-sm text-green-700">
                              {result.totalSizeAverage.mb.toFixed(2)} MB • {result.totalSizeAverage.gb.toFixed(3)} GB
                            </div>
                          </div>

                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <Label className="text-sm font-medium text-orange-700">{t("capacity.results.totalCapacity.maximumCase")}</Label>
                            <div className="text-2xl font-bold text-orange-900 mt-1">
                              {formatBytes(result.totalSizeMaximum.bytes)}
                            </div>
                            <div className="text-sm text-orange-700">
                              {result.totalSizeMaximum.mb.toFixed(2)} MB • {result.totalSizeMaximum.gb.toFixed(3)} GB
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Index Size */}
                      {result.indexSize && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <Label className="text-sm font-medium text-purple-700">{t("capacity.results.indexSize.title")}</Label>
                          <div className="text-xl font-bold text-purple-900 mt-1">
                            {formatBytes(result.indexSize.bytes)}
                          </div>
                          <div className="text-sm text-purple-700">
                            {result.indexSize.mb.toFixed(2)} MB • {result.indexSize.gb.toFixed(3)} GB
                          </div>
                        </div>
                      )}

                      {/* Total with Index */}
                      {result.totalWithIndexAverage && result.totalWithIndexMaximum && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t("capacity.results.totalWithIndex.title")}</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">{t("capacity.results.totalWithIndex.averageCase")}</div>
                              <div className="text-lg font-bold">
                                {formatBytes(result.totalWithIndexAverage.bytes)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.totalWithIndexAverage.mb.toFixed(2)} MB • {result.totalWithIndexAverage.gb.toFixed(3)} GB
                              </div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">{t("capacity.results.totalWithIndex.maximumCase")}</div>
                              <div className="text-lg font-bold">
                                {formatBytes(result.totalWithIndexMaximum.bytes)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.totalWithIndexMaximum.mb.toFixed(2)} MB • {result.totalWithIndexMaximum.gb.toFixed(3)} GB
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Table Breakdown */}
                      {result.breakdown && result.breakdown.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">{t("capacity.results.tableBreakdown.title")}</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFieldDetails(!showFieldDetails)}
                              >
                                {showFieldDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {showFieldDetails ? t("capacity.buttons.hideFieldDetails") : t("capacity.buttons.showFieldDetails")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOverheadAnalysis(!showOverheadAnalysis)}
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                {showOverheadAnalysis ? t("capacity.buttons.hideOverhead") : t("capacity.buttons.showOverhead")}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {result.breakdown.map((table, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <Table className="w-4 h-4" />
                                    {table.tableName}
                                  </h4>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">{t("capacity.results.tableBreakdown.recordSizeAverage")}</div>
                                    <div className="font-semibold">{formatBytes(table.averageRecordSize)}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">{t("capacity.results.tableBreakdown.recordSizeMaximum")}</div>
                                    <div className="font-semibold">{formatBytes(table.maximumRecordSize)}</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="p-2 bg-green-50 rounded">
                                    <div className="text-xs text-green-700">{t("capacity.results.tableBreakdown.capacityAverage")}</div>
                                    <div className="font-semibold text-green-900">
                                      {formatBytes(table.totalSizeAverage.bytes)}
                                    </div>
                                  </div>
                                  <div className="p-2 bg-orange-50 rounded">
                                    <div className="text-xs text-orange-700">{t("capacity.results.tableBreakdown.capacityMaximum")}</div>
                                    <div className="font-semibold text-orange-900">
                                      {formatBytes(table.totalSizeMaximum.bytes)}
                                    </div>
                                  </div>
                                </div>

                                {/* Row Overhead Analysis */}
                                {showOverheadAnalysis && table.rowOverhead && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded">
                                    <h5 className="text-xs font-medium text-gray-700 mb-2">Row Overhead Analysis</h5>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                      <div>
                                        <div className="text-muted-foreground">Null Bitmap</div>
                                        <div className="font-medium">{formatBytes(table.rowOverhead.nullBitmap)}</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Row Header</div>
                                        <div className="font-medium">{formatBytes(table.rowOverhead.rowHeader)}</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Alignment</div>
                                        <div className="font-medium">{formatBytes(table.rowOverhead.alignment)}</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground font-semibold">Total Overhead</div>
                                        <div className="font-semibold text-red-600">{formatBytes(table.rowOverhead.total)}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Field Details */}
                                {showFieldDetails && table.fieldDetails && table.fieldDetails.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                      <BarChart3 className="w-4 h-4" />
                                      {t("capacity.results.fieldDetails.title")}
                                    </h5>
                                    <div className="space-y-2">
                                      {table.fieldDetails.map((field, fieldIndex) => (
                                        <div key={fieldIndex} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                          <div className="flex justify-between items-start mb-1">
                                            <div className="font-medium text-blue-900">{field.fieldName}</div>
                                            <div className="text-blue-700 font-mono">{field.dataType}</div>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 mb-1">
                                            <div>
                                              <span className="text-muted-foreground">TB: </span>
                                              <span className="font-medium">{formatBytes(field.averageSize)}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Max: </span>
                                              <span className="font-medium">{formatBytes(field.maximumSize)}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Overhead: </span>
                                              <span className="font-medium">{formatBytes(field.overhead)}</span>
                                            </div>
                                          </div>
                                          <div className="text-blue-700">{field.description}</div>
                                          {field.storageNotes && (
                                            <div className="text-blue-600 italic mt-1">{field.storageNotes}</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-between items-center mt-3">
                                  <div className="text-xs text-muted-foreground">
                                    {t("capacity.results.tableBreakdown.recordCount", { count: table.recordCount.toLocaleString() })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {t("capacity.results.recommendations.title")}
                          </Label>
                          <div className="space-y-2">
                            {result.recommendations.map((recommendation, index) => (
                              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                {recommendation}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Field Analysis Report */}
                      {result.breakdown && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-purple-600" />
                              {t("capacity.fieldAnalysisReport.title")}
                            </h4>
                            <Badge variant="outline" className="text-purple-700 border-purple-300">
                              {result.breakdown.reduce((total, table) => total + (table.fieldDetails?.length || 0), 0)} fields
                            </Badge>
                          </div>
                          
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="text-sm text-purple-800">
                              {t("capacity.fieldAnalysisReport.description")}
                            </div>
                          </div>

                          {result.breakdown.some(table => table.fieldDetails?.length) ? (
                            result.breakdown.map((table, tableIndex) => 
                              table.fieldDetails && table.fieldDetails.length > 0 && (
                              <div key={tableIndex} className="border border-purple-200 rounded-lg overflow-hidden">
                                <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
                                  <h5 className="font-medium text-purple-900 flex items-center gap-2">
                                    <Table className="w-4 h-4" />
                                    {table.tableName}
                                    <Badge variant="secondary" className="ml-2">
                                      {table.fieldDetails.length} fields
                                    </Badge>
                                  </h5>
                                </div>
                                
                                <div className="p-4">
                                  {/* Field Analysis Summary */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                      <div className="text-xs text-blue-700 font-medium">{t("capacity.fieldAnalysisReport.summary.totalDataSize")}</div>
                                      <div className="text-lg font-bold text-blue-900">
                                        {formatBytes(table.fieldDetails.reduce((sum, field) => sum + field.averageSize, 0))}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                      <div className="text-xs text-orange-700 font-medium">{t("capacity.fieldAnalysisReport.summary.totalOverhead")}</div>
                                      <div className="text-lg font-bold text-orange-900">
                                        {formatBytes(table.fieldDetails.reduce((sum, field) => sum + field.overhead, 0))}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                      <div className="text-xs text-green-700 font-medium">{t("capacity.fieldAnalysisReport.summary.storageEfficiency")}</div>
                                      <div className="text-lg font-bold text-green-900">
                                        {(() => {
                                          const totalData = table.fieldDetails.reduce((sum, field) => sum + field.averageSize, 0);
                                          const totalOverhead = table.fieldDetails.reduce((sum, field) => sum + field.overhead, 0);
                                          const efficiency = totalData > 0 ? ((totalData / (totalData + totalOverhead)) * 100) : 0;
                                          return `${efficiency.toFixed(1)}%`;
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detailed Field Table */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                      <thead>
                                        <tr className="bg-gray-50 border-b">
                                          <th className="text-left p-2 font-medium">Field</th>
                                          <th className="text-left p-2 font-medium">Data Type</th>
                                          <th className="text-right p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.averageSize")}</th>
                                          <th className="text-right p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.maximumSize")}</th>
                                          <th className="text-right p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.overhead")}</th>
                                          <th className="text-right p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.overheadPercent")}</th>
                                          <th className="text-center p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.nullable")}</th>
                                          <th className="text-left p-2 font-medium">{t("capacity.fieldAnalysisReport.tableHeaders.assessment")}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {table.fieldDetails
                                          .sort((a, b) => (b.averageSize + b.overhead) - (a.averageSize + a.overhead))
                                          .map((field, fieldIndex) => {
                                            const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
                                            const isHighOverhead = overheadPercent > 20;
                                            const isLargeField = field.averageSize > 100;
                                            
                                            return (
                                              <tr key={fieldIndex} className={`border-b hover:bg-gray-50 ${isHighOverhead ? 'bg-yellow-50' : ''}`}>
                                                <td className="p-2">
                                                  <div className="font-medium text-gray-900">{field.fieldName}</div>
                                                  {field.maxLength && (
                                                    <div className="text-xs text-gray-500">Max length: {field.maxLength}</div>
                                                  )}
                                                </td>
                                                <td className="p-2 font-mono text-xs">{field.dataType}</td>
                                                <td className="p-2 text-right font-medium">{formatBytes(field.averageSize)}</td>
                                                <td className="p-2 text-right font-medium">{formatBytes(field.maximumSize)}</td>
                                                <td className="p-2 text-right">
                                                  <span className={`font-medium ${isHighOverhead ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {formatBytes(field.overhead)}
                                                  </span>
                                                </td>
                                                <td className="p-2 text-right">
                                                  <span className={`text-xs px-1 py-0.5 rounded ${
                                                    overheadPercent > 30 ? 'bg-red-100 text-red-800' :
                                                    overheadPercent > 15 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                  }`}>
                                                    {overheadPercent.toFixed(1)}%
                                                  </span>
                                                </td>
                                                <td className="p-2 text-center">
                                                  {field.nullable ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                                                  ) : (
                                                    <span className="w-4 h-4 bg-gray-300 rounded-full inline-block" />
                                                  )}
                                                </td>
                                                <td className="p-2">
                                                  <div className="flex flex-wrap gap-1">
                                                    {isHighOverhead && (
                                                      <Badge variant="destructive" className="text-xs">
                                                        High Overhead
                                                      </Badge>
                                                    )}
                                                    {isLargeField && (
                                                      <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                                                        Large Field
                                                      </Badge>
                                                    )}
                                                    {field.averageSize !== field.maximumSize && field.maximumSize / field.averageSize > 3 && (
                                                      <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                                                        Variable Size
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Field Optimization Recommendations */}
                                  <div className="mt-4 space-y-2">
                                    <h6 className="font-medium text-sm text-gray-800 flex items-center gap-1">
                                      <Info className="w-4 h-4" />
                                      {t("capacity.results.recommendations.title")} fields
                                    </h6>
                                    <div className="grid grid-cols-1 gap-2">
                                      {table.fieldDetails
                                        .filter(field => {
                                          const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
                                          return overheadPercent > 20 || field.averageSize > 1000 || 
                                                 (field.maximumSize / field.averageSize > 5);
                                        })
                                        .slice(0, 3)
                                        .map((field, idx) => {
                                          const overheadPercent = field.averageSize > 0 ? (field.overhead / field.averageSize * 100) : 0;
                                          let recommendation = "";
                                          let bgColor = "bg-blue-50 border-blue-200 text-blue-800";
                                          
                                          if (overheadPercent > 30) {
                                            recommendation = `Field "${field.fieldName}" có overhead cao (${overheadPercent.toFixed(1)}%). Xem xét tối ưu hóa data type.`;
                                            bgColor = "bg-red-50 border-red-200 text-red-800";
                                          } else if (field.averageSize > 1000) {
                                            recommendation = `Field "${field.fieldName}" có kích thước lớn (${formatBytes(field.averageSize)}). Xem xét nén hoặc tách riêng.`;
                                            bgColor = "bg-orange-50 border-orange-200 text-orange-800";
                                          } else if (field.maximumSize / field.averageSize > 5) {
                                            recommendation = `Field "${field.fieldName}" có độ biến thiên kích thước cao. Xem xét sử dụng VARCHAR thay vì CHAR.`;
                                            bgColor = "bg-yellow-50 border-yellow-200 text-yellow-800";
                                          }
                                          
                                          return recommendation ? (
                                            <div key={idx} className={`p-2 text-xs rounded border ${bgColor}`}>
                                              {recommendation}
                                            </div>
                                          ) : null;
                                        })
                                        .filter(Boolean)
                                      }
                                      
                                      {/* General recommendations based on table analysis */}
                                      {(() => {
                                        const totalFields = table.fieldDetails.length;
                                        const nullableFields = table.fieldDetails.filter(f => f.nullable).length;
                                        const highOverheadFields = table.fieldDetails.filter(f => 
                                          f.averageSize > 0 ? (f.overhead / f.averageSize * 100) > 20 : false
                                        ).length;
                                        
                                        const recommendations = [];
                                        
                                        if (nullableFields / totalFields > 0.7) {
                                          recommendations.push(
                                            <div key="nullable" className="p-2 text-xs rounded border bg-blue-50 border-blue-200 text-blue-800">
                                              Bảng có nhiều nullable fields ({nullableFields}/{totalFields}). Xem xét sắp xếp lại thứ tự columns để tối ưu null bitmap.
                                            </div>
                                          );
                                        }
                                        
                                        if (highOverheadFields > totalFields * 0.3) {
                                          recommendations.push(
                                            <div key="overhead" className="p-2 text-xs rounded border bg-yellow-50 border-yellow-200 text-yellow-800">
                                              {highOverheadFields}/{totalFields} fields có overhead cao. Xem xét review data types và padding.
                                            </div>
                                          );
                                        }
                                        
                                        return recommendations;
                                      })()}
                                    </div>
                                  </div>

                                  {/* Storage Notes */}
                                  {table.fieldDetails.some(field => field.storageNotes) && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                                      <h6 className="font-medium text-sm text-gray-800 mb-2">{t("capacity.fieldAnalysisReport.storageNotes.title")}</h6>
                                      <div className="space-y-1">
                                        {table.fieldDetails
                                          .filter(field => field.storageNotes)
                                          .map((field, idx) => (
                                            <div key={idx} className="text-xs text-gray-600">
                                              <span className="font-medium">{field.fieldName}:</span> {field.storageNotes}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )) : (
                            <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-lg">
                              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <h5 className="font-medium text-gray-700 mb-2">
                                Chưa có chi tiết phân tích field
                              </h5>
                              <div className="text-sm text-gray-500 space-y-2">
                                <p>
                                  Để xem phân tích chi tiết cho từng field, hãy sử dụng phương pháp 
                                  <span className="font-medium"> "Nhiều lời gọi AI"</span> trong phần cấu hình.
                                </p>
                                <p>
                                  Phương pháp này sẽ cung cấp thông tin chi tiết về:
                                </p>
                                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                                  <li>• Kích thước trung bình và tối đa của từng field</li>
                                  <li>• Phân tích overhead và hiệu quả lưu trữ</li>
                                  <li>• Khuyến nghị tối ưu hóa cho từng field</li>
                                  <li>• Thống kê nullable và data type</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      {/* Export Options */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <Label className="text-sm font-medium">Export Options</Label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyConfluence}
                            className="justify-start"
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            Copy Confluence Wiki
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopySummary}
                            className="justify-start"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Copy Summary Table
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyFieldAnalysis}
                            className="justify-start"
                            disabled={!result.breakdown?.some(table => table.fieldDetails?.length)}
                          >
                            <Table className="w-4 h-4 mr-2" />
                            Copy Field Analysis
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyDetailedFieldReport}
                            className="justify-start"
                            disabled={!result.breakdown?.some(table => table.fieldDetails?.length)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Copy Detailed Field Report
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(JSON.stringify(result, null, 2), "JSON")}
                            className="justify-start"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Raw JSON
                          </Button>
                        </div>

                        {/* Export Settings */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Label className="text-xs font-medium text-gray-700 mb-2 block">Confluence Export Settings</Label>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={confluenceExportOptions.includeFieldDetails}
                                onChange={(e) => setConfluenceExportOptions({
                                  ...confluenceExportOptions,
                                  includeFieldDetails: e.target.checked
                                })}
                                className="rounded"
                              />
                              Include Field Details
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={confluenceExportOptions.includeRecommendations}
                                onChange={(e) => setConfluenceExportOptions({
                                  ...confluenceExportOptions,
                                  includeRecommendations: e.target.checked
                                })}
                                className="rounded"
                              />
                              Include Recommendations
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={confluenceExportOptions.includeOverheadAnalysis}
                                onChange={(e) => setConfluenceExportOptions({
                                  ...confluenceExportOptions,
                                  includeOverheadAnalysis: e.target.checked
                                })}
                                className="rounded"
                              />
                              Include Overhead Analysis
                            </label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!result && !error && !isAnalyzing && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">{t("capacity.results.noResult.title")}</p>
                        <p className="text-sm">
                          {t("capacity.results.noResult.description")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <History className="w-6 h-6" />
                <span>Lịch sử phân tích dung lượng</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="hover:bg-destructive/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 h-[calc(100%-5rem)] overflow-hidden">
              <CapacityHistory 
                onLoadFromHistory={handleLoadFromHistory}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
