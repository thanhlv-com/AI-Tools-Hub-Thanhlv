import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig } from "@/contexts/ConfigContext";
import { CapacityAnalysisHistory } from "@/types/capacity";
import { 
  History, 
  Calculator, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Filter,
  Clock,
  Code2,
  RefreshCw,
  Database,
  BarChart3,
  HardDrive,
  Layers
} from "lucide-react";

interface CapacityHistoryProps {
  onLoadFromHistory?: (historyItem: CapacityAnalysisHistory) => void;
  className?: string;
}

const databases = [
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "sqlserver", name: "SQL Server", icon: "🏢" },
  { id: "oracle", name: "Oracle", icon: "🔴" },
  { id: "sqlite", name: "SQLite", icon: "💎" }
];

export function CapacityHistory({ onLoadFromHistory, className = "" }: CapacityHistoryProps) {
  const { t } = useTranslation();
  const { capacityHistory, removeFromCapacityHistory, clearCapacityHistory } = useConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDatabase, setFilterDatabase] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Filter and sort history
  const filteredHistory = capacityHistory
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.ddl.toLowerCase().includes(searchTerm.toLowerCase());
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleLoadFromHistory = (item: CapacityAnalysisHistory) => {
    if (onLoadFromHistory) {
      onLoadFromHistory(item);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(capacityHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `capacity-analysis-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">{t("capacity.history.title")}</h2>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {t("capacity.history.itemCount", { count: capacityHistory.length })}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {t("capacity.history.description")}
        </p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("capacity.history.searchPlaceholder")}
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
                <SelectItem value="all">{t("capacity.history.filterAll")}</SelectItem>
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
                  <SelectItem value="newest">{t("capacity.history.sortNewest")}</SelectItem>
                  <SelectItem value="oldest">{t("capacity.history.sortOldest")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={capacityHistory.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                {t("capacity.history.export")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearCapacityHistory}
                disabled={capacityHistory.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t("capacity.history.clearAll")}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* History List */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {capacityHistory.length === 0 ? (
                <div>
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t("capacity.history.noHistory.title")}</p>
                  <p className="text-sm">{t("capacity.history.noHistory.description")}</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t("capacity.history.noResults.title")}</p>
                  <p className="text-sm">{t("capacity.history.noResults.description")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const dbInfo = getDatabaseInfo(item.databaseType);
                return (
                  <Card key={item.id} className="border border-border hover:border-primary/50 transition-all hover:shadow-md bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-2 line-clamp-2 text-foreground">
                            {item.title}
                          </h4>
                          <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
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
                            <div className="flex items-center space-x-1">
                              <HardDrive className="w-3 h-3" />
                              <span>{t("capacity.history.item.recordCount", { count: item.recordCount })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {item.useMultiCall ? (
                                <>
                                  <Layers className="w-3 h-3" />
                                  <span>{t("capacity.history.item.multiCall")}</span>
                                </>
                              ) : (
                                <>
                                  <Calculator className="w-3 h-3" />
                                  <span>{t("capacity.history.item.singleCall")}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadFromHistory(item)}
                            className="h-9 px-3 text-sm"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t("capacity.history.item.reload")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCapacityHistory(item.id)}
                            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="font-medium">{t("capacity.history.item.ddlSchema")}</span>
                          </div>
                          <p className="text-muted-foreground font-mono bg-muted/30 p-2 rounded text-[10px]">
                            {truncateText(item.ddl)}
                          </p>
                        </div>
                        
                        {/* Capacity Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <div className="text-xs text-green-700 font-medium">{t("capacity.history.item.averageSize")}</div>
                            <div className="font-semibold text-green-900">
                              {formatBytes(item.result.averageRecordSize)}
                            </div>
                          </div>
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                            <div className="text-xs text-orange-700 font-medium">{t("capacity.history.item.maximumSize")}</div>
                            <div className="font-semibold text-orange-900">
                              {formatBytes(item.result.maximumRecordSize)}
                            </div>
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="text-xs text-blue-700 font-medium">{t("capacity.history.item.totalCapacityAverage")}</div>
                            <div className="font-semibold text-blue-900">
                              {formatBytes(item.result.totalSizeAverage.bytes)}
                            </div>
                          </div>
                          <div className="p-2 bg-purple-50 border border-purple-200 rounded">
                            <div className="text-xs text-purple-700 font-medium">{t("capacity.history.item.totalCapacityMaximum")}</div>
                            <div className="font-semibold text-purple-900">
                              {formatBytes(item.result.totalSizeMaximum.bytes)}
                            </div>
                          </div>
                        </div>

                        {item.metadata && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            <Badge variant="secondary" className="text-[10px]">
                              {t("capacity.history.item.ddlLength", { length: item.metadata.ddlLength })}
                            </Badge>
                            {item.metadata.tableCount && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t("capacity.history.item.tableCount", { count: item.metadata.tableCount })}
                              </Badge>
                            )}
                            {item.metadata.fieldCount && (
                              <Badge variant="secondary" className="text-[10px]">
                                {t("capacity.history.item.fieldCount", { count: item.metadata.fieldCount })}
                              </Badge>
                            )}
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
        </div>
      </div>
    </div>
  );
}