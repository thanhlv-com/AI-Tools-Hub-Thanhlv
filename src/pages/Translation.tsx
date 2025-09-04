import { useState } from "react";
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
import { LANGUAGES, TRANSLATION_STYLES } from "@/data/translation";
import { TranslationRequest } from "@/types/translation";
import { 
  Languages, 
  ArrowRightLeft, 
  Play, 
  Copy, 
  FileText,
  Zap,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Wand2,
  Globe
} from "lucide-react";

const PAGE_ID = "translation";

export default function Translation() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("vi");
  const [translationStyle, setTranslationStyle] = useState("natural");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>("");
  const { config, getPageModel } = useConfig();
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Thiếu văn bản",
        description: "Vui lòng nhập văn bản cần dịch.",
        variant: "destructive"
      });
      return;
    }

    if (sourceLanguage === targetLanguage && sourceLanguage !== "auto") {
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
    setTranslatedText("");
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      const modelToUse = pageModel || config.model;

      const request: TranslationRequest = {
        text: sourceText,
        sourceLanguage,
        targetLanguage,
        style: translationStyle,
        model: pageModel || undefined
      };
      
      const result = await chatGPT.translateText(request);
      setTranslatedText(result);
      
      toast({
        title: "Dịch thuật hoàn thành",
        description: `Văn bản đã được dịch bằng ${modelToUse}`,
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
    if (sourceLanguage === "auto") {
      toast({
        title: "Không thể đổi chỗ",
        description: "Không thể đổi chỗ khi ngôn ngữ nguồn là 'Tự động phát hiện'.",
        variant: "destructive"
      });
      return;
    }
    
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText("");
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

  const currentStyle = getStyleInfo(translationStyle);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Selection */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>Ngôn ngữ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapLanguages}
                disabled={sourceLanguage === "auto"}
                className="w-10 h-10 p-0"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Ngôn ngữ đích</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
            </div>
          </CardContent>
        </Card>

        {/* Translation Style */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <span>Phong cách dịch</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
              
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{currentStyle.icon}</span>
                  <span className="font-medium text-sm">{currentStyle.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentStyle.description}
                </p>
              </div>
            </div>
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
              label="Model cho Translation"
              showDefault={true}
            />
          </CardContent>
        </Card>
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
              className="min-h-[300px] text-sm bg-editor-bg text-foreground border-border"
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

        {/* Translated Text */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span>Bản dịch</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({getLanguageInfo(targetLanguage).flag} {getLanguageInfo(targetLanguage).name})
              </span>
            </CardTitle>
            <CardDescription>
              Kết quả dịch thuật
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={translatedText}
              readOnly
              placeholder="Bản dịch sẽ xuất hiện ở đây..."
              className="min-h-[300px] text-sm bg-code-bg text-foreground border-border"
            />
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {translatedText.length} ký tự
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
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
              Đang dịch với ChatGPT...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Dịch văn bản
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

      {/* Translation Info */}
      {translatedText && (
        <Card className="shadow-card bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Thông tin dịch thuật</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Phong cách:</span>
                <div className="flex items-center space-x-1 mt-1">
                  <span>{currentStyle.icon}</span>
                  <span className="font-medium">{currentStyle.name}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>
                <p className="font-medium mt-1">{getPageModel(PAGE_ID) || config.model}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Độ dài nguồn:</span>
                <p className="font-medium mt-1">{sourceText.length} ký tự</p>
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
  );
}