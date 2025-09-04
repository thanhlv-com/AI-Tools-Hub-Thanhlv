import { ChatGPTConfig } from "@/contexts/ConfigContext";
import { TranslationRequest } from "@/types/translation";
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

export class ChatGPTService {
  private config: ChatGPTConfig;

  constructor(config: ChatGPTConfig) {
    this.config = config;
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

  async callAPI(messages: ChatGPTMessage[], customModel?: string): Promise<string> {
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
}