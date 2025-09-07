import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/contexts/ConfigContext";
import { Brain, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const getModelColor = (modelId: string): string => {
  if (modelId.includes('gpt-4')) return "bg-red-500";
  if (modelId.includes('gpt-3.5')) return "bg-green-500";
  if (modelId.includes('claude')) return "bg-purple-500";
  return "bg-blue-500";
};

const getModelDescription = (modelId: string, t: (key: string) => string): string => {
  if (modelId.includes('gpt-4-turbo')) return "Balanced speed and quality";
  if (modelId.includes('gpt-4') && !modelId.includes('turbo')) return "Most powerful, slower";
  if (modelId.includes('gpt-3.5')) return "Fast, economical";
  if (modelId.includes('claude')) return "Anthropic Claude model";
  return "OpenAI model";
};

interface ModelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  showDefault?: boolean;
  className?: string;
  pageId?: string;
}

export function ModelSelector({ 
  value, 
  onChange, 
  label = "Model", 
  showDefault = false,
  className = "",
  pageId
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const { config, availableModels, setAvailableModels, loadAvailableModels, getPageModel, setPageModel, removePageModel } = useConfig();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Get the current value from props, page-specific storage, or global config
  const currentValue = useMemo(() => {
    if (value) return value;
    if (pageId) {
      const pageModel = getPageModel(pageId);
      if (pageModel) return pageModel;
    }
    return config.model;
  }, [value, pageId, getPageModel, config.model]);
  
  const isUsingDefault = useMemo(() => 
    !value && (!pageId || !getPageModel(pageId)), 
    [value, pageId, getPageModel]
  );
  
  const isUsingPageSpecific = useMemo(() => 
    pageId && getPageModel(pageId) !== null, 
    [pageId, getPageModel]
  );

  // Load available models from server using the context function
  const loadModels = useCallback(async () => {
    if (!config.apiKey) {
      setError(t('settings.apiKey'));
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const models = await loadAvailableModels();
      
      if (models.length > 0) {
        toast({
          title: t('common.success'),
          description: `${t('common.success')} ${models.length} models`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [config.apiKey, loadAvailableModels, toast, t]);

  // Handle model change
  const handleModelChange = (newModel: string) => {
    if (pageId) {
      setPageModel(pageId, newModel);
    }
    if (onChange) {
      onChange(newModel);
    }
  };

  // Reset to default model
  const handleResetToDefault = () => {
    if (pageId) {
      removePageModel(pageId);
      if (onChange) {
        onChange("");
      }
    }
  };

  // Create options for SearchableSelect
  const modelOptions: SearchableSelectOption[] = React.useMemo(() => {
    const options = availableModels.length > 0 
      ? availableModels.map((model) => ({
          value: model.id,
          label: (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getModelColor(model.id)}`} />
              <div className="flex flex-col">
                <span className="font-medium">{model.id}</span>
                <span className="text-xs text-muted-foreground">{getModelDescription(model.id, t)}</span>
              </div>
            </div>
          ),
          searchText: `${model.id} ${getModelDescription(model.id)}`
        }))
      : [{
          value: config.model,
          label: (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getModelColor(config.model)}`} />
              <div className="flex flex-col">
                <span className="font-medium">{config.model}</span>
                <span className="text-xs text-muted-foreground">{t('settings.defaultModel')}</span>
              </div>
            </div>
          ),
          searchText: `${config.model} ${t('settings.defaultModel')}`
        }];
    
    return options;
  }, [availableModels, config.model, t]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-primary" />
          <span>{label}</span>
        </Label>
        {showDefault && isUsingDefault && (
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {t('settings.defaultModel')}
          </Badge>
        )}
        {showDefault && isUsingPageSpecific && (
          <Badge variant="outline" className="text-xs">
            <Brain className="w-3 h-3 mr-1" />
            {t('common.select')}
          </Badge>
        )}
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <SearchableSelect
            value={currentValue}
            onValueChange={handleModelChange}
            options={modelOptions}
            placeholder={t('settings.selectModel')}
            searchPlaceholder={t('common.search')}
            disabled={!config.apiKey}
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadModels}
          disabled={isLoading || !config.apiKey}
          className="px-3"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-xs text-destructive mt-1">
          <AlertTriangle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
      
      {showDefault && (
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {isUsingDefault 
              ? `${t('settings.defaultModel')}: ${config.model}` 
              : isUsingPageSpecific
                ? t('settings.selectModel')
                : t('settings.selectModel')
            }
          </p>
          {pageId && isUsingPageSpecific && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}