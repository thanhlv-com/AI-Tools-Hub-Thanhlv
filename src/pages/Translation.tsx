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

// Helper functions to get localized names
const getLocalizedLanguageName = (langCode: string, t: (key: string) => string) => {
  const translatedName = t(`languages.${langCode}`);
  // Fallback to original name if translation doesn't exist
  const lang = LANGUAGES.find(l => l.code === langCode);
  return translatedName !== `languages.${langCode}` ? translatedName : lang?.nativeName || langCode;
};

const getLocalizedProficiencyName = (proficiencyId: string, t: (key: string) => string) => {
  const translatedName = t(`translationProficiencies.${proficiencyId}`);
  // Fallback to original name if translation doesn't exist
  const proficiency = TRANSLATION_PROFICIENCIES.find(p => p.id === proficiencyId);
  return translatedName !== `translationProficiencies.${proficiencyId}` ? translatedName : proficiency?.name || proficiencyId;
};

const getLocalizedEmoticonName = (emoticonId: string, t: (key: string) => string) => {
  const translatedName = t(`emoticonOptions.${emoticonId}`);
  // Fallback to original name if translation doesn't exist
  const emoticon = EMOTICON_OPTIONS.find(e => e.id === emoticonId);
  return translatedName !== `emoticonOptions.${emoticonId}` ? translatedName : emoticon?.name || emoticonId;
};

// Note: Options are now created dynamically inside the component with i18n support

export default function Translation() {
  const { t } = useTranslation();
  
  // Create options for SearchableSelect components with i18n support
  const languageOptions: SearchableSelectOption[] = LANGUAGES.map(lang => ({
    value: lang.code,
    label: (
      <div className="flex items-center space-x-2">
        <span>{lang.flag}</span>
        <span>{getLocalizedLanguageName(lang.code, t)}</span>
      </div>
    ),
    searchText: `${getLocalizedLanguageName(lang.code, t)} ${lang.nativeName} ${lang.code}`
  }));

  const styleOptions: SearchableSelectOption[] = TRANSLATION_STYLES.map(style => ({
    value: style.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{style.icon}</span>
        <span>{t(`translationStyles.${style.id}`)}</span>
      </div>
    ),
    searchText: `${t(`translationStyles.${style.id}`)} ${style.description}`
  }));

  const targetLanguageOptions: SearchableSelectOption[] = LANGUAGES
    .filter(lang => lang.code !== "auto")
    .map(lang => ({
      value: lang.code,
      label: (
        <div className="flex items-center space-x-2">
          <span>{lang.flag}</span>
          <span>{getLocalizedLanguageName(lang.code, t)}</span>
        </div>
      ),
      searchText: `${getLocalizedLanguageName(lang.code, t)} ${lang.nativeName} ${lang.code}`
    }));

  const proficiencyOptions: SearchableSelectOption[] = TRANSLATION_PROFICIENCIES.map(prof => ({
    value: prof.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{prof.icon}</span>
        <span>{getLocalizedProficiencyName(prof.id, t)}</span>
        <Badge variant="outline" className="text-xs ml-1">
          {prof.level}
        </Badge>
      </div>
    ),
    searchText: `${getLocalizedProficiencyName(prof.id, t)} ${prof.description} ${prof.level}`
  }));

  const emoticonOptions: SearchableSelectOption[] = EMOTICON_OPTIONS.map(option => ({
    value: option.id,
    label: (
      <div className="flex items-center space-x-2">
        <span>{option.icon}</span>
        <span className="truncate">{getLocalizedEmoticonName(option.id, t)}</span>
      </div>
    ),
    searchText: `${getLocalizedEmoticonName(option.id, t)} ${option.description}`
  }));

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
        title: t('translation.missingText'),
        description: t('translation.missingTextDesc'),
        variant: "destructive"
      });
      return;
    }

    if (targetLanguages.some(lang => lang === sourceLanguage) && sourceLanguage !== "auto") {
      toast({
        title: t('translation.duplicateLanguage'),
        description: t('translation.duplicateLanguageDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t('translation.noApiKey'),
        description: t('translation.noApiKeyDesc'),
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
      const sourceLanguageName = getLocalizedLanguageName(sourceLanguage, t);
      const historyTitle = `${sourceLanguageName} → ${targetLanguages.length} ${t('translation.targetLanguages')} - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
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
        title: t('common.success'),
        description: t('translation.successCount', { count: successCount, total: targetLanguages.length, model: modelToUse }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      setError(errorMessage);
      
      toast({
        title: t('translation.translationError'),
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
        title: t('translation.cannotSwap'),
        description: t('translation.cannotSwapDesc'),
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
        title: t('translation.missingText'),
        description: t('translation.missingTextDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!config.apiKey) {
      toast({
        title: t('translation.noApiKey'),
        description: t('translation.noApiKeyDesc'),
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
          title: t('translation.error'),
          description: `${t('translation.error')}: ${newResult.error}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('translation.retrySuccess'),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      
      // Update result with error
      setTranslationResults(prev => 
        prev.map(result => 
          result.language === targetLanguage 
            ? { ...result, error: errorMessage, translatedText: "" }
            : result
        )
      );

      toast({
        title: t('translation.retryFailed'),
        description: `${t('translation.retryFailed')}: ${errorMessage}`,
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
      title: t('translation.loadedFromHistory'),
      description: t('translation.loadedFromHistoryDesc', { title: historyItem.title }),
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
      title: t('common.copied'),
      description: t('translation.translationCopied'),
    });
  };

  const copyAllTranslations = () => {
    const successfulTranslations = translationResults.filter(r => !r.error);
    if (successfulTranslations.length === 0) {
      toast({
        title: t('translation.noTranslationsToCopy'),
        description: t('translation.noTranslationsToCopyDesc'),
        variant: "destructive"
      });
      return;
    }

    const allTranslationsText = successfulTranslations
      .map(result => {
        const langInfo = getLanguageInfo(result.language);
        return `${langInfo.flag} ${langInfo.name}:\n${result.translatedText}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(allTranslationsText);
    toast({
      title: t('common.copied'),
      description: t('translation.allTranslationsCopied', { count: successfulTranslations.length }),
    });
  };

  const getLanguageInfo = (code: string) => {
    const lang = LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
    return {
      ...lang,
      name: getLocalizedLanguageName(code, t)
    };
  };

  const getStyleInfo = (id: string) => {
    const style = TRANSLATION_STYLES.find(style => style.id === id) || TRANSLATION_STYLES[0];
    return {
      ...style,
      name: t(`translationStyles.${id}`) !== `translationStyles.${id}` ? t(`translationStyles.${id}`) : style.name
    };
  };

  const getProficiencyInfo = (id: string) => {
    const prof = TRANSLATION_PROFICIENCIES.find(prof => prof.id === id) || TRANSLATION_PROFICIENCIES[2]; // default to intermediate
    return {
      ...prof,
      name: getLocalizedProficiencyName(id, t)
    };
  };

  const getEmoticonInfo = (id: string) => {
    const emoticon = EMOTICON_OPTIONS.find(emoticon => emoticon.id === id) || EMOTICON_OPTIONS[0]; // default to keep-original
    return {
      ...emoticon,
      name: getLocalizedEmoticonName(id, t)
    };
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
              <span>{t('translation.title')}</span>
            </h1>
            <p className="text-muted-foreground">
              {t('translation.description')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>{t('translation.configuration')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>{t('translation.history')}</span>
            </Button>
          </div>
        </div>

        {/* Configuration Section - Optimized Layout */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <span>{t('translation.translationConfig')}</span>
            </CardTitle>
            <CardDescription>
              {t('translation.translationConfigDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Languages Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('translation.sourceLanguage')}</Label>
                </div>
                
                {/* Source Language */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('translation.sourceLabel')}</Label>
                  <SearchableSelect
                    value={sourceLanguage}
                    onValueChange={setSourceLanguage}
                    options={languageOptions}
                    placeholder={t('translation.selectLanguages')}
                    searchPlaceholder={t('common.search')}
                    className="h-9"
                  />
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwapLanguages}
                    disabled={sourceLanguage === "auto" || targetLanguages.length !== 1}
                    className="w-8 h-8 p-0"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                </div>

                {/* Target Languages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      {t('translation.targetLabel', { count: targetLanguages.length })}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTargetLanguage}
                      disabled={targetLanguages.length >= 10}
                      className="h-6 px-2"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {targetLanguages.map((langCode, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <SearchableSelect
                          value={langCode}
                          onValueChange={(value) => updateTargetLanguage(index, value)}
                          options={targetLanguageOptions}
                          placeholder={t('translation.selectLanguages')}
                          searchPlaceholder={t('common.search')}
                          className="h-8 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTargetLanguage(index)}
                          disabled={targetLanguages.length <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Translation Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('translation.preferences')}</Label>
                </div>

                {/* Translation Style */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('translation.styleLabel')}</Label>
                  <SearchableSelect
                    value={translationStyle}
                    onValueChange={setTranslationStyle}
                    options={styleOptions}
                    placeholder={t('translation.selectStyle')}
                    searchPlaceholder={t('common.search')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {currentStyle.description}
                  </div>
                </div>

                {/* Proficiency Level */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('translation.proficiencyLabel')}</Label>
                  <SearchableSelect
                    value={translationProficiency}
                    onValueChange={setTranslationProficiency}
                    options={proficiencyOptions}
                    placeholder={t('translation.selectProficiency')}
                    searchPlaceholder={t('common.search')}
                    className="h-9"
                  />
                </div>

                {/* Emoticon Options */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('translation.emoticonLabel')}</Label>
                  <SearchableSelect
                    value={emoticonOption}
                    onValueChange={setEmoticonOption}
                    options={emoticonOptions}
                    placeholder={t('translation.selectEmoticons')}
                    searchPlaceholder={t('common.search')}
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span>{currentEmoticonOption.icon}</span>
                      <span className="font-medium">{currentEmoticonOption.name}</span>
                    </div>
                    <span>{currentEmoticonOption.description}</span>
                  </div>
                </div>
              </div>

              {/* Model & Summary */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <Label className="font-medium">{t('translation.modelSummary')}</Label>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('translation.aiModel')}</Label>
                  <ModelSelector 
                    pageId={PAGE_ID}
                    label=""
                    showDefault={true}
                  />
                </div>

                <Separator />

                {/* Configuration Summary */}
                <div className="bg-muted/20 p-3 rounded-lg space-y-2">
                  <Label className="text-sm font-medium">{t('translation.currentConfig')}</Label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('translation.sourceLabel')}:</span>
                      <div className="flex items-center space-x-1">
                        <span>{getLanguageInfo(sourceLanguage).flag}</span>
                        <span>{getLanguageInfo(sourceLanguage).name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('translation.targetLanguages')}:</span>
                      <span>{targetLanguages.length} {t('translation.targetLanguages')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('translation.styleLabel')}:</span>
                      <div className="flex items-center space-x-1">
                        <span>{currentStyle.icon}</span>
                        <span>{currentStyle.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('translation.model')}:</span>
                      <span>{getPageModel(PAGE_ID) || config.model}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>{t('translation.sourceText')}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({getLanguageInfo(sourceLanguage).flag} {getLanguageInfo(sourceLanguage).name})
                </span>
              </CardTitle>
              <CardDescription>
                {t('translation.sourceText')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={`${t('translation.sourceTextPlaceholder')}

${t('translation.examples')}:
- ${t('translation.exampleText1')}
- ${t('translation.exampleText2')}
- ${t('translation.exampleText3')}
- ${t('translation.exampleText4')}`}
                className="min-h-[300px] text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {t('translation.characterCount', { count: sourceText.length })}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sourceText)}
                  disabled={!sourceText}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {t('common.copy')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translation Results */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-green-500" />
                  <span>{t('translation.translationResults')}</span>
                  <Badge variant="outline" className="text-xs">
                    {targetLanguages.length} {t('translation.targetLanguages')}
                  </Badge>
                </CardTitle>
                {translationResults.length > 0 && translationResults.some(r => !r.error) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllTranslations}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('translation.copyAll')}</span>
                  </Button>
                )}
              </div>
              <CardDescription>
                {t('translation.results')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {translationResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Languages className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('translation.translationResultsDesc')}</p>
                    <p className="text-sm">{t('translation.noResults')}</p>
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
                              title={result.error ? t('translation.translate') : t('translation.translate')}
                            >
                              <RefreshCw className={`w-3 h-3 ${retryingLanguages.has(result.language) ? 'animate-spin' : ''}`} />
                            </Button>
                            {!result.error && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(result.translatedText)}
                                className="h-6 px-2"
                                title={t('common.copy')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {retryingLanguages.has(result.language) ? (
                          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded flex items-center space-x-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>{t('translation.translating')}</span>
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
                            t('common.loading')
                          ) : result.error ? (
                            t('translation.error')
                          ) : (
                            t('translation.characterCount', { count: result.translatedText.length })
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
                  <span className="font-medium">{t('translation.configureApiKey')}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('translation.configureApiKeyDesc')}
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
                {t('translation.translating')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {t('translation.translateButton')}
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
                <span>{t('translation.error')}</span>
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
                {t('translation.closeButton')}
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
                <span>{t('translation.translationSummary')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('translation.styleLabel')}:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentStyle.icon}</span>
                    <span className="font-medium">{currentStyle.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('translation.emoticons')}:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span>{currentEmoticonOption.icon}</span>
                    <span className="font-medium">{currentEmoticonOption.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('translation.model')}:</span>
                  <p className="font-medium mt-1">{getPageModel(PAGE_ID) || config.model}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('translation.sourceLabel')}:</span>
                  <p className="font-medium mt-1">{t('translation.characterCount', { count: sourceText.length })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('common.success')}:</span>
                  <p className="font-medium mt-1 text-green-600">
                    {translationResults.filter(r => !r.error).length}/{translationResults.length}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('translation.timeLabel')}:</span>
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
                <span>{t('translation.history')}</span>
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
                <span>{t('translation.preferenceConfig')}</span>
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