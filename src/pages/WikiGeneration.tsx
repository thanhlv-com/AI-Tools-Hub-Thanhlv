import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { WIKI_STRUCTURES, getDefaultWikiStructure } from "@/data/wikiStructures";
import { LANGUAGES } from "@/data/translation";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { 
  Copy, 
  AlertTriangle,
  RefreshCw,
  FileText,
  BookOpen,
  Layout,
  Eye,
  ChevronDown,
  ChevronUp,
  Globe
} from "lucide-react";

const PAGE_ID = "wiki-generation";

export default function WikiGeneration() {
  const { t } = useTranslation();
  
  // Helper function to get localized language name
  const getLocalizedLanguageName = (langCode: string) => {
    const translatedName = t(`languages.${langCode}`);
    const lang = LANGUAGES.find(l => l.code === langCode);
    return translatedName !== `languages.${langCode}` ? translatedName : lang?.nativeName || langCode;
  };

  // Create language options for SearchableSelect
  const outputLanguageOptions: SearchableSelectOption[] = LANGUAGES
    .filter(lang => lang.code !== "auto") // Remove auto-detect for output
    .map(lang => ({
      value: lang.code,
      label: (
        <div className="flex items-center space-x-2">
          <span>{lang.flag}</span>
          <span>{getLocalizedLanguageName(lang.code)}</span>
        </div>
      ),
      searchText: `${getLocalizedLanguageName(lang.code)} ${lang.nativeName} ${lang.code}`
    }));
  
  // Session-persisted state
  const [projectDescription, setProjectDescription] = useFieldSession(PAGE_ID, "projectDescription", "");
  const [wikiResult, setWikiResult] = useFieldSession(PAGE_ID, "wikiResult", "");
  const [selectedStructure, setSelectedStructure] = useFieldSession(PAGE_ID, "selectedStructure", getDefaultWikiStructure().id);
  const [selectedFormat, setSelectedFormat] = useFieldSession(PAGE_ID, "selectedFormat", "markdown");
  const [outputLanguage, setOutputLanguage] = useFieldSession(PAGE_ID, "outputLanguage", "vi");
  
  // Temporary state (not persisted)
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { config, getPageModel, addToWikiHistory } = useConfig();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("common.copied") + " 📋",
      description: t("wiki.resultDescription") + " 📝",
    });
  };

  const generatePreviewExample = (structureId: string) => {
    const structure = WIKI_STRUCTURES.find(s => s.id === structureId);
    if (!structure) return "";

    const exampleProject = t("wiki.previewExample.projectName");
    const sections = structure.sections.map(section => 
      `## ${section.emoji} ${section.title}\n${t(`wiki.previewExample.${section.title.toLowerCase().replace(/\s+/g, '')}`)} \n`
    ).join('\n');

    return `# ${exampleProject}\n\n${sections}`;
  };

  const generateWiki = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: t("wiki.errors.missingInfo") + " ⚠️",
        description: t("wiki.errors.missingDescription") + " 📝",
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t("wiki.errors.apiKeyWarning") + " ⚠️",
        description: t("wiki.errors.apiKeyWarningDesc") + " ⚙️",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      
      const response = await chatGPT.generateWikiDocument(
        projectDescription,
        selectedStructure,
        selectedFormat,
        outputLanguage,
        pageModel || undefined
      );

      setWikiResult(response);
      
      // Add to history
      addToWikiHistory({
        type: "wiki",
        title: `Wiki: ${projectDescription.substring(0, 50)}${projectDescription.length > 50 ? '...' : ''}`,
        description: projectDescription,
        result: response,
        model: pageModel || config.model,
        structure: selectedStructure,
        format: selectedFormat,
        outputLanguage: outputLanguage
      });
      
      toast({
        title: t("wiki.success.generated") + " 🎉",
        description: t("wiki.success.generatedDesc", {
          input: projectDescription.substring(0, 50) + (projectDescription.length > 50 ? '...' : '')
        }) + " 📄",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("wiki.errors.unknownError");
      
      toast({
        title: t("wiki.errors.generating") + " ❌",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>{t("wiki.title")} 📚</span>
        </h1>
        <p className="text-muted-foreground">
          {t("wiki.description")} 📝✨
        </p>
      </div>

      {/* Main Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>{t("wiki.generateButton")} 📄</span>
          </CardTitle>
          <CardDescription>
            {t("wiki.description")} 🗂️
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <Label>{t("wiki.projectDescription")} 📝</Label>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder={t("wiki.projectDescriptionPlaceholder")}
              className="min-h-[150px]"
            />
            <Badge variant="outline" className="text-xs">
              {t("wiki.characterCount", { count: projectDescription.length })} 📊
            </Badge>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("wiki.formatLabel")} 📄</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder={t("wiki.selectFormat")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">
                  <div className="flex items-center space-x-2">
                    <span>📝</span>
                    <div>
                      <div className="font-medium">{t("wiki.formats.markdown.name")}</div>
                      <div className="text-xs text-muted-foreground">{t("wiki.formats.markdown.description")}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="confluence">
                  <div className="flex items-center space-x-2">
                    <span>🏢</span>
                    <div>
                      <div className="font-medium">{t("wiki.formats.confluence.name")}</div>
                      <div className="text-xs text-muted-foreground">{t("wiki.formats.confluence.description")}</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Output Language Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              <Globe className="w-4 h-4 inline mr-1" />
              {t("wiki.outputLanguageLabel")} 🌐
            </Label>
            <SearchableSelect
              value={outputLanguage}
              onValueChange={setOutputLanguage}
              options={outputLanguageOptions}
              placeholder={t("wiki.selectOutputLanguage")}
              searchPlaceholder={t("common.search")}
              className="h-9"
            />
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              {t("wiki.outputLanguageDescription")}
            </div>
          </div>

          {/* Structure Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("wiki.structureLabel")} 📋</Label>
            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder={t("wiki.selectStructure")} />
              </SelectTrigger>
              <SelectContent>
                {WIKI_STRUCTURES.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    <div className="flex items-center space-x-2">
                      <span>{structure.icon}</span>
                      <div>
                        <div className="font-medium">
                          {t(`wiki.structures.${structure.id}.name`) !== `wiki.structures.${structure.id}.name`
                            ? t(`wiki.structures.${structure.id}.name`)
                            : structure.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(`wiki.structures.${structure.id}.description`) !== `wiki.structures.${structure.id}.description`
                            ? t(`wiki.structures.${structure.id}.description`)
                            : structure.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStructure && (
              <div className="mt-2 space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">{t("wiki.structureSections")}:</div>
                  <div className="flex flex-wrap gap-1">
                    {WIKI_STRUCTURES.find(s => s.id === selectedStructure)?.sections.map((section, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {section.emoji} {section.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Collapsible open={showPreview} onOpenChange={setShowPreview}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      {t("wiki.previewToggle")}
                      {showPreview ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Card className="bg-muted/20 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>{t("wiki.previewTitle")}</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t("wiki.previewDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[300px] font-mono bg-background/50 p-3 rounded border">
                          {generatePreviewExample(selectedStructure)}
                        </pre>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t("wiki.modelLabel")} 🤖</Label>
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
                  <span className="font-medium">{t("wiki.errors.apiKeyWarning")} ⚠️</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("wiki.errors.apiKeyWarningDesc")} ⚙️
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateWiki}
            disabled={isGenerating || !projectDescription.trim() || !config.apiKey}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t("wiki.generatingText")} ⏳
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                {t("wiki.generateButton")} 📚
              </>
            )}
          </Button>

          {/* Result Section */}
          {wikiResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium text-primary">
                  {t("wiki.resultLabel")} 📄
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(wikiResult)}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t("wiki.copyButton")} 📋</span>
                </Button>
              </div>
              
              <Card className="bg-muted/30 border-primary/20">
                <CardContent className="pt-4">
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[600px] font-sans">
                    {wikiResult}
                  </pre>
                </CardContent>
              </Card>
              
              <div className="mt-3 text-xs text-muted-foreground">
                {t("wiki.resultDescription")} 📝✨
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}