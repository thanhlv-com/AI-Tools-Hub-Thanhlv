import { ChatGPTConfig, QueueConfig } from "@/contexts/ConfigContext";
import { TranslationRequest, MultiTranslationRequest, MultiTranslationResult } from "@/types/translation";
import { LANGUAGES, TRANSLATION_STYLES } from "@/data/translation";

export interface ChatGPTMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatGPTRequest {
  model: string;
  messages: ChatGPTMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

interface QueueItem {
  requestFn: () => Promise<string>;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

// Global request queue to ensure sequential processing
class RequestQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private queueConfig: QueueConfig;

  constructor(queueConfig: QueueConfig) {
    this.queueConfig = queueConfig;
  }

  updateConfig(queueConfig: QueueConfig) {
    this.queueConfig = queueConfig;
  }

  async enqueue(requestFn: () => Promise<string>): Promise<string> {
    if (!this.queueConfig.enabled) {
      // If queue is disabled, execute immediately
      return requestFn();
    }

    return new Promise<string>((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        const result = await item.requestFn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Wait configured delay before processing next request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.queueConfig.delayMs));
      }
    }

    this.isProcessing = false;
  }
}

// Global instance of the request queue with default config
const globalRequestQueue = new RequestQueue({
  enabled: true,
  delayMs: 500,
  maxConcurrent: 1
});

// Function to update global queue configuration
export function updateGlobalQueueConfig(queueConfig: QueueConfig) {
  globalRequestQueue.updateConfig(queueConfig);
}

export class ChatGPTService {
  private config: ChatGPTConfig;

  constructor(config: ChatGPTConfig) {
    this.config = config;
    // Update global queue configuration when service is created
    globalRequestQueue.updateConfig(config.queue);
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    if (!this.config.apiKey) {
      throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      const data: ModelsResponse = await response.json();
      
      // Filter only chat completion models and sort by ID
      return data.data
        .filter(model => model.id.includes('gpt') || model.id.includes('claude') || model.id.includes('chat'))
        .sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Lỗi không xác định khi tải danh sách model");
    }
  }

  async testModel(modelId: string): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
    }

    try {
      // Use a simple test message to verify the model works
      const testMessage: ChatGPTMessage = {
        role: "user",
        content: "Hello"
      };

      const requestBody: ChatGPTRequest = {
        model: modelId,
        messages: [testMessage],
        max_tokens: 10, // Keep it minimal to save costs
        temperature: 0
      };

      const response = await fetch(`${this.config.serverUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Model ${modelId} failed API test:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return false; // Model failed the test
      }

      const data: ChatGPTResponse = await response.json();
      const isValid = !!(data.choices && data.choices.length > 0);
      
      if (!isValid) {
        console.error(`Model ${modelId} returned invalid response:`, data);
      }
      
      return isValid;
    } catch (error) {
      console.error(`Model ${modelId} test failed with exception:`, error);
      return false; // Model failed the test
    }
  }

  async callAPI(messages: ChatGPTMessage[], customModel?: string): Promise<string> {
    // Wrap the actual API call in a function and add it to the queue
    return globalRequestQueue.enqueue(async () => {
      if (!this.config.apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
      }

      const model = customModel || this.config.model;
      
      const requestBody: ChatGPTRequest = {
        model,
        messages,
        max_tokens: parseInt(this.config.maxTokens),
        temperature: parseFloat(this.config.temperature),
      };

      try {
        const response = await fetch(`${this.config.serverUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `API Error (${response.status}): ${errorData.error?.message || response.statusText}`
          );
        }

        const data: ChatGPTResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error("Không nhận được response từ ChatGPT");
        }

        return data.choices[0].message.content;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Lỗi không xác định khi gọi ChatGPT API");
      }
    });
  }

  async analyzeDDL(currentDDL: string, newDDL: string, databaseType: string, customModel?: string): Promise<string> {
    const systemPrompt = `Bạn là chuyên gia database migration. Nhiệm vụ của bạn là phân tích sự khác biệt giữa 2 DDL và tạo ra script migration chính xác.

Yêu cầu:
- Database type: ${databaseType.toUpperCase()}
- Phân tích chi tiết sự khác biệt giữa DDL hiện tại và DDL mới
- Tạo script migration SQL để chuyển đổi từ cấu trúc hiện tại sang cấu trúc mới
- Script phải có thể chạy được và an toàn (không làm mất data)
- Bao gồm cả ALTER, CREATE, DROP statements khi cần
- Thêm comment giải thích cho từng bước quan trọng
- Sắp xếp các câu lệnh theo thứ tự logic (tạo bảng trước, sau đó index, constraint...)

Định dạng output:
- Chỉ trả về SQL script thuần túy
- Không thêm markdown formatting
- Bắt đầu bằng comment header có thông tin tổng quan`;

    const userPrompt = `DDL hiện tại:
${currentDDL}

DDL mới nhất:
${newDDL}

Hãy tạo migration script để chuyển đổi từ DDL hiện tại sang DDL mới nhất.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, customModel);
  }

  async translateText(request: TranslationRequest): Promise<string> {
    const { text, sourceLanguage, targetLanguage, style, model } = request;
    
    const sourceLang = LANGUAGES.find(lang => lang.code === sourceLanguage);
    const targetLang = LANGUAGES.find(lang => lang.code === targetLanguage);
    const translationStyle = TRANSLATION_STYLES.find(s => s.id === style);
    
    if (!sourceLang || !targetLang || !translationStyle) {
      throw new Error("Invalid language or style selection");
    }

    const systemPrompt = `Bạn là một chuyên gia dịch thuật đa ngôn ngữ chuyên nghiệp. Nhiệm vụ của bạn là dịch văn bản với chất lượng cao nhất.

Yêu cầu dịch thuật:
- Ngôn ngữ nguồn: ${sourceLang.name} (${sourceLang.nativeName})
- Ngôn ngữ đích: ${targetLang.name} (${targetLang.nativeName})
- Phong cách dịch: ${translationStyle.name}
- Mô tả phong cách: ${translationStyle.description}

Hướng dẫn chi tiết:
${translationStyle.prompt}

Lưu ý quan trọng:
- Chỉ trả về bản dịch cuối cùng, không thêm giải thích
- Giữ nguyên định dạng của văn bản gốc (xuống dòng, dấu câu, etc.)
- Nếu có từ khóa chuyên ngành, hãy dịch phù hợp với ngữ cảnh
- Đảm bảo bản dịch phù hợp với văn hóa của ngôn ngữ đích
- Nếu ngôn ngữ nguồn là "auto", hãy tự động phát hiện ngôn ngữ`;

    const userPrompt = `Hãy dịch văn bản sau:

${text}`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, model);
  }

  async translateToMultipleLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult[]> {
    const { text, sourceLanguage, targetLanguages, style, model } = request;
    
    const sourceLang = LANGUAGES.find(lang => lang.code === sourceLanguage);
    const translationStyle = TRANSLATION_STYLES.find(s => s.id === style);
    
    if (!sourceLang || !translationStyle) {
      throw new Error("Invalid source language or style selection");
    }

    // Process translations in parallel with error handling for each language
    const translationPromises = targetLanguages.map(async (targetLangCode): Promise<MultiTranslationResult> => {
      try {
        const targetLang = LANGUAGES.find(lang => lang.code === targetLangCode);
        if (!targetLang) {
          return {
            language: targetLangCode,
            translatedText: "",
            error: "Ngôn ngữ không được hỗ trợ"
          };
        }

        const singleRequest: TranslationRequest = {
          text,
          sourceLanguage,
          targetLanguage: targetLangCode,
          style,
          model
        };

        const translatedText = await this.translateText(singleRequest);
        
        return {
          language: targetLangCode,
          translatedText
        };
      } catch (error) {
        return {
          language: targetLangCode,
          translatedText: "",
          error: error instanceof Error ? error.message : "Lỗi không xác định"
        };
      }
    });

    // Wait for all translations to complete (some may fail)
    const results = await Promise.all(translationPromises);
    return results;
  }
}
