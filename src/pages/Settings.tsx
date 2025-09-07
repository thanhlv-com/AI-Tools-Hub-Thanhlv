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
            <span>Tham số Model</span>
          </CardTitle>
          <CardDescription>
            Điều chỉnh các tham số để tối ưu hóa kết quả phân tích DDL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={localConfig.maxTokens}
                onChange={(e) => handleLocalConfigUpdate({ maxTokens: e.target.value })}
                min="100"
                max="8000"
                className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">Số token tối đa cho response</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
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
              <p className="text-xs text-muted-foreground">Mức độ sáng tạo (0.0 - 2.0)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Management */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <span>Quản lý Models</span>
          </CardTitle>
          <CardDescription>
            Tải, lưu trữ và xác minh tính khả dụng của các models AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Models đã lưu trong cache</Label>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Số lượng models: 
                  </span>
                  <Badge variant="secondary">
                    {availableModels.length}
                  </Badge>
                </div>
                {availableModels.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Cập nhật lần cuối: {localStorage.getItem('ddl-tool-available-models') ? 
                      new Date(JSON.parse(localStorage.getItem('ddl-tool-available-models') || '[]')[0]?.created * 1000 || Date.now()).toLocaleString('vi-VN') 
                      : 'Chưa có'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Thao tác</Label>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadModels}
                  disabled={loadingModels || !config.apiKey}
                  className="justify-start"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingModels ? 'animate-spin' : ''}`} />
                  {loadingModels ? "Đang tải..." : "Tải lại Models"}
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
                      ? `Testing ${verificationProgress.current}/${verificationProgress.total}...`
                      : "Đang xác minh..."
                    : "Xác minh Models (API Test)"
                  }
                </Button>
              </div>
            </div>
          </div>

          {/* Model Verification Results */}
          {modelVerificationResult && (
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-sm font-medium">Kết quả xác minh</Label>
              
              {modelVerificationResult.invalidModels.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Models thất bại API test và đã bị xóa:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {modelVerificationResult.invalidModels.map((modelId, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            <Trash2 className="w-3 h-3 mr-1" />
                            {modelId}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs mt-2">
                        Các models này không thể thực hiện API calls và có thể không được hỗ trợ hoặc bị hạn chế quyền truy cập.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <p>Tất cả {modelVerificationResult.validModels.length} models đều đã pass API test thành công!</p>
                    <p className="text-xs mt-1">Các models này có thể sử dụng bình thường cho dịch thuật và phân tích DDL.</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <SettingsIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Hướng dẫn:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Tải lại Models:</strong> Lấy danh sách models mới từ server và lưu vào localStorage</li>
                  <li>• <strong>Xác minh Models (API Test):</strong> Thực hiện API calls thực tế để test từng model</li>
                  <li>• Models không pass API test sẽ tự động bị xóa khỏi cache</li>
                  <li>• Quá trình xác minh có thể mất vài phút và sử dụng một ít API tokens</li>
                  <li>• Nên xác minh models định kỳ để đảm bảo chúng hoạt động chính xác</li>
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
            <span>Cấu hình Request Queue</span>
          </CardTitle>
          <CardDescription>
            Điều khiển hàng đợi yêu cầu API để tránh rate limiting và quản lý tài nguyên
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="queue-enabled" className="text-base">
                Bật Queue System
              </Label>
              <p className="text-sm text-muted-foreground">
                Kích hoạt hàng đợi tuần tự cho các yêu cầu API
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
                <Label htmlFor="delayMs">Độ trễ giữa các request (ms)</Label>
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
                  Thời gian chờ giữa các request API (0-5000ms)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxConcurrent">Số request đồng thời tối đa</Label>
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
                  Số lượng request có thể chạy song song (1-10)
                </p>
              </div>
            </div>
          )}
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <SettingsIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Khuyến nghị cấu hình:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>OpenAI API:</strong> Delay 500ms, Max 1 concurrent</li>
                  <li>• <strong>Local/Self-hosted:</strong> Delay 100ms, Max 3-5 concurrent</li>
                  <li>• <strong>Rate-limited APIs:</strong> Delay 1000ms+, Max 1 concurrent</li>
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
              Có thay đổi chưa lưu
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary-glow/10 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />
              Đã lưu
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
            {testing ? "Đang kiểm tra..." : "Test Connection"}
          </Button>
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Hoàn tác
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
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? "Lưu thay đổi" : "Đã lưu"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
