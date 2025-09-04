import { useState } from "react";
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
import { Save, TestTube, Server, Key, Zap, CheckCircle2, Clock, Settings as SettingsIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { config, updateConfig, updateQueueConfig } = useConfig();
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Đã lưu cấu hình",
      description: "Cấu hình ChatGPT đã được lưu thành công.",
    });
  };

  const handleTest = async () => {
    if (!config.apiKey) {
      toast({
        title: "Chưa có API Key",
        description: "Vui lòng nhập API Key trước khi test.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      const chatGPT = new ChatGPTService(config);
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Cấu hình</h1>
        <p className="text-muted-foreground">
          Cài đặt server và API để sử dụng ChatGPT trong công cụ phân tích DDL
        </p>
      </div>

      {/* Server Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-primary" />
            <span>Cấu hình Server</span>
          </CardTitle>
          <CardDescription>
            Thiết lập endpoint và thông tin xác thực cho ChatGPT API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                value={config.serverUrl}
                onChange={(e) => updateConfig({ serverUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <ModelSelector 
                value={config.model}
                onChange={(value) => updateConfig({ model: value })}
                label="Model mặc định"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>API Key</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => updateConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
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
                value={config.maxTokens}
                onChange={(e) => updateConfig({ maxTokens: e.target.value })}
                min="100"
                max="8000"
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
                value={config.temperature}
                onChange={(e) => updateConfig({ temperature: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Mức độ sáng tạo (0.0 - 2.0)</p>
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
              checked={config.queue.enabled}
              onCheckedChange={(enabled) => updateQueueConfig({ enabled })}
            />
          </div>
          
          {config.queue.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delayMs">Độ trễ giữa các request (ms)</Label>
                <Input
                  id="delayMs"
                  type="number"
                  value={config.queue.delayMs}
                  onChange={(e) => updateQueueConfig({ delayMs: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="5000"
                  step="100"
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
                  value={config.queue.maxConcurrent}
                  onChange={(e) => updateQueueConfig({ maxConcurrent: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="10"
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
          <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary-glow/10 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />
            Tự động lưu vào LocalStorage
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !config.apiKey}
            className="transition-all"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? "Đang kiểm tra..." : "Test Connection"}
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary-glow">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Đã lưu tự động
          </Button>
        </div>
      </div>
    </div>
  );
}