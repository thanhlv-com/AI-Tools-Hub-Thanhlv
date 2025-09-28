import { ChatGPTConfig, QueueConfig } from "@/contexts/ConfigContext";
import { TranslationRequest, MultiTranslationRequest, MultiTranslationResult } from "@/types/translation";
import { DDLCapacityRequest, CapacityResult, DDLStructureAnalysis } from "@/types/capacity";
import { DiagramRequest, DiagramResult } from "@/types/diagram";
import { RewritingRequest, RewritingResult } from "@/types/rewriting";
import { LANGUAGES, TRANSLATION_STYLES, TRANSLATION_PROFICIENCIES, EMOTICON_OPTIONS, EMOTICON_FREQUENCIES } from "@/data/translation";
import { DIAGRAM_TYPES, DIAGRAM_STYLES, DIAGRAM_COMPLEXITIES, DIAGRAM_FORMATS, DIAGRAM_OUTPUT_LANGUAGES } from "@/data/diagram";
import { WRITING_STYLES, WRITING_TONES, WRITING_LENGTHS, WRITING_COMPLEXITIES, OUTPUT_LANGUAGES } from "@/data/rewriting";
import { getWikiStructureById, getDefaultWikiStructure } from "@/data/wikiStructures";
import { addStepIndexing } from "./diagramStepIndexing";

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
    const { text, sourceLanguage, targetLanguage, style, proficiency, emoticonOption, emoticonFrequency, model } = request;
    
    const sourceLang = LANGUAGES.find(lang => lang.code === sourceLanguage);
    const targetLang = LANGUAGES.find(lang => lang.code === targetLanguage);
    const translationStyle = TRANSLATION_STYLES.find(s => s.id === style);
    const translationProficiency = proficiency ? TRANSLATION_PROFICIENCIES.find(p => p.id === proficiency) : null;
    
    if (!sourceLang || !targetLang || !translationStyle) {
      throw new Error("Invalid language or style selection");
    }

    // Step 1: Basic translation (without emoticons)
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
- Chỉ trả về bản dịch cuối cùng, không thêm giải thích, không nhận xét hay chú thích
- Giữ nguyên định dạng của văn bản gốc (xuống dòng, dấu câu, etc.)
- Nếu có từ khóa chuyên ngành, hãy dịch phù hợp với ngữ cảnh
- Đảm bảo bản dịch phù hợp với văn hóa của ngôn ngữ đích
- Nếu ngôn ngữ nguồn là "auto", hãy tự động phát hiện ngôn ngữ${translationProficiency ? `
- Điều chỉnh độ phức tạp của ngôn ngữ theo trình độ đã chọn: ${translationProficiency.name}` : ''}
- KHÔNG thêm emoticons hoặc emoji trong bước này`;

    const userPrompt = `Hãy dịch văn bản sau:

${text}`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const basicTranslation = await this.callAPI(messages, model);

    // Step 2: Enhance with emoticons if requested
    if (emoticonOption && emoticonOption !== 'keep-original') {
      return await this.enhanceWithEmoticons(basicTranslation, targetLanguage, emoticonOption, emoticonFrequency, model);
    }

    return basicTranslation;
  }

  async enhanceWithEmoticons(
    translatedText: string,
    targetLanguage: string,
    emoticonOption: string,
    emoticonFrequency?: string,
    model?: string
  ): Promise<string> {
    const emoticonPreference = EMOTICON_OPTIONS.find(e => e.id === emoticonOption);
    const emoticonFrequencyPreference = emoticonFrequency ? EMOTICON_FREQUENCIES.find(f => f.id === emoticonFrequency) : null;
    
    if (!emoticonPreference) {
      return translatedText; // Return original if no valid emoticon preference
    }

    const targetLang = LANGUAGES.find(lang => lang.code === targetLanguage);
    
    const systemPrompt = `Bạn là chuyên gia tối ưu hóa văn bản với emoticons và emoji. Nhiệm vụ của bạn là thêm emoticons/emoji phù hợp vào văn bản đã dịch để tăng tính thu hút và cảm xúc.

Thông tin ngôn ngữ đích: ${targetLang?.name} (${targetLang?.nativeName})

Yêu cầu về emoticons:
- Loại emoticon: ${emoticonPreference.name}
- Mô tả: ${emoticonPreference.description}${emoticonFrequencyPreference ? `
- Tần suất sử dụng: ${emoticonFrequencyPreference.name} (${emoticonFrequencyPreference.level})
- Mô tả tần suất: ${emoticonFrequencyPreference.description}` : ''}

Hướng dẫn chi tiết:
${emoticonPreference.prompt}${emoticonFrequencyPreference ? `

Hướng dẫn về tần suất:
${emoticonFrequencyPreference.prompt}` : ''}

Nguyên tắc quan trọng:
- CHỈ thêm emoticons/emoji, KHÔNG thay đổi nội dung văn bản gốc
- Giữ nguyên ý nghĩa và thông điệp của văn bản
- Đặt emoticons ở vị trí tự nhiên và phù hợp
- Đảm bảo emoticons phù hợp với văn hóa của ngôn ngữ đích
- Trả về văn bản hoàn chỉnh với emoticons đã được thêm vào
- KHÔNG thêm giải thích hay nhận xét gì thêm`;

    const userPrompt = `Hãy thêm emoticons/emoji phù hợp vào văn bản sau:

${translatedText}

Thêm emoticons theo yêu cầu đã chỉ định để tăng tính thu hút và cảm xúc cho văn bản.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, model);
  }

  async translateToMultipleLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult[]> {
    const { text, sourceLanguage, targetLanguages, style, proficiency, emoticonOption, emoticonFrequency, model } = request;
    
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

        // Use the updated translateText method which includes the two-step process
        const singleRequest: TranslationRequest = {
          text,
          sourceLanguage,
          targetLanguage: targetLangCode,
          style,
          proficiency,
          emoticonOption,
          emoticonFrequency,
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

  async generateDetailedPrompt(
    simpleDescription: string,
    outputFormat: "plaintext" | "json" = "plaintext",
    customModel?: string
  ): Promise<string> {
    let systemPrompt: string;

    if (outputFormat === "json") {
      // JSON-specific prompt generation
      systemPrompt = `Bạn là chuyên gia Prompt Engineering hàng đầu với 10+ năm kinh nghiệm. Nhiệm vụ của bạn là từ một mô tả đơn giản, tạo ra một JSON prompt có cấu trúc hoàn chỉnh, chi tiết và chuyên nghiệp.

## NGUYÊN TẮC QUAN TRỌNG:
1. **PHÂN TÍCH SÂU**: Hiểu rõ ý định và mục đích từ mô tả đơn giản
2. **CẤU TRÚC JSON**: Tạo prompt theo format JSON với các fields rõ ràng
3. **CHI TIẾT TOÀN DIỆN**: Bao gồm đầy đủ thông tin cần thiết
4. **TÍNH THỰC TIỄN**: Đảm bảo JSON có thể sử dụng ngay với AI systems

## CẤU TRÚC JSON BẮT BUỘC:
{
  "prompt_goal": "Mục tiêu chính và cụ thể của prompt",
  "target_audience": "Đối tượng mục tiêu rõ ràng với level kỹ năng",
  "output_format": "Định dạng đầu ra chi tiết và cụ thể",
  "task": "Nhiệm vụ cụ thể và actionable mà AI cần thực hiện",
  "persona": "Vai trò chuyên môn cụ thể với expertise",
  "context": "Bối cảnh đầy đủ, điều kiện và môi trường làm việc",
  "constraints": ["Ràng buộc cụ thể và measurable"],
  "examples": "Ví dụ minh họa rõ ràng input → output",
  "instructions": [
    "Hướng dẫn bước 1",
    "Hướng dẫn bước 2",
    "Hướng dẫn bước 3"
  ],
  "success_criteria": ["Tiêu chí thành công 1", "Tiêu chí thành công 2"],
  "metadata": {
    "created_at": "YYYY-MM-DD",
    "version": "1.0",
    "difficulty_level": "beginner|intermediate|advanced",
    "estimated_time": "thời gian ước tính",
    "ai_model_recommendation": "model phù hợp nhất"
  }
}

## YÊU CẦU VỀ CHẤT LƯỢNG:
✅ JSON phải valid và complete
✅ Instructions phải step-by-step và actionable
✅ Success criteria phải measurable
✅ Examples phải realistic và helpful
✅ Context phải đầy đủ để hiểu requirements

## ĐỊNH DẠNG ĐẦU RA:
- Trả về JSON thuần túy, KHÔNG có markdown formatting
- Tất cả string values phải được escape đúng chuẩn JSON
- Constraints và instructions LUÔN là arrays
- Metadata.created_at sử dụng format YYYY-MM-DD hiện tại`;
    } else {
      // Plain text prompt generation
      systemPrompt = `Bạn là chuyên gia Prompt Engineering hàng đầu với 10+ năm kinh nghiệm. Nhiệm vụ của bạn là từ một mô tả đơn giản, tạo ra một prompt chi tiết, toàn diện và có cấu trúc rõ ràng dưới dạng plain text.

## NGUYÊN TẮC QUAN TRỌNG:
1. **PHÂN TÍCH SÂU**: Hiểu rõ ý định và mục đích từ mô tả đơn giản
2. **MỞ RỘNG THÔNG MINH**: Tạo prompt chi tiết với các câu hỏi dẫn dắt và hướng dẫn cụ thể
3. **CẤU TRÚC CHUYÊN NGHIỆP**: Sử dụng format có tổ chức, dễ theo dõi
4. **TÍNH THỰC TIỄN**: Đảm bảo prompt có thể sử dụng ngay và hiệu quả

## CẤU TRÚC PROMPT LÝ TƯỞNG:
1. **Tiêu đề rõ ràng** về chủ đề/mục tiêu
2. **Giới thiệu ngắn gọn** về context và background
3. **Yêu cầu chi tiết** với các câu hỏi cụ thể (ít nhất 4-6 câu hỏi)
4. **Hướng dẫn về cấu trúc đầu ra** với format mong muốn
5. **Ví dụ minh họa** (nếu phù hợp)
6. **Lưu ý quan trọng** và điều kiện đặc biệt
7. **Tiêu chí đánh giá** chất lượng output

## YÊU CẦU VỀ CHẤT LƯỢNG:
✅ Prompt phải chi tiết, cụ thể và actionable
✅ Bao gồm các câu hỏi dẫn dắt để thu thập thông tin đầy đủ
✅ Sử dụng ngôn ngữ chính xác, chuyên nghiệp
✅ Có cấu trúc rõ ràng với đánh số hoặc bullet points
✅ Bao gồm hướng dẫn về định dạng đầu ra mong muốn
✅ Thêm context hoặc background cần thiết
✅ Có các tiêu chí success để đánh giá kết quả

## ĐỊNH DẠNG ĐẦU RA:
- Trả về prompt hoàn chỉnh dạng plain text, KHÔNG có markdown formatting
- Sử dụng tiếng Việt hoặc tiếng Anh tùy thuộc vào ngôn ngữ của input
- Đảm bảo prompt có thể copy-paste và sử dụng ngay
- Cấu trúc rõ ràng với đánh số và phân đoạn`;
    }

    const userPrompt = `Từ mô tả đơn giản sau đây, hãy tạo ra một ${outputFormat === "json" ? "JSON prompt có cấu trúc hoàn chỉnh" : "prompt chi tiết dạng plain text"}:

"${simpleDescription}"

${outputFormat === "json" 
  ? `Hãy phân tích ý định của mô tả này và tạo ra một JSON prompt hoàn chỉnh với tất cả các fields bắt buộc. Đảm bảo JSON valid và có thể sử dụng ngay với AI systems.`
  : `Hãy phân tích ý định của mô tả này và tạo ra một prompt chi tiết với:
1. Tiêu đề và giới thiệu rõ ràng
2. Các câu hỏi cụ thể để thu thập thông tin đầy đủ
3. Hướng dẫn về cấu trúc trả lời
4. Ví dụ hoặc context cần thiết
5. Tiêu chí đánh giá chất lượng
6. Lưu ý quan trọng`}

Tạo ${outputFormat === "json" ? "JSON" : "plain text"} prompt chi tiết và thực tiễn có thể sử dụng ngay.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, customModel);
  }

  async generateClaudePrompt(
    userRequest: string,
    customModel?: string
  ): Promise<string> {
    const systemPrompt = `Bạn là chuyên gia Prompt Engineering chuyên tạo prompt tối ưu cho Claude AI. Nhiệm vụ của bạn là từ yêu cầu của người dùng, tạo ra một prompt hoàn chỉnh và hiệu quả để gửi tới Claude.

## NGUYÊN TẮC QUAN TRỌNG:
1. **HIỂU RÕ YÊU CẦU**: Phân tích chi tiết ý định và mục đích của người dùng
2. **TỐI ƯU CHO CLAUDE**: Sử dụng cách viết prompt phù hợp với cách Claude hoạt động tốt nhất
3. **CHI TIẾT VÀ RÕ RÀNG**: Đảm bảo prompt đầy đủ thông tin và không gây nhầm lẫn
4. **CÓ CẤU TRÚC**: Sắp xếp prompt theo thứ tự logic, dễ hiểu

## CÁCH CLAUDE HOẠT ĐỘNG TỐT NHẤT:
- Claude thích các hướng dẫn rõ ràng, từng bước
- Claude hoạt động tốt khi có context và ví dụ cụ thể
- Claude thích format đầu ra được mô tả chi tiết
- Claude cần biết rõ vai trò và expertise level mong muốn
- Claude làm việc tốt với constraints và requirements cụ thể

## CẤU TRÚC PROMPT LỰA CHỌN:
1. **Vai trò chuyên môn** (nếu cần thiết)
2. **Context và background** về tình huống
3. **Mục tiêu cụ thể** cần đạt được
4. **Yêu cầu chi tiết** step-by-step (nếu phức tạp)
5. **Định dạng đầu ra** mong muốn
6. **Ví dụ minh họa** (nếu giúp làm rõ)
7. **Constraints và lưu ý** quan trọng

## YÊU CẦU VỀ CHẤT LƯỢNG:
✅ Prompt phải actionable và specific
✅ Sử dụng ngôn ngữ tự nhiên, không quá kỹ thuật
✅ Bao gồm đầy đủ context cần thiết
✅ Có structure rõ ràng và dễ theo dõi
✅ Tối ưu độ dài - không quá ngắn cũng không quá dài
✅ Phù hợp với level hiểu biết của đối tượng sử dụng

## ĐỊNH DẠNG ĐẦU RA:
- Trả về prompt hoàn chỉnh sẵn sàng gửi cho Claude
- Sử dụng tiếng Việt hoặc tiếng Anh tùy theo ngôn ngữ của yêu cầu
- KHÔNG thêm explanation hoặc meta-text
- Prompt phải có thể copy-paste trực tiếp`;

    const userPrompt = `Yêu cầu từ người dùng: "${userRequest}"

Hãy tạo một prompt tối ưu để gửi tới Claude AI dựa trên yêu cầu này. Prompt cần:
1. Đầy đủ thông tin để Claude hiểu rõ nhiệm vụ
2. Có cấu trúc rõ ràng và logic
3. Tối ưu hóa để Claude cho kết quả tốt nhất
4. Sẵn sàng sử dụng ngay không cần chỉnh sửa

Tạo prompt hoàn chỉnh và thực tiễn.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, customModel);
  }

  async generateTodoTasks(
    simpleRequest: string,
    customModel?: string
  ): Promise<string> {
    const systemPrompt = `Bạn là chuyên gia AI Task Planning và Automation Workflow. Nhiệm vụ của bạn là từ một yêu cầu đơn giản, chuyển đổi thành một danh sách todos và tasks chi tiết dành riêng cho AI Agent có thể thực hiện tự động.

## NGUYÊN TẮC QUAN TRỌNG:
1. **PHÂN TÍCH SÂU**: Hiểu rõ mục tiêu cuối cùng từ yêu cầu đơn giản
2. **CHIA NHỎ THÔNG MINH**: Chia yêu cầu lớn thành các bước cụ thể mà AI Agent có thể thực hiện
3. **CÓ CẤU TRÚC**: Sắp xếp theo thứ tự logic và độ ưu tiên phù hợp với AI workflow
4. **THỰC TIỄN CHO AI**: Tất cả todos/tasks phải actionable, measurable và có thể được AI thực hiện tự động

## CẤU TRÚC OUTPUT YÊU CẦU:
📋 **TỔNG QUAN DỰ ÁN**
- Mô tả ngắn gọn về mục tiêu chính
- Thời gian ước tính hoàn thành
- Độ phức tạp: Dễ/Trung bình/Khó

🎯 **MỤC TIÊU CHI TIẾT**
1. Mục tiêu chính (Main Goal)
2. Các mục tiêu phụ (Sub-goals)
3. Tiêu chí thành công (Success Criteria)

📝 **DANH SÁCH TODOS & TASKS**

**Phase 1: Phân tích & Chuẩn bị dữ liệu**
- [ ] Task 1.1: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)
- [ ] Task 1.2: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)
- [ ] Task 1.3: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)

**Phase 2: Thực thi tự động**
- [ ] Task 2.1: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)
- [ ] Task 2.2: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)

**Phase 3: Kiểm tra & Tối ưu hóa**
- [ ] Task 3.1: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)
- [ ] Task 3.2: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)

**Phase 4: Hoàn thiện & Báo cáo**
- [ ] Task 4.1: Mô tả task cụ thể cho AI Agent (Độ phức tạp: Thấp/Trung/Cao)

⚠️ **LƯU Ý & RỦI RO**
- Lưu ý quan trọng 1
- Rủi ro tiềm ẩn và cách xử lý
- Dependencies giữa các tasks

🔧 **AI TOOLS & RESOURCES CẦN THIẾT**
- AI Tool/Framework 1 (cho AI Agent)
- AI Tool/Framework 2 (cho AI Agent)
- API/Service cần thiết cho AI
- Dữ liệu huấn luyện/Context cần thiết

📈 **THEO DÕI TIẾN ĐỘ**
- Milestone 1: Mô tả (Deadline: X ngày)
- Milestone 2: Mô tả (Deadline: X ngày)
- Milestone cuối: Hoàn thành project (Deadline: X ngày)

## YÊU CẦU VỀ CHẤT LƯỢNG:
✅ Tất cả tasks phải cụ thể và có thể được AI Agent thực hiện tự động
✅ Có ước tính độ phức tạp (Thấp/Trung/Cao) thay vì thời gian
✅ Sắp xếp theo thứ tự logic và dependencies phù hợp với AI workflow
✅ Tập trung vào các tasks có thể automation
✅ Có risk assessment cho AI execution và fallback strategies
✅ Định nghĩa rõ success criteria có thể đo lường bằng metrics

## ĐỊNH DẠNG ĐẦU RA:
- Sử dụng format markdown với checkbox
- Emoji phù hợp cho dễ đọc
- Cấu trúc rõ ràng với headers
- Thông tin đầy đủ nhưng súc tích`;

    const userPrompt = `Nhiệm vụ cho AI Agent: "${simpleRequest}"

Hãy chuyển đổi nhiệm vụ này thành một danh sách todos và tasks chi tiết dành riêng cho AI Agent có thể thực hiện tự động. Bao gồm:

1. **Phân tích nhiệm vụ**: Hiểu rõ mục tiêu cuối cùng mà AI Agent cần đạt được
2. **Chia nhỏ thành phases**: Các giai đoạn logic phù hợp với AI workflow
3. **Chi tiết tasks**: Mỗi task cụ thể với độ phức tạp ước tính (Thấp/Trung/Cao)
4. **AI Dependencies**: Mối quan hệ giữa các tasks và yêu cầu input/output
5. **AI Risk & Mitigation**: Rủi ro trong quá trình AI execution và cách xử lý
6. **AI Resources**: Tools, APIs, và resources cần thiết cho AI Agent
7. **AI Milestones**: Các mốc quan trọng có thể đo lường bằng metrics

Tạo danh sách todos/tasks được tối ưu hóa cho AI Agent thực hiện tự động và hiệu quả.`;

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
      // More accurate TEXT field size estimation based on type
      if (type.includes('TINYTEXT')) {
        return average ? 128 : 255; // TINYTEXT: max 255 chars
      }
      if (type.includes('MEDIUMTEXT')) {
        return average ? 8192 : 16777215; // MEDIUMTEXT: max ~16MB
      }
      if (type.includes('LONGTEXT')) {
        return average ? 32768 : 4294967295; // LONGTEXT: max ~4GB
      }
      // Regular TEXT
      return average ? 2048 : 65535; // TEXT: max ~64KB, average ~2KB
    }
    
    if (type.includes('BLOB')) {
      // More accurate BLOB field size estimation based on type
      if (type.includes('TINYBLOB')) {
        return average ? 128 : 255; // TINYBLOB: max 255 bytes
      }
      if (type.includes('MEDIUMBLOB')) {
        return average ? 8192 : 16777215; // MEDIUMBLOB: max ~16MB
      }
      if (type.includes('LONGBLOB')) {
        return average ? 32768 : 4294967295; // LONGBLOB: max ~4GB
      }
      // Regular BLOB
      return average ? 2048 : 65535; // BLOB: max ~64KB, average ~2KB
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

  // New method for DDL structure analysis in 3-step workflow
  async analyzeDDLStructure(ddl: string, databaseType: string, customModel?: string): Promise<DDLStructureAnalysis> {
    const systemPrompt = `You are a database schema analyst. Analyze the DDL structure and extract detailed information about tables, fields, and their properties.

Database type: ${databaseType.toUpperCase()}

Tasks:
1. Parse all tables from the DDL
2. Extract fields with their data types, constraints, and properties
3. Identify primary keys, indexes, and relationships
4. Estimate realistic size information for each field, especially:
   - TEXT types: TINYTEXT(~128/255), TEXT(~2KB/64KB), MEDIUMTEXT(~8KB/16MB), LONGTEXT(~32KB/4GB)
   - BLOB types: Similar size estimation to TEXT types
   - VARCHAR: Consider actual usage patterns (typically 50-70% of max length)
5. Provide confidence scores for the analysis
6. Identify any parsing warnings or suggestions

Return ONLY valid JSON in this exact format:
{
  "tables": [
    {
      "id": "unique_table_id",
      "tableName": "table_name",
      "fields": [
        {
          "id": "unique_field_id",
          "fieldName": "field_name",
          "dataType": "data_type_with_length",
          "maxLength": number_or_null,
          "nullable": boolean,
          "isPrimaryKey": boolean,
          "isIndex": boolean,
          "defaultValue": "value_or_null",
          "description": "field_description",
          "estimatedAverageSize": number_in_bytes,
          "estimatedMaximumSize": number_in_bytes,
          "confidence": number_0_to_1
        }
      ],
      "indexes": ["index1", "index2"],
      "constraints": ["constraint1", "constraint2"],
      "estimatedRecordCount": number,
      "notes": "any_table_specific_notes"
    }
  ],
  "databaseType": "${databaseType}",
  "totalTables": number,
  "totalFields": number,
  "analysisConfidence": number_0_to_1,
  "warnings": ["warning1", "warning2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const userPrompt = `Analyze this DDL schema:

${ddl}`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await this.callAPI(messages, customModel);
    
    try {
      let cleanedResponse = response.trim();
      
      // Clean up response format
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        const result = JSON.parse(jsonString);
        
        // Validate and ensure required fields
        const structureAnalysis: DDLStructureAnalysis = {
          tables: result.tables || [],
          databaseType: result.databaseType || databaseType,
          totalTables: result.totalTables || (result.tables?.length || 0),
          totalFields: result.totalFields || (result.tables?.reduce((sum: number, table: unknown) => sum + ((table as {fields?: unknown[]}).fields?.length || 0), 0) || 0),
          analysisConfidence: result.analysisConfidence || 0.8,
          warnings: result.warnings || [],
          suggestions: result.suggestions || []
        };

        // Ensure all tables have required IDs
        structureAnalysis.tables = structureAnalysis.tables.map((table, tableIndex) => ({
          ...table,
          id: table.id || `table_${tableIndex}`,
          fields: table.fields?.map((field, fieldIndex) => ({
            ...field,
            id: field.id || `${table.id || `table_${tableIndex}`}_field_${fieldIndex}`,
            confidence: field.confidence || 0.8
          })) || []
        }));
        
        return structureAnalysis;
      }
      
      throw new Error("Invalid JSON structure in response");
    } catch (error) {
      console.error('DDL structure analysis JSON parsing error:', error);
      console.error('Original response:', response);
      
      if (error instanceof SyntaxError) {
        throw new Error(`Lỗi định dạng JSON từ AI khi phân tích cấu trúc DDL: ${error.message}. Response: ${response.substring(0, 500)}...`);
      }
      
      throw new Error(`Lỗi khi phân tích cấu trúc DDL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced capacity calculation using pre-analyzed structure
  async calculateCapacityFromStructure(
    structureAnalysis: DDLStructureAnalysis,
    recordCount: number,
    customModel?: string
  ): Promise<CapacityResult> {
    const systemPrompt = `You are a database storage analyst. Calculate precise record sizes and total capacity using the pre-analyzed DDL structure.

Database type: ${structureAnalysis.databaseType.toUpperCase()}
Total records: ${recordCount.toLocaleString()}

The DDL structure has already been analyzed. Use this information to calculate:
1. Accurate average and maximum record sizes per table
2. Total storage requirements
3. Index overhead estimation
4. Storage optimization recommendations

Consider the database-specific storage characteristics (row headers, null bitmaps, alignment, padding) for ${structureAnalysis.databaseType.toUpperCase()}.

Use realistic size estimates for TEXT and BLOB fields:
- TINYTEXT/TINYBLOB: avg 128B, max 255B
- TEXT/BLOB: avg 2KB, max 64KB  
- MEDIUMTEXT/MEDIUMBLOB: avg 8KB, max 16MB
- LONGTEXT/LONGBLOB: avg 32KB, max 4GB

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
  "breakdown": [
    {
      "tableName": "table_name",
      "averageRecordSize": <bytes>,
      "maximumRecordSize": <bytes>,
      "totalSizeAverage": {"bytes": <num>, "mb": <num>},
      "totalSizeMaximum": {"bytes": <num>, "mb": <num>},
      "recordCount": <num>,
      "fieldDetails": [
        {
          "fieldName": "field_name",
          "dataType": "type",
          "averageSize": <bytes>,
          "maximumSize": <bytes>,
          "overhead": <bytes>,
          "nullable": boolean,
          "description": "description"
        }
      ],
      "rowOverhead": {
        "nullBitmap": <bytes>,
        "rowHeader": <bytes>,
        "alignment": <bytes>,
        "total": <bytes>
      }
    }
  ]
}`;

    const userPrompt = `Calculate capacity using this pre-analyzed DDL structure:

${JSON.stringify(structureAnalysis, null, 2)}

Total records to calculate for: ${recordCount.toLocaleString()}`;

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
        const result = JSON.parse(jsonString);
        
        // Ensure all required fields with proper validation
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
      }
      
      throw new Error("Invalid JSON structure in response");
    } catch (error) {
      console.error('Capacity calculation JSON parsing error:', error);
      console.error('Original response:', response);
      
      if (error instanceof SyntaxError) {
        throw new Error(`Lỗi định dạng JSON từ AI khi tính toán dung lượng: ${error.message}. Response: ${response.substring(0, 500)}...`);
      }
      
      throw new Error(`Lỗi khi tính toán dung lượng từ cấu trúc đã phân tích: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePlantUMLDiagram(
    description: string,
    diagramType: DiagramTypeId,
    outputLanguage?: string,
    customModel?: string
  ): Promise<DiagramResult> {
    const diagramTypeInfo = DIAGRAM_TYPES.find(type => type.id === diagramType);
    
    if (!diagramTypeInfo) {
      throw new Error("Loại sơ đồ không hợp lệ");
    }

    const systemPrompt = `## Vai trò và Mục tiêu

Bạn là một Solution Architect với hơn 15 năm kinh nghiệm thiết kế, tư vấn và triển khai các hệ thống phần mềm phức tạp, từ monolithic đến microservices, và từ hệ thống on-premise đến giải pháp cloud-native. Chuyên môn của bạn không chỉ là phác thảo kiến trúc tổng thể mà còn dịch các luồng xử lý phức tạp thành các sơ đồ PlantUML (PUML) rõ ràng, chuyên nghiệp và trực quan.

Mục tiêu chính của bạn là giúp người dùng tạo ra các sơ đồ PlantUML chất lượng cao. Các sơ đồ này phải dễ hiểu bằng cách đánh số các bước (step-by-step) và hấp dẫn về mặt trực quan bằng cách tích hợp các icon đẹp, phù hợp với ngữ cảnh.

## Chuyên môn cốt lõi

**Kiến trúc phần mềm**: Hiểu sâu về các mô hình kiến trúc (Microservices, Event-Driven, SOA, C4 Model, v.v.) và các thành phần hệ thống (API Gateway, Load Balancer, Message Queue, Database, Cache, v.v.).

**Chuyên gia PlantUML**: Thành thạo cú pháp PlantUML cho các loại sơ đồ khác nhau:
- Sequence Diagram: Mô tả luồng tương tác theo thứ tự thời gian.
- Usecase Diagram: Mô tả các use case của hệ thống.
- Component Diagram: Mô tả cấu trúc các thành phần.
- Deployment Diagram: Mô tả việc triển khai vật lý của hệ thống.

**Tích hợp Iconography**: Có kiến thức về việc sử dụng các thư viện icon phổ biến trong PlantUML như FontAwesome, Material Icons, Archimate để làm cho sơ đồ trông chuyên nghiệp và dễ nhận biết.

**Tư duy logic và Đơn giản hóa**: Khả năng phân tích một yêu cầu phức tạp, chia nhỏ thành các bước logic và trình bày một cách tuần tự và rõ ràng.

## Quy trình làm việc

Loại sơ đồ: ${diagramTypeInfo.name}
Mô tả: ${diagramTypeInfo.description}

## Quy tắc bắt buộc khi tạo code PlantUML

Tất cả code PlantUML bạn tạo PHẢI tuân thủ những quy tắc này:

**Luôn đánh số các bước (Numbering):**
- Sử dụng autonumber để tự động đánh số các bước tương tác trong sơ đồ Sequence. Điều này là bắt buộc để đảm bảo trình tự và dễ theo dõi.
- Bạn có thể tùy chỉnh định dạng của autonumber nếu cần (ví dụ: autonumber "<b>[00]")

**Tích hợp Icons một cách thông minh:**
- Luôn khai báo thư viện icon ở đầu source code.
- Chọn icon phù hợp nhất cho vai trò của thành phần (ví dụ: users cho người dùng, server cho máy chủ, database cho cơ sở dữ liệu, cloud cho dịch vụ đám mây).

**Cấu trúc và Thẩm mỹ:**
- Sử dụng skinparam để cải thiện giao diện của sơ đồ, làm cho nó trông hiện đại và chuyên nghiệp.
- Ví dụ: skinparam sequenceArrowThickness 2, skinparam roundcorner 20, skinparam participantpadding 20.
- Sử dụng box để nhóm các thành phần liên quan (ví dụ: nhóm microservices trong một box "Backend Services").
- Sử dụng note để thêm ghi chú, giải thích cho các bước phức tạp hoặc quan trọng.
- Thêm đánh số bước từng bước để dễ đọc luồng

**Hướng dẫn cho ${diagramTypeInfo.name}:**
${diagramTypeInfo.prompt}

## Yêu cầu đầu ra:
- Chỉ trả về code PlantUML trong code block, không thêm giải thích
- Bắt đầu với @startuml và kết thúc với @enduml
- Sử dụng ${outputLanguage === 'vi' ? 'tiếng Việt' : outputLanguage === 'en' ? 'English' : outputLanguage === 'zh' ? '中文' : outputLanguage === 'ja' ? '日本語' : outputLanguage === 'ko' ? '한국어' : outputLanguage === 'fr' ? 'Français' : outputLanguage === 'de' ? 'Deutsch' : outputLanguage === 'es' ? 'Español' : outputLanguage || 'tiếng Việt'} cho labels và mô tả
- Bao gồm autonumber cho sequence diagrams
- Tích hợp icons phù hợp
- Sử dụng styling chuyên nghiệp với skinparam`;

    const userPrompt = `Hãy tạo sơ đồ PlantUML ${diagramTypeInfo.name} dựa trên mô tả sau:

"${description}"

Yêu cầu:
- Sử dụng autonumber để đánh số các bước
- Tích hợp icons phù hợp (FontAwesome, Material Icons)
- Styling chuyên nghiệp với skinparam
- Sử dụng box để nhóm các thành phần liên quan
- Thêm note để giải thích các bước quan trọng
- Sử dụng ${outputLanguage === 'vi' ? 'tiếng Việt' : outputLanguage === 'en' ? 'English' : outputLanguage === 'zh' ? '中文' : outputLanguage === 'ja' ? '日本語' : outputLanguage === 'ko' ? '한국어' : outputLanguage === 'fr' ? 'Français' : outputLanguage === 'de' ? 'Deutsch' : outputLanguage === 'es' ? 'Español' : outputLanguage || 'tiếng Việt'} cho tất cả labels và mô tả

Tạo code PlantUML hoàn chỉnh và chuyên nghiệp.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    try {
      const startTime = Date.now();
      const response = await this.callAPI(messages, customModel);
      const processingTime = Date.now() - startTime;

      let pumlCode = response.trim();
      
      // Extract PlantUML code from response
      const pumlMatch = pumlCode.match(/```(?:plantuml|puml)?\s*([\s\S]*?)\s*```/i);
      if (pumlMatch) {
        pumlCode = pumlMatch[1].trim();
      } else {
        // If no code blocks found, try to clean up the response
        pumlCode = pumlCode.replace(/^[^@]*/, '').replace(/[^@]*$/, '');
      }
      
      // Ensure PlantUML structure
      if (!pumlCode.includes('@startuml')) {
        pumlCode = `@startuml\n${pumlCode}`;
      }
      if (!pumlCode.includes('@enduml')) {
        pumlCode = `${pumlCode}\n@enduml`;
      }
      
      // Validate that we have some diagram content
      if (!pumlCode || pumlCode.length < 20) {
        throw new Error("AI không trả về code PlantUML hợp lệ");
      }

      // Generate explanation
      const explanation = await this.generateDiagramExplanation(pumlCode, diagramType, customModel);

      const result: DiagramResult = {
        pumlCode,
        explanation,
        model: customModel || this.config.model,
        metadata: {
          processingTime,
          codeLength: pumlCode.length
        }
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định khi tạo sơ đồ";
      return {
        pumlCode: "",
        explanation: "",
        model: customModel || this.config.model,
        error: errorMessage,
        metadata: {
          codeLength: 0
        }
      };
    }
  }

  private async generateDiagramExplanation(
    pumlCode: string,
    diagramType: DiagramTypeId,
    customModel?: string
  ): Promise<string> {
    const systemPrompt = `Bạn là chuyên gia phân tích sơ đồ. Nhiệm vụ của bạn là giải thích sơ đồ PlantUML một cách ngắn gọn và dễ hiểu.

Yêu cầu:
- Giải thích logic kiến trúc trong sơ đồ
- Mô tả các thành phần chính và vai trò của chúng
- Giải thích luồng hoạt động (nếu có)
- Sử dụng tiếng Việt
- Tối đa 3-4 câu, ngắn gọn và dễ hiểu`;

    const userPrompt = `Hãy giải thích ngắn gọn sơ đồ ${diagramType} PlantUML sau:

\`\`\`plantuml
${pumlCode}
\`\`\`

Giải thích logic kiến trúc và luồng hoạt động chính trong sơ đồ này.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    try {
      return await this.callAPI(messages, customModel);
    } catch (error) {
      return "Không thể tạo giải thích cho sơ đồ này.";
    }
  }

  async generateDiagram(request: DiagramRequest): Promise<DiagramResult> {
    const { description, diagramType, outputFormat, outputLanguage, style, complexity, includeIcons, includeColors, includeNotes, model } = request;
    
    const diagramTypeInfo = DIAGRAM_TYPES.find(type => type.id === diagramType);
    const formatInfo = DIAGRAM_FORMATS.find(f => f.id === outputFormat);
    const languageInfo = DIAGRAM_OUTPUT_LANGUAGES.find(l => l.code === outputLanguage);
    const styleInfo = DIAGRAM_STYLES.find(s => s.id === style);
    const complexityInfo = DIAGRAM_COMPLEXITIES.find(c => c.id === complexity);
    
    if (!diagramTypeInfo || !formatInfo || !languageInfo || !styleInfo || !complexityInfo) {
      throw new Error("Thông tin loại sơ đồ, định dạng đầu ra, ngôn ngữ, phong cách hoặc độ phức tạp không hợp lệ");
    }

    // Check if the selected format is supported for this diagram type
    if (!diagramTypeInfo.supportedFormats.includes(outputFormat)) {
      throw new Error(`Định dạng ${formatInfo.name} không được hỗ trợ cho loại sơ đồ ${diagramTypeInfo.name}. Các định dạng được hỗ trợ: ${diagramTypeInfo.supportedFormats.map(f => DIAGRAM_FORMATS.find(fmt => fmt.id === f)?.name).join(', ')}`);
    }

    // Get format-specific instructions
    const formatInstructions = this.getFormatInstructions(formatInfo);
    
    const systemPrompt = `Bạn là chuyên gia tạo sơ đồ đa định dạng. Nhiệm vụ của bạn là từ mô tả của người dùng, tạo ra code sơ đồ chính xác và đẹp mắt theo định dạng được yêu cầu.

## THÔNG TIN YÊU CẦU:
- Loại sơ đồ: ${diagramTypeInfo.name} (${diagramTypeInfo.description})
- Định dạng đầu ra: ${formatInfo.name} (${formatInfo.description})
- Ngôn ngữ nội dung: ${languageInfo.nativeName} (${languageInfo.name})
- Phong cách: ${styleInfo.name} - ${styleInfo.description}
- Độ phức tạp: ${complexityInfo.name} (${complexityInfo.level}) - ${complexityInfo.description}
- Bao gồm icons: ${includeIcons ? 'Có' : 'Không'}
- Bao gồm màu sắc: ${includeColors ? 'Có' : 'Không'}
- Bao gồm ghi chú: ${includeNotes ? 'Có' : 'Không'}

## HƯỚNG DẪN CHI TIẾT CHO LOẠI SƠ ĐỒ:
${diagramTypeInfo.prompt}

## HƯỚNG DẪN VỀ ĐỊNH DẠNG ${formatInfo.name.toUpperCase()}:
${formatInstructions}

## HƯỚNG DẪN VỀ PHONG CÁCH:
${styleInfo.prompt}

## HƯỚNG DẪN VỀ ĐỘ PHỨC TẠP:
${complexityInfo.prompt}

## YÊU CẦU NGÔN NGỮ:
- **Ngôn ngữ nội dung**: Tất cả labels, text, và comments phải sử dụng ${languageInfo.nativeName}
- **Unicode Support**: Sử dụng đúng ký tự Unicode cho ${languageInfo.nativeName}
- **Thuật ngữ**: Sử dụng thuật ngữ kỹ thuật phù hợp trong ${languageInfo.nativeName}

## XỬ LÝ YÊU CẦU BỔ SUNG:
${includeIcons ? `- **Icons**: Thêm emoji/icons phù hợp vào các node và elements (${formatInfo.syntax === 'mermaid' ? 'Mermaid hỗ trợ emoji' : 'Sử dụng ký tự Unicode'})` : ''}
${includeColors ? `- **Màu sắc**: ${formatInfo.syntax === 'mermaid' ? 'Sử dụng classDef để định nghĩa màu sắc' : 'Áp dụng màu sắc theo cú pháp ' + formatInfo.syntax}` : ''}
${includeNotes ? '- **Ghi chú**: Thêm annotations và comments để giải thích các phần quan trọng' : ''}

## CẤU TRÚC OUTPUT:
\`\`\`${formatInfo.syntax}
[${formatInfo.name.toUpperCase()} CODE HERE]
\`\`\`

## LƯU Ý QUAN TRỌNG:
- CHỈ trả về code ${formatInfo.name} trong code block, không thêm text giải thích
- Đảm bảo syntax hoàn toàn chính xác cho ${formatInfo.name}
- Sử dụng ${languageInfo.nativeName} trong tất cả labels và text
- Code phải render được ngay lập tức trong ${formatInfo.name} viewer/compiler
- Tuân thủ strict syntax của ${formatInfo.syntax}`;

    const userPrompt = `Hãy tạo ${diagramTypeInfo.name} theo định dạng ${formatInfo.name} dựa trên mô tả sau:

"${description}"

Yêu cầu:
- Định dạng đầu ra: ${formatInfo.name} (${formatInfo.syntax})
- Ngôn ngữ nội dung: ${languageInfo.nativeName}
- Phù hợp với độ phức tạp: ${complexityInfo.name}
- Áp dụng phong cách: ${styleInfo.name}
${includeIcons ? '- Bao gồm icons/emoji phù hợp' : ''}
${includeColors ? '- Sử dụng màu sắc để phân biệt các thành phần' : ''}
${includeNotes ? '- Thêm ghi chú và annotations quan trọng' : ''}

Tạo code ${formatInfo.name} hoàn chỉnh và chính xác với nội dung bằng ${languageInfo.nativeName}.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    try {
      const startTime = Date.now();
      const response = await this.callAPI(messages, model);
      const processingTime = Date.now() - startTime;

      // Extract diagram code from response based on format
      let diagramCode = response.trim();
      
      // Clean up response - extract content based on format
      const formatSpecificMatch = diagramCode.match(new RegExp(`\`\`\`${formatInfo.syntax}\\s*([\\s\\S]*?)\\s*\`\`\``, 'i'));
      if (formatSpecificMatch) {
        diagramCode = formatSpecificMatch[1].trim();
      } else {
        // Try to find generic code block patterns
        const codeMatch = diagramCode.match(/```\w*\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          diagramCode = codeMatch[1].trim();
        } else {
          // If no code blocks found, try to clean up the response
          diagramCode = diagramCode.replace(/^[^@\w\n]*/, '').replace(/[^}]*$/, '');
        }
      }
      
      // Validate that we have some diagram content
      if (!diagramCode || diagramCode.length < 10) {
        throw new Error("AI không trả về code sơ đồ hợp lệ");
      }

      // Add step-by-step indexing for step-ordered diagrams
      const indexedDiagramCode = addStepIndexing(diagramCode, diagramType, outputFormat);

      const result: DiagramResult = {
        diagramCode: indexedDiagramCode,
        metadata: {
          processingTime,
          codeLength: indexedDiagramCode.length
        }
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định khi tạo sơ đồ";
      return {
        diagramCode: "",
        error: errorMessage,
        metadata: {
          codeLength: 0
        }
      };
    }
  }

  private getFormatInstructions(formatInfo: { id: string; name: string; syntax: string }): string {
    switch (formatInfo.id) {
      case 'mermaid':
        return `
**Mermaid Syntax Guidelines:**
- Sử dụng cú pháp Mermaid chính xác và hiện đại
- Hỗ trợ đầy đủ: flowchart, classDiagram, sequenceDiagram, stateDiagram, erDiagram, journey, timeline, gitgraph
- Tương thích với Mermaid.js version mới nhất
- Hỗ trợ Unicode và emoji trong labels
- Sử dụng classDef cho styling và màu sắc
- Cấu trúc: direction TB/LR/BT/RL cho layout`;

      case 'plantuml':
        return `
**PlantUML Syntax Guidelines:**
- Bắt đầu với @startuml và kết thúc với @enduml
- Hỗ trợ mạnh mẽ cho UML diagrams: class, sequence, use case, activity, component, state
- Sử dụng skinparam để customization
- Hỗ trợ Unicode cho các ngôn ngữ quốc tế
- Syntax chặt chẽ và chuẩn UML
- Có thể nhúng notes và comments với note left/right/top/bottom`;

      case 'graphviz':
        return `
**Graphviz DOT Syntax Guidelines:**
- Bắt đầu với digraph hoặc graph
- Sử dụng node attributes: [label="...", shape=box/circle/diamond]
- Edge attributes: [label="...", style=solid/dashed/dotted]
- Hỗ trợ subgraph để nhóm nodes
- Ranking: same, min, max, source, sink
- Layout engines: dot (hierarchical), neato (spring), fdp (force), circo (circular)`;

      case 'drawio':
        return `
**Draw.io XML Guidelines:**
- XML format tương thích với Draw.io/Diagrams.net
- Sử dụng mxGraphModel structure
- Các elements: mxCell, mxGeometry cho positioning
- Styles: shape, fillColor, strokeColor, fontSize
- Connectors: edgeStyle, startArrow, endArrow
- Text labels với HTML formatting support`;

      case 'ascii':
        return `
**ASCII Art Guidelines:**
- Sử dụng các ký tự ASCII: | - + / \\ * o # =
- Boxes: +---+ hoặc ┌───┐ (Unicode box drawing)
- Arrows: -> <- => <=> ↑ ↓ ← →
- Connections: | (vertical) - (horizontal) + (intersection)
- Text alignment và spacing đều đặn
- Tương thích với monospace fonts`;

      case 'tikz':
        return `
**TikZ/LaTeX Guidelines:**
- Bắt đầu với \\begin{tikzpicture} và \\end{tikzpicture}
- Nodes: \\node[options] (name) at (x,y) {text};
- Paths: \\draw[options] (start) -- (end);
- Positioning: above, below, left, right, above right
- Styles: rectangle, circle, ellipse, diamond
- Libraries: positioning, shapes, arrows, decorations`;

      default:
        return `Tuân thủ cú pháp chuẩn của ${formatInfo.name}`;
    }
  }

  async generateWikiDocument(projectDescription: string, structureId?: string, format: string = "markdown", outputLanguage: string = "vi", customModel?: string): Promise<string> {
    // Get the wiki structure
    const structure = structureId 
      ? getWikiStructureById(structureId) || getDefaultWikiStructure()
      : getDefaultWikiStructure();

    // Determine format-specific instructions
    const formatInstructions = format === "confluence" 
      ? "- Sử dụng Confluence wiki markup syntax (h1., h2., *bold*, _italic_, {code}, {panel}, {info}, etc.)\n- Phù hợp để paste trực tiếp vào Confluence\n- Sử dụng Confluence macro syntax khi cần thiết"
      : "- Sử dụng markdown format chuẩn (## headings, **bold**, *italic*, ```code blocks```, etc.)\n- Phù hợp cho GitHub, GitLab, và các platform markdown khác";

    // Determine language-specific instructions
    const getLanguageInstructions = (langCode: string) => {
      const languageMap: { [key: string]: string } = {
        'vi': 'Viết toàn bộ nội dung bằng tiếng Việt',
        'en': 'Write all content in English',
        'zh': 'Write all content in Chinese (中文)',
        'ja': 'Write all content in Japanese (日本語)',
        'ko': 'Write all content in Korean (한국어)',
        'fr': 'Write all content in French (Français)',
        'de': 'Write all content in German (Deutsch)',
        'es': 'Write all content in Spanish (Español)',
        'pt': 'Write all content in Portuguese (Português)',
        'ru': 'Write all content in Russian (Русский)',
        'it': 'Write all content in Italian (Italiano)',
        'th': 'Write all content in Thai (ไทย)',
        'id': 'Write all content in Indonesian (Bahasa Indonesia)',
        'ms': 'Write all content in Malay (Bahasa Melayu)',
        'ar': 'Write all content in Arabic (العربية)',
        'hi': 'Write all content in Hindi (हिन्दी)',
        'nl': 'Write all content in Dutch (Nederlands)',
        'sv': 'Write all content in Swedish (Svenska)',
        'no': 'Write all content in Norwegian (Norsk)',
        'da': 'Write all content in Danish (Dansk)',
        'fi': 'Write all content in Finnish (Suomi)',
        'pl': 'Write all content in Polish (Polski)',
        'tr': 'Write all content in Turkish (Türkçe)',
        'he': 'Write all content in Hebrew (עברית)'
      };
      return languageMap[langCode] || 'Write all content in Vietnamese';
    };

    const languageInstructions = getLanguageInstructions(outputLanguage);

    const userPrompt = `Hãy tạo một tài liệu wiki đầy đủ cho dự án/tính năng sau:

"${projectDescription}"

Yêu cầu:
- Sử dụng cấu trúc ${structure.name}
${formatInstructions}
- ${languageInstructions}
- Thêm emoticons để tăng tính thu hút
- Nội dung chi tiết, thực tế và có giá trị
- Phù hợp cho môi trường doanh nghiệp

Hãy tạo một tài liệu wiki hoàn chỉnh và chuyên nghiệp.`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: structure.prompt },
      { role: "user", content: userPrompt }
    ];

    return await this.callAPI(messages, customModel);
  }

  async rewriteText(request: RewritingRequest): Promise<RewritingResult> {
    const { text, style, tone, length, complexity, outputLanguage, customInstructions, model } = request;

    const writingStyle = WRITING_STYLES.find(s => s.id === style);
    const writingTone = WRITING_TONES.find(t => t.id === tone);
    const writingLength = WRITING_LENGTHS.find(l => l.id === length);
    const writingComplexity = WRITING_COMPLEXITIES.find(c => c.id === complexity);
    const outputLang = OUTPUT_LANGUAGES.find(l => l.code === outputLanguage);

    if (!writingStyle || !writingTone || !writingLength || !writingComplexity || !outputLang) {
      throw new Error("Invalid rewriting parameters selected");
    }

    // Language instruction logic
    const getLanguageInstruction = (langCode: string) => {
      if (langCode === "original") {
        return "IMPORTANT: Write the rewritten text in the exact same language as the original text. Do not translate or change the language of the text.";
      }

      const languageMap: { [key: string]: string } = {
        'vi': 'Write the rewritten text in Vietnamese (Tiếng Việt)',
        'en': 'Write the rewritten text in English',
        'zh': 'Write the rewritten text in Chinese (中文)',
        'ja': 'Write the rewritten text in Japanese (日本語)',
        'ko': 'Write the rewritten text in Korean (한국어)',
        'fr': 'Write the rewritten text in French (Français)',
        'de': 'Write the rewritten text in German (Deutsch)',
        'es': 'Write the rewritten text in Spanish (Español)',
        'pt': 'Write the rewritten text in Portuguese (Português)',
        'ru': 'Write the rewritten text in Russian (Русский)',
        'it': 'Write the rewritten text in Italian (Italiano)',
        'th': 'Write the rewritten text in Thai (ไทย)',
        'id': 'Write the rewritten text in Indonesian (Bahasa Indonesia)',
        'ms': 'Write the rewritten text in Malay (Bahasa Melayu)',
        'ar': 'Write the rewritten text in Arabic (العربية)',
        'hi': 'Write the rewritten text in Hindi (हिन्दी)',
        'nl': 'Write the rewritten text in Dutch (Nederlands)',
        'sv': 'Write the rewritten text in Swedish (Svenska)',
        'no': 'Write the rewritten text in Norwegian (Norsk)',
        'da': 'Write the rewritten text in Danish (Dansk)',
        'fi': 'Write the rewritten text in Finnish (Suomi)',
        'pl': 'Write the rewritten text in Polish (Polski)',
        'tr': 'Write the rewritten text in Turkish (Türkçe)',
        'he': 'Write the rewritten text in Hebrew (עברית)'
      };
      return languageMap[langCode] || 'IMPORTANT: Write the rewritten text in the exact same language as the original text. Do not translate or change the language of the text.';
    };

    const languageInstruction = getLanguageInstruction(outputLanguage);

    const systemPrompt = `You are an expert text rewriter. Your task is to rewrite the given text according to specific parameters while maintaining the core meaning and message.

LANGUAGE REQUIREMENT:
${languageInstruction}

REWRITING PARAMETERS:
- Style: ${writingStyle.name} - ${writingStyle.description}
- Tone: ${writingTone.name} - ${writingTone.description}
- Length: ${writingLength.name} - ${writingLength.description}
- Complexity: ${writingComplexity.name} - ${writingComplexity.description}
- Output Language: ${outputLang.name}

INSTRUCTIONS:
${writingStyle.prompt}
${writingTone.prompt}
${writingLength.prompt}
${writingComplexity.prompt}

${customInstructions ? `ADDITIONAL CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

IMPORTANT:
- Maintain the core meaning and key information from the original text
- Apply the specified style, tone, length, and complexity requirements
- ${languageInstruction}
- Ensure the rewritten text flows naturally and is coherent
- Do not add false information or change factual content
- Return only the rewritten text without explanations or comments`;

    const userPrompt = `Please rewrite the following text according to the specified parameters:

Original text:
"${text}"

Please provide the rewritten version:`;

    const messages: ChatGPTMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const startTime = Date.now();
    const rewrittenText = await this.callAPI(messages, model);
    const processingTime = Date.now() - startTime;

    return {
      originalText: text,
      rewrittenText: rewrittenText.trim(),
      style,
      tone,
      length,
      complexity,
      outputLanguage,
      customInstructions,
      metadata: {
        originalLength: text.length,
        rewrittenLength: rewrittenText.trim().length,
        processingTime,
        model: model || this.config.model
      }
    };
  }
}
