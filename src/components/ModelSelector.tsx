import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/contexts/ConfigContext";
import { Brain, Zap } from "lucide-react";

const models = [
  { id: "gpt-4", name: "GPT-4", description: "Mạnh nhất, chậm hơn", color: "bg-red-500" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Cân bằng tốc độ và chất lượng", color: "bg-blue-500" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Nhanh, tiết kiệm", color: "bg-green-500" }
];

interface ModelSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  showDefault?: boolean;
  className?: string;
}

export function ModelSelector({ 
  value, 
  onChange, 
  label = "Model", 
  showDefault = false,
  className = ""
}: ModelSelectorProps) {
  const { config } = useConfig();
  
  const currentValue = value || config.model;
  const isUsingDefault = !value;

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
      </div>
      
      <Select value={currentValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${model.color}`} />
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDefault && (
        <p className="text-xs text-muted-foreground mt-1">
          {isUsingDefault 
            ? `Sử dụng model mặc định: ${config.model}` 
            : "Đã chọn model riêng cho trang này"
          }
        </p>
      )}
    </div>
  );
}