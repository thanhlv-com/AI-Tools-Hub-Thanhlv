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
import { TranslationHistory as TranslationHistoryType } from "@/types/translation";
import { LANGUAGES, TRANSLATION_STYLES } from "@/data/translation";
import { 
  History, 
  Languages as LanguagesIcon, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Search,
  Filter,
  Clock,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe
} from "lucide-react";

interface TranslationHistoryProps {
  onLoadFromHistory?: (historyItem: TranslationHistoryType) => void;
  className?: string;
}

export function TranslationHistory({ onLoadFromHistory, className = "" }: TranslationHistoryProps) {
  const { t } = useTranslation();
  const { translationHistory, removeFromTranslationHistory, clearTranslationHistory } = useConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Filter and sort history
  const filteredHistory = translationHistory
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           Object.values(item.translations).some(t => 
                             t.text.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      const matchesStyle = filterStyle === "all" || item.style === filterStyle;
      return matchesSearch && matchesStyle;
    })
    .sort((a, b) => sortBy === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || { code, name: code, nativeName: code, flag: "🌐" };
  };

  const getStyleInfo = (id: string) => {
    return TRANSLATION_STYLES.find(style => style.id === id) || { id, name: id, icon: "🔤", description: "" };
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const handleLoadFromHistory = (item: TranslationHistoryType) => {
    if (onLoadFromHistory) {
      onLoadFromHistory(item);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(translationHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `translation-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyTranslation = (text: string, language: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">{t('translation.history')}</h2>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {t('translationHistory.itemCount', { count: translationHistory.length })}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {t('translationHistory.description')}
        </p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('translationHistory.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStyle} onValueChange={setFilterStyle}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('translationHistory.filterAll')}</SelectItem>
                {TRANSLATION_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    <div className="flex items-center space-x-2">
                      <span>{style.icon}</span>
                      <span>{style.name}</span>
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
                  <SelectItem value="newest">{t('translationHistory.sortNewest')}</SelectItem>
                  <SelectItem value="oldest">{t('translationHistory.sortOldest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                disabled={translationHistory.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                {t('translationHistory.export')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearTranslationHistory}
                disabled={translationHistory.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t('translationHistory.clearAll')}
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
              {translationHistory.length === 0 ? (
                <div>
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('translationHistory.noHistory.title')}</p>
                  <p className="text-sm">{t('translationHistory.noHistory.description')}</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('translationHistory.noResults.title')}</p>
                  <p className="text-sm">{t('translationHistory.noResults.description')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const sourceInfo = getLanguageInfo(item.sourceLanguage);
                const styleInfo = getStyleInfo(item.style);
                const successCount = item.metadata?.successfulTranslations || 0;
                const failCount = item.metadata?.failedTranslations || 0;
                
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
                              <span>{styleInfo.icon}</span>
                              <span>{styleInfo.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>{sourceInfo.flag} → {t('translationHistory.item.languageCount', { count: item.targetLanguages.length })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span>{successCount}</span>
                              {failCount > 0 && (
                                <>
                                  <XCircle className="w-3 h-3 text-red-500 ml-1" />
                                  <span>{failCount}</span>
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
                            {t('translationHistory.item.reload')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromTranslationHistory(item.id)}
                            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-xs">
                        {/* Source Text */}
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="font-medium">{t('translationHistory.item.sourceText', { flag: sourceInfo.flag, name: sourceInfo.name })}:</span>
                          </div>
                          <p className="text-muted-foreground font-mono bg-muted/30 p-2 rounded text-[10px]">
                            {truncateText(item.sourceText)}
                          </p>
                        </div>
                        
                        {/* Translations */}
                        <div>
                          <div className="flex items-center space-x-1 mb-2">
                            <LanguagesIcon className="w-3 h-3 text-green-500" />
                            <span className="font-medium">{t('translationHistory.item.translations', { count: item.targetLanguages.length })}:</span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {item.targetLanguages.map((langCode) => {
                              const langInfo = getLanguageInfo(langCode);
                              const translation = item.translations[langCode];
                              
                              return (
                                <div key={langCode} className="flex items-start space-x-2 p-2 bg-muted/20 rounded">
                                  <div className="flex items-center space-x-1 min-w-0 flex-1">
                                    <span>{langInfo.flag}</span>
                                    <span className="font-medium text-[10px] truncate">{langInfo.name}:</span>
                                    {translation.error ? (
                                      <span className="text-red-500 text-[10px] truncate">{translation.error}</span>
                                    ) : (
                                      <span className="text-[10px] truncate">{truncateText(translation.text, 60)}</span>
                                    )}
                                  </div>
                                  {!translation.error && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyTranslation(translation.text, langInfo.name)}
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {item.metadata && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            <Badge variant="secondary" className="text-[10px]">
                              {t('translationHistory.item.sourceLength', { length: item.metadata.sourceLength })}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {t('translationHistory.item.languageCount', { count: item.metadata.totalTranslations })}
                            </Badge>
                            {item.metadata.successfulTranslations > 0 && (
                              <Badge variant="secondary" className="text-[10px] text-green-600">
                                ✓ {item.metadata.successfulTranslations}
                              </Badge>
                            )}
                            {item.metadata.failedTranslations > 0 && (
                              <Badge variant="secondary" className="text-[10px] text-red-600">
                                ✗ {item.metadata.failedTranslations}
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