import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { ConfluenceTemplateRequest, ConfluenceTemplateResult, ConfluenceHistory } from "@/types/confluence";
import { TEMPLATE_TYPES, TEMPLATE_STYLES, TEMPLATE_TONES } from "@/data/confluence";
import { LANGUAGES } from "@/data/translation";
import { 
  FileText, 
  Download, 
  Upload, 
  Eye, 
  Play, 
  Copy, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  X,
  History,
  Globe,
  RefreshCw,
  BookOpen,
  Layout,
  Palette,
  Volume2
} from "lucide-react";

const PAGE_ID = "confluence-template";

export default function ConfluenceTemplate() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { getPageModel, addToConfluenceHistory, getHistory, queueConfig } = useConfig();
  
  // Form state
  const [title, setTitle] = useFieldSession(`${PAGE_ID}-title`, "");
  const [description, setDescription] = useFieldSession(`${PAGE_ID}-description`, "");
  const [purpose, setPurpose] = useFieldSession(`${PAGE_ID}-purpose`, "");
  const [targetAudience, setTargetAudience] = useFieldSession(`${PAGE_ID}-target-audience`, "");
  const [templateType, setTemplateType] = useFieldSession(`${PAGE_ID}-template-type`, "project-documentation");
  const [style, setStyle] = useFieldSession(`${PAGE_ID}-style`, "professional");
  const [tone, setTone] = useFieldSession(`${PAGE_ID}-tone`, "formal");
  const [contentStructure, setContentStructure] = useFieldSession<string[]>(`${PAGE_ID}-content-structure`, []);
  const [newStructureItem, setNewStructureItem] = useState("");
  const [includeTableOfContents, setIncludeTableOfContents] = useFieldSession(`${PAGE_ID}-include-toc`, true);
  const [includeMacros, setIncludeMacros] = useFieldSession(`${PAGE_ID}-include-macros`, true);
  const [selectedLanguages, setSelectedLanguages] = useFieldSession<string[]>(`${PAGE_ID}-languages`, []);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ConfluenceTemplateResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Create options for SearchableSelect components
  const templateTypeOptions: SearchableSelectOption[] = TEMPLATE_TYPES.map(type => ({
    value: type.id,
    label: type.name,
    description: type.description
  }));

  const styleOptions: SearchableSelectOption[] = TEMPLATE_STYLES.map(style => ({
    value: style.id,
    label: style.name,
    description: style.description
  }));

  const toneOptions: SearchableSelectOption[] = TEMPLATE_TONES.map(tone => ({
    value: tone.id,
    label: tone.name,
    description: tone.description
  }));

  const languageOptions: SearchableSelectOption[] = LANGUAGES.map(lang => ({
    value: lang.code,
    label: lang.name,
    description: lang.nativeName
  }));

  const addStructureItem = () => {
    if (newStructureItem.trim() && !(contentStructure || []).includes(newStructureItem.trim())) {
      setContentStructure([...(contentStructure || []), newStructureItem.trim()]);
      setNewStructureItem("");
    }
  };

  const removeStructureItem = (index: number) => {
    setContentStructure((contentStructure || []).filter((_, i) => i !== index));
  };

  const loadDefaultStructure = () => {
    const templateTypeInfo = TEMPLATE_TYPES.find(t => t.id === templateType);
    if (templateTypeInfo) {
      setContentStructure(templateTypeInfo.defaultStructure);
    }
  };

  const generateTemplate = async () => {
    if (!title.trim() || !description.trim() || !purpose.trim() || !targetAudience.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (title, description, purpose, target audience).",
        variant: "destructive"
      });
      return;
    }

    if ((contentStructure || []).length === 0) {
      toast({
        title: "Missing Content Structure",
        description: "Please add at least one content structure item or load the default structure.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const chatGPTService = new ChatGPTService(queueConfig);
      const pageModel = getPageModel(PAGE_ID);

      const request: ConfluenceTemplateRequest = {
        title: title.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        targetAudience: targetAudience.trim(),
        contentStructure: contentStructure || [],
        templateType,
        includeTableOfContents,
        includeMacros,
        languages: selectedLanguages || [],
        style,
        tone
      };

      const templateResult = await chatGPTService.generateConfluenceTemplate(request, pageModel);
      setResult(templateResult);

      // Add to history
      const historyItem: ConfluenceHistory = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        templateType,
        style,
        tone,
        languages: (selectedLanguages || []).length > 0 ? selectedLanguages : undefined,
        result: templateResult,
        createdAt: new Date().toISOString()
      };

      addToConfluenceHistory(historyItem);

      toast({
        title: "Template Generated Successfully",
        description: "Your Confluence template has been created!",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to Clipboard",
        description: "Template content has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
  };

  const exportTemplate = () => {
    if (!result) return;

    const exportData = {
      template: result,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: "DB Diff AI - Confluence Template Generator"
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confluence-template-${result.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Exported",
      description: "Template has been saved as JSON file.",
    });
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.template && data.template.content) {
          setResult(data.template);
          toast({
            title: "Template Imported",
            description: "Template has been loaded successfully.",
          });
        } else {
          throw new Error("Invalid template format");
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import template. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const history: ConfluenceHistory[] = (getHistory() || []).filter((item): item is ConfluenceHistory => 
    'templateType' in item && 'result' in item
  );

  const loadFromHistory = (historyItem: ConfluenceHistory) => {
    setResult(historyItem.result);
    setTitle(historyItem.title);
    setDescription(historyItem.description);
    setTemplateType(historyItem.templateType);
    setStyle(historyItem.style);
    setTone(historyItem.tone);
    if (historyItem.languages) {
      setSelectedLanguages(historyItem.languages);
    }
    
    toast({
      title: "Template Loaded",
      description: "Template loaded from history.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            {t('confluenceTemplate.title', 'Confluence Template Generator')}
          </h1>
          <p className="text-muted-foreground">
            {t('confluenceTemplate.description', 'Create AI-powered Confluence wiki templates with multilingual support')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            {t('common.history', 'History')}
          </Button>
          
          <ModelSelector pageId={PAGE_ID} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t('confluenceTemplate.basicInfo', 'Basic Information')}
              </CardTitle>
              <CardDescription>
                {t('confluenceTemplate.basicInfoDesc', 'Provide basic details about your template')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('confluenceTemplate.title', 'Template Title')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('confluenceTemplate.titlePlaceholder', 'Enter template title')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">
                    {t('confluenceTemplate.purpose', 'Purpose')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={t('confluenceTemplate.purposePlaceholder', 'What is this template for?')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('confluenceTemplate.description', 'Description')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('confluenceTemplate.descriptionPlaceholder', 'Describe what this template will be used for')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-audience">
                  {t('confluenceTemplate.targetAudience', 'Target Audience')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target-audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder={t('confluenceTemplate.targetAudiencePlaceholder', 'Who will use this template?')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                {t('confluenceTemplate.configuration', 'Template Configuration')}
              </CardTitle>
              <CardDescription>
                {t('confluenceTemplate.configurationDesc', 'Configure template type, style, and behavior')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('confluenceTemplate.templateType', 'Template Type')}</Label>
                  <SearchableSelect
                    options={templateTypeOptions}
                    value={templateType}
                    onValueChange={setTemplateType}
                    placeholder={t('confluenceTemplate.selectTemplateType', 'Select template type')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t('confluenceTemplate.style', 'Style')}
                  </Label>
                  <SearchableSelect
                    options={styleOptions}
                    value={style}
                    onValueChange={setStyle}
                    placeholder={t('confluenceTemplate.selectStyle', 'Select style')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    {t('confluenceTemplate.tone', 'Tone')}
                  </Label>
                  <SearchableSelect
                    options={toneOptions}
                    value={tone}
                    onValueChange={setTone}
                    placeholder={t('confluenceTemplate.selectTone', 'Select tone')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-toc"
                    checked={includeTableOfContents}
                    onCheckedChange={(checked) => setIncludeTableOfContents(checked as boolean)}
                  />
                  <Label htmlFor="include-toc">
                    {t('confluenceTemplate.includeTableOfContents', 'Include Table of Contents')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-macros"
                    checked={includeMacros}
                    onCheckedChange={(checked) => setIncludeMacros(checked as boolean)}
                  />
                  <Label htmlFor="include-macros">
                    {t('confluenceTemplate.includeMacros', 'Use Confluence Macros')}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                {t('confluenceTemplate.contentStructure', 'Content Structure')}
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>{t('confluenceTemplate.contentStructureDesc', 'Define the sections for your template')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDefaultStructure}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('confluenceTemplate.loadDefault', 'Load Default')}
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newStructureItem}
                  onChange={(e) => setNewStructureItem(e.target.value)}
                  placeholder={t('confluenceTemplate.addSectionPlaceholder', 'Add new section')}
                  onKeyDown={(e) => e.key === 'Enter' && addStructureItem()}
                />
                <Button onClick={addStructureItem} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(contentStructure || []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-sm">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStructureItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Multilingual Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('confluenceTemplate.multilingualSupport', 'Multilingual Support')}
              </CardTitle>
              <CardDescription>
                {t('confluenceTemplate.multilingualDesc', 'Select languages for multilingual templates (optional)')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchableSelect
                options={languageOptions}
                value={(selectedLanguages || [])[0] || ""}
                onValueChange={(value) => {
                  if (value && !(selectedLanguages || []).includes(value)) {
                    setSelectedLanguages([...(selectedLanguages || []), value]);
                  }
                }}
                placeholder={t('confluenceTemplate.selectLanguage', 'Select language to add')}
              />

              <div className="flex flex-wrap gap-2">
                {(selectedLanguages || []).map((langCode) => {
                  const language = LANGUAGES.find(l => l.code === langCode);
                  return (
                    <Badge key={langCode} variant="secondary">
                      {language?.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 ml-2"
                        onClick={() => setSelectedLanguages((selectedLanguages || []).filter(l => l !== langCode))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={generateTemplate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('confluenceTemplate.generating', 'Generating Template...')}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {t('confluenceTemplate.generateTemplate', 'Generate Template')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results and Actions */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('confluenceTemplate.actions', 'Actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!result}
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('confluenceTemplate.preview', 'Preview Template')}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportTemplate}
                disabled={!result}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('confluenceTemplate.export', 'Export Template')}
              </Button>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={importTemplate}
                  style={{ display: 'none' }}
                  id="import-file"
                />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('confluenceTemplate.import', 'Import Template')}
                </Button>
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => result && copyToClipboard(result.content)}
                disabled={!result}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('confluenceTemplate.copyContent', 'Copy Template Content')}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          {showHistory && history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('confluenceTemplate.recentTemplates', 'Recent Templates')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {history.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-secondary rounded cursor-pointer hover:bg-secondary/80"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {TEMPLATE_TYPES.find(t => t.id === item.templateType)?.name} • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Result Summary */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {t('confluenceTemplate.templateGenerated', 'Template Generated')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">{t('confluenceTemplate.title', 'Title')}</div>
                  <div className="text-sm text-muted-foreground">{result.title}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">{t('confluenceTemplate.type', 'Type')}</div>
                  <div className="text-sm text-muted-foreground">
                    {TEMPLATE_TYPES.find(t => t.id === result.metadata.templateType)?.name}
                  </div>
                </div>

                {result.macros.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">{t('confluenceTemplate.macros', 'Macros Used')}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(result.macros || []).map((macro, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {macro}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.tableOfContents && result.tableOfContents.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">{t('confluenceTemplate.tableOfContents', 'Table of Contents')}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.tableOfContents.length} sections
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('confluenceTemplate.templatePreview', 'Template Preview')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">{result.title}</h3>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded border overflow-auto max-h-96">
                {result.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}