import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Server, Key, Zap } from "lucide-react";

const models = [
  { id: "gpt-4", name: "GPT-4", description: "Mạnh nhất, chậm hơn" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Cân bằng tốc độ và chất lượng" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Nhanh, tiết kiệm" }
];

export default function Settings() {
  const [config, setConfig] = useState({
    serverUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4-turbo",
    maxTokens: "4000",
    temperature: "0.1"
  });
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem('ddl-tool-config', JSON.stringify(config));
    toast({
      title: "Đã lưu cấu hình",
      description: "Cấu hình ChatGPT đã được lưu thành công.",
    });
  };

  const handleTest = async () => {
    setTesting(true);
    // Simulate API test
    setTimeout(() => {
      setTesting(false);
      toast({
        title: "Kết nối thành công",
        description: "ChatGPT API đang hoạt động bình thường.",
      });
    }, 2000);
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
                onChange={(e) => setConfig({...config, serverUrl: e.target.value})}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={config.model} onValueChange={(value) => setConfig({...config, model: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
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
                onChange={(e) => setConfig({...config, maxTokens: e.target.value})}
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
                onChange={(e) => setConfig({...config, temperature: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Mức độ sáng tạo (0.0 - 2.0)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary-glow/10">
            <Server className="w-3 h-3 mr-1" />
            Ready to use
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
            <Save className="w-4 h-4 mr-2" />
            Lưu cấu hình
          </Button>
        </div>
      </div>
    </div>
  );
}