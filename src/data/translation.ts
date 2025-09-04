import { Language, TranslationStyle } from "@/types/translation";

export const LANGUAGES: Language[] = [
  { code: "auto", name: "Tự động phát hiện", nativeName: "Auto-detect", flag: "🌐" },
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "Tiếng Anh", nativeName: "English", flag: "🇺🇸" },
  { code: "zh", name: "Tiếng Trung", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Tiếng Nhật", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Tiếng Hàn", nativeName: "한국어", flag: "🇰🇷" },
  { code: "fr", name: "Tiếng Pháp", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "Tiếng Đức", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Tiếng Tây Ban Nha", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Tiếng Bồ Đào Nha", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Tiếng Nga", nativeName: "Русский", flag: "🇷🇺" },
  { code: "it", name: "Tiếng Ý", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "th", name: "Tiếng Thái", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Tiếng Indonesia", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Tiếng Malaysia", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "ar", name: "Tiếng Ả Rập", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Tiếng Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", name: "Tiếng Hà Lan", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Tiếng Thụy Điển", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Tiếng Na Uy", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Tiếng Đan Mạch", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Tiếng Phần Lan", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "pl", name: "Tiếng Ba Lan", nativeName: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Tiếng Thổ Nhĩ Kỳ", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "he", name: "Tiếng Do Thái", nativeName: "עברית", flag: "🇮🇱" }
];

export const TRANSLATION_STYLES: TranslationStyle[] = [
  {
    id: "natural",
    name: "Tự nhiên",
    description: "Dịch tự nhiên, dễ hiểu, phù hợp với ngữ cảnh hàng ngày. Ưu tiên sự trôi chảy và dễ đọc.",
    icon: "🌿",
    prompt: "Translate the following text naturally and fluently, making it sound like it was originally written in the target language. Focus on naturalness and readability over literal accuracy."
  },
  {
    id: "formal",
    name: "Trang trọng",
    description: "Dịch theo phong cách trang trọng, lịch sự, phù hợp cho văn bản công việc, học thuật hoặc chính thức.",
    icon: "🎩",
    prompt: "Translate the following text using formal and professional language. Use respectful tone and proper formal vocabulary appropriate for business or academic contexts."
  },
  {
    id: "casual",
    name: "Thân mật",
    description: "Dịch theo phong cách thân mật, gần gũi, phù hợp cho cuộc trò chuyện hàng ngày hoặc tin nhắn cá nhân.",
    icon: "😊",
    prompt: "Translate the following text using casual, friendly language. Make it conversational and approachable, as if talking to a friend."
  },
  {
    id: "literal",
    name: "Nguyên văn",
    description: "Dịch sát nghĩa nguyên bản nhất có thể, giữ nguyên cấu trúc và từng từ. Phù hợp cho tài liệu kỹ thuật.",
    icon: "📝",
    prompt: "Translate the following text as literally as possible while maintaining grammatical correctness. Preserve the original structure and meaning as closely as possible."
  },
  {
    id: "creative",
    name: "Sáng tạo",
    description: "Dịch với sự sáng tạo, linh hoạt, có thể thay đổi cách diễn đạt để phù hợp văn hóa đích. Phù hợp cho nội dung marketing.",
    icon: "🎨",
    prompt: "Translate the following text creatively, adapting expressions and cultural references to fit the target language and culture. Focus on conveying the intended impact and emotion."
  },
  {
    id: "technical",
    name: "Kỹ thuật",
    description: "Dịch chuyên ngành kỹ thuật, giữ nguyên thuật ngữ chuyên môn, độ chính xác cao. Phù hợp cho tài liệu IT, khoa học.",
    icon: "⚙️",
    prompt: "Translate the following technical text with high precision, preserving technical terminology and maintaining accuracy. Use appropriate industry-standard terminology."
  },
  {
    id: "poetic",
    name: "Thơ ca",
    description: "Dịch văn học, thơ ca, chú trọng nhịp điệu, vần luật, và cảm xúc. Phù hợp cho tác phẩm nghệ thuật.",
    icon: "🎭",
    prompt: "Translate the following text with attention to poetic elements, rhythm, and emotional resonance. Prioritize artistic expression and literary beauty."
  },
  {
    id: "commercial",
    name: "Thương mại",
    description: "Dịch cho mục đích thương mại, marketing, bán hàng. Tập trung vào tính thuyết phục và thu hút khách hàng.",
    icon: "💼",
    prompt: "Translate the following text for commercial purposes, focusing on persuasive language and customer appeal. Make it engaging and suitable for marketing contexts."
  },
  {
    id: "academic",
    name: "Học thuật",
    description: "Dịch theo phong cách học thuật, khoa học, sử dụng thuật ngữ chính xác và cấu trúc logic rõ ràng.",
    icon: "🎓",
    prompt: "Translate the following text using academic language and style. Use precise terminology and maintain scholarly tone with clear logical structure."
  },
  {
    id: "news",
    name: "Báo chí",
    description: "Dịch theo phong cách báo chí, trung lập, khách quan, súc tích và dễ hiểu cho đại chúng.",
    icon: "📰",
    prompt: "Translate the following text in journalistic style, maintaining objectivity and clarity. Use concise language suitable for news reporting."
  }
];