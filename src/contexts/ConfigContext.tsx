import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ModelInfo } from "@/lib/chatgpt";
import { DDLAnalysisHistory } from "@/types/history";
import { TranslationHistory } from "@/types/translation";

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
  // DDL History management
  history: DDLAnalysisHistory[];
  addToHistory: (item: Omit<DDLAnalysisHistory, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getHistoryById: (id: string) => DDLAnalysisHistory | undefined;
  // Translation History management
  translationHistory: TranslationHistory[];
  addToTranslationHistory: (item: Omit<TranslationHistory, 'id' | 'timestamp'>) => void;
  removeFromTranslationHistory: (id: string) => void;
  clearTranslationHistory: () => void;
  getTranslationHistoryById: (id: string) => TranslationHistory | undefined;
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
  const [history, setHistory] = useState<DDLAnalysisHistory[]>([]);
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);

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

  // History management functions
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = (historyData: DDLAnalysisHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const addToHistory = (item: Omit<DDLAnalysisHistory, 'id' | 'timestamp'>) => {
    const newItem: DDLAnalysisHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      metadata: {
        currentDDLLength: item.currentDDL.length,
        newDDLLength: item.newDDL.length,
        scriptLength: item.migrationScript.length,
      }
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 100); // Keep max 100 items
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const removeFromHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('ddl-tool-history');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getHistoryById = (id: string): DDLAnalysisHistory | undefined => {
    return history.find(item => item.id === id);
  };

  // Translation history management functions
  const loadTranslationHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-translation-history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setTranslationHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading translation history:', error);
    }
  };

  const saveTranslationHistory = (historyData: TranslationHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-translation-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving translation history:', error);
    }
  };

  const addToTranslationHistory = (item: Omit<TranslationHistory, 'id' | 'timestamp'>) => {
    const newItem: TranslationHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      metadata: {
        sourceLength: item.sourceText.length,
        totalTranslations: item.targetLanguages.length,
        successfulTranslations: Object.values(item.translations).filter(t => !t.error).length,
        failedTranslations: Object.values(item.translations).filter(t => t.error).length,
      }
    };
    
    const updatedHistory = [newItem, ...translationHistory].slice(0, 100); // Keep max 100 items
    setTranslationHistory(updatedHistory);
    saveTranslationHistory(updatedHistory);
  };

  const removeFromTranslationHistory = (id: string) => {
    const updatedHistory = translationHistory.filter(item => item.id !== id);
    setTranslationHistory(updatedHistory);
    saveTranslationHistory(updatedHistory);
  };

  const clearTranslationHistory = () => {
    setTranslationHistory([]);
    try {
      localStorage.removeItem('ddl-tool-translation-history');
    } catch (error) {
      console.error('Error clearing translation history:', error);
    }
  };

  const getTranslationHistoryById = (id: string): TranslationHistory | undefined => {
    return translationHistory.find(item => item.id === id);
  };

  // Load config and history on mount
  useEffect(() => {
    loadConfig();
    loadHistory();
    loadTranslationHistory();
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
      removePageModel,
      history,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getHistoryById,
      translationHistory,
      addToTranslationHistory,
      removeFromTranslationHistory,
      clearTranslationHistory,
      getTranslationHistoryById
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