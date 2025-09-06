import { ChatGPTConfig, QueueConfig } from "@/contexts/ConfigContext";
import { TranslationRequest, MultiTranslationRequest, MultiTranslationResult } from "@/types/translation";
import { DDLCapacityRequest, CapacityResult } from "@/types/capacity";
import { LANGUAGES, TRANSLATION_STYLES, TRANSLATION_PROFICIENCIES, EMOTICON_OPTIONS } from "@/data/translation";

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

  async callAPI(messages: ChatGPTMessage[], customModel?: string, retryCount: number = 0): Promise<string> {
    // Wrap the actual API call in a function and add it to the queue
    return globalRequestQueue.enqueue(async () => {
      if (!this.config.apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Settings để nhập API Key.");
      }

      const model = customModel || this.config.model;
      const maxRetries = 5; // Limit retry attempts
      const retryDelay = 5000; // 5 seconds fixed delay
      
      const requestBody: ChatGPTRequest = {
        model,
        messages,
        max_tokens: parseInt(this.config.maxTokens),
        temperature: parseFloat(this.config.temperature),
      };

      const makeRequest = async (attempt: number): Promise<string> => {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 120 second timeout for capacity analysis

          const response = await fetch(`${this.config.serverUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Limit retry attempts and handle 503 specifically
            if (attempt < maxRetries && response.status !== 401 && response.status !== 403) {
              let delay = retryDelay;
              
              // Exponential backoff for 503 and rate limit errors
              if (response.status === 503 || response.status === 429) {
                delay = Math.min(retryDelay * Math.pow(2, attempt), 30000); // Cap at 30 seconds
                console.warn(`Service unavailable (${response.status}), using exponential backoff: ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
              } else {
                console.warn(`API call failed (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
              }
              
              await new Promise(resolve => setTimeout(resolve, delay));
              return makeRequest(attempt + 1);
            }
            
            throw new Error(
              `API Error (${response.status}): ${errorData.error?.message || response.statusText}`
            );
          }

          const data: ChatGPTResponse = await response.json();
          
          if (!data.choices || data.choices.length === 0) {
            // Retry on invalid response with attempt limit
            if (attempt < maxRetries) {
              console.warn(`Invalid response received, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            throw new Error("Invalid response from API after maximum retries");
          }

          return data.choices[0].message.content;
        } catch (error) {
          // Handle specific error types with retry limit
          if (error instanceof Error && attempt < maxRetries) {
            if (error.name === 'AbortError') {
              console.warn(`Request timeout, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            
            if (error.message.includes('fetch') || error.message.includes('network')) {
              console.warn(`Network error, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            
            // For API authentication errors, don't retry
            if (error.message.includes('401') || error.message.includes('403') || error.message.includes('API Key')) {
              throw error;
            }
            
            // For all other errors, retry with limit
            console.warn(`Error occurred, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries}): ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return makeRequest(attempt + 1);
          }
          
          // Max retries exceeded or authentication error
          if (attempt >= maxRetries) {
            throw new Error(`Maximum retry attempts (${maxRetries}) exceeded. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          throw error;
        }
      };

      return makeRequest(0);
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
    const { text, sourceLanguage, targetLanguage, style, proficiency, emoticonOption, model } = request;
    
    const sourceLang = LANGUAGES.find(lang => lang.code === sourceLanguage);
    const targetLang = LANGUAGES.find(lang => lang.code === targetLanguage);
    const translationStyle = TRANSLATION_STYLES.find(s => s.id === style);
    const translationProficiency = proficiency ? TRANSLATION_PROFICIENCIES.find(p => p.id === proficiency) : null;
    const emoticonPreference = emoticonOption ? EMOTICON_OPTIONS.find(e => e.id === emoticonOption) : null;
    
    if (!sourceLang || !targetLang || !translationStyle) {
      throw new Error("Invalid language or style selection");
    }

    const systemPrompt = `Bạn là một chuyên gia dịch thuật đa ngôn ngữ chuyên nghiệp. Nhiệm vụ của bạn là dịch văn bản với chất lượng cao nhất.

Yêu cầu dịch thuật:
- Ngôn ngữ nguồn: ${sourceLang.name} (${sourceLang.nativeName})
- Ngôn ngữ đích: ${targetLang.name} (${targetLang.nativeName})
- Phong cách dịch: ${translationStyle.name}
- Mô tả phong cách: ${translationStyle.description}${translationProficiency ? `
- Trình độ đầu ra: ${translationProficiency.name} (${translationProficiency.level})
- Mô tả trình độ: ${translationProficiency.description}` : ''}${emoticonPreference ? `
- Xử lý Emoticon/Emoji: ${emoticonPreference.name}
- Mô tả xử lý emoticon: ${emoticonPreference.description}` : ''}

Hướng dẫn chi tiết về phong cách:
${translationStyle.prompt}${translationProficiency ? `

Hướng dẫn chi tiết về trình độ đầu ra:
${translationProficiency.prompt}` : ''}${emoticonPreference ? `

Hướng dẫn chi tiết về xử lý emoticon/emoji:
${emoticonPreference.prompt}` : ''}

Lưu ý quan trọng:
- Chỉ trả về bản dịch cuối cùng, không thêm giải thích
- Giữ nguyên định dạng của văn bản gốc (xuống dòng, dấu câu, etc.)
- Nếu có từ khóa chuyên ngành, hãy dịch phù hợp với ngữ cảnh
- Đảm bảo bản dịch phù hợp với văn hóa của ngôn ngữ đích
- Nếu ngôn ngữ nguồn là "auto", hãy tự động phát hiện ngôn ngữ${translationProficiency ? `
- Điều chỉnh độ phức tạp của ngôn ngữ theo trình độ đã chọn: ${translationProficiency.name}` : ''}${emoticonPreference ? `
- Xử lý emoticon/emoji theo hướng dẫn: ${emoticonPreference.name}` : ''}`;  

    const userPrompt = `Hãy dịch văn bản sau:

${text}`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, model);
  }

  async translateToMultipleLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult[]> {
    const { text, sourceLanguage, targetLanguages, style, proficiency, emoticonOption, model } = request;
    
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
          proficiency,
          emoticonOption,
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

  async generatePrompt(
    promptGoal: string,
    targetAudience?: string,
    outputFormat?: string,
    task?: string,
    persona?: string,
    context?: string,
    constraints?: string[],
    examples?: string,
    customModel?: string
  ): Promise<string> {
    const systemPrompt = `Bạn là chuyên gia về prompt engineering và AI. Nhiệm vụ của bạn là tạo ra một JSON prompt có cấu trúc hoàn chỉnh và tối ưu cho các mô hình ngôn ngữ lớn.

Yêu cầu:
- Phân tích thông tin đầu vào và tạo ra JSON prompt hoàn chỉnh
- Bổ sung thông tin còn thiếu một cách thông minh và phù hợp
- Tối ưu hóa prompt để đạt hiệu quả cao nhất
- Đảm bảo JSON có cấu trúc đúng và đầy đủ các trường bắt buộc
- Thêm metadata phù hợp và gợi ý model AI phù hợp

Cấu trúc JSON cần tạo:
{
  "prompt_goal": "Mục tiêu chính của prompt",
  "target_audience": "Đối tượng mục tiêu",
  "output_format": "Định dạng đầu ra mong muốn",
  "task": "Nhiệm vụ cụ thể AI cần thực hiện",
  "persona": "Vai trò/persona AI cần đảm nhận",
  "context": "Bối cảnh và thông tin nền",
  "constraints": ["Ràng buộc 1", "Ràng buộc 2", ...],
  "examples": "Ví dụ minh họa input/output",
  "metadata": {
    "created_at": "YYYY-MM-DD",
    "version": "1.0",
    "ai_model_recommendation": "model_name"
  }
}

Lưu ý quan trọng:
- Chỉ trả về JSON thuần túy, không thêm markdown formatting
- Nếu thông tin không đủ, hãy suy luận và bổ sung thông minh
- Đảm bảo tất cả các trường đều có giá trị hợp lý
- Constraints phải là array, không được để trống
- Gợi ý model AI phù hợp nhất cho prompt này`;

    const userPrompt = `Hãy tạo JSON prompt dựa trên thông tin sau:

Mục tiêu prompt: ${promptGoal}
${targetAudience ? `Đối tượng mục tiêu: ${targetAudience}` : ''}
${outputFormat ? `Định dạng đầu ra: ${outputFormat}` : ''}
${task ? `Nhiệm vụ cụ thể: ${task}` : ''}
${persona ? `Persona: ${persona}` : ''}
${context ? `Bối cảnh: ${context}` : ''}
${constraints && constraints.length > 0 ? `Ràng buộc: ${constraints.join(', ')}` : ''}
${examples ? `Ví dụ: ${examples}` : ''}

Hãy phân tích và tạo ra JSON prompt hoàn chỉnh, tối ưu nhất có thể.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, customModel);
  }

  async analyzeCapacity(request: DDLCapacityRequest): Promise<CapacityResult> {
    const { ddl, databaseType, recordCount, customModel } = request;
    
    const systemPrompt = `You are a database storage analyst. Calculate record sizes and total capacity for ${databaseType.toUpperCase()} with ${recordCount.toLocaleString()} records.

Tasks:
1. Analyze DDL schema structure and data types
2. Calculate average record size (realistic values: VARCHAR 50% max, typical numbers)
3. Calculate maximum record size (all fields at maximum possible values)
4. Estimate total storage and index overhead
5. Provide optimization recommendations
6. Include field-level analysis with size calculations for each column

For ${databaseType.toUpperCase()}, include engine overhead (row headers, null bitmaps, alignment). Analyze each field individually to provide detailed breakdown.

Return ONLY valid JSON in this exact format:
{
  "averageRecordSize": <bytes>,
  "maximumRecordSize": <bytes>,
  "totalSizeAverage": {"bytes": <num>, "mb": <num>, "gb": <num>},
  "totalSizeMaximum": {"bytes": <num>, "mb": <num>, "gb": <num>},
  "indexSize": {"bytes": <num>, "mb": <num>, "gb": <num>},
  "totalWithIndexAverage": {"bytes": <num>, "mb": <num>, "gb": <num>},
  "totalWithIndexMaximum": {"bytes": <num>, "mb": <num>, "gb": <num>},
  "recommendations": ["rec1", "rec2"],
  "breakdown": [{"tableName": "name", "averageRecordSize": <num>, "maximumRecordSize": <num>, "totalSizeAverage": {"bytes": <num>, "mb": <num>}, "totalSizeMaximum": {"bytes": <num>, "mb": <num>}, "recordCount": ${recordCount}, "fieldDetails": [{"fieldName": "field", "dataType": "VARCHAR(255)", "nullable": true, "averageSize": 50, "maximumSize": 255, "overhead": 1, "description": "Field description"}]}]
}`;

    const userPrompt = `Analyze this ${databaseType.toUpperCase()} DDL schema and calculate storage capacity:

${ddl.substring(0, 2000)}${ddl.length > 2000 ? '...' : ''}

Records: ${recordCount.toLocaleString()}
Calculate average/maximum record sizes and total storage. Return JSON only.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    try {
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`Không tìm thấy JSON hợp lệ trong response: ${response.substring(0, 200)}...`);
      }
      
      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      
      // Parse JSON response
      const result = JSON.parse(jsonString);
      
      // Validate and ensure all required fields exist with proper structure
      const capacityResult: CapacityResult = {
        averageRecordSize: result.averageRecordSize || 0,
        maximumRecordSize: result.maximumRecordSize || 0,
        totalSizeAverage: {
          bytes: result.totalSizeAverage?.bytes || 0,
          mb: result.totalSizeAverage?.mb || (result.totalSizeAverage?.bytes / (1024 * 1024)) || 0,
          gb: result.totalSizeAverage?.gb || (result.totalSizeAverage?.bytes / (1024 * 1024 * 1024)) || 0
        },
        totalSizeMaximum: {
          bytes: result.totalSizeMaximum?.bytes || 0,
          mb: result.totalSizeMaximum?.mb || (result.totalSizeMaximum?.bytes / (1024 * 1024)) || 0,
          gb: result.totalSizeMaximum?.gb || (result.totalSizeMaximum?.bytes / (1024 * 1024 * 1024)) || 0
        },
        indexSize: result.indexSize ? {
          bytes: result.indexSize.bytes || 0,
          mb: result.indexSize.mb || (result.indexSize.bytes / (1024 * 1024)) || 0,
          gb: result.indexSize.gb || (result.indexSize.bytes / (1024 * 1024 * 1024)) || 0
        } : undefined,
        totalWithIndexAverage: result.totalWithIndexAverage ? {
          bytes: result.totalWithIndexAverage.bytes || 0,
          mb: result.totalWithIndexAverage.mb || (result.totalWithIndexAverage.bytes / (1024 * 1024)) || 0,
          gb: result.totalWithIndexAverage.gb || (result.totalWithIndexAverage.bytes / (1024 * 1024 * 1024)) || 0
        } : undefined,
        totalWithIndexMaximum: result.totalWithIndexMaximum ? {
          bytes: result.totalWithIndexMaximum.bytes || 0,
          mb: result.totalWithIndexMaximum.mb || (result.totalWithIndexMaximum.bytes / (1024 * 1024)) || 0,
          gb: result.totalWithIndexMaximum.gb || (result.totalWithIndexMaximum.bytes / (1024 * 1024 * 1024)) || 0
        } : undefined,
        recommendations: result.recommendations || [],
        breakdown: result.breakdown || []
      };
      
      return capacityResult;
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Original response:', response);
      
      if (error instanceof SyntaxError) {
        throw new Error(`Lỗi định dạng JSON từ AI: ${error.message}. Response: ${response.substring(0, 500)}...`);
      }
      
      throw new Error(`Lỗi khi phân tích kết quả: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Optimized multi-call capacity analysis method with rate limiting
  async analyzeCapacityMultiCall(
    request: DDLCapacityRequest,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CapacityResult> {
    const { ddl, databaseType, recordCount, customModel } = request;
    
    // Add delay between API calls to prevent 503 errors
    const delayBetweenCalls = async (ms: number = 2000) => {
      await new Promise(resolve => setTimeout(resolve, ms));
    };
    
    try {
      onProgress?.("Analyzing DDL structure...", 10);
      
      // Check DDL size - if too large, fallback immediately
      if (ddl.length > 10000) {
        onProgress?.("DDL too large, using single call method...", 20);
        return await this.analyzeCapacity(request);
      }
      
      // Step 1: Parse DDL structure (simplified)
      let schemaAnalysis;
      try {
        schemaAnalysis = await this.analyzeSchemaStructure(ddl, databaseType, customModel);
        onProgress?.("Schema analysis completed", 30);
        await delayBetweenCalls(); // Rate limiting
      } catch (error) {
        console.error('Schema analysis failed:', error);
        onProgress?.("Schema analysis failed, falling back to single call...", 30);
        return await this.analyzeCapacity(request);
      }
      
      // If more than 3 tables, use single call to avoid too many requests
      if (schemaAnalysis.tables && schemaAnalysis.tables.length > 3) {
        onProgress?.("Too many tables, using single call method...", 40);
        return await this.analyzeCapacity(request);
      }
      
      // Step 2: Analyze tables with delays
      onProgress?.("Analyzing tables...", 50);
      const tableResults = [];
      
      for (let i = 0; i < Math.min(schemaAnalysis.tables?.length || 0, 3); i++) {
        const table = schemaAnalysis.tables[i];
        try {
          onProgress?.(`Analyzing table ${table.name}...`, 50 + i * 15);
          
          // Add delay before each table analysis
          if (i > 0) await delayBetweenCalls();
          
          const result = await this.analyzeTableCapacity(table, recordCount, databaseType, customModel);
          tableResults.push(result);
          onProgress?.(`Table ${table.name} completed`, 50 + (i + 1) * 15);
        } catch (error) {
          console.error(`Table analysis failed for ${table.name}:`, error);
          // Create basic fallback result with field details from schema
          const fieldDetails = table.columns ? table.columns.map((col: {name?: string; type?: string; nullable?: boolean}, idx: number) => ({
            fieldName: col.name || `field_${idx}`,
            dataType: col.type || 'VARCHAR(255)',
            maxLength: col.type?.match(/\((\d+)\)/)?.[1] ? parseInt(col.type.match(/\((\d+)\)/)[1]) : undefined,
            nullable: col.nullable !== false,
            averageSize: this.estimateFieldSize(col.type || 'VARCHAR(255)', true),
            maximumSize: this.estimateFieldSize(col.type || 'VARCHAR(255)', false),
            overhead: col.nullable !== false ? 1 : 0,
            description: `Estimated size for ${col.type || 'VARCHAR(255)'} field`,
            storageNotes: `Basic estimate due to analysis error`
          })) : [];
          
          const avgRecordSize = fieldDetails.reduce((sum, field) => sum + field.averageSize + field.overhead, 20); // +20 for row overhead
          const maxRecordSize = fieldDetails.reduce((sum, field) => sum + field.maximumSize + field.overhead, 20);
          
          tableResults.push({
            tableName: table.name,
            averageRecordSize: avgRecordSize,
            maximumRecordSize: maxRecordSize,
            totalSizeAverage: { bytes: recordCount * avgRecordSize, mb: (recordCount * avgRecordSize) / (1024 * 1024) },
            totalSizeMaximum: { bytes: recordCount * maxRecordSize, mb: (recordCount * maxRecordSize) / (1024 * 1024) },
            recordCount: recordCount,
            fieldDetails: fieldDetails,
            rowOverhead: {
              nullBitmap: Math.ceil(fieldDetails.length / 8),
              rowHeader: 8,
              alignment: 4,
              total: Math.ceil(fieldDetails.length / 8) + 8 + 4
            },
            recommendations: [
              `Basic estimate for table ${table.name} due to analysis error.`,
              `Field analysis based on DDL structure - may not be fully accurate.`
            ]
          });
        }
      }
      
      onProgress?.("Tables analyzed", 80);
      await delayBetweenCalls(); // Delay before final aggregation
      
      // Step 3: Simple aggregation (skip complex index analysis to avoid 503)
      onProgress?.("Finalizing results...", 90);
      
      const totalAvgBytes = tableResults.reduce((sum, table) => sum + (table.totalSizeAverage?.bytes || 0), 0);
      const totalMaxBytes = tableResults.reduce((sum, table) => sum + (table.totalSizeMaximum?.bytes || 0), 0);
      const indexEstimate = totalAvgBytes * 0.1; // Simple 10% estimate for indexes
      
      const result: CapacityResult = {
        averageRecordSize: Math.round(totalAvgBytes / recordCount),
        maximumRecordSize: Math.round(totalMaxBytes / recordCount),
        totalSizeAverage: {
          bytes: totalAvgBytes,
          mb: totalAvgBytes / (1024 * 1024),
          gb: totalAvgBytes / (1024 * 1024 * 1024)
        },
        totalSizeMaximum: {
          bytes: totalMaxBytes,
          mb: totalMaxBytes / (1024 * 1024),
          gb: totalMaxBytes / (1024 * 1024 * 1024)
        },
        indexSize: {
          bytes: indexEstimate,
          mb: indexEstimate / (1024 * 1024),
          gb: indexEstimate / (1024 * 1024 * 1024)
        },
        totalWithIndexAverage: {
          bytes: totalAvgBytes + indexEstimate,
          mb: (totalAvgBytes + indexEstimate) / (1024 * 1024),
          gb: (totalAvgBytes + indexEstimate) / (1024 * 1024 * 1024)
        },
        totalWithIndexMaximum: {
          bytes: totalMaxBytes + indexEstimate,
          mb: (totalMaxBytes + indexEstimate) / (1024 * 1024),
          gb: (totalMaxBytes + indexEstimate) / (1024 * 1024 * 1024)
        },
        recommendations: [
          "Analysis completed with rate limiting to prevent 503 errors",
          "Consider optimizing VARCHAR field sizes",
          "Review indexing strategy for better performance"
        ],
        breakdown: tableResults
      };
      
      onProgress?.("Analysis completed", 100);
      return result;
      
    } catch (error) {
      console.error('Multi-call analysis failed:', error);
      onProgress?.("Multi-call failed, using single call fallback...", 50);
      return await this.analyzeCapacity(request);
    }
  }

  private estimateFieldSize(dataType: string, average: boolean = true): number {
    const type = dataType.toUpperCase();
    
    // Extract length from VARCHAR(n), CHAR(n), etc.
    const lengthMatch = type.match(/\((\d+)\)/);
    const length = lengthMatch ? parseInt(lengthMatch[1]) : null;
    
    // Basic size estimates
    if (type.includes('INT')) return 4;
    if (type.includes('BIGINT')) return 8;
    if (type.includes('SMALLINT')) return 2;
    if (type.includes('TINYINT')) return 1;
    if (type.includes('DECIMAL') || type.includes('NUMERIC')) return 16;
    if (type.includes('FLOAT')) return 4;
    if (type.includes('DOUBLE')) return 8;
    if (type.includes('DATE')) return 3;
    if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return 8;
    if (type.includes('TIME')) return 3;
    if (type.includes('BOOLEAN') || type.includes('BOOL')) return 1;
    
    // Variable length types
    if (type.includes('VARCHAR')) {
      if (length) {
        return average ? Math.min(length * 0.6, length) : length; // Assume 60% usage on average
      }
      return average ? 50 : 255; // Default estimate
    }
    
    if (type.includes('CHAR')) {
      return length || 255;
    }
    
    if (type.includes('TEXT')) {
      return average ? 1000 : 65535; // TEXT field estimates
    }
    
    if (type.includes('BLOB')) {
      return average ? 1024 : 65535; // BLOB field estimates
    }
    
    // Default fallback
    return average ? 50 : 255;
  }

  private async analyzeSchemaStructure(ddl: string, databaseType: string, customModel?: string) {
    const systemPrompt = `Parse ${databaseType.toUpperCase()} DDL and extract basic structure. Return concise JSON:
{
  "tables": [{"name": "table_name", "columns": [{"name": "col", "type": "VARCHAR(255)", "nullable": true}], "primaryKey": ["col1"]}],
  "indexes": [{"name": "idx", "table": "table1", "columns": ["col1"]}]
}`;

    const userPrompt = `Parse this ${databaseType.toUpperCase()} DDL:

${ddl.substring(0, 1500)}${ddl.length > 1500 ? '...' : ''}

Return JSON with table structure.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    try {
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Schema analysis JSON parsing error:', error);
      console.error('Original response:', response);
      throw new Error(`Lỗi phân tích cấu trúc DDL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeTableCapacity(table: { name: string; columns: unknown[]; primaryKey?: string[]; constraints?: string[] }, recordCount: number, databaseType: string, customModel?: string) {
    const systemPrompt = `Bạn là chuyên gia tính toán storage capacity cho database table. Phân tích chi tiết từng field và tính toán chính xác record size.

Database type: ${databaseType.toUpperCase()}
Record count: ${recordCount.toLocaleString()}

Nhiệm vụ:
1. Phân tích từng field chi tiết (data type, size, overhead)
2. Tính toán row overhead (null bitmap, row header, alignment padding)
3. Tính toán average và maximum record size
4. Tính total storage requirement
5. Đưa ra khuyến nghị tối ưu hóa chi tiết

QUAN TRỌNG: Phân tích từng field một cách chi tiết với:
- Kích thước cơ bản của data type
- Overhead cho nullable fields
- Alignment padding requirements
- Mô tả rõ ràng về cách tính toán

Trả về JSON:
\`\`\`json
{
  "tableName": "${table.name}",
  "averageRecordSize": number,
  "maximumRecordSize": number,
  "totalSizeAverage": {
    "bytes": number,
    "mb": number
  },
  "totalSizeMaximum": {
    "bytes": number,
    "mb": number  
  },
  "recordCount": ${recordCount},
  "fieldDetails": [
    {
      "fieldName": "field_name",
      "dataType": "VARCHAR(255)",
      "maxLength": 255,
      "nullable": true,
      "averageSize": 50,
      "maximumSize": 255,
      "overhead": 2,
      "description": "Mô tả chi tiết cách tính toán size",
      "storageNotes": "Thông tin bổ sung về storage"
    }
  ],
  "rowOverhead": {
    "nullBitmap": 4,
    "rowHeader": 8,
    "alignment": 4,
    "total": 16
  },
  "recommendations": ["recommendation 1", "recommendation 2"]
}
\`\`\`

Lưu ý: Đóng gói kết quả trong \`\`\`json và \`\`\` để đảm bảo format đúng.`;

    const userPrompt = `Tính toán capacity cho bảng:
Table: ${table.name}
Columns: ${JSON.stringify(table.columns, null, 2)}
Primary Key: ${JSON.stringify(table.primaryKey)}
Constraints: ${JSON.stringify(table.constraints)}

Hãy tính toán chính xác record size và storage requirement.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    try {
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Table capacity JSON parsing error:', error);
      console.error('Original response:', response);
      throw new Error(`Lỗi phân tích bảng ${table.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeIndexes(indexes: unknown[], tableResults: { tableName: string; recordCount: number }[], databaseType: string, customModel?: string) {
    const systemPrompt = `Bạn là chuyên gia database index optimization. Tính toán storage requirement cho indexes và đưa ra khuyến nghị.

Database type: ${databaseType.toUpperCase()}

Nhiệm vụ:
1. Tính toán storage requirement cho từng index
2. Ước tính overhead của index maintenance
3. Phân tích index selectivity và hiệu quả
4. Đưa ra khuyến nghị tối ưu hóa index

Trả về JSON:
\`\`\`json
{
  "totalIndexSize": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "indexBreakdown": [
    {
      "name": "index_name",
      "table": "table_name",
      "size": {
        "bytes": number,
        "mb": number
      },
      "efficiency": "HIGH|MEDIUM|LOW",
      "recommendations": ["rec1", "rec2"]
    }
  ],
  "generalRecommendations": ["recommendation 1"]
}
\`\`\`

Lưu ý: Đóng gói kết quả trong \`\`\`json và \`\`\` để đảm bảo format đúng.`;

    const userPrompt = `Phân tích indexes:
${JSON.stringify(indexes, null, 2)}

Table Results để tham khảo:
${JSON.stringify(tableResults.map(t => ({ name: t.tableName, recordCount: t.recordCount })), null, 2)}

Hãy tính toán storage requirement và đưa ra khuyến nghị tối ưu.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    try {
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Index analysis JSON parsing error:', error);
      console.error('Original response:', response);
      throw new Error(`Lỗi phân tích indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async aggregateCapacityResults(
    tableResults: unknown[], 
    indexAnalysis: { totalIndexSize: unknown }, 
    schemaAnalysis: unknown, 
    recordCount: number,
    databaseType: string, 
    customModel?: string
  ) {
    const systemPrompt = `Bạn là chuyên gia database capacity planning. Tổng hợp kết quả từ các phân tích riêng lẻ thành báo cáo tổng thể.

Database type: ${databaseType.toUpperCase()}
Total records: ${recordCount.toLocaleString()}

Nhiệm vụ:
1. Tổng hợp kết quả từ tất cả bảng
2. Kết hợp với analysis của indexes
3. Tính toán tổng dung lượng average và maximum
4. Đưa ra khuyến nghị tổng thể cho toàn bộ database
5. So sánh và phân tích trade-offs

Trả về JSON theo format CapacityResult đầy đủ.`;

    const userPrompt = `Tổng hợp kết quả capacity analysis:

Table Results:
${JSON.stringify(tableResults, null, 2)}

Index Analysis:
${JSON.stringify(indexAnalysis, null, 2)}

Schema Overview:
${JSON.stringify(schemaAnalysis, null, 2)}

Hãy tạo báo cáo tổng thể với recommendations cho toàn bộ database.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    let result;
    try {
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        result = JSON.parse(jsonString);
      } else {
        result = JSON.parse(cleanedResponse);
      }
    } catch (error) {
      console.error('Aggregate results JSON parsing error:', error);
      console.error('Original response:', response);
      throw new Error(`Lỗi tổng hợp kết quả: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Ensure proper structure for CapacityResult
    const capacityResult: CapacityResult = {
      averageRecordSize: (result as { averageRecordSize?: number }).averageRecordSize || 0,
      maximumRecordSize: (result as { maximumRecordSize?: number }).maximumRecordSize || 0,
      totalSizeAverage: {
        bytes: (result as { totalSizeAverage?: { bytes?: number } }).totalSizeAverage?.bytes || 0,
        mb: (result as { totalSizeAverage?: { mb?: number, bytes?: number } }).totalSizeAverage?.mb || ((result as { totalSizeAverage?: { bytes?: number } }).totalSizeAverage?.bytes || 0) / (1024 * 1024),
        gb: (result as { totalSizeAverage?: { gb?: number, bytes?: number } }).totalSizeAverage?.gb || ((result as { totalSizeAverage?: { bytes?: number } }).totalSizeAverage?.bytes || 0) / (1024 * 1024 * 1024)
      },
      totalSizeMaximum: {
        bytes: (result as { totalSizeMaximum?: { bytes?: number } }).totalSizeMaximum?.bytes || 0,
        mb: (result as { totalSizeMaximum?: { mb?: number, bytes?: number } }).totalSizeMaximum?.mb || ((result as { totalSizeMaximum?: { bytes?: number } }).totalSizeMaximum?.bytes || 0) / (1024 * 1024),
        gb: (result as { totalSizeMaximum?: { gb?: number, bytes?: number } }).totalSizeMaximum?.gb || ((result as { totalSizeMaximum?: { bytes?: number } }).totalSizeMaximum?.bytes || 0) / (1024 * 1024 * 1024)
      },
      indexSize: indexAnalysis.totalIndexSize as { bytes: number; mb: number; gb: number } | undefined,
      totalWithIndexAverage: (result as { totalWithIndexAverage?: { bytes: number; mb: number; gb: number } }).totalWithIndexAverage,
      totalWithIndexMaximum: (result as { totalWithIndexMaximum?: { bytes: number; mb: number; gb: number } }).totalWithIndexMaximum,
      recommendations: (result as { recommendations?: string[] }).recommendations || [],
      breakdown: tableResults as { tableName: string; averageRecordSize: number; maximumRecordSize: number; totalSizeAverage: { bytes: number; mb: number }; totalSizeMaximum: { bytes: number; mb: number }; recordCount: number; indexSize?: { bytes: number; mb: number }; recommendations?: string[] }[]
    };
    return capacityResult;
  }
}
