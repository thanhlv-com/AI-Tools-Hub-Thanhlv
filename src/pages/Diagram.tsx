import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { DIAGRAM_TYPES, DIAGRAM_STYLES, DIAGRAM_COMPLEXITIES, DIAGRAM_FORMATS, DIAGRAM_OUTPUT_LANGUAGES } from "@/data/diagram";
import { DiagramRequest, DiagramResult, DiagramHistory as DiagramHistoryType, DiagramTypeId } from "@/types/diagram";
import { shouldAddStepIndexing } from "@/lib/diagramStepIndexing";
import { 
  Shapes, 
  Play, 
  Copy, 
  FileText,
  Zap,
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  Palette,
  Target,
  Eye,
  EyeOff,
  Download,
  History,
  Lightbulb,
  RefreshCw,
  Hash
} from "lucide-react";

const PAGE_ID = "diagram";

export default function Diagram() {
  const { t } = useTranslation();
  
  // Create options for SearchableSelect components
  const diagramTypeOptions: SearchableSelectOption[] = DIAGRAM_TYPES.map(type => ({
    value: type.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{type.icon}</span>
        <div className="flex flex-col">
          <span>{type.name}</span>
          <span className="text-xs text-muted-foreground">{type.category}</span>
        </div>
      </div>
    ),
    searchText: `${type.name} ${type.description} ${type.category}`
  }));

  const styleOptions: SearchableSelectOption[] = DIAGRAM_STYLES.map(style => ({
    value: style.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{style.icon}</span>
        <span>{style.name}</span>
      </div>
    ),
    searchText: `${style.name} ${style.description}`
  }));

  const complexityOptions: SearchableSelectOption[] = DIAGRAM_COMPLEXITIES.map(complexity => ({
    value: complexity.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{complexity.icon}</span>
        <span>{complexity.name}</span>
        <Badge variant="outline" className="text-xs ml-1">
          {complexity.level}
        </Badge>
      </div>
    ),
    searchText: `${complexity.name} ${complexity.description} ${complexity.level}`
  }));

  // Session-persisted state
  const [description, setDescription] = useFieldSession(PAGE_ID, "description", "");
  const [diagramType, setDiagramType] = useFieldSession(PAGE_ID, "diagramType", "class-diagram");
  const [outputFormat, setOutputFormat] = useFieldSession(PAGE_ID, "outputFormat", "mermaid");
  const [outputLanguage, setOutputLanguage] = useFieldSession(PAGE_ID, "outputLanguage", "vi");
  const [style, setStyle] = useFieldSession(PAGE_ID, "style", "clean-minimal");
  const [complexity, setComplexity] = useFieldSession(PAGE_ID, "complexity", "moderate");
  const [includeIcons, setIncludeIcons] = useFieldSession(PAGE_ID, "includeIcons", true);
  const [includeColors, setIncludeColors] = useFieldSession(PAGE_ID, "includeColors", true);
  const [includeNotes, setIncludeNotes] = useFieldSession(PAGE_ID, "includeNotes", false);
  const [diagramResult, setDiagramResult] = useFieldSession(PAGE_ID, "diagramResult", null);
  
  // Temporary state (not persisted)
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPreview, setShowPreview] = useState(true);
  const { config, getPageModel, addToDiagramHistory } = useConfig();
  const { toast } = useToast();

  // Filter format options based on selected diagram type (after state is declared)
  const currentDiagramType = DIAGRAM_TYPES.find(type => type.id === diagramType);
  const formatOptions: SearchableSelectOption[] = DIAGRAM_FORMATS
    .filter(format => currentDiagramType?.supportedFormats.includes(format.id))
    .map(format => ({
      value: format.id,
      label: (
        <div className="flex items-center space-x-2">
          <span>{format.icon}</span>
          <div className="flex flex-col">
            <span>{format.name}</span>
            <span className="text-xs text-muted-foreground">{format.fileExtension}</span>
          </div>
        </div>
      ),
      searchText: `${format.name} ${format.description} ${format.syntax}`
    }));

  const languageOptions: SearchableSelectOption[] = DIAGRAM_OUTPUT_LANGUAGES.map(lang => ({
    value: lang.code,
    label: (
      <div className="flex items-center space-x-2">
        <span>{lang.flag}</span>
        <span>{lang.nativeName}</span>
      </div>
    ),
    searchText: `${lang.name} ${lang.nativeName} ${lang.code}`
  }));

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Thiếu mô tả",
        description: "Vui lòng nhập mô tả cho sơ đồ cần tạo.",
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: "Chưa có API Key",
        description: "Vui lòng vào Settings để cấu hình API Key.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setError("");
    setDiagramResult(null);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      const modelToUse = pageModel || config.model;

      const request: DiagramRequest = {
        description,
        diagramType,
        outputFormat,
        outputLanguage,
        style,
        complexity,
        includeIcons,
        includeColors,
        includeNotes,
        model: pageModel || undefined
      };
      
      let result;
      
      if (outputFormat === 'plantuml') {
        // Use the new PlantUML-focused method for PlantUML format
        result = await chatGPT.generatePlantUMLDiagram(
          description,
          diagramType as DiagramTypeId,
          outputLanguage,
          pageModel || undefined
        );
      } else {
        // Use the existing method for other formats
        result = await chatGPT.generateDiagram(request);
      }
      setDiagramResult(result);
      
      if (result.error) {
        setError(result.error);
        toast({
          title: "Lỗi tạo sơ đồ",
          description: result.error,
          variant: "destructive"
        });
      } else {
        // Save to history
        const diagramTypeInfo = DIAGRAM_TYPES.find(t => t.id === diagramType);
        const historyTitle = `${diagramTypeInfo?.name} - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
        
        const diagramCode = outputFormat === 'plantuml' 
          ? (result as { pumlCode: string }).pumlCode 
          : (result as { diagramCode: string }).diagramCode;
        
        addToDiagramHistory({
          title: historyTitle,
          description,
          diagramType,
          outputFormat,
          outputLanguage,
          style,
          complexity,
          includeIcons,
          includeColors,
          includeNotes,
          diagramCode,
          model: modelToUse
        });
        
        toast({
          title: "Thành công",
          description: `Đã tạo sơ đồ thành công với ${modelToUse}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      
      toast({
        title: "Lỗi tạo sơ đồ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép vào clipboard.`,
    });
  };

  const getTypeInfo = (id: string) => {
    return DIAGRAM_TYPES.find(type => type.id === id) || DIAGRAM_TYPES[0];
  };

  const getStyleInfo = (id: string) => {
    return DIAGRAM_STYLES.find(s => s.id === id) || DIAGRAM_STYLES[0];
  };

  const getComplexityInfo = (id: string) => {
    return DIAGRAM_COMPLEXITIES.find(c => c.id === id) || DIAGRAM_COMPLEXITIES[0];
  };

  const getFormatInfo = (id: string) => {
    return DIAGRAM_FORMATS.find(f => f.id === id) || DIAGRAM_FORMATS[0];
  };

  const getLanguageInfo = (code: string) => {
    return DIAGRAM_OUTPUT_LANGUAGES.find(l => l.code === code) || DIAGRAM_OUTPUT_LANGUAGES[0];
  };

  const currentType = getTypeInfo(diagramType);
  const currentFormat = getFormatInfo(outputFormat);
  const currentLanguage = getLanguageInfo(outputLanguage);
  const currentStyle = getStyleInfo(style);
  const currentComplexity = getComplexityInfo(complexity);

  // Reset format when diagram type changes if current format is not supported
  useEffect(() => {
    const currentDiagramType = DIAGRAM_TYPES.find(type => type.id === diagramType);
    if (currentDiagramType && !currentDiagramType.supportedFormats.includes(outputFormat)) {
      const defaultFormat = currentDiagramType.supportedFormats[0];
      setOutputFormat(defaultFormat);
    }
  }, [diagramType, outputFormat, setOutputFormat]);

  return (
    <div className="relative">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Shapes className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Tạo sơ đồ AI</span>
            </h1>
            <p className="text-muted-foreground">
              Tạo sơ đồ đa định dạng với AI: Mermaid, PlantUML, Graphviz, ASCII Art, và nhiều hơn nữa 📊🔣
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPreview ? "Ẩn preview" : "Hiện preview"}</span>
            </Button>
          </div>
        </div>

        {/* Configuration Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span>Cấu hình sơ đồ</span>
            </CardTitle>
            <CardDescription>
              Chọn loại sơ đồ, phong cách và các tùy chọn khác
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Diagram Type & Style */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shapes className="w-4 h-4 text-primary" />
                  <Label className="font-medium">Loại sơ đồ & Phong cách</Label>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Loại sơ đồ</Label>
                  <SearchableSelect
                    value={diagramType}
                    onValueChange={setDiagramType}
                    options={diagramTypeOptions}
                    placeholder="Chọn loại sơ đồ"
                    searchPlaceholder="Tìm kiếm..."
                    className="h-12"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentType.icon}</span>
                      <span className="font-medium">{currentType.name}</span>
                      <Badge variant="outline">{currentType.category}</Badge>
                    </div>
                    <span>{currentType.description}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Định dạng đầu ra</Label>
                  <SearchableSelect
                    value={outputFormat}
                    onValueChange={setOutputFormat}
                    options={formatOptions}
                    placeholder="Chọn định dạng"
                    searchPlaceholder="Tìm kiếm..."
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentFormat.icon}</span>
                      <span className="font-medium">{currentFormat.name}</span>
                      <Badge variant="outline">{currentFormat.fileExtension}</Badge>
                    </div>
                    <span>{currentFormat.description}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Ngôn ngữ nội dung</Label>
                  <SearchableSelect
                    value={outputLanguage}
                    onValueChange={setOutputLanguage}
                    options={languageOptions}
                    placeholder="Chọn ngôn ngữ"
                    searchPlaceholder="Tìm kiếm..."
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentLanguage.flag}</span>
                      <span className="font-medium">{currentLanguage.nativeName}</span>
                    </div>
                    <span>Tất cả labels và text sẽ sử dụng {currentLanguage.nativeName}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Phong cách thiết kế</Label>
                  <SearchableSelect
                    value={style}
                    onValueChange={setStyle}
                    options={styleOptions}
                    placeholder="Chọn phong cách"
                    searchPlaceholder="Tìm kiếm..."
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentStyle.icon}</span>
                      <span className="font-medium">{currentStyle.name}</span>
                    </div>
                    <span>{currentStyle.description}</span>
                  </div>
                </div>
              </div>

              {/* Complexity & Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <Label className="font-medium">Độ phức tạp & Tùy chọn</Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Độ phức tạp</Label>
                  <SearchableSelect
                    value={complexity}
                    onValueChange={setComplexity}
                    options={complexityOptions}
                    placeholder="Chọn độ phức tạp"
                    searchPlaceholder="Tìm kiếm..."
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentComplexity.icon}</span>
                      <span className="font-medium">{currentComplexity.name}</span>
                      <Badge variant="outline">{currentComplexity.level}</Badge>
                    </div>
                    <span>{currentComplexity.description}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Tùy chọn bổ sung</Label>
                  
                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm">Bao gồm icons</span>
                    </div>
                    <Switch
                      checked={includeIcons}
                      onCheckedChange={setIncludeIcons}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4" />
                      <span className="text-sm">Bao gồm màu sắc</span>
                    </div>
                    <Switch
                      checked={includeColors}
                      onCheckedChange={setIncludeColors}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Bao gồm ghi chú</span>
                    </div>
                    <Switch
                      checked={includeNotes}
                      onCheckedChange={setIncludeNotes}
                    />
                  </div>
                </div>
              </div>

              {/* Model & Summary */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <Label className="font-medium">AI Model & Tổng quan</Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">AI Model</Label>
                  <ModelSelector 
                    pageId={PAGE_ID}
                    label=""
                    showDefault={true}
                  />
                </div>

                <Separator />

                <div className="bg-muted/20 p-3 rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Cấu hình hiện tại</Label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Loại sơ đồ:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentType.icon}</span>
                        <span>{currentType.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Định dạng:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentFormat.icon}</span>
                        <span>{currentFormat.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ngôn ngữ:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentLanguage.flag}</span>
                        <span>{currentLanguage.nativeName}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phong cách:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentStyle.icon}</span>
                        <span>{currentStyle.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Độ phức tạp:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentComplexity.icon}</span>
                        <span>{currentComplexity.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">AI Model:</span>
                      <span>{getPageModel(PAGE_ID) || config.model}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Result Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description Input */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Mô tả sơ đồ</span>
              </CardTitle>
              <CardDescription>
                Mô tả chi tiết sơ đồ bạn muốn tạo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Mô tả chi tiết sơ đồ bạn muốn tạo...

Ví dụ:
- Sơ đồ lớp cho hệ thống quản lý thư viện với các lớp Book, User, Library
- Flowchart cho quy trình đăng ký tài khoản người dùng
- Sơ đồ tư duy về lộ trình học AI/Machine Learning
- Sơ đồ tuần tự cho API thanh toán online`}
                className="min-h-[300px] text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {description.length} ký tự
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(description, "Mô tả")}
                  disabled={!description}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Sao chép
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diagram Result */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shapes className="w-5 h-5 text-green-500" />
                  <span>Kết quả sơ đồ</span>
                  {diagramResult && !diagramResult.error && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {outputFormat === 'plantuml' 
                          ? ('pumlCode' in diagramResult ? (diagramResult as { pumlCode: string }).pumlCode?.length || 0 : 0)
                          : ('diagramCode' in diagramResult ? (diagramResult as { diagramCode: string }).diagramCode?.length || 0 : 0)
                        } ký tự
                      </Badge>
                      {shouldAddStepIndexing(diagramType) && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                          <Hash className="w-3 h-3 mr-1" />
                          Bước được đánh số
                        </Badge>
                      )}
                    </>
                  )}
                </CardTitle>
                {diagramResult && !diagramResult.error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = outputFormat === 'plantuml' 
                        ? ('pumlCode' in diagramResult ? (diagramResult as { pumlCode: string }).pumlCode || '' : '')
                        : ('diagramCode' in diagramResult ? (diagramResult as { diagramCode: string }).diagramCode || '' : '');
                      copyToClipboard(code, `Mã ${outputFormat === 'plantuml' ? 'PlantUML' : currentFormat.name}`);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Sao chép code</span>
                  </Button>
                )}
              </div>
              <CardDescription>
                Mã {currentFormat.name} được tạo từ AI {outputFormat === 'plantuml' ? 'với Solution Architect expertise' : 'đa định dạng'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {!diagramResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shapes className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có kết quả sơ đồ</p>
                    <p className="text-sm">Nhập mô tả và nhấn "Tạo sơ đồ" để bắt đầu</p>
                  </div>
                ) : diagramResult.error ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                    <p className="text-red-500 font-medium">Lỗi tạo sơ đồ</p>
                    <p className="text-sm text-muted-foreground mt-2">{diagramResult.error}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Mã {currentFormat.name}</span>
                      </div>
                    </div>
                    
                    {/* Show explanation if available (only for PlantUML) */}
                    {outputFormat === 'plantuml' && 'explanation' in diagramResult && (diagramResult as { explanation: string }).explanation && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Giải thích sơ đồ:
                        </h4>
                        <p className="text-blue-700 text-sm">{(diagramResult as { explanation: string }).explanation}</p>
                      </div>
                    )}
                    
                    <pre className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto">
                      <code>
                        {outputFormat === 'plantuml' 
                          ? ('pumlCode' in diagramResult ? (diagramResult as { pumlCode: string }).pumlCode || '' : '')
                          : ('diagramCode' in diagramResult ? (diagramResult as { diagramCode: string }).diagramCode || '' : '')
                        }
                      </code>
                    </pre>
                    {diagramResult.metadata && (
                      <div className="text-xs text-muted-foreground">
                        Thời gian xử lý: {diagramResult.metadata.processingTime}ms | 
                        Độ dài: {diagramResult.metadata.codeLength} ký tự
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center space-y-4">
          {!config.apiKey && (
            <Card className="w-full max-w-2xl border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Cần cấu hình API Key</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Vui lòng vào Settings để nhập API Key OpenAI/ChatGPT
                </p>
              </CardContent>
            </Card>
          )}
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim() || !config.apiKey}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow shadow-elegant hover:shadow-glow transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Đang tạo sơ đồ...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Tạo sơ đồ
                <Zap className="w-5 h-5 ml-2" />
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
                <span>Lỗi</span>
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

        {/* Generation Summary */}
        {diagramResult && !diagramResult.error && (
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Tổng kết</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Loại sơ đồ:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentType.icon}</span>
                    <span className="font-medium">{currentType.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Định dạng:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentFormat.icon}</span>
                    <span className="font-medium">{currentFormat.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngôn ngữ:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentLanguage.flag}</span>
                    <span className="font-medium">{currentLanguage.nativeName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phong cách:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentStyle.icon}</span>
                    <span className="font-medium">{currentStyle.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">AI Model:</span>
                  <p className="font-medium mt-1">{getPageModel(PAGE_ID) || config.model}</p>
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
    </div>
  );
}