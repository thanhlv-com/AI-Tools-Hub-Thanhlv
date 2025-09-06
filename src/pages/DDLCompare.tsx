import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { AnalysisHistory } from "@/components/AnalysisHistory";
import { DDLAnalysisHistory } from "@/types/history";
import { 
  GitCompare, 
  Database, 
  Play, 
  Copy, 
  FileText,
  ArrowRight,
  Zap,
  Code2,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle2,
  History,
  X
} from "lucide-react";

const databases = [
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "sqlserver", name: "SQL Server", icon: "🏢" },
  { id: "oracle", name: "Oracle", icon: "🔴" },
  { id: "sqlite", name: "SQLite", icon: "💎" }
];

const databaseOptions: SearchableSelectOption[] = databases.map(db => ({
  value: db.id,
  label: (
    <div className="flex items-center space-x-2">
      <span>{db.icon}</span>
      <span>{db.name}</span>
    </div>
  ),
  searchText: `${db.name} ${db.id}`
}));

const PAGE_ID = "ddl-compare";

export default function DDLCompare() {
  const [currentDDL, setCurrentDDL] = useState("");
  const [newDDL, setNewDDL] = useState("");
  const [databaseType, setDatabaseType] = useState("mysql");
  const [migrationScript, setMigrationScript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const { config, getPageModel, addToHistory } = useConfig();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!currentDDL.trim() || !newDDL.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập cả DDL hiện tại và DDL mới nhất.",
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
    setMigrationScript("");
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      const modelToUse = pageModel || config.model;
      
      const script = await chatGPT.analyzeDDL(
        currentDDL, 
        newDDL, 
        databaseType, 
        pageModel || undefined
      );
      
      setMigrationScript(script);
      
      // Save to history
      const historyTitle = `${databaseType.toUpperCase()} Migration - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      addToHistory({
        title: historyTitle,
        currentDDL,
        newDDL,
        databaseType,
        model: modelToUse,
        migrationScript: script
      });
      
      toast({
        title: "Phân tích hoàn thành",
        description: `Migration script đã được tạo bằng ${modelToUse}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      
      toast({
        title: "Lỗi phân tích DDL",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard.",
    });
  };

  const handleLoadFromHistory = (historyItem: DDLAnalysisHistory) => {
    setCurrentDDL(historyItem.currentDDL);
    setNewDDL(historyItem.newDDL);
    setDatabaseType(historyItem.databaseType);
    setMigrationScript(historyItem.migrationScript);
    setError("");
    setShowHistory(false);
    
    toast({
      title: "Đã tải từ lịch sử",
      description: `Đã tải dữ liệu từ: ${historyItem.title}`,
    });
  };

  return (
    <div className="relative">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <GitCompare className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>DDL Compare & Migration</span>
            </h1>
            <p className="text-muted-foreground">
              Phân tích sự khác biệt giữa cấu trúc database hiện tại và mới nhất, tạo ra script migration tự động
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>Lịch sử</span>
          </Button>
        </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Type Selection */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-primary" />
              <span>Loại Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SearchableSelect
              value={databaseType}
              onValueChange={setDatabaseType}
              options={databaseOptions}
              placeholder="Chọn loại database..."
              searchPlaceholder="Tìm kiếm database..."
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span>Model Configuration</span>
            </CardTitle>
            <CardDescription>
              Chọn model riêng cho trang này hoặc dùng mặc định
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelSelector 
              pageId={PAGE_ID}
              label="Model cho DDL Analysis"
              showDefault={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* DDL Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current DDL */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span>DDL Hiện tại</span>
            </CardTitle>
            <CardDescription>
              Nhập cấu trúc database hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentDDL}
              onChange={(e) => setCurrentDDL(e.target.value)}
              placeholder="CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100)
);"
              className="min-h-[300px] font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
            />
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {currentDDL.length} characters
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentDDL)}
                disabled={!currentDDL}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New DDL */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span>DDL Mới nhất</span>
            </CardTitle>
            <CardDescription>
              Nhập cấu trúc database mục tiêu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={newDDL}
              onChange={(e) => setNewDDL(e.target.value)}
              placeholder="CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);"
              className="min-h-[300px] font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
            />
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {newDDL.length} characters
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(newDDL)}
                disabled={!newDDL}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="flex flex-col items-center space-y-4">
        {!config.apiKey && (
          <Card className="w-full max-w-2xl border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Chưa cấu hình API Key</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Vui lòng vào trang Settings để nhập ChatGPT API Key trước khi sử dụng.
              </p>
            </CardContent>
          </Card>
        )}
        
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !currentDDL.trim() || !newDDL.trim() || !config.apiKey}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary-glow shadow-elegant hover:shadow-glow transition-all"
        >
          {isAnalyzing ? (
            <>
              <Zap className="w-5 h-5 mr-2 animate-spin" />
              Đang phân tích với ChatGPT...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Phân tích và tạo Migration
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="shadow-card border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Lỗi phân tích</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setError("")}
            >
              Đóng
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Migration Script Result */}
      {migrationScript && (
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span>Migration Script</span>
              <Badge className="bg-gradient-to-r from-primary to-primary-glow">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Generated by ChatGPT
              </Badge>
            </CardTitle>
            <CardDescription>
              Script SQL để migration từ cấu trúc hiện tại sang cấu trúc mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                value={migrationScript}
                readOnly
                className="min-h-[300px] font-mono text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(migrationScript)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Script
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Generated for {databases.find(db => db.id === databaseType)?.name}</span>
              <div className="flex items-center space-x-4">
                <span>Model: {getPageModel(PAGE_ID) || config.model}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <History className="w-6 h-6" />
                <span>Lịch sử phân tích DDL</span>
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
              <AnalysisHistory 
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