import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/contexts/ConfigContext";
import { ChatGPTService } from "@/lib/chatgpt";
import { ModelSelector } from "@/components/ModelSelector";
import { Save, TestTube, Server, Key, Zap, CheckCircle2, Clock, Settings as SettingsIcon, RefreshCw, Shield, AlertTriangle, Trash2, Languages } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' }
];

export default function Settings() {
  const { t } = useTranslation();
  const { config, updateConfig, updateQueueConfig, saveConfig, loadAvailableModels, verifyModels, availableModels, changeLanguage } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [verifyingModels, setVerifyingModels] = useState(false);
  const [modelVerificationResult, setModelVerificationResult] = useState<{ validModels: unknown[], invalidModels: string[] } | null>(null);
  const [verificationProgress, setVerificationProgress] = useState<{ current: number, total: number } | null>(null);
  const { toast } = useToast();

  // Sync local config with global config on mount
  useEffect(() => {
    setLocalConfig(config);
    setHasUnsavedChanges(false);
  }, [config]);

  // Update local config and mark as changed
  const handleLocalConfigUpdate = (newConfig: Partial<typeof config>) => {
    setLocalConfig(prev => ({ ...prev, ...newConfig }));
    setHasUnsavedChanges(true);
  };

  // Update local queue config and mark as changed
  const handleLocalQueueConfigUpdate = (queueConfig: Partial<typeof config.queue>) => {
    setLocalConfig(prev => ({ 
      ...prev, 
      queue: { ...prev.queue, ...queueConfig }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save the local config directly to localStorage and update global state
      updateConfig(localConfig);
      await saveConfig(localConfig);
      
      setHasUnsavedChanges(false);
      toast({
        title: "Đã lưu cấu hình",
        description: "Cấu hình ChatGPT đã được lưu thành công (API Key được mã hóa).",
      });
    } catch (error) {
      console.error('Save config error:', error);
      toast({
        title: "Lỗi lưu cấu hình",
        description: error instanceof Error ? error.message : "Không thể lưu cấu hình. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasUnsavedChanges(false);
    toast({
      title: "Đã hoàn tác",
      description: "Các thay đổi chưa lưu đã được hoàn tác.",
    });
  };

  const handleTest = async () => {
    if (!localConfig.apiKey) {
      toast({
        title: "Chưa có API Key",
        description: "Vui lòng nhập API Key trước khi test.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      const chatGPT = new ChatGPTService(localConfig);
      await chatGPT.callAPI([
        { role: "user", content: "Say 'Hello, I am working correctly!' in Vietnamese" }
      ]);
      
      toast({
        title: "Kết nối thành công",
        description: "ChatGPT API đang hoạt động bình thường.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      toast({
        title: "Kết nối thất bại",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLoadModels = async () => {
    if (!localConfig.apiKey) {
      toast({
        title: "Chưa có API Key",
        description: "Vui lòng nhập API Key trước khi tải models.",
        variant: "destructive"
      });
      return;
    }

    setLoadingModels(true);
    setModelVerificationResult(null);

    try {
      const models = await loadAvailableModels();
      toast({
        title: "Tải models thành công",
        description: `Đã tải và lưu ${models.length} models vào localStorage.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      toast({
        title: "Lỗi tải models",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleVerifyModels = async () => {
    if (!localConfig.apiKey) {
      toast({
        title: "Chưa có API Key",
        description: "Vui lòng nhập API Key trước khi xác minh models.",
        variant: "destructive"
      });
      return;
    }

    if (availableModels.length === 0) {
      toast({
        title: "Không có models",
        description: "Vui lòng tải models trước khi xác minh.",
        variant: "destructive"
      });
      return;
    }

    setVerifyingModels(true);
    setVerificationProgress({ current: 0, total: availableModels.length });
    setModelVerificationResult(null);

    try {
      toast({
        title: "Bắt đầu xác minh models",
        description: `Đang thực hiện API test cho ${availableModels.length} models. Quá trình này có thể mất vài phút.`,
      });

      const result = await verifyModels();
      setModelVerificationResult(result);
      
      if (result.invalidModels.length > 0) {
        toast({
          title: "Tìm thấy models không hợp lệ",
          description: `${result.invalidModels.length} models không thể sử dụng và đã bị xóa. ${result.validModels.length} models hợp lệ.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Tất cả models hợp lệ",
          description: `Tất cả ${result.validModels.length} models đều đã được test thành công và có thể sử dụng.`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      toast({
        title: "Lỗi xác minh models",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setVerifyingModels(false);
      setVerificationProgress(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      {/* Language Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-primary" />
            <span>{t('settings.language')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.selectLanguage')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <Select
              value={config.language}
              onValueChange={changeLanguage}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Server Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-primary" />
            <span>{t('settings.chatgptConfig')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">{t('settings.serverUrl')}</Label>
              <Input
                id="serverUrl"
                value={localConfig.serverUrl}
                onChange={(e) => handleLocalConfigUpdate({ serverUrl: e.target.value })}
                placeholder={t('settings.serverUrlPlaceholder')}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <ModelSelector 
                value={localConfig.model}
                onChange={(value) => handleLocalConfigUpdate({ model: value })}
                label={t('settings.defaultModel')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>{t('settings.apiKey')}</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => handleLocalConfigUpdate({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{t('settingsHardcoded.modelParameters')}</span>
          </CardTitle>
          <CardDescription>
            {t('settingsHardcoded.modelParametersDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">{t('settingsHardcoded.maxTokens')}</Label>
              <Input
                id="maxTokens"
                type="number"
                value={localConfig.maxTokens}
                onChange={(e) => handleLocalConfigUpdate({ maxTokens: e.target.value })}
                min="100"
                max="8000"
                className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">{t('settingsHardcoded.maxTokensDesc')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">{t('settingsHardcoded.temperature')}</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={localConfig.temperature}
                onChange={(e) => handleLocalConfigUpdate({ temperature: e.target.value })}
                className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">{t('settingsHardcoded.temperatureDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Management */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>{t('settingsHardcoded.modelManagement')}</span>
          </CardTitle>
          <CardDescription>
            {t('settingsHardcoded.modelManagementDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('settingsHardcoded.cachedModels')}</Label>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('settingsHardcoded.modelCount')}
                  </span>
                  <Badge variant="secondary">
                    {availableModels.length}
                  </Badge>
                </div>
                {availableModels.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t('settingsHardcoded.lastUpdated')}{localStorage.getItem('ddl-tool-available-models') ? 
                      new Date(JSON.parse(localStorage.getItem('ddl-tool-available-models') || '[]')[0]?.created * 1000 || Date.now()).toLocaleString('vi-VN') 
                      : t('settingsHardcoded.noUpdate')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('settingsHardcoded.actions')}</Label>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadModels}
                  disabled={loadingModels || !config.apiKey}
                  className="justify-start"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingModels ? 'animate-spin' : ''}`} />
                  {loadingModels ? t('settingsHardcoded.loading') : t('settingsHardcoded.reloadModels')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyModels}
                  disabled={verifyingModels || !config.apiKey || availableModels.length === 0}
                  className="justify-start"
                >
                  <Shield className={`w-4 h-4 mr-2 ${verifyingModels ? 'animate-spin' : ''}`} />
                  {verifyingModels 
                    ? verificationProgress 
                      ? t('settingsHardcoded.testing', { current: verificationProgress.current, total: verificationProgress.total })
                      : t('settingsHardcoded.verifying')
                    : t('settingsHardcoded.verifyModels')
                  }
                </Button>
              </div>
            </div>
          </div>

          {/* Model Verification Results */}
          {modelVerificationResult && (
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-sm font-medium">{t('settingsHardcoded.verificationResults')}</Label>
              
              {modelVerificationResult.invalidModels.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>{t('settingsHardcoded.failedModels')}</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {modelVerificationResult.invalidModels.map((modelId, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            <Trash2 className="w-3 h-3 mr-1" />
                            {modelId}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs mt-2">
                        {t('settingsHardcoded.failedModelsDesc')}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <p>{t('settingsHardcoded.allModelsValid', { count: modelVerificationResult.validModels.length })}</p>
                    <p className="text-xs mt-1">{t('settingsHardcoded.allModelsValidDesc')}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <SettingsIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">{t('settingsHardcoded.instructions')}</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>{t('settingsHardcoded.reloadModels')}:</strong> {t('settingsHardcoded.reloadModelsInstr')}</li>
                  <li>• <strong>{t('settingsHardcoded.verifyModels')}:</strong> {t('settingsHardcoded.verifyModelsInstr')}</li>
                  <li>• {t('settingsHardcoded.autoRemoveInstr')}</li>
                  <li>• {t('settingsHardcoded.verificationTimeInstr')}</li>
                  <li>• {t('settingsHardcoded.periodicVerificationInstr')}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Queue Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>{t('settingsHardcoded.queueConfig')}</span>
          </CardTitle>
          <CardDescription>
            {t('settingsHardcoded.queueConfigDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="queue-enabled" className="text-base">
                {t('settingsHardcoded.enableQueue')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settingsHardcoded.enableQueueDesc')}
              </p>
            </div>
            <Switch
              id="queue-enabled"
              checked={localConfig.queue.enabled}
              onCheckedChange={(enabled) => handleLocalQueueConfigUpdate({ enabled })}
            />
          </div>
          
          {localConfig.queue.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delayMs">{t('settingsHardcoded.delayBetweenRequests')}</Label>
                <Input
                  id="delayMs"
                  type="number"
                  value={localConfig.queue.delayMs}
                  onChange={(e) => handleLocalQueueConfigUpdate({ delayMs: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="5000"
                  step="100"
                  className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">
                  {t('settingsHardcoded.delayBetweenRequestsDesc')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxConcurrent">{t('settingsHardcoded.maxConcurrentRequests')}</Label>
                <Input
                  id="maxConcurrent"
                  type="number"
                  value={localConfig.queue.maxConcurrent}
                  onChange={(e) => handleLocalQueueConfigUpdate({ maxConcurrent: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
                  className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">
                  {t('settingsHardcoded.maxConcurrentRequestsDesc')}
                </p>
              </div>
            </div>
          )}
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <SettingsIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">{t('settingsHardcoded.recommendedConfig')}</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>{t('settingsHardcoded.openaiConfig')}</strong></li>
                  <li>• <strong>{t('settingsHardcoded.localConfig')}</strong></li>
                  <li>• <strong>{t('settingsHardcoded.rateLimitedConfig')}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges ? (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t('settingsHardcoded.unsavedChanges')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary-glow/10 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />
              {t('settingsHardcoded.saved')}
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !localConfig.apiKey}
            className="transition-all"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? t('settingsHardcoded.testing') : t('settingsHardcoded.testConnection')}
          </Button>
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('settingsHardcoded.undo')}
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges || saving}
            className={hasUnsavedChanges ? "bg-gradient-to-r from-primary to-primary-glow" : ""}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
                {t('settingsHardcoded.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? t('settingsHardcoded.saveChanges') : t('settingsHardcoded.saved')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
