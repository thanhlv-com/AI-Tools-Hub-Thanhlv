import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/contexts/ConfigContext";
import { Brain, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const getModelColor = (modelId: string): string => {
  if (modelId.includes('gpt-4')) return "bg-red-500";
  if (modelId.includes('gpt-3.5')) return "bg-green-500";
  if (modelId.includes('claude')) return "bg-purple-500";
  return "bg-blue-500";
};

const getModelDescription = (modelId: string): string => {
  if (modelId.includes('gpt-4-turbo')) return "Cân bằng tốc độ và chất lượng";
  if (modelId.includes('gpt-4') && !modelId.includes('turbo')) return "Mạnh nhất, chậm hơn";
  if (modelId.includes('gpt-3.5')) return "Nhanh, tiết kiệm";
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
      setError("Chưa cấu hình API Key");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const models = await loadAvailableModels();
      
      if (models.length > 0) {
        toast({
          title: "Đã tải models",
          description: `Tải thành công ${models.length} models và lưu vào localStorage`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(errorMessage);
      toast({
        title: "Lỗi tải models",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [config.apiKey, loadAvailableModels, toast]);

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

  // Models are now loaded from localStorage on mount via ConfigContext
  // Manual loading can be triggered by the refresh button

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
            Default
          </Badge>
        )}
        {showDefault && isUsingPageSpecific && (
          <Badge variant="outline" className="text-xs">
            <Brain className="w-3 h-3 mr-1" />
            Page Specific
          </Badge>
        )}
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <Select value={currentValue} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getModelColor(model.id)}`} />
                      <div className="flex flex-col">
                        <span className="font-medium">{model.id}</span>
                        <span className="text-xs text-muted-foreground">{getModelDescription(model.id)}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={config.model}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getModelColor(config.model)}`} />
                    <div className="flex flex-col">
                      <span className="font-medium">{config.model}</span>
                      <span className="text-xs text-muted-foreground">Default model</span>
                    </div>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
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
              ? `Sử dụng model mặc định: ${config.model}` 
              : isUsingPageSpecific
                ? "Đã chọn model riêng cho trang này"
                : "Model đã được chọn"
            }
          </p>
          {pageId && isUsingPageSpecific && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              Reset về mặc định
            </Button>
          )}
        </div>
      )}
    </div>
  );
}