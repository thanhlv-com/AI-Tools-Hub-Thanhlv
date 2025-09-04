import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ModelSelector } from "@/components/ModelSelector";
import { 
  GitCompare, 
  Database, 
  Play, 
  Copy, 
  FileText,
  ArrowRight,
  Zap,
  Code2,
  Settings as SettingsIcon
} from "lucide-react";

const databases = [
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "sqlserver", name: "SQL Server", icon: "🏢" },
  { id: "oracle", name: "Oracle", icon: "🔴" },
  { id: "sqlite", name: "SQLite", icon: "💎" }
];

export default function DDLCompare() {
  const [currentDDL, setCurrentDDL] = useState("");
  const [newDDL, setNewDDL] = useState("");
  const [databaseType, setDatabaseType] = useState("mysql");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [migrationScript, setMigrationScript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

    setIsAnalyzing(true);
    
    // Get the model to use (selected model or default from config)
    const modelToUse = selectedModel || "default-from-config";
    
    // Simulate ChatGPT API call
    setTimeout(() => {
      const mockScript = `-- Migration script generated for ${databases.find(db => db.id === databaseType)?.name}
-- Generated at: ${new Date().toLocaleString()}
-- Using model: ${modelToUse}

-- Add new columns
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Modify existing columns
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;

-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Add foreign key constraints
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;`;

      setMigrationScript(mockScript);
      setIsAnalyzing(false);
      
      toast({
        title: "Phân tích hoàn thành",
        description: "Migration script đã được tạo thành công.",
      });
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard.",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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
            <Select value={databaseType} onValueChange={setDatabaseType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    <div className="flex items-center space-x-2">
                      <span>{db.icon}</span>
                      <span>{db.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              value={selectedModel}
              onChange={setSelectedModel}
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
              className="min-h-[300px] font-mono text-sm bg-editor-bg text-code-text border-border"
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
              className="min-h-[300px] font-mono text-sm bg-editor-bg text-code-text border-border"
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
      <div className="flex justify-center">
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !currentDDL.trim() || !newDDL.trim()}
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

      {/* Migration Script Result */}
      {migrationScript && (
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span>Migration Script</span>
              <Badge className="bg-gradient-to-r from-primary to-primary-glow">
                Generated
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
                className="min-h-[300px] font-mono text-sm bg-code-bg text-code-text border-border"
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
              <span>{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}