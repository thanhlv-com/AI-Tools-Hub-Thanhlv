import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { CapacityResult, DDLCapacityRequest } from "@/types/capacity";
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
  Activity
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

    setIsAnalyzing(true);
    setError("");
    setResult(null);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const request: DDLCapacityRequest = {
        ddl,
        databaseType,
        recordCount,
        customModel: pageModel || undefined
      };
      
      const analysisResult = await chatGPT.analyzeCapacity(request);
      setResult(analysisResult);
      
      toast({
        title: "Phân tích hoàn tất",
        description: "Đã tính toán xong dung lượng cơ sở dữ liệu.",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      toast({
        title: "Lỗi phân tích",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Đã sao chép",
        description: "Nội dung đã được sao chép vào clipboard.",
      });
    });
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

                    <div>
                      <Label htmlFor="record-count">Số lượng bản ghi dự kiến</Label>
                      <Input
                        id="record-count"
                        type="number"
                        placeholder="1000000"
                        value={recordCount}
                        onChange={(e) => setRecordCount(parseInt(e.target.value) || 0)}
                      />
                    </div>

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
                          Tự động phân tích dung lượng
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
                          <Label className="text-sm font-medium">Chi tiết theo bảng</Label>
                          <div className="space-y-3">
                            {result.breakdown.map((table, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-3">{table.tableName}</h4>
                                
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

                                <div className="grid grid-cols-2 gap-4">
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

                                <div className="text-xs text-muted-foreground mt-2">
                                  {table.recordCount.toLocaleString()} bản ghi
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

                      <Separator />

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(result, null, 2))}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Sao chép kết quả
                        </Button>
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