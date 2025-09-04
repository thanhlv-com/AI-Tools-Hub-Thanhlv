import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ModelInfo } from "@/lib/chatgpt";

export interface ChatGPTConfig {
  serverUrl: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
}

interface ConfigContextType {
  config: ChatGPTConfig;
  updateConfig: (newConfig: Partial<ChatGPTConfig>) => void;
  saveConfig: () => void;
  loadConfig: () => void;
  availableModels: ModelInfo[];
  setAvailableModels: (models: ModelInfo[]) => void;
  getPageModel: (pageId: string) => string | null;
  setPageModel: (pageId: string, model: string) => void;
  removePageModel: (pageId: string) => void;
}

const defaultConfig: ChatGPTConfig = {
  serverUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4-turbo",
  maxTokens: "4000",
  temperature: "0.1"
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<ChatGPTConfig>(defaultConfig);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-config');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = () => {
    try {
      localStorage.setItem('ddl-tool-config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const updateConfig = (newConfig: Partial<ChatGPTConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Per-page model storage functions
  const getPageModel = (pageId: string): string | null => {
    try {
      const pageModels = localStorage.getItem('ddl-tool-page-models');
      if (pageModels) {
        const parsed = JSON.parse(pageModels);
        return parsed[pageId] || null;
      }
    } catch (error) {
      console.error('Error loading page model:', error);
    }
    return null;
  };

  const setPageModel = (pageId: string, model: string) => {
    try {
      const pageModels = localStorage.getItem('ddl-tool-page-models');
      const parsed = pageModels ? JSON.parse(pageModels) : {};
      parsed[pageId] = model;
      localStorage.setItem('ddl-tool-page-models', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving page model:', error);
    }
  };

  const removePageModel = (pageId: string) => {
    try {
      const pageModels = localStorage.getItem('ddl-tool-page-models');
      if (pageModels) {
        const parsed = JSON.parse(pageModels);
        delete parsed[pageId];
        localStorage.setItem('ddl-tool-page-models', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error removing page model:', error);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-save when config changes
  useEffect(() => {
    saveConfig();
  }, [config]);

  return (
    <ConfigContext.Provider value={{ 
      config, 
      updateConfig, 
      saveConfig, 
      loadConfig,
      availableModels,
      setAvailableModels,
      getPageModel,
      setPageModel,
      removePageModel
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}