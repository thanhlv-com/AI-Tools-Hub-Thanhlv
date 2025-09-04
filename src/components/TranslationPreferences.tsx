import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ModelSelector } from "@/components/ModelSelector";
import { TranslationPreference } from "@/types/translation";
import { LANGUAGES, TRANSLATION_STYLES } from "@/data/translation";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Star,
  Globe,
  Wand2,
  Copy,
  Check,
  Minus,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TranslationPreferencesProps {
  onApplyPreference?: (preference: TranslationPreference) => void;
  currentSettings?: {
    sourceLanguage: string;
    targetLanguages: string[];
    style: string;
    model?: string;
  };
  className?: string;
}

const PAGE_ID = "translation";

export function TranslationPreferences({ onApplyPreference, currentSettings, className = "" }: TranslationPreferencesProps) {
  const { translationPreferences, addTranslationPreference, updateTranslationPreference, removeTranslationPreference, getPageModel } = useConfig();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newPreference, setNewPreference] = useState({
    name: "",
    description: "",
    sourceLanguage: "auto",
    targetLanguages: ["vi"],
    style: "natural",
    model: ""
  });

  const preferences = Object.values(translationPreferences).sort((a, b) => b.timestamp - a.timestamp);

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || { code, name: code, nativeName: code, flag: "🌐" };
  };

  const getStyleInfo = (id: string) => {
    return TRANSLATION_STYLES.find(style => style.id === id) || { id, name: id, icon: "🔤", description: "" };
  };

  const handleCreatePreference = () => {
    if (!newPreference.name.trim()) {
      toast({
        title: "Tên không được để trống",
        description: "Vui lòng nhập tên cho cấu hình.",
        variant: "destructive"
      });
      return;
    }

    try {
      addTranslationPreference({
        name: newPreference.name.trim(),
        description: newPreference.description.trim(),
        sourceLanguage: newPreference.sourceLanguage,
        targetLanguages: newPreference.targetLanguages,
        style: newPreference.style,
        model: newPreference.model || undefined
      });

      setNewPreference({
        name: "",
        description: "",
        sourceLanguage: "auto",
        targetLanguages: ["vi"],
        style: "natural",
        model: ""
      });
      setIsCreating(false);

      toast({
        title: "Đã lưu cấu hình",
        description: `Cấu hình "${newPreference.name}" đã được lưu thành công.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi lưu cấu hình",
        description: "Không thể lưu cấu hình. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const handleSaveFromCurrent = () => {
    if (!currentSettings) return;

    const timestamp = new Date().toLocaleString("vi-VN");
    setNewPreference({
      name: `Cấu hình ${timestamp}`,
      description: "Tự động lưu từ cài đặt hiện tại",
      sourceLanguage: currentSettings.sourceLanguage,
      targetLanguages: currentSettings.targetLanguages,
      style: currentSettings.style,
      model: currentSettings.model || ""
    });
    setIsCreating(true);
  };

  const handleApplyPreference = (preference: TranslationPreference) => {
    if (onApplyPreference) {
      onApplyPreference(preference);
      toast({
        title: "Đã áp dụng cấu hình",
        description: `Cấu hình "${preference.name}" đã được áp dụng.`,
      });
    }
  };

  const handleDeletePreference = (id: string) => {
    const preference = translationPreferences[id];
    removeTranslationPreference(id);
    toast({
      title: "Đã xóa cấu hình",
      description: `Cấu hình "${preference?.name}" đã được xóa.`,
    });
  };

  const addTargetLanguage = (languages: string[]) => {
    const availableLanguages = LANGUAGES.filter(lang => 
      lang.code !== "auto" && 
      lang.code !== newPreference.sourceLanguage && 
      !languages.includes(lang.code)
    );
    
    if (availableLanguages.length > 0) {
      return [...languages, availableLanguages[0].code];
    }
    return languages;
  };

  const removeTargetLanguage = (languages: string[], index: number) => {
    if (languages.length > 1) {
      return languages.filter((_, i) => i !== index);
    }
    return languages;
  };

  const updateTargetLanguage = (languages: string[], index: number, newLanguage: string) => {
    const updated = [...languages];
    updated[index] = newLanguage;
    return updated;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Cấu hình ưa thích</h2>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {preferences.length} cấu hình
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">
          Lưu và quản lý các cấu hình dịch thuật thường dùng của bạn
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreating(true)} 
            className="flex items-center space-x-2"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mới</span>
          </Button>
          {currentSettings && (
            <Button 
              variant="outline" 
              onClick={handleSaveFromCurrent}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu hiện tại</span>
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {/* Create New Preference Form */}
            {isCreating && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Tạo cấu hình mới</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreating(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pref-name">Tên cấu hình *</Label>
                      <Input
                        id="pref-name"
                        value={newPreference.name}
                        onChange={(e) => setNewPreference(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ví dụ: Dịch kỹ thuật EN→VI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pref-desc">Mô tả</Label>
                      <Input
                        id="pref-desc"
                        value={newPreference.description}
                        onChange={(e) => setNewPreference(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả ngắn gọn về cấu hình"
                      />
                    </div>
                  </div>

                  {/* Language Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Ngôn ngữ</span>
                      </h4>
                      
                      {/* Source Language */}
                      <div className="space-y-2">
                        <Label>Ngôn ngữ nguồn</Label>
                        <Select 
                          value={newPreference.sourceLanguage} 
                          onValueChange={(value) => setNewPreference(prev => ({ ...prev, sourceLanguage: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                <div className="flex items-center space-x-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Target Languages */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Ngôn ngữ đích ({newPreference.targetLanguages.length})</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewPreference(prev => ({ 
                              ...prev, 
                              targetLanguages: addTargetLanguage(prev.targetLanguages) 
                            }))}
                            disabled={newPreference.targetLanguages.length >= 10}
                            className="h-7 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {newPreference.targetLanguages.map((langCode, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Select 
                                value={langCode} 
                                onValueChange={(value) => setNewPreference(prev => ({ 
                                  ...prev, 
                                  targetLanguages: updateTargetLanguage(prev.targetLanguages, index, value) 
                                }))}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-40">
                                  {LANGUAGES.filter(lang => lang.code !== "auto").map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                      <div className="flex items-center space-x-2">
                                        <span>{lang.flag}</span>
                                        <span>{lang.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setNewPreference(prev => ({ 
                                  ...prev, 
                                  targetLanguages: removeTargetLanguage(prev.targetLanguages, index) 
                                }))}
                                disabled={newPreference.targetLanguages.length <= 1}
                                className="h-9 w-9 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center space-x-2">
                        <Wand2 className="w-4 h-4" />
                        <span>Cấu hình AI</span>
                      </h4>

                      {/* Translation Style */}
                      <div className="space-y-2">
                        <Label>Phong cách dịch</Label>
                        <Select 
                          value={newPreference.style} 
                          onValueChange={(value) => setNewPreference(prev => ({ ...prev, style: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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

                      {/* Model Selection */}
                      <div className="space-y-2">
                        <Label>Model (tuỳ chọn)</Label>
                        <ModelSelector 
                          pageId={PAGE_ID}
                          label=""
                          showDefault={true}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreatePreference}
                      disabled={!newPreference.name.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Lưu cấu hình
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Preferences */}
            {preferences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Chưa có cấu hình nào</p>
                <p className="text-sm">Tạo cấu hình đầu tiên để bắt đầu sử dụng</p>
              </div>
            ) : (
              preferences.map((preference) => {
                const isExpanded = expandedId === preference.id;
                const sourceInfo = getLanguageInfo(preference.sourceLanguage);
                const styleInfo = getStyleInfo(preference.style);
                
                return (
                  <Card key={preference.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-lg">{preference.name}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(isExpanded ? null : preference.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          {preference.description && (
                            <p className="text-muted-foreground text-sm mb-2">{preference.description}</p>
                          )}
                          
                          <div className="flex items-center flex-wrap gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {sourceInfo.flag} {sourceInfo.name} → {preference.targetLanguages.length} ngôn ngữ
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {styleInfo.icon} {styleInfo.name}
                            </Badge>
                            {preference.model && (
                              <Badge variant="outline" className="text-xs">
                                🤖 {preference.model}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-1 ml-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreference(preference)}
                            className="h-8 px-3"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Áp dụng
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreference(preference.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium mb-2 flex items-center space-x-1">
                                <Globe className="w-4 h-4" />
                                <span>Chi tiết ngôn ngữ</span>
                              </h5>
                              <div className="space-y-2 pl-5">
                                <div>
                                  <span className="text-muted-foreground">Nguồn: </span>
                                  <span>{sourceInfo.flag} {sourceInfo.name}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Đích: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {preference.targetLanguages.map((code) => {
                                      const langInfo = getLanguageInfo(code);
                                      return (
                                        <Badge key={code} variant="secondary" className="text-xs">
                                          {langInfo.flag} {langInfo.name}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium mb-2 flex items-center space-x-1">
                                <Wand2 className="w-4 h-4" />
                                <span>Cấu hình AI</span>
                              </h5>
                              <div className="space-y-2 pl-5">
                                <div>
                                  <span className="text-muted-foreground">Phong cách: </span>
                                  <span>{styleInfo.icon} {styleInfo.name}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Model: </span>
                                  <span>{preference.model || "Mặc định"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Tạo: </span>
                                  <span>{new Date(preference.timestamp).toLocaleString("vi-VN")}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}