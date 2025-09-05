import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Settings, 
  Menu, 
  X,
  GitCompare,
  Languages,
  Wand2,
  Zap
} from "lucide-react";

const navigation = [
  {
    name: "DDL Compare",
    href: "/",
    icon: GitCompare,
    description: "So sánh và tạo migration DDL"
  },
  {
    name: "Translation",
    href: "/translation",
    icon: Languages,
    description: "Dịch thuật đa ngôn ngữ với AI"
  },
  {
    name: "Prompt Planning",
    href: "/prompt-planning",
    icon: Wand2,
    description: "Lập kế hoạch và tạo JSON prompts"
  },
  {
    name: "Settings",
    href: "/settings", 
    icon: Settings,
    description: "Cấu hình server và API"
  }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-to-b from-card to-secondary border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AI Tools Hub</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive && "text-primary-foreground")} />
              {!isCollapsed && (
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-primary" />
            <span>Powered by ChatGPT</span>
          </div>
        </div>
      )}
    </div>
  );
}