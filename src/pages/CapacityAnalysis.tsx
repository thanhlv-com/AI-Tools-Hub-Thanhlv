import { useState } from "react";
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
import { CapacityResult, DDLCapacityRequest, FieldCapacityDetail } from "@/types/capacity";
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
  EyeOff
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
  const [ddl, setDdl] = useState("");
  const [databaseType, setDatabaseType] = useState("mysql");
  const [recordCount, setRecordCount] = useState<number>(1000000);
  const [result, setResult] = useState<CapacityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
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
  const { config, getPageModel } = useConfig();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!ddl.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập DDL schema.",
        variant: "destructive"
      });
      return;
    }

    if (!recordCount || recordCount <= 0) {
      toast({
        title: "Số lượng bản ghi không hợp lệ",
        description: "Vui lòng nhập số lượng bản ghi hợp lệ.",
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: "Chưa cấu hình API Key",
        description: "Vui lòng vào Settings để nhập ChatGPT API Key.",
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
        setCurrentStep("Đang phân tích với một lời gọi API...");
        setProgress(50);
        analysisResult = await chatGPT.analyzeCapacity(request);
        setProgress(100);
      }
      
      // Validate result before setting it
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error("Kết quả phân tích không hợp lệ từ AI");
      }
      
      setResult(analysisResult);
      
      toast({
        title: "Phân tích hoàn tất",
        description: useMultiCall 
          ? "Đã hoàn thành phân tích chi tiết với nhiều lời gọi AI." 
          : "Đã tính toán xong dung lượng cơ sở dữ liệu.",
      });
      
    } catch (err) {
      console.error('Capacity analysis error:', err);
      
      let errorMessage = "Lỗi không xác định";
      let canRetry = false;
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide more user-friendly error messages and retry suggestions
        if (errorMessage.includes('JSON') || errorMessage.includes('định dạng')) {
          errorMessage = "AI trả về kết quả không đúng định dạng. Hệ thống đã tự động retry mỗi 5 giây nhưng vẫn thất bại.";
          canRetry = true;
        } else if (errorMessage.includes('API Error') || errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = "Lỗi xác thực API. Vui lòng kiểm tra API Key trong Settings.";
        } else if (errorMessage.includes('429')) {
          errorMessage = "Đã vượt quá giới hạn API. Hệ thống sẽ tự động retry mỗi 5 giây cho đến khi thành công.";
          canRetry = true;
        } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
          errorMessage = "Kết nối bị timeout. Hệ thống tự động retry mỗi 5 giây cho đến khi thành công.";
          canRetry = true;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = "Lỗi kết nối mạng. Hệ thống sẽ tự động retry mỗi 5 giây cho đến khi thành công.";
          canRetry = true;
        } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
          errorMessage = "Server đang gặp sự cố. Hệ thống tự động retry mỗi 5 giây cho đến khi thành công.";
          canRetry = true;
        }
      }
      
      setError(errorMessage);
      setResult(null); // Clear any previous results
      
      // Show different toast messages based on error type
      toast({
        title: canRetry ? "Lỗi tạm thời" : "Lỗi phân tích",
        description: errorMessage + (canRetry ? " Bạn có thể thử lại." : ""),
        variant: "destructive",
        duration: canRetry ? 7000 : 5000, // Show longer for retryable errors
      });
      
      // Suggest switching methods if multi-call failed
      if (useMultiCall && canRetry) {
        setTimeout(() => {
          toast({
            title: "Gợi ý",
            description: "Nếu vẫn gặp lỗi, hãy thử chuyển sang 'Một lời gọi AI' để tăng tỷ lệ thành công.",
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

  const handleCopy = (text: string, format: string = "JSON") => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Đã sao chép",
        description: `Nội dung ${format} đã được sao chép vào clipboard.`,
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
      let report = "# Báo Cáo Chi Tiết Phân Tích Field\n\n";
      
      // Overall summary
      const totalDataSize = allFields.reduce((sum, field) => sum + field.averageSize, 0);
      const totalOverhead = allFields.reduce((sum, field) => sum + field.overhead, 0);
      const efficiency = totalDataSize > 0 ? ((totalDataSize / (totalDataSize + totalOverhead)) * 100) : 0;
      
      report += `## Tổng Quan\n`;
      report += `- **Tổng số fields:** ${allFields.length}\n`;
      report += `- **Tổng dung lượng data:** ${formatBytes(totalDataSize)}\n`;
      report += `- **Tổng overhead:** ${formatBytes(totalOverhead)}\n`;
      report += `- **Hiệu quả lưu trữ:** ${efficiency.toFixed(1)}%\n\n`;
      
      // Per-table analysis
      Object.entries(tableData).forEach(([tableName, fields]) => {
        report += `## Bảng: ${tableName}\n\n`;
        report += `| Field | Data Type | Kích thước TB | Kích thước Max | Overhead | % Overhead | Nullable | Ghi chú |\n`;
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
                  Phân Tích Dung Lượng DDL
                </h1>
                <p className="text-muted-foreground">
                  AI tự động tính toán kích thước trung bình và tối đa của bản ghi, ước tính tổng dung lượng cơ sở dữ liệu
                </p>
              </div>
              <ModelSelector pageId={PAGE_ID} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Thông tin DDL Schema
                    </CardTitle>
                    <CardDescription>
                      AI sẽ tự động phân tích và tính toán kích thước trung bình và tối đa của bản ghi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="database-type">Loại cơ sở dữ liệu</Label>
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
                        placeholder="Nhập DDL schema (CREATE TABLE statements)..."
                        value={ddl}
                        onChange={(e) => setDdl(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="record-count">Số lượng bản ghi dự kiến</Label>
                      
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
                                 recordCount.toString()} bản ghi
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div>Gợi ý: 1K = 1,000 | 1M = 1,000,000</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Validation Warning */}
                      {recordCount > 0 && recordCount < 100 && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ Số lượng bản ghi quá nhỏ có thể cho kết quả không chính xác
                        </div>
                      )}
                      
                      {recordCount > 1000000000 && (
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          📊 Số lượng bản ghi rất lớn - thời gian phân tích có thể lâu hơn
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Phương pháp phân tích</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUseMultiCall(!useMultiCall)}
                          className="text-xs"
                        >
                          {useMultiCall ? (
                            <>
                              <Layers className="w-3 h-3 mr-1" />
                              Nhiều lời gọi AI
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              Một lời gọi AI
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          {useMultiCall 
                            ? "Phân tích chi tiết với nhiều lời gọi AI riêng biệt (chính xác hơn, mất nhiều thời gian hơn)"
                            : "Phân tích nhanh với một lời gọi AI duy nhất (nhanh hơn, ít chi tiết hơn)"
                          }
                        </div>
                        {useMultiCall && (
                          <div className="text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                            🔄 Chế độ nhiều lời gọi sẽ tự động retry mỗi 5 giây cho đến khi thành công. 
                            Hệ thống sẽ không dừng lại cho đến khi hoàn thành phân tích.
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
                            {isRetrying ? `Đang thử lại (lần ${retryCount})` : 'Tiến trình phân tích'}
                          </Label>
                          {isRetrying && (
                            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                              Retry
                            </div>
                          )}
                        </div>
                        <Progress value={progress} className={`h-2 ${isRetrying ? 'animate-pulse' : ''}`} />
                        <div className="text-sm text-blue-700">
                          {currentStep || "Đang chuẩn bị..."}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-blue-600">
                            {progress}% hoàn thành
                          </div>
                          {retryCount > 0 && (
                            <div className="text-xs text-yellow-700">
                              Đã thử lại {retryCount} lần
                            </div>
                          )}
                        </div>
                        {isRetrying && (
                          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                            🔄 Hệ thống đang tự động retry (mỗi 5 giây) cho đến khi thành công. Vui lòng kiên nhẫn...
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
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {useMultiCall ? "Phân tích chi tiết (nhiều lời gọi AI)" : "Phân tích nhanh (một lời gọi AI)"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-destructive">Lỗi phân tích</h4>
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
                        Báo cáo phân tích dung lượng
                      </CardTitle>
                      <CardDescription>
                        Kích thước bản ghi và ước tính tổng dung lượng
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Record Size Analysis */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Phân tích kích thước bản ghi
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm text-blue-700">Kích thước trung bình</Label>
                            <div className="text-xl font-bold text-blue-900">
                              {formatBytes(result.averageRecordSize)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm text-blue-700">Kích thước tối đa</Label>
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
                          Ước tính tổng dung lượng ({recordCount.toLocaleString()} bản ghi)
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <Label className="text-sm font-medium text-green-700">Trường hợp trung bình</Label>
                            <div className="text-2xl font-bold text-green-900 mt-1">
                              {formatBytes(result.totalSizeAverage.bytes)}
                            </div>
                            <div className="text-sm text-green-700">
                              {result.totalSizeAverage.mb.toFixed(2)} MB • {result.totalSizeAverage.gb.toFixed(3)} GB
                            </div>
                          </div>

                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <Label className="text-sm font-medium text-orange-700">Trường hợp tối đa</Label>
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
                          <Label className="text-sm font-medium text-purple-700">Dung lượng index ước tính</Label>
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
                          <Label className="text-sm font-medium">Tổng dung lượng (bao gồm index)</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">Trường hợp trung bình</div>
                              <div className="text-lg font-bold">
                                {formatBytes(result.totalWithIndexAverage.bytes)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.totalWithIndexAverage.mb.toFixed(2)} MB • {result.totalWithIndexAverage.gb.toFixed(3)} GB
                              </div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">Trường hợp tối đa</div>
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
                            <Label className="text-sm font-medium">Chi tiết theo bảng</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFieldDetails(!showFieldDetails)}
                              >
                                {showFieldDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {showFieldDetails ? "Ẩn chi tiết field" : "Hiện chi tiết field"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowOverheadAnalysis(!showOverheadAnalysis)}
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                {showOverheadAnalysis ? "Ẩn overhead" : "Hiện overhead"}
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
                                    <div className="text-xs text-muted-foreground">Kích thước bản ghi TB</div>
                                    <div className="font-semibold">{formatBytes(table.averageRecordSize)}</div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Kích thước bản ghi tối đa</div>
                                    <div className="font-semibold">{formatBytes(table.maximumRecordSize)}</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="p-2 bg-green-50 rounded">
                                    <div className="text-xs text-green-700">Dung lượng TB</div>
                                    <div className="font-semibold text-green-900">
                                      {formatBytes(table.totalSizeAverage.bytes)}
                                    </div>
                                  </div>
                                  <div className="p-2 bg-orange-50 rounded">
                                    <div className="text-xs text-orange-700">Dung lượng tối đa</div>
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
                                      Chi tiết từng field
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
                                    {table.recordCount.toLocaleString()} bản ghi
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
                            Khuyến nghị tối ưu hóa
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
                              Báo Cáo Chi Tiết Phân Tích Field
                            </h4>
                            <Badge variant="outline" className="text-purple-700 border-purple-300">
                              {result.breakdown.reduce((total, table) => total + (table.fieldDetails?.length || 0), 0)} fields
                            </Badge>
                          </div>
                          
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="text-sm text-purple-800">
                              Phân tích chi tiết dung lượng, hiệu quả lưu trữ và khuyến nghị tối ưu hóa cho từng field
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
                                      <div className="text-xs text-blue-700 font-medium">Tổng dung lượng field (TB)</div>
                                      <div className="text-lg font-bold text-blue-900">
                                        {formatBytes(table.fieldDetails.reduce((sum, field) => sum + field.averageSize, 0))}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                      <div className="text-xs text-orange-700 font-medium">Tổng overhead</div>
                                      <div className="text-lg font-bold text-orange-900">
                                        {formatBytes(table.fieldDetails.reduce((sum, field) => sum + field.overhead, 0))}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                      <div className="text-xs text-green-700 font-medium">Hiệu quả lưu trữ</div>
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
                                          <th className="text-right p-2 font-medium">Kích thước TB</th>
                                          <th className="text-right p-2 font-medium">Kích thước Max</th>
                                          <th className="text-right p-2 font-medium">Overhead</th>
                                          <th className="text-right p-2 font-medium">% Overhead</th>
                                          <th className="text-center p-2 font-medium">Nullable</th>
                                          <th className="text-left p-2 font-medium">Đánh giá</th>
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
                                      Khuyến nghị tối ưu hóa fields
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
                                      <h6 className="font-medium text-sm text-gray-800 mb-2">Ghi chú về lưu trữ</h6>
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
                        <p className="mb-2">Nhập DDL schema để AI tự động phân tích</p>
                        <p className="text-sm">
                          Hệ thống sẽ tính toán kích thước trung bình và tối đa của bản ghi, 
                          sau đó ước tính tổng dung lượng cơ sở dữ liệu
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
    </div>
  );
}
