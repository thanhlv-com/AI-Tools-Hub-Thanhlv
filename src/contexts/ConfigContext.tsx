import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ModelInfo, ChatGPTService } from "@/lib/chatgpt";
import { DDLAnalysisHistory } from "@/types/history";
import { TranslationHistory, TranslationPreference, TranslationPreferences } from "@/types/translation";
import { RewritingHistory } from "@/types/rewriting";
import { CapacityAnalysisHistory } from "@/types/capacity";
import { DiagramHistory } from "@/types/diagram";
import { WikiHistory } from "@/types/wiki";
import { ApiKeyManager } from "@/lib/encryption";
import { useTranslation } from 'react-i18next';

export interface QueueConfig {
  enabled: boolean;
  delayMs: number;
  maxConcurrent: number;
}

export interface ChatGPTConfig {
  serverUrl: string;
  apiKey: string;
  model: string;
  maxTokens: string;
  temperature: string;
  queue: QueueConfig;
  language: string;
}

interface ConfigContextType {
  config: ChatGPTConfig;
  updateConfig: (newConfig: Partial<ChatGPTConfig>) => void;
  updateQueueConfig: (queueConfig: Partial<QueueConfig>) => void;
  saveConfig: (configToSave?: ChatGPTConfig) => Promise<void>;
  loadConfig: () => Promise<void>;
  availableModels: ModelInfo[];
  setAvailableModels: (models: ModelInfo[]) => void;
  loadAvailableModels: () => Promise<ModelInfo[]>;
  verifyModels: () => Promise<{ validModels: ModelInfo[], invalidModels: string[] }>;
  getPageModel: (pageId: string) => string | null;
  setPageModel: (pageId: string, model: string) => void;
  removePageModel: (pageId: string) => void;
  // Language management
  changeLanguage: (language: string) => void;
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
  // Translation Preferences management
  translationPreferences: TranslationPreferences;
  addTranslationPreference: (preference: Omit<TranslationPreference, 'id' | 'timestamp'>) => string;
  updateTranslationPreference: (id: string, preference: Partial<Omit<TranslationPreference, 'id' | 'timestamp'>>) => void;
  removeTranslationPreference: (id: string) => void;
  clearTranslationPreferences: () => void;
  getTranslationPreferenceById: (id: string) => TranslationPreference | undefined;
  // Rewriting History management
  rewritingHistory: RewritingHistory[];
  addToRewritingHistory: (item: Omit<RewritingHistory, 'id' | 'timestamp'>) => void;
  removeFromRewritingHistory: (id: string) => void;
  clearRewritingHistory: () => void;
  getRewritingHistoryById: (id: string) => RewritingHistory | undefined;
  // Capacity Analysis History management
  capacityHistory: CapacityAnalysisHistory[];
  addToCapacityHistory: (item: Omit<CapacityAnalysisHistory, 'id' | 'timestamp'>) => void;
  removeFromCapacityHistory: (id: string) => void;
  clearCapacityHistory: () => void;
  getCapacityHistoryById: (id: string) => CapacityAnalysisHistory | undefined;
  // Diagram History management
  diagramHistory: DiagramHistory[];
  addToDiagramHistory: (item: Omit<DiagramHistory, 'id' | 'timestamp'>) => void;
  removeFromDiagramHistory: (id: string) => void;
  clearDiagramHistory: () => void;
  getDiagramHistoryById: (id: string) => DiagramHistory | undefined;
  // Wiki History management
  wikiHistory: WikiHistory[];
  addToWikiHistory: (item: Omit<WikiHistory, 'id' | 'timestamp'>) => void;
  removeFromWikiHistory: (id: string) => void;
  clearWikiHistory: () => void;
  getWikiHistoryById: (id: string) => WikiHistory | undefined;
}

const defaultConfig: ChatGPTConfig = {
  serverUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4-turbo",
  maxTokens: "4000",
  temperature: "0.1",
  queue: {
    enabled: true,
    delayMs: 500,
    maxConcurrent: 1
  },
  language: "en"
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const { i18n } = useTranslation();
  const [config, setConfig] = useState<ChatGPTConfig>(defaultConfig);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [history, setHistory] = useState<DDLAnalysisHistory[]>([]);
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [translationPreferences, setTranslationPreferences] = useState<TranslationPreferences>({});
  const [rewritingHistory, setRewritingHistory] = useState<RewritingHistory[]>([]);
  const [capacityHistory, setCapacityHistory] = useState<CapacityAnalysisHistory[]>([]);
  const [diagramHistory, setDiagramHistory] = useState<DiagramHistory[]>([]);
  const [wikiHistory, setWikiHistory] = useState<WikiHistory[]>([]);
  const [pageModels, setPageModels] = useState<{ [pageId: string]: string }>({});

  const changeLanguage = async (language: string) => {
    i18n.changeLanguage(language);
    const updatedConfig = { ...config, language };
    setConfig(updatedConfig);
    await saveConfig(updatedConfig);
  };

  const loadConfig = async () => {
    try {
      const saved = localStorage.getItem('ddl-tool-config');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        
        // Decrypt API key if it exists and is encrypted
        if (parsedConfig.apiKey) {
          parsedConfig.apiKey = await ApiKeyManager.decryptFromStorage(parsedConfig.apiKey);
        }
        
        const fullConfig = { ...defaultConfig, ...parsedConfig };
        setConfig(fullConfig);
        // Sync language with i18n
        if (fullConfig.language) {
          i18n.changeLanguage(fullConfig.language);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async (configToSave?: ChatGPTConfig) => {
    try {
      // Use provided config or current config state
      const targetConfig = configToSave || config;
      console.log('Saving config:', { 
        hasApiKey: !!targetConfig.apiKey,
        serverUrl: targetConfig.serverUrl,
        model: targetConfig.model
      });
      
      // Create a copy of config with encrypted API key
      const configWithEncryptedKey = { ...targetConfig };
      
      if (configWithEncryptedKey.apiKey) {
        console.log('Encrypting API key...');
        configWithEncryptedKey.apiKey = await ApiKeyManager.encryptForStorage(configWithEncryptedKey.apiKey);
        console.log('API key encrypted successfully');
      }
      
      localStorage.setItem('ddl-tool-config', JSON.stringify(configWithEncryptedKey));
      console.log('Config saved to localStorage successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  const updateConfig = (newConfig: Partial<ChatGPTConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const updateQueueConfig = (queueConfig: Partial<QueueConfig>) => {
    setConfig(prev => ({ 
      ...prev, 
      queue: { ...prev.queue, ...queueConfig }
    }));
  };

  // Per-page model storage functions
  const loadPageModels = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-page-models');
      if (saved) {
        const parsedModels = JSON.parse(saved);
        setPageModels(parsedModels);
      }
    } catch (error) {
      console.error('Error loading page models:', error);
    }
  };
  const getPageModel = (pageId: string): string | null => {
    return pageModels[pageId] || null;
  };

  const setPageModel = (pageId: string, model: string) => {
    try {
      const newPageModels = { ...pageModels, [pageId]: model };
      setPageModels(newPageModels);
      localStorage.setItem('ddl-tool-page-models', JSON.stringify(newPageModels));
    } catch (error) {
      console.error('Error saving page model:', error);
    }
  };

  const removePageModel = (pageId: string) => {
    try {
      const newPageModels = { ...pageModels };
      delete newPageModels[pageId];
      setPageModels(newPageModels);
      localStorage.setItem('ddl-tool-page-models', JSON.stringify(newPageModels));
    } catch (error) {
      console.error('Error removing page model:', error);
    }
  };

  // Model management functions
  const loadModelsFromStorage = (): ModelInfo[] => {
    try {
      const saved = localStorage.getItem('ddl-tool-available-models');
      if (saved) {
        const parsedModels = JSON.parse(saved);
        return parsedModels;
      }
    } catch (error) {
      console.error('Error loading models from storage:', error);
    }
    return [];
  };

  const saveModelsToStorage = (models: ModelInfo[]) => {
    try {
      localStorage.setItem('ddl-tool-available-models', JSON.stringify(models));
    } catch (error) {
      console.error('Error saving models to storage:', error);
    }
  };

  const loadAvailableModels = async (): Promise<ModelInfo[]> => {
    if (!config.apiKey) {
      throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
    }

    try {
      const chatGPT = new ChatGPTService(config);
      const models = await chatGPT.getAvailableModels();
      
      // Save to localStorage and update state
      saveModelsToStorage(models);
      setAvailableModels(models);
      
      return models;
    } catch (error) {
      console.error('Error loading available models:', error);
      throw error;
    }
  };

  const verifyModels = async (): Promise<{ validModels: ModelInfo[], invalidModels: string[] }> => {
    if (!config.apiKey) {
      throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
    }

    try {
      const chatGPT = new ChatGPTService(config);
      const cachedModels = availableModels;
      
      if (cachedModels.length === 0) {
        throw new Error("Không có models để xác minh. Vui lòng tải models trước.");
      }
      
      // Test each cached model with actual API calls
      const validModels: ModelInfo[] = [];
      const invalidModels: string[] = [];
      
      console.log(`Testing ${cachedModels.length} models...`);
      
      // Test models in batches to avoid overwhelming the API
      for (const model of cachedModels) {
        try {
          console.log(`Testing model: ${model.id}`);
          const isValid = await chatGPT.testModel(model.id);
          
          if (isValid) {
            validModels.push(model);
            console.log(`✓ Model ${model.id} is valid`);
          } else {
            invalidModels.push(model.id);
            console.log(`✗ Model ${model.id} failed API test`);
          }
          
          // Add a small delay between tests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error testing model ${model.id}:`, error);
          invalidModels.push(model.id);
        }
      }
      
      // Update cached models with only valid ones
      saveModelsToStorage(validModels);
      setAvailableModels(validModels);
      
      return {
        validModels,
        invalidModels
      };
    } catch (error) {
      console.error('Error verifying models:', error);
      throw error;
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

  const loadRewritingHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-rewriting-history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setRewritingHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading rewriting history:', error);
    }
  };

  const saveRewritingHistory = (historyData: RewritingHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-rewriting-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving rewriting history:', error);
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

  // Rewriting history management functions
  const addToRewritingHistory = (item: Omit<RewritingHistory, 'id' | 'timestamp'>) => {
    const newItem: RewritingHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      metadata: {
        originalLength: item.originalText.length,
        rewrittenLength: item.rewrittenText.length,
      }
    };

    const updatedHistory = [newItem, ...rewritingHistory].slice(0, 100); // Keep max 100 items
    setRewritingHistory(updatedHistory);
    saveRewritingHistory(updatedHistory);
  };

  const removeFromRewritingHistory = (id: string) => {
    const updatedHistory = rewritingHistory.filter(item => item.id !== id);
    setRewritingHistory(updatedHistory);
    saveRewritingHistory(updatedHistory);
  };

  const clearRewritingHistory = () => {
    setRewritingHistory([]);
    try {
      localStorage.removeItem('ddl-tool-rewriting-history');
    } catch (error) {
      console.error('Error clearing rewriting history:', error);
    }
  };

  const getRewritingHistoryById = (id: string): RewritingHistory | undefined => {
    return rewritingHistory.find(item => item.id === id);
  };

  // Translation preferences management functions
  const loadTranslationPreferences = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-translation-preferences');
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setTranslationPreferences(parsedPreferences);
      }
    } catch (error) {
      console.error('Error loading translation preferences:', error);
    }
  };

  const saveTranslationPreferences = (preferences: TranslationPreferences) => {
    try {
      localStorage.setItem('ddl-tool-translation-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving translation preferences:', error);
    }
  };

  const addTranslationPreference = (preference: Omit<TranslationPreference, 'id' | 'timestamp'>): string => {
    const newPreference: TranslationPreference = {
      ...preference,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    const updatedPreferences = {
      ...translationPreferences,
      [newPreference.id]: newPreference
    };
    setTranslationPreferences(updatedPreferences);
    saveTranslationPreferences(updatedPreferences);
    return newPreference.id;
  };

  const updateTranslationPreference = (id: string, updates: Partial<Omit<TranslationPreference, 'id' | 'timestamp'>>) => {
    const existing = translationPreferences[id];
    if (existing) {
      const updatedPreference = {
        ...existing,
        ...updates,
        timestamp: Date.now() // Update timestamp on modification
      };
      const updatedPreferences = {
        ...translationPreferences,
        [id]: updatedPreference
      };
      setTranslationPreferences(updatedPreferences);
      saveTranslationPreferences(updatedPreferences);
    }
  };

  const removeTranslationPreference = (id: string) => {
    const updatedPreferences = { ...translationPreferences };
    delete updatedPreferences[id];
    setTranslationPreferences(updatedPreferences);
    saveTranslationPreferences(updatedPreferences);
  };

  const clearTranslationPreferences = () => {
    setTranslationPreferences({});
    try {
      localStorage.removeItem('ddl-tool-translation-preferences');
    } catch (error) {
      console.error('Error clearing translation preferences:', error);
    }
  };

  const getTranslationPreferenceById = (id: string): TranslationPreference | undefined => {
    return translationPreferences[id];
  };

  // Capacity analysis history management functions
  const loadCapacityHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-capacity-history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setCapacityHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading capacity history:', error);
    }
  };

  const saveCapacityHistory = (historyData: CapacityAnalysisHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-capacity-history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Error saving capacity history:', error);
    }
  };

  const addToCapacityHistory = (item: Omit<CapacityAnalysisHistory, 'id' | 'timestamp'>) => {
    const newItem: CapacityAnalysisHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      metadata: {
        ddlLength: item.ddl.length,
        resultSize: JSON.stringify(item.result).length,
        tableCount: item.result.breakdown?.length || 0,
        fieldCount: item.result.breakdown?.reduce((sum, table) => 
          sum + (table.fieldDetails?.length || 0), 0) || 0,
      }
    };
    
    const updatedHistory = [newItem, ...capacityHistory].slice(0, 100); // Keep max 100 items
    setCapacityHistory(updatedHistory);
    saveCapacityHistory(updatedHistory);
  };

  const removeFromCapacityHistory = (id: string) => {
    const updatedHistory = capacityHistory.filter(item => item.id !== id);
    setCapacityHistory(updatedHistory);
    saveCapacityHistory(updatedHistory);
  };

  const clearCapacityHistory = () => {
    setCapacityHistory([]);
    try {
      localStorage.removeItem('ddl-tool-capacity-history');
    } catch (error) {
      console.error('Error clearing capacity history:', error);
    }
  };

  const getCapacityHistoryById = (id: string): CapacityAnalysisHistory | undefined => {
    return capacityHistory.find(item => item.id === id);
  };

  // Diagram History management functions
  const loadDiagramHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-diagram-history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setDiagramHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading diagram history:', error);
    }
  };

  const saveDiagramHistory = (history: DiagramHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-diagram-history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving diagram history:', error);
    }
  };

  const addToDiagramHistory = (item: Omit<DiagramHistory, 'id' | 'timestamp'>) => {
    const newItem: DiagramHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      metadata: {
        descriptionLength: item.description.length,
        codeLength: item.diagramCode.length,
      }
    };
    
    const updatedHistory = [newItem, ...diagramHistory].slice(0, 100); // Keep max 100 items
    setDiagramHistory(updatedHistory);
    saveDiagramHistory(updatedHistory);
  };

  const removeFromDiagramHistory = (id: string) => {
    const updatedHistory = diagramHistory.filter(item => item.id !== id);
    setDiagramHistory(updatedHistory);
    saveDiagramHistory(updatedHistory);
  };

  const clearDiagramHistory = () => {
    setDiagramHistory([]);
    try {
      localStorage.removeItem('ddl-tool-diagram-history');
    } catch (error) {
      console.error('Error clearing diagram history:', error);
    }
  };

  const getDiagramHistoryById = (id: string): DiagramHistory | undefined => {
    return diagramHistory.find(item => item.id === id);
  };

  // Wiki History functions
  const loadWikiHistory = () => {
    try {
      const saved = localStorage.getItem('ddl-tool-wiki-history');
      if (saved) {
        const parsedHistory: WikiHistory[] = JSON.parse(saved);
        setWikiHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading wiki history:', error);
      setWikiHistory([]);
    }
  };

  const saveWikiHistory = (historyToSave: WikiHistory[]) => {
    try {
      localStorage.setItem('ddl-tool-wiki-history', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Error saving wiki history:', error);
    }
  };

  const addToWikiHistory = (item: Omit<WikiHistory, 'id' | 'timestamp'>) => {
    const newItem: WikiHistory = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metadata: {
        contentLength: item.result.length,
        wordCount: item.result.split(/\s+/).length,
      }
    };
    
    const updatedHistory = [newItem, ...wikiHistory].slice(0, 100); // Keep max 100 items
    setWikiHistory(updatedHistory);
    saveWikiHistory(updatedHistory);
  };

  const removeFromWikiHistory = (id: string) => {
    const updatedHistory = wikiHistory.filter(item => item.id !== id);
    setWikiHistory(updatedHistory);
    saveWikiHistory(updatedHistory);
  };

  const clearWikiHistory = () => {
    setWikiHistory([]);
    try {
      localStorage.removeItem('ddl-tool-wiki-history');
    } catch (error) {
      console.error('Error clearing wiki history:', error);
    }
  };

  const getWikiHistoryById = (id: string): WikiHistory | undefined => {
    return wikiHistory.find(item => item.id === id);
  };

  // Load config and history on mount
  useEffect(() => {
    const initializeConfig = async () => {
      await loadConfig();
    };
    
    initializeConfig();
    loadHistory();
    loadTranslationHistory();
    loadRewritingHistory();
    loadTranslationPreferences();
    loadCapacityHistory();
    loadDiagramHistory();
    loadWikiHistory();
    loadPageModels();
    
    // Load cached models from localStorage
    const cachedModels = loadModelsFromStorage();
    if (cachedModels.length > 0) {
      setAvailableModels(cachedModels);
    }
  }, []);

  // Note: Auto-save removed - Settings page now uses manual save
  // useEffect(() => {
  //   saveConfig();
  // }, [config]);

  return (
    <ConfigContext.Provider value={{ 
      config, 
      updateConfig,
      updateQueueConfig, 
      saveConfig, 
      loadConfig,
      availableModels,
      setAvailableModels,
      loadAvailableModels,
      verifyModels,
      getPageModel,
      setPageModel,
      removePageModel,
      changeLanguage,
      history,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getHistoryById,
      translationHistory,
      addToTranslationHistory,
      removeFromTranslationHistory,
      clearTranslationHistory,
      getTranslationHistoryById,
      translationPreferences,
      addTranslationPreference,
      updateTranslationPreference,
      removeTranslationPreference,
      clearTranslationPreferences,
      getTranslationPreferenceById,
      rewritingHistory,
      addToRewritingHistory,
      removeFromRewritingHistory,
      clearRewritingHistory,
      getRewritingHistoryById,
      capacityHistory,
      addToCapacityHistory,
      removeFromCapacityHistory,
      clearCapacityHistory,
      getCapacityHistoryById,
      // Diagram history
      diagramHistory,
      addToDiagramHistory,
      removeFromDiagramHistory,
      clearDiagramHistory,
      getDiagramHistoryById,
      // Wiki history
      wikiHistory,
      addToWikiHistory,
      removeFromWikiHistory,
      clearWikiHistory,
      getWikiHistoryById
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
