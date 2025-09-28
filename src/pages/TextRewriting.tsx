import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldSession } from "@/hooks/usePageSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { RewritingRequest, RewritingResult } from "@/types/rewriting";
import { WRITING_STYLES, WRITING_TONES, WRITING_LENGTHS, WRITING_COMPLEXITIES, OUTPUT_LANGUAGES } from "@/data/rewriting";
import {
  PenTool,
  Play,
  Copy,
  FileText,
  Zap,
  Settings as SettingsIcon,
  Settings,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wand2,
  Palette,
  History,
  X,
  Target,
  Layers,
  Volume2
} from "lucide-react";

const PAGE_ID = "text-rewriting";

export default function TextRewriting() {
  const { t } = useTranslation();

  // Create options for SearchableSelect components
  const styleOptions: SearchableSelectOption[] = WRITING_STYLES.map(style => ({
    value: style.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{style.icon}</span>
        <span>{t(`writingStyles.${style.id}`)}</span>
      </div>
    ),
    searchText: `${t(`writingStyles.${style.id}`)} ${t(`writingStyleDescriptions.${style.id}`)}`
  }));

  const toneOptions: SearchableSelectOption[] = WRITING_TONES.map(tone => ({
    value: tone.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{tone.icon}</span>
        <span>{t(`writingTones.${tone.id}`)}</span>
      </div>
    ),
    searchText: `${t(`writingTones.${tone.id}`)} ${t(`writingToneDescriptions.${tone.id}`)}`
  }));

  const lengthOptions: SearchableSelectOption[] = WRITING_LENGTHS.map(length => ({
    value: length.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{length.icon}</span>
        <span>{t(`writingLengths.${length.id}`)}</span>
      </div>
    ),
    searchText: `${t(`writingLengths.${length.id}`)} ${t(`writingLengthDescriptions.${length.id}`)}`
  }));

  const complexityOptions: SearchableSelectOption[] = WRITING_COMPLEXITIES.map(complexity => ({
    value: complexity.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{complexity.icon}</span>
        <span>{t(`writingComplexities.${complexity.id}`)}</span>
        <Badge variant="outline" className="text-xs ml-1">
          {complexity.level}
        </Badge>
      </div>
    ),
    searchText: `${t(`writingComplexities.${complexity.id}`)} ${t(`writingComplexityDescriptions.${complexity.id}`)} ${complexity.level}`
  }));

  const outputLanguageOptions: SearchableSelectOption[] = OUTPUT_LANGUAGES.map(lang => ({
    value: lang.code,
    label: (
      <div className="flex items-center space-x-2">
        <span>{lang.flag}</span>
        <span>{lang.name}</span>
      </div>
    ),
    searchText: `${lang.name} ${lang.nativeName} ${lang.code}`
  }));

  // Session-persisted state
  const [originalText, setOriginalText] = useFieldSession(PAGE_ID, "originalText", "");
  const [writingStyle, setWritingStyle] = useFieldSession(PAGE_ID, "writingStyle", "professional");
  const [writingTone, setWritingTone] = useFieldSession(PAGE_ID, "writingTone", "neutral");
  const [writingLength, setWritingLength] = useFieldSession(PAGE_ID, "writingLength", "same");
  const [writingComplexity, setWritingComplexity] = useFieldSession(PAGE_ID, "writingComplexity", "moderate");
  const [outputLanguage, setOutputLanguage] = useFieldSession(PAGE_ID, "outputLanguage", "original");
  const [customInstructions, setCustomInstructions] = useFieldSession(PAGE_ID, "customInstructions", "");
  const [rewritingResult, setRewritingResult] = useFieldSession(PAGE_ID, "rewritingResult", null);

  // Temporary state (not persisted)
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const { config, getPageModel, addToRewritingHistory } = useConfig();
  const { toast } = useToast();

  const handleRewrite = async () => {
    if (!originalText.trim()) {
      toast({
        title: t('textRewriting.missingText'),
        description: t('textRewriting.missingTextDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t('textRewriting.noApiKey'),
        description: t('textRewriting.noApiKeyDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);
    setError("");
    setRewritingResult(null);

    try {
      const chatGPT = new ChatGPTService(config);
      const pageModel = getPageModel(PAGE_ID);
      const modelToUse = pageModel || config.model;

      const request: RewritingRequest = {
        text: originalText,
        style: writingStyle,
        tone: writingTone,
        length: writingLength,
        complexity: writingComplexity,
        outputLanguage,
        customInstructions: customInstructions || undefined,
        model: pageModel || undefined
      };

      const result = await chatGPT.rewriteText(request);
      setRewritingResult(result);

      // Save to history
      const historyTitle = `${getStyleInfo(writingStyle).name} + ${getToneInfo(writingTone).name} - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;

      addToRewritingHistory({
        title: historyTitle,
        originalText,
        rewrittenText: result.rewrittenText,
        style: writingStyle,
        tone: writingTone,
        length: writingLength,
        complexity: writingComplexity,
        outputLanguage,
        customInstructions: customInstructions || undefined,
        model: modelToUse
      });

      toast({
        title: t('common.success'),
        description: `${t('textRewriting.textRewrittenSuccess')} ${modelToUse}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('textRewriting.unknownError');
      setError(errorMessage);

      toast({
        title: t('textRewriting.rewritingError'),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: t('textRewriting.textCopied'),
    });
  };

  const getStyleInfo = (id: string) => {
    const style = WRITING_STYLES.find(style => style.id === id) || WRITING_STYLES[0];
    return {
      ...style,
      name: t(`writingStyles.${style.id}`),
      description: t(`writingStyleDescriptions.${style.id}`)
    };
  };

  const getToneInfo = (id: string) => {
    const tone = WRITING_TONES.find(tone => tone.id === id) || WRITING_TONES[0];
    return {
      ...tone,
      name: t(`writingTones.${tone.id}`),
      description: t(`writingToneDescriptions.${tone.id}`)
    };
  };

  const getLengthInfo = (id: string) => {
    const length = WRITING_LENGTHS.find(length => length.id === id) || WRITING_LENGTHS[2]; // default to same
    return {
      ...length,
      name: t(`writingLengths.${length.id}`),
      description: t(`writingLengthDescriptions.${length.id}`)
    };
  };

  const getComplexityInfo = (id: string) => {
    const complexity = WRITING_COMPLEXITIES.find(complexity => complexity.id === id) || WRITING_COMPLEXITIES[1]; // default to moderate
    return {
      ...complexity,
      name: t(`writingComplexities.${complexity.id}`),
      description: t(`writingComplexityDescriptions.${complexity.id}`)
    };
  };

  const getLanguageInfo = (code: string) => {
    const lang = OUTPUT_LANGUAGES.find(lang => lang.code === code) || OUTPUT_LANGUAGES[0]; // default to original
    return lang;
  };

  const currentStyle = getStyleInfo(writingStyle);
  const currentTone = getToneInfo(writingTone);
  const currentLength = getLengthInfo(writingLength);
  const currentComplexity = getComplexityInfo(writingComplexity);
  const currentLanguage = getLanguageInfo(outputLanguage);

  return (
    <div className="relative">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <PenTool className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>{t('textRewriting.title')}</span>
            </h1>
            <p className="text-muted-foreground">
              {t('textRewriting.description')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>{t('textRewriting.history')}</span>
            </Button>
          </div>
        </div>

        {/* Configuration Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span>{t('textRewriting.rewritingConfig')}</span>
            </CardTitle>
            <CardDescription>
              {t('textRewriting.rewritingConfigDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Writing Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('textRewriting.styleAndToneLabel')}</Label>
                </div>

                {/* Writing Style */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.styleLabel')}</Label>
                  <SearchableSelect
                    value={writingStyle}
                    onValueChange={setWritingStyle}
                    options={styleOptions}
                    placeholder={t('textRewriting.selectStyle')}
                    searchPlaceholder={t('textRewriting.searchStyles')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {currentStyle.description}
                  </div>
                </div>

                {/* Writing Tone */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.toneLabel')}</Label>
                  <SearchableSelect
                    value={writingTone}
                    onValueChange={setWritingTone}
                    options={toneOptions}
                    placeholder={t('textRewriting.selectTone')}
                    searchPlaceholder={t('textRewriting.searchTones')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {currentTone.description}
                  </div>
                </div>
              </div>

              {/* Length & Complexity */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Layers className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('textRewriting.lengthAndComplexityLabel')}</Label>
                </div>

                {/* Writing Length */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.lengthLabel')}</Label>
                  <SearchableSelect
                    value={writingLength}
                    onValueChange={setWritingLength}
                    options={lengthOptions}
                    placeholder={t('textRewriting.selectLength')}
                    searchPlaceholder={t('textRewriting.searchLengths')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {currentLength.description}
                  </div>
                </div>

                {/* Writing Complexity */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.complexityLabel')}</Label>
                  <SearchableSelect
                    value={writingComplexity}
                    onValueChange={setWritingComplexity}
                    options={complexityOptions}
                    placeholder={t('textRewriting.selectComplexity')}
                    searchPlaceholder={t('textRewriting.searchComplexity')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentComplexity.icon}</span>
                      <span className="font-medium">{currentComplexity.name}</span>
                      <Badge variant="secondary" className="text-xs ml-1">
                        {currentComplexity.level}
                      </Badge>
                    </div>
                    <span>{currentComplexity.description}</span>
                  </div>
                </div>
              </div>

              {/* Model & Custom Instructions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('textRewriting.modelAndInstructionsLabel')}</Label>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.aiModel')}</Label>
                  <ModelSelector
                    pageId={PAGE_ID}
                    label=""
                    showDefault={true}
                  />
                </div>

                <Separator />

                {/* Output Language */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.outputLanguage')}</Label>
                  <SearchableSelect
                    value={outputLanguage}
                    onValueChange={setOutputLanguage}
                    options={outputLanguageOptions}
                    placeholder={t('textRewriting.selectOutputLanguage')}
                    searchPlaceholder={t('common.search')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <span>{currentLanguage.flag}</span>
                      <span className="font-medium">{currentLanguage.name}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('textRewriting.customInstructionsOptional')}</Label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder={t('textRewriting.customInstructionsPlaceholder')}
                    className="h-20 text-sm"
                  />
                </div>

                {/* Configuration Summary */}
                <div className="bg-muted/20 p-3 rounded-lg space-y-2">
                  <Label className="text-sm font-medium">{t('textRewriting.currentConfig')}</Label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('textRewriting.styleField')}</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentStyle.icon}</span>
                        <span>{currentStyle.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('textRewriting.toneField')}</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentTone.icon}</span>
                        <span>{currentTone.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('textRewriting.language')}:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentLanguage.flag}</span>
                        <span>{currentLanguage.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('textRewriting.modelField')}</span>
                      <span>{getPageModel(PAGE_ID) || config.model}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Input/Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Text */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>{t('textRewriting.originalTextTitle')}</span>
              </CardTitle>
              <CardDescription>
                {t('textRewriting.originalTextDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder={t('textRewriting.originalTextPlaceholder')}
                className="min-h-[300px] text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {originalText.length} {t('textRewriting.charactersCount')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(originalText)}
                  disabled={!originalText}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {t('textRewriting.copy')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rewritten Text */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-green-500" />
                <span>{t('textRewriting.rewrittenTextTitle')}</span>
              </CardTitle>
              <CardDescription>
                {t('textRewriting.rewrittenTextDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[300px]">
                {!rewritingResult ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <PenTool className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('textRewriting.rewrittenTextPlaceholder')}</p>
                    <p className="text-sm">{t('textRewriting.rewrittenTextHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {rewritingResult.rewrittenText}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>{rewritingResult.rewrittenText.length} {t('textRewriting.charactersCount')}</span>
                        {rewritingResult.metadata && (
                          <span>
                            {Math.round((rewritingResult.metadata.rewrittenLength / rewritingResult.metadata.originalLength) * 100)}{t('textRewriting.ofOriginal')}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(rewritingResult.rewrittenText)}
                        className="h-6"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {t('textRewriting.copy')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewrite Button */}
        <div className="flex flex-col items-center space-y-4">
          {!config.apiKey && (
            <Card className="w-full max-w-2xl border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">{t('textRewriting.configureApiKey')}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('textRewriting.configureApiKeyDesc')}
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleRewrite}
            disabled={isRewriting || !originalText.trim() || !config.apiKey}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow shadow-elegant hover:shadow-glow transition-all"
          >
            {isRewriting ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-spin" />
                {t('textRewriting.rewriting')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {t('textRewriting.rewriteText')}
                <PenTool className="w-5 h-5 ml-2" />
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
                <span>{t('textRewriting.errorTitle')}</span>
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
                {t('textRewriting.close')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Rewriting Summary */}
        {rewritingResult && (
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>{t('textRewriting.rewritingSummary')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.styleField')}</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentStyle.icon}</span>
                    <span className="font-medium">{currentStyle.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.toneField')}</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentTone.icon}</span>
                    <span className="font-medium">{currentTone.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.lengthField')}</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentLength.icon}</span>
                    <span className="font-medium">{currentLength.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.modelField')}</span>
                  <p className="font-medium mt-1">{getPageModel(PAGE_ID) || config.model}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.originalField')}</span>
                  <p className="font-medium mt-1">{originalText.length} {t('textRewriting.chars')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('textRewriting.rewrittenField')}</span>
                  <p className="font-medium mt-1">{rewritingResult.rewrittenText.length} {t('textRewriting.chars')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}