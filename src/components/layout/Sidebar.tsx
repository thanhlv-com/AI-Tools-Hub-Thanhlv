import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { 
  Database, 
  Settings, 
  Menu, 
  X,
  GitCompare,
  Languages,
  Wand2,
  Calculator,
  Shapes,
  FileText,
  Zap
} from "lucide-react";

const getNavigation = (t: (key: string) => string) => [
  {
    name: t('nav.ddlCompare'),
    href: "/",
    icon: GitCompare,
    description: t('nav.ddlCompareDesc')
  },
  {
    name: t('nav.translation'),
    href: "/translation",
    icon: Languages,
    description: t('nav.translationDesc')
  },
  {
    name: t('nav.promptGenerator'),
    href: "/prompt-generation",
    icon: Wand2,
    description: t('nav.promptGeneratorDesc')
  },
  {
    name: t('nav.capacityAnalysis'),
    href: "/capacity-analysis",
    icon: Calculator,
    description: t('nav.capacityAnalysisDesc')
  },
  {
    name: t('nav.diagram'),
    href: "/diagram",
    icon: Shapes,
    description: t('nav.diagramDesc')
  },
  {
    name: t('nav.confluenceTemplate'),
    href: "/confluence-template",
    icon: FileText,
    description: t('nav.confluenceTemplateDesc')
  },
  {
    name: t('nav.settings'),
    href: "/settings", 
    icon: Settings,
    description: t('nav.settingsDesc')
  }
];

export function Sidebar() {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const navigation = getNavigation(t);

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
            <span className="font-semibold text-foreground">{t('nav.appTitle')}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
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
            <span>{t('common.poweredBy')}</span>
          </div>
        </div>
      )}
    </div>
  );
}