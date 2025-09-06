import { useState } from "react";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { TranslationHistory } from "@/components/TranslationHistory";
import { TranslationPreferences } from "@/components/TranslationPreferences";
import { LANGUAGES, TRANSLATION_STYLES, TRANSLATION_PROFICIENCIES, EMOTICON_OPTIONS } from "@/data/translation";
import { MultiTranslationRequest, MultiTranslationResult, TranslationHistory as TranslationHistoryType, TranslationPreference } from "@/types/translation";
import { 
  Languages, 
  ArrowRightLeft, 
  Play, 
  Copy, 
  FileText,
  Zap,
  Settings as SettingsIcon,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Wand2,
  Globe,
  History,
  X,
  Plus,
  Minus,
  XCircle,
  RefreshCw,
  GraduationCap
} from "lucide-react";

const PAGE_ID = "translation";

export default function Translation() {
  // Session-persisted state
  const [sourceText, setSourceText] = useFieldSession(PAGE_ID, "sourceText", "");
  const [sourceLanguage, setSourceLanguage] = useFieldSession(PAGE_ID, "sourceLanguage", "auto");
  const [targetLanguages, setTargetLanguages] = useFieldSession(PAGE_ID, "targetLanguages", ["vi"]);
  const [translationStyle, setTranslationStyle] = useFieldSession(PAGE_ID, "translationStyle", "natural");
  const [translationProficiency, setTranslationProficiency] = useFieldSession(PAGE_ID, "translationProficiency", "intermediate");
  const [emoticonOption, setEmoticonOption] = useFieldSession(PAGE_ID, "emoticonOption", "keep-original");
  const [translationResults, setTranslationResults] = useFieldSession(PAGE_ID, "translationResults", []);
  
  // Temporary state (not persisted)
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [retryingLanguages, setRetryingLanguages] = useState<Set<string>>(new Set());
  const { config, getPageModel, addToTranslationHistory } = useConfig();
  const { toast } = useToast();

  const addTargetLanguage = () => {
    const availableLanguages = LANGUAGES.filter(lang => 
      lang.code !== "auto" && 
      lang.code !== sourceLanguage && 
      !targetLanguages.includes(lang.code)
    );
    
    if (availableLanguages.length > 0) {
      setTargetLanguages([...targetLanguages, availableLanguages[0].code]);
    }
  };

  const removeTargetLanguage = (index: number) => {
    if (targetLanguages.length > 1) {
      setTargetLanguages(targetLanguages.filter((_, i) => i !== index));
    }
  };

  const updateTargetLanguage = (index: number, newLanguage: string) => {
    const updated = [...targetLanguages];
    updated[index] = newLanguage;
    setTargetLanguages(updated);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Thiếu văn bản",
        description: "Vui lòng nhập văn bản cần dịch.",
        variant: "destructive"
      });
      return;
    }

    if (targetLanguages.some(lang => lang === sourceLanguage) && sourceLanguage !== "auto") {
      toast({
        title: "Ngôn ngữ trùng lặp",
        description: "Ngôn ngữ nguồn và đích không được giống nhau.",
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

    setIsTranslating(true);
    setError("");
    setTranslationResults([]);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      const modelToUse = pageModel || config.model;

      const request: MultiTranslationRequest = {
        text: sourceText,
        sourceLanguage,
        targetLanguages,
        style: translationStyle,
        proficiency: translationProficiency,
        emoticonOption,
        model: pageModel || undefined
      };
      
      const results = await chatGPT.translateToMultipleLanguages(request);
      setTranslationResults(results);
      
      // Save to history
      const historyTitle = `${LANGUAGES.find(l => l.code === sourceLanguage)?.name || sourceLanguage} → ${targetLanguages.length} ngôn ngữ - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      const translations: { [key: string]: { text: string; error?: string } } = {};
      
      results.forEach(result => {
        translations[result.language] = {
          text: result.translatedText,
          error: result.error
        };
      });
      
      addToTranslationHistory({
        title: historyTitle,
        sourceText,
        translations,
        sourceLanguage,
        targetLanguages,
        style: translationStyle,
        proficiency: translationProficiency,
        emoticonOption,
        model: modelToUse
      });
      
      const successCount = results.filter(r => !r.error).length;
      
      toast({
        title: "Dịch thuật hoàn thành",
        description: `Đã dịch thành công ${successCount}/${targetLanguages.length} ngôn ngữ bằng ${modelToUse}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      
      toast({
        title: "Lỗi dịch thuật",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === "auto" || targetLanguages.length !== 1) {
      toast({
        title: "Không thể đổi chỗ",
        description: "Chỉ có thể đổi chỗ khi có 1 ngôn ngữ đích và nguồn không phải 'Tự động phát hiện'.",
        variant: "destructive"
      });
      return;
    }
    
    const currentTarget = targetLanguages[0];
    setSourceLanguage(currentTarget);
    setTargetLanguages([sourceLanguage]);
    
    // Try to use the translated text if available
    const existingTranslation = translationResults.find(r => r.language === currentTarget);
    if (existingTranslation && !existingTranslation.error) {
      setSourceText(existingTranslation.translatedText);
    }
    setTranslationResults([]);
  };

  const handleRetryTranslation = async (targetLanguage: string) => {
    if (!sourceText.trim()) {
      toast({
        title: "Thiếu văn bản",
        description: "Vui lòng nhập văn bản cần dịch.",
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

    // Add language to retrying set
    setRetryingLanguages(prev => new Set(prev).add(targetLanguage));

    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);

      const request: MultiTranslationRequest = {
        text: sourceText,
        sourceLanguage,
        targetLanguages: [targetLanguage], // Only retry this specific language
        style: translationStyle,
        proficiency: translationProficiency,
        emoticonOption,
        model: pageModel || undefined
      };

      const results = await chatGPT.translateToMultipleLanguages(request);
      const newResult = results[0]; // Should only be one result

      // Update the translation results array
      setTranslationResults(prev => 
        prev.map(result => 
          result.language === targetLanguage ? newResult : result
        )
      );

      if (newResult.error) {
        toast({
          title: "Dịch lại thất bại",
          description: `Lỗi khi dịch sang ${getLanguageInfo(targetLanguage).name}: ${newResult.error}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Dịch lại thành công",
          description: `Đã dịch lại thành công sang ${getLanguageInfo(targetLanguage).name}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      
      // Update result with error
      setTranslationResults(prev => 
        prev.map(result => 
          result.language === targetLanguage 
            ? { ...result, error: errorMessage, translatedText: "" }
            : result
        )
      );

      toast({
        title: "Lỗi dịch lại",
        description: `Không thể dịch lại sang ${getLanguageInfo(targetLanguage).name}: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      // Remove language from retrying set
      setRetryingLanguages(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetLanguage);
        return newSet;
      });
    }
  };

  const handleLoadFromHistory = (historyItem: TranslationHistoryType) => {
    setSourceText(historyItem.sourceText);
    setSourceLanguage(historyItem.sourceLanguage);
    setTargetLanguages(historyItem.targetLanguages);
    setTranslationStyle(historyItem.style);
    if (historyItem.emoticonOption) {
      setEmoticonOption(historyItem.emoticonOption);
    }
    
    // Recreate translation results from history
    const results: MultiTranslationResult[] = historyItem.targetLanguages.map(langCode => ({
      language: langCode,
      translatedText: historyItem.translations[langCode]?.text || "",
      error: historyItem.translations[langCode]?.error
    }));
    
    setTranslationResults(results);
    setError("");
    setShowHistory(false);
    
    toast({
      title: "Đã tải từ lịch sử",
      description: `Đã tải dữ liệu từ: ${historyItem.title}`,
    });
  };

  const handleApplyPreference = (preference: TranslationPreference) => {
    setSourceLanguage(preference.sourceLanguage);
    setTargetLanguages(preference.targetLanguages);
    setTranslationStyle(preference.style);
    if (preference.emoticonOption) {
      setEmoticonOption(preference.emoticonOption);
    }
    
    // Clear current results since we're changing settings
    setTranslationResults([]);
    setError("");
    setShowPreferences(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard.",
    });
  };

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
  };

  const getStyleInfo = (id: string) => {
    return TRANSLATION_STYLES.find(style => style.id === id) || TRANSLATION_STYLES[0];
  };

  const getProficiencyInfo = (id: string) => {
    return TRANSLATION_PROFICIENCIES.find(prof => prof.id === id) || TRANSLATION_PROFICIENCIES[2]; // default to intermediate
  };

  const getEmoticonInfo = (id: string) => {
    return EMOTICON_OPTIONS.find(emoticon => emoticon.id === id) || EMOTICON_OPTIONS[0]; // default to keep-original
  };

  const currentStyle = getStyleInfo(translationStyle);
  const currentProficiency = getProficiencyInfo(translationProficiency);
  const currentEmoticonOption = getEmoticonInfo(emoticonOption);

  return (
    <div className="relative">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>AI Translation Hub</span>
            </h1>
            <p className="text-muted-foreground">
              Dịch thuật đa ngôn ngữ với AI, hỗ trợ nhiều phong cách dịch thuật chuyên nghiệp
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Cấu hình</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử</span>
            </Button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
          {/* Primary Configuration Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Selection */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Cấu hình Ngôn ngữ</span>
                </CardTitle>
                <CardDescription>
                  Chọn ngôn ngữ nguồn và đích cho dịch thuật
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source Language */}
                <div className="space-y-2">
                  <Label>Ngôn ngữ nguồn</Label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
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

                {/* Swap Button */}
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwapLanguages}
                    disabled={sourceLanguage === "auto" || targetLanguages.length !== 1}
                    className="w-10 h-10 p-0"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Target Languages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Ngôn ngữ đích ({targetLanguages.length})</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTargetLanguage}
                      disabled={targetLanguages.length >= 10}
                      className="h-7 px-2"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {targetLanguages.map((langCode, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Select 
                          value={langCode} 
                          onValueChange={(value) => updateTargetLanguage(index, value)}
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
                          onClick={() => removeTargetLanguage(index)}
                          disabled={targetLanguages.length <= 1}
                          className="h-9 w-9 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                  <span>Model & Cấu hình AI</span>
                </CardTitle>
                <CardDescription>
                  Chọn model AI và cấu hình cho dịch thuật
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelSelector 
                  pageId={PAGE_ID}
                  label="Model cho Translation"
                  showDefault={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Translation Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Translation Style & Proficiency Combined */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <span>Phong cách & Trình độ</span>
                </CardTitle>
                <CardDescription>
                  Chọn phong cách dịch và trình độ đầu ra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Translation Style */}
                <div className="space-y-2">
                  <Label>Phong cách dịch</Label>
                  <Select value={translationStyle} onValueChange={setTranslationStyle}>
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
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {currentStyle.description}
                  </div>
                </div>

                {/* Proficiency Level */}
                <div className="space-y-2">
                  <Label>Trình độ đầu ra</Label>
                  <Select value={translationProficiency} onValueChange={setTranslationProficiency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSLATION_PROFICIENCIES.map((proficiency) => (
                        <SelectItem key={proficiency.id} value={proficiency.id}>
                          <div className="flex items-center space-x-2">
                            <span>{proficiency.icon}</span>
                            <span>{proficiency.name}</span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {proficiency.level}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Emoticon Options */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-xl">😊</span>
                  <span>Xử lý Emoticon</span>
                </CardTitle>
                <CardDescription>
                  Cách xử lý emoticon và emoji trong bản dịch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Select value={emoticonOption} onValueChange={setEmoticonOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {EMOTICON_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div className="flex items-center space-x-2">
                            <span>{option.icon}</span>
                            <span className="truncate">{option.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">{currentEmoticonOption.icon}</span>
                      <span className="font-medium text-xs">{currentEmoticonOption.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {currentEmoticonOption.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings Summary */}
            <Card className="shadow-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Tóm tắt cấu hình</span>
                </CardTitle>
                <CardDescription>
                  Xem nhanh các tùy chọn hiện tại
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nguồn:</span>
                    <div className="flex items-center space-x-1">
                      <span>{getLanguageInfo(sourceLanguage).flag}</span>
                      <span className="font-medium text-xs">{getLanguageInfo(sourceLanguage).name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Đích:</span>
                    <span className="font-medium">{targetLanguages.length} ngôn ngữ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phong cách:</span>
                    <div className="flex items-center space-x-1">
                      <span>{currentStyle.icon}</span>
                      <span className="font-medium text-xs">{currentStyle.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Emoticon:</span>
                    <div className="flex items-center space-x-1">
                      <span>{currentEmoticonOption.icon}</span>
                      <span className="font-medium text-xs">{currentEmoticonOption.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium text-xs">{getPageModel(PAGE_ID) || config.model}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Translation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Văn bản nguồn</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageInfo(sourceLanguage).flag} {getLanguageInfo(sourceLanguage).name})
                </span>
              </CardTitle>
              <CardDescription>
                Nhập văn bản cần dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Nhập văn bản cần dịch tại đây...

Ví dụ:
- Hello, how are you today?
- 这是一个测试文本
- Bonjour, comment allez-vous?
- こんにちは、元気ですか？"
                className="min-h-[300px] text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {sourceText.length} ký tự
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sourceText)}
                  disabled={!sourceText}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translation Results */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Languages className="w-5 h-5 text-green-500" />
                <span>Bản dịch</span>
                <Badge variant="outline" className="text-xs">
                  {targetLanguages.length} ngôn ngữ
                </Badge>
              </CardTitle>
              <CardDescription>
                Kết quả dịch thuật đa ngôn ngữ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {translationResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Languages className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Bản dịch sẽ xuất hiện ở đây...</p>
                    <p className="text-sm">Chọn ngôn ngữ đích và nhấn "Dịch văn bản"</p>
                  </div>
                ) : (
                  translationResults.map((result, index) => {
                    const langInfo = getLanguageInfo(result.language);
                    return (
                      <div key={result.language} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span>{langInfo.flag}</span>
                            <span className="font-medium text-sm">{langInfo.name}</span>
                            {retryingLanguages.has(result.language) ? (
                              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : result.error ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryTranslation(result.language)}
                              disabled={retryingLanguages.has(result.language) || isTranslating}
                              className="h-6 px-2"
                              title={result.error ? "Dịch lại" : "Dịch lại để cải thiện kết quả"}
                            >
                              <RefreshCw className={`w-3 h-3 ${retryingLanguages.has(result.language) ? 'animate-spin' : ''}`} />
                            </Button>
                            {!result.error && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(result.translatedText)}
                                className="h-6 px-2"
                                title="Sao chép"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {retryingLanguages.has(result.language) ? (
                          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded flex items-center space-x-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Đang dịch lại...</span>
                          </div>
                        ) : result.error ? (
                          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                            {result.error}
                          </p>
                        ) : (
                          <p className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            {result.translatedText}
                          </p>
                        )}
                        <div className="mt-1 text-xs text-muted-foreground">
                          {retryingLanguages.has(result.language) ? (
                            "Đang xử lý..."
                          ) : result.error ? (
                            "Lỗi dịch thuật"
                          ) : (
                            `${result.translatedText.length} ký tự`
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Translate Button */}
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
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim() || !config.apiKey}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow shadow-elegant hover:shadow-glow transition-all"
          >
            {isTranslating ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-spin" />
                Đang dịch sang {targetLanguages.length} ngôn ngữ...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Dịch sang {targetLanguages.length} ngôn ngữ
                <ArrowRightLeft className="w-5 h-5 ml-2" />
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
                <span>Lỗi dịch thuật</span>
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

        {/* Translation Summary */}
        {translationResults.length > 0 && (
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Tóm tắt dịch thuật</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phong cách:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentStyle.icon}</span>
                    <span className="font-medium">{currentStyle.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Emoticon:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentEmoticonOption.icon}</span>
                    <span className="font-medium">{currentEmoticonOption.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <p className="font-medium mt-1">{getPageModel(PAGE_ID) || config.model}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nguồn:</span>
                  <p className="font-medium mt-1">{sourceText.length} ký tự</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thành công:</span>
                  <p className="font-medium mt-1 text-green-600">
                    {translationResults.filter(r => !r.error).length}/{translationResults.length}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Thời gian:</span>
                  <p className="font-medium mt-1">{new Date().toLocaleTimeString("vi-VN")}</p>
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
                <span>Lịch sử dịch thuật</span>
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
              <TranslationHistory 
                onLoadFromHistory={handleLoadFromHistory}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full max-h-[90vh] bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Settings className="w-6 h-6" />
                <span>Cấu hình ưa thích</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
                className="hover:bg-destructive/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 h-[calc(100%-5rem)] overflow-hidden">
              <TranslationPreferences 
                onApplyPreference={handleApplyPreference}
                currentSettings={{
                  sourceLanguage,
                  targetLanguages,
                  style: translationStyle,
                  emoticonOption,
                  model: getPageModel(PAGE_ID) || undefined
                }}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}