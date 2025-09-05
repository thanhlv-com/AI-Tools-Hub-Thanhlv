import { useState, useCallback } from "react";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { PromptFormData, JSONPrompt, ValidationResult } from "@/types/prompt";
import { PromptExamples } from "@/components/PromptExamples";
import { ModelSelector } from "@/components/ModelSelector";
import { 
  Wand2, 
  Copy, 
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lightbulb,
  Target,
  User,
  FileOutput,
  Lock,
  MessageSquare,
  Sparkles,
  Zap,
  Bot
} from "lucide-react";

const PAGE_ID = "prompt-planning";

export default function PromptPlanning() {
  const { toast } = useToast();
  const { config } = useConfig();
  
  // Form state with session persistence
  const [promptGoal, setPromptGoal] = useFieldSession(PAGE_ID, "promptGoal", "");
  const [targetAudience, setTargetAudience] = useFieldSession(PAGE_ID, "targetAudience", "");
  const [outputFormat, setOutputFormat] = useFieldSession(PAGE_ID, "outputFormat", "");
  const [task, setTask] = useFieldSession(PAGE_ID, "task", "");
  const [persona, setPersona] = useFieldSession(PAGE_ID, "persona", "");
  const [context, setContext] = useFieldSession(PAGE_ID, "context", "");
  const [constraints, setConstraints] = useFieldSession(PAGE_ID, "constraints", [""]);
  const [examples, setExamples] = useFieldSession(PAGE_ID, "examples", "");
  
  // Local state
  const [generatedJSON, setGeneratedJSON] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult>({ 
    isValid: true, 
    missingFields: [], 
    suggestions: [] 
  });
  const [generationMode, setGenerationMode] = useState<"static" | "ai">("static");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addConstraint = () => {
    setConstraints([...constraints, ""]);
  };

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...constraints];
    newConstraints[index] = value;
    setConstraints(newConstraints);
  };

  const validateForm = useCallback((): ValidationResult => {
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    if (!promptGoal.trim()) missingFields.push("Mục tiêu prompt");
    if (!targetAudience.trim()) missingFields.push("Đối tượng mục tiêu");
    if (!outputFormat.trim()) missingFields.push("Định dạng đầu ra");
    if (!task.trim()) missingFields.push("Nhiệm vụ cụ thể");

    // Suggestions
    if (!persona.trim()) {
      suggestions.push("Thêm persona sẽ giúp AI hiểu vai trò cần đảm nhận");
    }
    if (!context.trim()) {
      suggestions.push("Cung cấp bối cảnh sẽ giúp AI đưa ra phản hồi chính xác hơn");
    }
    if (constraints.filter(c => c.trim()).length === 0) {
      suggestions.push("Thêm ràng buộc sẽ giúp kiểm soát chất lượng đầu ra");
    }
    if (!examples.trim()) {
      suggestions.push("Cung cấp ví dụ sẽ giúp AI hiểu rõ hơn về yêu cầu của bạn");
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      suggestions
    };
  }, [promptGoal, targetAudience, outputFormat, task, persona, context, constraints, examples]);

  const generateJSON = async () => {
    const validationResult = validateForm();
    setValidation(validationResult);

    if (generationMode === "static") {
      generateStaticJSON(validationResult);
    } else {
      await generateAIJSON(validationResult);
    }
  };

  const generateStaticJSON = (validationResult: ValidationResult) => {
    if (!validationResult.isValid) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: `Vui lòng điền: ${validationResult.missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    const formData: PromptFormData = {
      prompt_goal: promptGoal,
      target_audience: targetAudience,
      output_format: outputFormat,
      task: task,
      persona: persona,
      context: context,
      constraints: constraints.filter(c => c.trim()),
      examples: examples
    };

    const jsonPrompt: JSONPrompt = {
      ...formData,
      metadata: {
        created_at: new Date().toISOString().split('T')[0],
        version: "1.0",
        ai_model_recommendation: "claude-3-sonnet"
      }
    };

    setGeneratedJSON(JSON.stringify(jsonPrompt, null, 2));
    
    toast({
      title: "JSON Prompt đã được tạo!",
      description: "Bạn có thể copy và sử dụng JSON này cho các mô hình AI",
    });
  };

  const generateAIJSON = async (validationResult: ValidationResult) => {
    if (!promptGoal.trim()) {
      toast({
        title: "Thiếu mục tiêu prompt",
        description: "Vui lòng điền ít nhất mục tiêu prompt để AI có thể tạo JSON",
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: "Chưa cấu hình API Key",
        description: "Vui lòng vào Settings để nhập API Key",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const chatGPTService = new ChatGPTService(config);
      const model = selectedModel || config.model;
      
      const aiResult = await chatGPTService.generatePrompt(
        promptGoal,
        targetAudience,
        outputFormat,
        task,
        persona,
        context,
        constraints.filter(c => c.trim()),
        examples,
        model
      );

      // Try to parse the AI result as JSON to validate it
      try {
        const parsedJSON = JSON.parse(aiResult);
        setGeneratedJSON(JSON.stringify(parsedJSON, null, 2));
        toast({
          title: "AI đã tạo JSON Prompt!",
          description: "JSON prompt được tối ưu bởi AI đã sẵn sàng sử dụng",
        });
      } catch (parseError) {
        // If AI didn't return valid JSON, wrap it in a fallback structure
        const fallbackJSON: JSONPrompt = {
          prompt_goal: promptGoal,
          target_audience: targetAudience || "Tổng quát",
          output_format: outputFormat || "Text",
          task: task || promptGoal,
          persona: persona || "AI Assistant",
          context: context || aiResult,
          constraints: constraints.filter(c => c.trim()),
          examples: examples || "",
          metadata: {
            created_at: new Date().toISOString().split('T')[0],
            version: "1.0",
            ai_model_recommendation: model
          }
        };
        setGeneratedJSON(JSON.stringify(fallbackJSON, null, 2));
        toast({
          title: "JSON Prompt đã được tạo!",
          description: "AI đã hỗ trợ tối ưu prompt của bạn",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi tạo AI Prompt",
        description: error instanceof Error ? error.message : "Lỗi không xác định",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedJSON) return;
    
    try {
      await navigator.clipboard.writeText(generatedJSON);
      toast({
        title: "Đã copy vào clipboard!",
        description: "JSON prompt đã được sao chép",
      });
    } catch (error) {
      toast({
        title: "Lỗi copy",
        description: "Không thể copy vào clipboard",
        variant: "destructive"
      });
    }
  };

  const loadExample = (exampleData: PromptFormData) => {
    setPromptGoal(exampleData.prompt_goal);
    setTargetAudience(exampleData.target_audience);
    setOutputFormat(exampleData.output_format);
    setTask(exampleData.task);
    setPersona(exampleData.persona);
    setContext(exampleData.context);
    setConstraints(exampleData.constraints.length > 0 ? exampleData.constraints : [""]);
    setExamples(exampleData.examples);
    
    toast({
      title: "Đã tải ví dụ",
      description: "Dữ liệu ví dụ đã được điền vào form",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>Lập kế hoạch Prompt</span>
              </CardTitle>
              <CardDescription>
                Tạo JSON prompt có cấu trúc cho các mô hình ngôn ngữ lớn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal" className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Mục tiêu Prompt *</span>
                  </Label>
                  <Textarea
                    id="goal"
                    placeholder="Mô tả mục tiêu chính của prompt này..."
                    value={promptGoal}
                    onChange={(e) => setPromptGoal(e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="audience" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Đối tượng mục tiêu *</span>
                  </Label>
                  <Input
                    id="audience"
                    placeholder="VD: Lập trình viên, Marketer, Sinh viên..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="format" className="flex items-center space-x-2">
                    <FileOutput className="w-4 h-4" />
                    <span>Định dạng đầu ra *</span>
                  </Label>
                  <Input
                    id="format"
                    placeholder="VD: JSON, Markdown, Code, Email..."
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="task" className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Nhiệm vụ cụ thể *</span>
                  </Label>
                  <Textarea
                    id="task"
                    placeholder="Mô tả chi tiết nhiệm vụ AI cần thực hiện..."
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Optional Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="persona" className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Persona (Tùy chọn)</span>
                  </Label>
                  <Input
                    id="persona"
                    placeholder="VD: Chuyên gia marketing, Giáo viên, Developer senior..."
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="context" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Bối cảnh (Tùy chọn)</span>
                  </Label>
                  <Textarea
                    id="context"
                    placeholder="Cung cấp thông tin bối cảnh, tình huống cụ thể..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Ràng buộc (Tùy chọn)</span>
                  </Label>
                  <div className="space-y-2 mt-1">
                    {constraints.map((constraint, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          placeholder="VD: Tối đa 500 từ, Không sử dụng từ ngữ phản cảm..."
                          value={constraint}
                          onChange={(e) => updateConstraint(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeConstraint(index)}
                          disabled={constraints.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addConstraint}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm ràng buộc</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="examples" className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Ví dụ (Tùy chọn)</span>
                  </Label>
                  <Textarea
                    id="examples"
                    placeholder="Cung cấp ví dụ input/output để AI hiểu rõ hơn yêu cầu..."
                    value={examples}
                    onChange={(e) => setExamples(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Validation Status */}
              {validation.missingFields.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <div className="flex items-center space-x-2 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Thiếu thông tin bắt buộc: {validation.missingFields.join(", ")}</span>
                  </div>
                </div>
              )}

              {validation.suggestions.length > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <div className="flex items-start space-x-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <Lightbulb className="w-4 h-4 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">Gợi ý cải thiện:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Mode Selection */}
              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4" />
                  <span>Chế độ tạo JSON</span>
                </Label>
                <Tabs value={generationMode} onValueChange={(value) => setGenerationMode(value as "static" | "ai")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="static" className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Tĩnh</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <span>AI</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="static" className="mt-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Tạo JSON prompt dựa trên thông tin đã nhập một cách trực tiếp
                    </div>
                  </TabsContent>
                  <TabsContent value="ai" className="mt-4">
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        AI sẽ phân tích và tối ưu hóa prompt của bạn, bổ sung thông tin thiếu
                      </div>
                      <ModelSelector
                        value={selectedModel}
                        onChange={setSelectedModel}
                        label="Model cho AI Generation"
                        showDefault={true}
                        pageId={PAGE_ID}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button onClick={generateJSON} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Đang tạo bởi AI...
                  </>
                ) : (
                  <>
                    {generationMode === "ai" ? (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Tạo JSON bằng AI
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Tạo JSON Prompt
                      </>
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Examples */}
          <PromptExamples onLoadExample={loadExample} />
        </div>

        {/* Right Column - Generated JSON */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>JSON Prompt được tạo</span>
                </div>
                {generatedJSON && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Hợp lệ</span>
                    </Badge>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                JSON có cấu trúc sẵn sàng để sử dụng với các mô hình AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedJSON ? (
                <div className="relative">
                  <pre className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-[600px] text-sm">
                    <code>{generatedJSON}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Điền thông tin và nhấn "Tạo JSON Prompt" để xem kết quả</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}