import { ChatGPTConfig, QueueConfig } from "@/contexts/ConfigContext";
import { TranslationRequest, MultiTranslationRequest, MultiTranslationResult } from "@/types/translation";
import { DDLCapacityRequest, CapacityResult } from "@/types/capacity";
import { LANGUAGES, TRANSLATION_STYLES, TRANSLATION_PROFICIENCIES } from "@/data/translation";

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
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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
            
            // Always retry on any error (except authentication errors) with 5 second delay
            if (response.status !== 401 && response.status !== 403) {
              console.warn(`API call failed (${response.status}), retrying in ${retryDelay}ms... (attempt ${attempt + 1})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            
            throw new Error(
              `API Error (${response.status}): ${errorData.error?.message || response.statusText}`
            );
          }

          const data: ChatGPTResponse = await response.json();
          
          if (!data.choices || data.choices.length === 0) {
            // Retry on invalid response
            console.warn(`Invalid response received, retrying in ${retryDelay}ms... (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return makeRequest(attempt + 1);
          }

          return data.choices[0].message.content;
        } catch (error) {
          // Handle specific error types
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.warn(`Request timeout, retrying in ${retryDelay}ms... (attempt ${attempt + 1})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            
            if (error.message.includes('fetch') || error.message.includes('network')) {
              console.warn(`Network error, retrying in ${retryDelay}ms... (attempt ${attempt + 1})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return makeRequest(attempt + 1);
            }
            
            // For API authentication errors, don't retry
            if (error.message.includes('401') || error.message.includes('403') || error.message.includes('API Key')) {
              throw error;
            }
            
            // For all other errors, retry
            console.warn(`Error occurred, retrying in ${retryDelay}ms... (attempt ${attempt + 1}): ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return makeRequest(attempt + 1);
          }
          
          // Unknown error, retry
          console.warn(`Unknown error, retrying in ${retryDelay}ms... (attempt ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return makeRequest(attempt + 1);
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
    const { text, sourceLanguage, targetLanguage, style, proficiency, model } = request;
    
    const sourceLang = LANGUAGES.find(lang => lang.code === sourceLanguage);
    const targetLang = LANGUAGES.find(lang => lang.code === targetLanguage);
    const translationStyle = TRANSLATION_STYLES.find(s => s.id === style);
    const translationProficiency = proficiency ? TRANSLATION_PROFICIENCIES.find(p => p.id === proficiency) : null;
    
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
- Mô tả trình độ: ${translationProficiency.description}` : ''}

Hướng dẫn chi tiết về phong cách:
${translationStyle.prompt}${translationProficiency ? `

Hướng dẫn chi tiết về trình độ đầu ra:
${translationProficiency.prompt}` : ''}

Lưu ý quan trọng:
- Chỉ trả về bản dịch cuối cùng, không thêm giải thích
- Giữ nguyên định dạng của văn bản gốc (xuống dòng, dấu câu, etc.)
- Nếu có từ khóa chuyên ngành, hãy dịch phù hợp với ngữ cảnh
- Đảm bảo bản dịch phù hợp với văn hóa của ngôn ngữ đích
- Nếu ngôn ngữ nguồn là "auto", hãy tự động phát hiện ngôn ngữ${translationProficiency ? `
- Điều chỉnh độ phức tạp của ngôn ngữ theo trình độ đã chọn: ${translationProficiency.name}` : ''}`;

    const userPrompt = `Hãy dịch văn bản sau:

${text}`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, model);
  }

  async translateToMultipleLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult[]> {
    const { text, sourceLanguage, targetLanguages, style, proficiency, model } = request;
    
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
    
    const systemPrompt = `Bạn là chuyên gia về database và data storage optimization. Nhiệm vụ của bạn là phân tích DDL schema và tính toán dung lượng cơ sở dữ liệu một cách chính xác.

Yêu cầu phân tích:
- Database type: ${databaseType.toUpperCase()}
- Số lượng bản ghi: ${recordCount.toLocaleString()}

Nhiệm vụ chính:
1. Phân tích DDL schema để hiểu cấu trúc bảng, kiểu dữ liệu, constraints
2. TỰ ĐỘNG TÍNH TOÁN kích thước trung bình (average) và kích thước tối đa (maximum) của một bản ghi
3. Tính toán tổng dung lượng cho cả trường hợp trung bình và tối đa
4. Ước tính dung lượng index (primary key, foreign key, unique constraints)
5. Đưa ra khuyến nghị tối ưu hóa storage và performance
6. Phân tích chi tiết theo từng bảng

Cách tính toán kích thước bản ghi:
- AVERAGE: Sử dụng giá trị trung bình cho VARCHAR/TEXT (50% max length), số liệu điển hình
- MAXIMUM: Sử dụng giá trị tối đa có thể cho tất cả field (VARCHAR max length, số lớn nhất, etc.)
- Bao gồm overhead của ${databaseType.toUpperCase()} (null bitmap, row header, alignment, etc.)

Định dạng output (JSON):
{
  "averageRecordSize": number,
  "maximumRecordSize": number,
  "totalSizeAverage": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "totalSizeMaximum": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "indexSize": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "totalWithIndexAverage": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "totalWithIndexMaximum": {
    "bytes": number,
    "mb": number,
    "gb": number
  },
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2", ...],
  "breakdown": [
    {
      "tableName": "tên bảng",
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
      "recordCount": number,
      "indexSize": {
        "bytes": number,
        "mb": number
      },
      "recommendations": ["khuyến nghị cho bảng này"]
    }
  ]
}

Lưu ý quan trọng:
- ĐÓNG GÓI kết quả trong \`\`\`json và \`\`\` để đảm bảo format đúng
- PHẢI tính toán cả average và maximum record size tự động  
- Tính toán dựa trên đặc điểm của ${databaseType.toUpperCase()} (page size, overhead, compression, etc.)
- Bao gồm overhead của database engine (metadata, page headers, row overhead, etc.)
- Đưa ra báo cáo chi tiết về sự khác biệt giữa trường hợp trung bình và tối đa`;

    const userPrompt = `Hãy phân tích DDL schema sau và tự động tính toán kích thước trung bình và tối đa của bản ghi:

DDL Schema:
${ddl}

Số lượng bản ghi dự kiến: ${recordCount.toLocaleString()}
Database: ${databaseType.toUpperCase()}

Yêu cầu:
1. Tự động tính toán average record size (kích thước trung bình thực tế)
2. Tự động tính toán maximum record size (kích thước tối đa có thể)
3. Tính tổng dung lượng cho cả hai trường hợp
4. Đưa ra báo cáo so sánh và khuyến nghị

Hãy tính toán chi tiết và đưa ra kết quả JSON hoàn chỉnh.`;

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

  // New multi-call capacity analysis method with improved error handling
  async analyzeCapacityMultiCall(
    request: DDLCapacityRequest,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CapacityResult> {
    const { ddl, databaseType, recordCount, customModel } = request;
    
    try {
      onProgress?.("Đang phân tích cấu trúc DDL...", 10);
      
      // Step 1: Parse DDL structure and identify tables with retry
      let schemaAnalysis;
      try {
        onProgress?.("Đang phân tích cấu trúc DDL với retry logic...", 10);
        schemaAnalysis = await this.analyzeSchemaStructure(ddl, databaseType, customModel);
        onProgress?.("Đã hoàn thành phân tích cấu trúc", 25);
      } catch (error) {
        console.error('Schema analysis failed:', error);
        onProgress?.("Lỗi phân tích cấu trúc sau nhiều lần thử, chuyển sang phương pháp đơn giản...", 25);
        // Fallback to single call method
        return await this.analyzeCapacity(request);
      }
      
      // Step 2: Analyze each table individually with error handling
      onProgress?.("Đang phân tích từng bảng...", 40);
      const tableResults = [];
      const failedTables = [];
      
      // Process tables sequentially to avoid overwhelming the API
      for (let i = 0; i < schemaAnalysis.tables.length; i++) {
        const table = schemaAnalysis.tables[i];
        try {
          onProgress?.(`Đang phân tích bảng ${table.name} (sẽ retry nếu cần)...`, 40 + i * 20 / schemaAnalysis.tables.length);
          const result = await this.analyzeTableCapacity(table, recordCount, databaseType, customModel);
          tableResults.push(result);
          onProgress?.(`Đã phân tích xong bảng ${table.name}`, 40 + (i + 1) * 20 / schemaAnalysis.tables.length);
        } catch (error) {
          console.error(`Failed to analyze table ${table.name} after retries:`, error);
          failedTables.push(table.name);
          
          // Create a basic fallback result for failed tables
          tableResults.push({
            tableName: table.name,
            averageRecordSize: 100, // Basic estimate
            maximumRecordSize: 500,
            totalSizeAverage: {
              bytes: recordCount * 100,
              mb: (recordCount * 100) / (1024 * 1024)
            },
            totalSizeMaximum: {
              bytes: recordCount * 500,
              mb: (recordCount * 500) / (1024 * 1024)
            },
            recordCount: recordCount,
            recommendations: [`Không thể phân tích chi tiết bảng ${table.name} sau nhiều lần retry. Sử dụng ước tính cơ bản.`]
          });
        }
      }
      
      onProgress?.("Đã hoàn thành phân tích bảng", 70);
      
      // Step 3: Analyze indexes and constraints with fallback
      let indexAnalysis;
      try {
        onProgress?.("Đang phân tích indexes (sẽ retry nếu cần)...", 75);
        indexAnalysis = await this.analyzeIndexes(schemaAnalysis.indexes || [], tableResults, databaseType, customModel);
        onProgress?.("Đã phân tích xong indexes", 85);
      } catch (error) {
        console.error('Index analysis failed after retries:', error);
        // Provide basic index analysis fallback
        const totalRecords = tableResults.reduce((sum, table) => sum + (table.recordCount || recordCount), 0);
        indexAnalysis = {
          totalIndexSize: {
            bytes: totalRecords * 50, // Basic estimate for index size
            mb: (totalRecords * 50) / (1024 * 1024),
            gb: (totalRecords * 50) / (1024 * 1024 * 1024)
          },
          indexBreakdown: [],
          generalRecommendations: ["Không thể phân tích chi tiết indexes sau nhiều lần retry. Sử dụng ước tính cơ bản."]
        };
        onProgress?.("Sử dụng ước tính cơ bản cho indexes sau retry", 85);
      }
      
      // Step 4: Aggregate results and generate recommendations with error handling
      try {
        const finalResult = await this.aggregateCapacityResults(
          tableResults, 
          indexAnalysis, 
          schemaAnalysis, 
          recordCount, 
          databaseType, 
          customModel
        );
        onProgress?.("Hoàn thành phân tích", 100);
        
        // Add warnings about failed components
        if (failedTables.length > 0) {
          finalResult.recommendations = finalResult.recommendations || [];
          finalResult.recommendations.unshift(
            `Lưu ý: Không thể phân tích chi tiết ${failedTables.length} bảng: ${failedTables.join(', ')}. Sử dụng ước tính cơ bản.`
          );
        }
        
        return finalResult;
      } catch (error) {
        console.error('Final aggregation failed:', error);
        onProgress?.("Lỗi tổng hợp kết quả, chuyển sang phương pháp đơn giản...", 90);
        // Fallback to single call method
        return await this.analyzeCapacity(request);
      }
      
    } catch (error) {
      console.error('Multi-call analysis completely failed:', error);
      onProgress?.("Phân tích nhiều bước thất bại, chuyển sang phương pháp đơn giản...", 50);
      // Final fallback to single call method
      return await this.analyzeCapacity(request);
    }
  }

  private async analyzeSchemaStructure(ddl: string, databaseType: string, customModel?: string) {
    const systemPrompt = `Bạn là chuyên gia database schema analysis. Nhiệm vụ của bạn là phân tích DDL và trích xuất thông tin cấu trúc.

Database type: ${databaseType.toUpperCase()}

Yêu cầu:
1. Phân tích DDL và trích xuất danh sách bảng
2. Xác định columns, data types, constraints cho mỗi bảng
3. Nhận diện indexes, primary keys, foreign keys
4. Phân tích relationships giữa các bảng

Trả về JSON format:
\`\`\`json
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "data_type",
          "nullable": boolean,
          "maxLength": number,
          "defaultValue": string
        }
      ],
      "primaryKey": ["column1", "column2"],
      "constraints": ["constraint descriptions"]
    }
  ],
  "indexes": [
    {
      "name": "index_name",
      "table": "table_name", 
      "columns": ["col1", "col2"],
      "type": "PRIMARY|UNIQUE|INDEX",
      "estimatedSelectivity": 0.8
    }
  ],
  "relationships": [
    {
      "fromTable": "table1",
      "toTable": "table2", 
      "type": "one-to-many|many-to-many|one-to-one"
    }
  ]
}
\`\`\`

Lưu ý: Đóng gói kết quả trong \`\`\`json và \`\`\` để đảm bảo format đúng.`;

    const userPrompt = `Phân tích DDL schema sau và trích xuất cấu trúc:

${ddl}

Hãy trả về JSON chứa thông tin chi tiết về tables, columns, indexes và relationships.`;

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
