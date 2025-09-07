import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { 
  Copy, 
  FileType,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Code2,
  Bot,
  CheckSquare,
  ListTodo
} from "lucide-react";

const PAGE_ID = "prompt-generation";

export default function PromptGeneration() {
  const { t } = useTranslation();
  // Session-persisted state for detailed prompt feature
  const [detailedPromptInput, setDetailedPromptInput] = useFieldSession(PAGE_ID, "detailedPromptInput", "");
  const [detailedPromptResult, setDetailedPromptResult] = useFieldSession(PAGE_ID, "detailedPromptResult", "");
  const [detailedOutputFormat, setDetailedOutputFormat] = useFieldSession(PAGE_ID, "detailedOutputFormat", "plaintext");
  
  // Session-persisted state for Claude request feature
  const [claudeRequestInput, setClaudeRequestInput] = useFieldSession(PAGE_ID, "claudeRequestInput", "");
  const [claudePromptResult, setClaudePromptResult] = useFieldSession(PAGE_ID, "claudePromptResult", "");
  
  // Session-persisted state for todo generation feature
  const [todoRequestInput, setTodoRequestInput] = useFieldSession(PAGE_ID, "todoRequestInput", "");
  const [todoTasksResult, setTodoTasksResult] = useFieldSession(PAGE_ID, "todoTasksResult", "");
  
  // Temporary state (not persisted)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingClaude, setIsGeneratingClaude] = useState(false);
  const [isGeneratingTodo, setIsGeneratingTodo] = useState(false);
  const { config, getPageModel } = useConfig();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard.",
    });
  };

  const generateDetailedPrompt = async () => {
    if (!detailedPromptInput.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mô tả để tạo prompt chi tiết.",
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

    setIsGenerating(true);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const response = await chatGPT.generateDetailedPrompt(
        detailedPromptInput,
        detailedOutputFormat as "plaintext" | "json",
        pageModel || undefined
      );

      setDetailedPromptResult(response);
      
      toast({
        title: t("prompts.common.successGenerated"),
        description: t("prompts.common.successGeneratedDesc", {
          format: detailedOutputFormat === 'json' ? 'JSON' : 'plain text',
          input: detailedPromptInput.substring(0, 50)
        }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("prompts.common.unknownError");
      
      toast({
        title: t("prompts.common.errorGenerating"),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClaudePrompt = async () => {
    if (!claudeRequestInput.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập yêu cầu để tạo prompt cho Claude.",
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

    setIsGeneratingClaude(true);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const response = await chatGPT.generateClaudePrompt(
        claudeRequestInput,
        pageModel || undefined
      );

      setClaudePromptResult(response);
      
      toast({
        title: t("prompts.common.successGeneratedClaude"),
        description: t("prompts.common.successGeneratedClaudeDesc", {
          input: claudeRequestInput.substring(0, 50)
        }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("prompts.common.unknownError");
      
      toast({
        title: t("prompts.common.errorGeneratingClaude"),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingClaude(false);
    }
  };

  const generateTodoTasks = async () => {
    if (!todoRequestInput.trim()) {
      toast({
        title: t("prompts.common.missingInfo"),
        description: t("prompts.common.missingTodoInput"),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t("prompts.common.apiKeyWarning"),
        description: t("prompts.common.apiKeyWarningDesc"),
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingTodo(true);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const response = await chatGPT.generateTodoTasks(
        todoRequestInput,
        pageModel || undefined
      );

      setTodoTasksResult(response);
      
      toast({
        title: t("prompts.common.successGeneratedTodo"),
        description: t("prompts.common.successGeneratedTodoDesc", {
          input: todoRequestInput.substring(0, 50)
        }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("prompts.common.unknownError");
      
      toast({
        title: t("prompts.common.errorGeneratingTodo"),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTodo(false);
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>{t("prompts.title")}</span>
        </h1>
        <p className="text-muted-foreground">
          {t("prompts.description")}
        </p>
      </div>

      {/* Tabs for different prompt types */}
      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detailed" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{t("prompts.tabs.detailed")}</span>
          </TabsTrigger>
          <TabsTrigger value="claude" className="flex items-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>{t("prompts.tabs.claude")}</span>
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center space-x-2">
            <ListTodo className="w-4 h-4" />
            <span>{t("prompts.tabs.todos")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Detailed Prompt Tab */}
        <TabsContent value="detailed">
          <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{t("prompts.detailedPrompt.title")}</span>
          </CardTitle>
          <CardDescription>
            {t("prompts.detailedPrompt.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Output Format Selector */}
          <div className="space-y-2">
            <Label>{t("prompts.detailedPrompt.outputFormat")}</Label>
            <div className="flex space-x-3">
              <Button
                variant={detailedOutputFormat === "plaintext" ? "default" : "outline"}
                size="sm"
                onClick={() => setDetailedOutputFormat("plaintext")}
                className="flex items-center space-x-2"
              >
                <FileType className="w-4 h-4" />
                <span>{t("prompts.detailedPrompt.plainText")}</span>
              </Button>
              <Button
                variant={detailedOutputFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setDetailedOutputFormat("json")}
                className="flex items-center space-x-2"
              >
                <Code2 className="w-4 h-4" />
                <span>{t("prompts.detailedPrompt.jsonPrompt")}</span>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {detailedOutputFormat === "plaintext" 
                ? t("prompts.detailedPrompt.plainTextDesc") 
                : t("prompts.detailedPrompt.jsonDesc")}
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-2">
            <Label>{t("prompts.detailedPrompt.inputLabel")}</Label>
            <Textarea
              value={detailedPromptInput}
              onChange={(e) => setDetailedPromptInput(e.target.value)}
              placeholder={t("prompts.detailedPrompt.inputPlaceholder")}
              className="min-h-[120px]"
            />
            <Badge variant="outline" className="text-xs">
              {t("prompts.detailedPrompt.characterCount", { count: detailedPromptInput.length })}
            </Badge>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("prompts.detailedPrompt.modelLabel")}</Label>
            <ModelSelector 
              pageId={PAGE_ID}
              label=""
              showDefault={true}
            />
          </div>

          {/* API Key Warning */}
          {!config.apiKey && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">{t("prompts.common.apiKeyWarning")}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("prompts.common.apiKeyWarningDesc")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateDetailedPrompt}
            disabled={isGenerating || !detailedPromptInput.trim() || !config.apiKey}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t("prompts.detailedPrompt.generatingText")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("prompts.detailedPrompt.generateButton", {
                  format: detailedOutputFormat === "json" ? "JSON" : "Plain Text"
                })}
              </>
            )}
          </Button>

          {/* Result Section */}
          {detailedPromptResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium text-primary">
                  {t("prompts.detailedPrompt.resultLabel", {
                    format: detailedOutputFormat === "json" ? "JSON" : "Plain Text"
                  })}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(detailedPromptResult)}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t("prompts.common.copy")}</span>
                </Button>
              </div>
              
              <Card className="bg-muted/30 border-primary/20">
                <CardContent className="pt-4">
                  <pre className={`text-sm whitespace-pre-wrap overflow-auto max-h-96 ${detailedOutputFormat === "json" ? "font-mono" : "font-sans"}`}>
                    {detailedPromptResult}
                  </pre>
                </CardContent>
              </Card>
              
              <div className="mt-3 text-xs text-muted-foreground">
                {detailedOutputFormat === "json" 
                  ? t("prompts.detailedPrompt.resultDesc", { format: "JSON" })
                  : t("prompts.detailedPrompt.resultDescPlain")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Claude Prompt Tab */}
        <TabsContent value="claude">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-primary" />
                <span>{t("prompts.claudePrompt.title")}</span>
              </CardTitle>
              <CardDescription>
                {t("prompts.claudePrompt.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Section */}
              <div className="space-y-2">
                <Label>{t("prompts.claudePrompt.inputLabel")}</Label>
                <Textarea
                  value={claudeRequestInput}
                  onChange={(e) => setClaudeRequestInput(e.target.value)}
                  placeholder={t("prompts.claudePrompt.inputPlaceholder")}
                  className="min-h-[150px]"
                />
                <Badge variant="outline" className="text-xs">
                  {t("prompts.detailedPrompt.characterCount", { count: claudeRequestInput.length })}
                </Badge>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t("prompts.detailedPrompt.modelLabel")}</Label>
                <ModelSelector 
                  pageId={PAGE_ID}
                  label=""
                  showDefault={true}
                />
              </div>

              {/* API Key Warning */}
              {!config.apiKey && (
                <Card className="border-destructive/20 bg-destructive/5">
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

              {/* Generate Button */}
              <Button 
                onClick={generateClaudePrompt}
                disabled={isGeneratingClaude || !claudeRequestInput.trim() || !config.apiKey}
                className="w-full"
              >
                {isGeneratingClaude ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t("prompts.detailedPrompt.generatingText")}
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    {t("prompts.claudePrompt.generateButton")}
                  </>
                )}
              </Button>

              {/* Result Section */}
              {claudePromptResult && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium text-primary">
                      {t("prompts.claudePrompt.resultLabel")}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(claudePromptResult)}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{t("prompts.common.copy")}</span>
                    </Button>
                  </div>
                  
                  <Card className="bg-muted/30 border-primary/20">
                    <CardContent className="pt-4">
                      <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96 font-sans">
                        {claudePromptResult}
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    {t("prompts.claudePrompt.resultDesc")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Todos & Tasks Tab */}
        <TabsContent value="todos">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ListTodo className="w-5 h-5 text-primary" />
                <span>{t("prompts.todoTasks.title")}</span>
              </CardTitle>
              <CardDescription>
                {t("prompts.todoTasks.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Section */}
              <div className="space-y-2">
                <Label>{t("prompts.todoTasks.inputLabel")}</Label>
                <Textarea
                  value={todoRequestInput}
                  onChange={(e) => setTodoRequestInput(e.target.value)}
                  placeholder={t("prompts.todoTasks.inputPlaceholder")}
                  className="min-h-[150px]"
                />
                <Badge variant="outline" className="text-xs">
                  {t("prompts.detailedPrompt.characterCount", { count: todoRequestInput.length })}
                </Badge>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">{t("prompts.detailedPrompt.modelLabel")}</Label>
                <ModelSelector 
                  pageId={PAGE_ID}
                  label=""
                  showDefault={true}
                />
              </div>

              {/* API Key Warning */}
              {!config.apiKey && (
                <Card className="border-destructive/20 bg-destructive/5">
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

              {/* Generate Button */}
              <Button 
                onClick={generateTodoTasks}
                disabled={isGeneratingTodo || !todoRequestInput.trim() || !config.apiKey}
                className="w-full"
              >
                {isGeneratingTodo ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t("prompts.todoTasks.generatingText")}
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {t("prompts.todoTasks.generateButton")}
                  </>
                )}
              </Button>

              {/* Result Section */}
              {todoTasksResult && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium text-primary">
                      {t("prompts.todoTasks.resultLabel")}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(todoTasksResult)}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{t("prompts.common.copy")}</span>
                    </Button>
                  </div>
                  
                  <Card className="bg-muted/30 border-primary/20">
                    <CardContent className="pt-4">
                      <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96 font-sans">
                        {todoTasksResult}
                      </pre>
                    </CardContent>
                  </Card>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    {t("prompts.todoTasks.resultDesc")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}