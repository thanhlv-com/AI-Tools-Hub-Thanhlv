import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig } from "@/contexts/ConfigContext";
import { DDLAnalysisHistory } from "@/types/history";
import { 
  History, 
  Database, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Filter,
  Clock,
  Code2,
  RefreshCw
} from "lucide-react";

interface AnalysisHistoryProps {
  onLoadFromHistory?: (historyItem: DDLAnalysisHistory) => void;
  className?: string;
}

const databases = [
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "sqlserver", name: "SQL Server", icon: "🏢" },
  { id: "oracle", name: "Oracle", icon: "🔴" },
  { id: "sqlite", name: "SQLite", icon: "💎" }
];

export function AnalysisHistory({ onLoadFromHistory, className = "" }: AnalysisHistoryProps) {
  const { history, removeFromHistory, clearHistory } = useConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDatabase, setFilterDatabase] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.currentDDL.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.newDDL.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDatabase = filterDatabase === "all" || item.databaseType === filterDatabase;
      return matchesSearch && matchesDatabase;
    })
    .sort((a, b) => sortBy === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  const getDatabaseInfo = (dbType: string) => {
    return databases.find(db => db.id === dbType) || { id: dbType, name: dbType, icon: "📊" };
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const handleLoadFromHistory = (item: DDLAnalysisHistory) => {
    if (onLoadFromHistory) {
      onLoadFromHistory(item);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ddl-analysis-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="w-5 h-5 text-primary" />
          <span>Lịch sử phân tích</span>
          <Badge variant="secondary" className="ml-auto">
            {history.length} mục
          </Badge>
        </CardTitle>
        <CardDescription>
          Xem lại và tái sử dụng các phân tích DDL trước đây
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="space-y-4 mb-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm trong lịch sử..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterDatabase} onValueChange={setFilterDatabase}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: "newest" | "oldest") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={history.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearHistory}
                disabled={history.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa tất cả
              </Button>
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* History List */}
        <ScrollArea className="h-[400px]">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {history.length === 0 ? (
                <div>
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lịch sử phân tích nào</p>
                  <p className="text-sm">Thực hiện phân tích DDL để bắt đầu xây dựng lịch sử</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy kết quả phù hợp</p>
                  <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const dbInfo = getDatabaseInfo(item.databaseType);
                return (
                  <Card key={item.id} className="border border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(item.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>{dbInfo.icon}</span>
                              <span>{dbInfo.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Code2 className="w-3 h-3" />
                              <span>{item.model}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadFromHistory(item)}
                            className="h-8 px-2"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Tải lại
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromHistory(item.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="w-3 h-3 text-orange-500" />
                            <span className="font-medium">DDL hiện tại:</span>
                          </div>
                          <p className="text-muted-foreground font-mono bg-muted/30 p-2 rounded text-[10px]">
                            {truncateText(item.currentDDL)}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="w-3 h-3 text-green-500" />
                            <span className="font-medium">DDL mới:</span>
                          </div>
                          <p className="text-muted-foreground font-mono bg-muted/30 p-2 rounded text-[10px]">
                            {truncateText(item.newDDL)}
                          </p>
                        </div>

                        {item.metadata && (
                          <div className="flex space-x-4 pt-2 border-t border-border/50">
                            <Badge variant="secondary" className="text-[10px]">
                              Script: {item.metadata.scriptLength} ký tự
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}