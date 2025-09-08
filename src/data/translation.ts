import { Language, TranslationStyle, TranslationProficiency, EmoticonOption, EmoticonFrequency } from "@/types/translation";

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

export const EMOTICON_OPTIONS: EmoticonOption[] = [
  {
    id: "keep-original",
    name: "Giữ nguyên",
    description: "Giữ nguyên tất cả emoticon/emoji từ văn bản gốc, không thêm hoặc thay đổi",
    icon: "🔄",
    prompt: "Keep all existing emoticons and emojis exactly as they are in the original text. Do not add new ones or modify existing ones."
  },
  {
    id: "add-contextual",
    name: "Thêm theo ngữ cảnh",
    description: "Thêm emoticon/emoji phù hợp với nội dung và cảm xúc của văn bản để tăng tính sinh động",
    icon: "😊",
    prompt: "Add contextually appropriate emoticons and emojis that match the tone and content of the text to make it more expressive and engaging."
  },
  {
    id: "remove-all",
    name: "Loại bỏ tất cả",
    description: "Loại bỏ tất cả emoticon/emoji để tạo ra văn bản thuần túy, trang trọng",
    icon: "🚫",
    prompt: "Remove all emoticons and emojis from the translation to create clean, formal text without any visual expressions."
  },
  {
    id: "localize",
    name: "Địa phương hóa",
    description: "Thay thế emoticon/emoji bằng các biểu tượng phù hợp với văn hóa của ngôn ngữ đích",
    icon: "🌍",
    prompt: "Replace emoticons and emojis with ones that are more culturally appropriate for the target language and region."
  },
  {
    id: "enhance-emotional",
    name: "Tăng cường cảm xúc",
    description: "Thêm nhiều emoticon/emoji để làm nổi bật và khuếch đại cảm xúc trong văn bản",
    icon: "💫",
    prompt: "Enhance the emotional impact by adding multiple relevant emoticons and emojis that amplify the feelings and sentiments expressed in the text."
  },
  {
    id: "minimal-subtle",
    name: "Tối giản tinh tế",
    description: "Chỉ thêm một số ít emoticon/emoji tinh tế, phù hợp với phong cách nhẹ nhàng",
    icon: "✨",
    prompt: "Add only minimal, subtle emoticons and emojis sparingly to maintain elegance while adding a gentle touch of expression."
  },
  {
    id: "youth-friendly",
    name: "Thân thiện trẻ trung",
    description: "Sử dụng emoticon/emoji phong cách trẻ trung, hiện đại, phù hợp với giới trẻ",
    icon: "🤩",
    prompt: "Use trendy, youthful emoticons and emojis that appeal to younger audiences with modern, energetic expressions."
  },
  {
    id: "professional-warm",
    name: "Chuyên nghiệp ấm áp",
    description: "Cân bằng giữa tính chuyên nghiệp và sự thân thiện với emoticon/emoji vừa phải",
    icon: "🤝",
    prompt: "Balance professionalism with warmth by using appropriate emoticons that maintain business courtesy while being approachable."
  },
  {
    id: "kawaii-cute",
    name: "Dễ thương Kawaii",
    description: "Sử dụng emoticon/emoji theo phong cách kawaii Nhật Bản, tập trung vào sự dễ thương",
    icon: "🥰",
    prompt: "Use kawaii-style cute emoticons and emojis inspired by Japanese culture, focusing on adorable and endearing expressions."
  },
  {
    id: "text-emoticons",
    name: "Emoticon văn bản",
    description: "Chuyển đổi emoji thành emoticon văn bản ASCII như :) ^_^ ¯\\_(ツ)_/¯",
    icon: ":-)",
    prompt: "Convert emojis to text-based ASCII emoticons like :) :D ^_^ ¯\\_(ツ)_/¯ for a more classic, universal appearance."
  },
  {
    id: "gender-neutral",
    name: "Trung tính giới tính",
    description: "Ưu tiên sử dụng emoticon/emoji không phân biệt giới tính và bao trùm",
    icon: "🙂",
    prompt: "Prioritize gender-neutral and inclusive emoticons and emojis that represent diversity and avoid gender-specific expressions."
  },
  {
    id: "seasonal-themed",
    name: "Theo chủ đề mùa",
    description: "Thêm emoticon/emoji phù hợp với mùa hiện tại hoặc dịp lễ đặc biệt",
    icon: "🌸",
    prompt: "Add emoticons and emojis that match the current season, holidays, or special occasions mentioned in or relevant to the text."
  }
];

export const EMOTICON_FREQUENCIES: EmoticonFrequency[] = [
  {
    id: "never",
    name: "Không bao giờ",
    description: "Không thêm emoticon/emoji mới. Chỉ giữ nguyên những gì có sẵn từ văn bản gốc.",
    icon: "🚫",
    level: "0%",
    prompt: "Không thêm bất kỳ biểu tượng cảm xúc hoặc emoji nào vào bản dịch. Chỉ giữ lại những biểu tượng hiện có từ văn bản gốc."
  },
  {
    id: "very-rare",
    name: "Rất hiếm",
    description: "Chỉ thêm emoticon/emoji khi thực sự cần thiết để làm rõ nghĩa hoặc tránh hiểu lầm.",
    icon: "⚪",
    level: "5-10%",
    prompt: "Chỉ thêm biểu tượng cảm xúc hoặc emoji khi thực sự cần thiết để làm rõ nội dung hoặc tránh hiểu lầm. Tối đa 1 biểu tượng cảm xúc cho mỗi đoạn văn."
  },
  {
    id: "rare",
    name: "Hiếm",
    description: "Thêm emoticon/emoji một cách tiết chế, chỉ trong những trường hợp quan trọng nhất.",
    icon: "🔵",
    level: "10-20%",
    prompt: "Thêm biểu tượng cảm xúc một cách thận trọng và hiếm khi, chỉ tập trung vào những khoảnh khắc hoặc khái niệm cảm xúc quan trọng nhất. Khoảng 1 biểu tượng cho mỗi 2-3 câu."
  },
  {
    id: "occasional",
    name: "Thỉnh thoảng",
    description: "Thêm emoticon/emoji thỉnh thoảng để làm cho văn bản sinh động hơn nhưng vẫn giữ tính chuyên nghiệp.",
    icon: "🟡",
    level: "20-35%",
    prompt: "Thỉnh thoảng thêm biểu tượng cảm xúc hoặc emoji phù hợp với ngữ cảnh để tăng cường biểu cảm mà vẫn giữ được tính chuyên nghiệp. Khoảng 1 biểu tượng cho mỗi câu khi phù hợp."
  },
  {
    id: "moderate",
    name: "Vừa phải",
    description: "Cân bằng giữa việc thêm emoticon/emoji và giữ văn bản tự nhiên. Mức độ trung bình.",
    icon: "🟠",
    level: "35-50%",
    prompt: "Sử dụng một lượng vừa phải các biểu tượng cảm xúc và emoji để làm cho văn bản trở nên biểu cảm và hấp dẫn nhưng vẫn tự nhiên và dễ đọc."
  },
  {
    id: "frequent",
    name: "Thường xuyên",
    description: "Thêm emoticon/emoji khá thường xuyên để tạo ra văn bản sinh động và thân thiện.",
    icon: "🟢",
    level: "50-70%",
    prompt: "Thường xuyên thêm biểu tượng cảm xúc và emoji để tạo nên văn bản sống động, thân thiện, ấm áp và dễ tiếp cận. Có thể thêm nhiều biểu tượng cảm xúc cho mỗi câu nếu thấy phù hợp."
  },
  {
    id: "very-frequent",
    name: "Rất thường xuyên",
    description: "Sử dụng emoticon/emoji nhiều để tạo ra văn bản rất sinh động và cảm xúc phong phú.",
    icon: "🔴",
    level: "70-85%",
    prompt: "Sử dụng biểu tượng cảm xúc và emoji thường xuyên để tạo ra văn bản giàu cảm xúc và giàu sức biểu cảm. Hãy đưa chúng vào hầu hết các cụm từ và khái niệm."
  },
  {
    id: "maximum",
    name: "Tối đa",
    description: "Thêm emoticon/emoji bất cứ khi nào có thể để đạt được sự sinh động và cảm xúc tối đa.",
    icon: "🌈",
    level: "85-100%",
    prompt: "Tận dụng tối đa việc sử dụng biểu tượng cảm xúc và emoji bất cứ khi nào có thể để tạo ra văn bản sống động, giàu cảm xúc và lôi cuốn. Sử dụng nhiều emoji cho mỗi khái niệm khi thích hợp."
  }
];

export const TRANSLATION_PROFICIENCIES: TranslationProficiency[] = [
  {
    id: "beginner",
    name: "Người mới bắt đầu",
    description: "Sử dụng từ vựng đơn giản, cấu trúc câu cơ bản. Phù hợp cho người mới học hoặc trình độ sơ cấp.",
    icon: "🌱",
    level: "A1-A2",
    prompt: "Use simple vocabulary and basic sentence structures. Avoid complex grammar, idioms, or advanced vocabulary. Break down complex ideas into simple, easy-to-understand concepts."
  },
  {
    id: "elementary",
    name: "Sơ cấp",
    description: "Từ vựng phổ biến, câu đơn giản với giải thích ngắn gọn. Phù hợp cho người học cơ bản.",
    icon: "📚",
    level: "A2-B1",
    prompt: "Use common vocabulary and straightforward sentences. Include brief explanations for potentially difficult words. Keep grammar simple but correct."
  },
  {
    id: "intermediate",
    name: "Trung cấp",
    description: "Từ vựng đa dạng hơn, cấu trúc câu phức tạp vừa phải. Phù hợp cho người học trung cấp.",
    icon: "🎯",
    level: "B1-B2",
    prompt: "Use varied vocabulary and moderately complex sentence structures. Include some idiomatic expressions and common phrases while maintaining clarity."
  },
  {
    id: "advanced",
    name: "Nâng cao",
    description: "Từ vựng phong phú, cấu trúc câu phức tạp, thành ngữ. Phù hợp cho người có trình độ cao.",
    icon: "🎓",
    level: "B2-C1",
    prompt: "Use rich vocabulary, complex sentence structures, and appropriate idioms. Maintain sophisticated language while ensuring accuracy and natural flow."
  },
  {
    id: "native",
    name: "Bản ngữ",
    description: "Sử dụng toàn bộ khả năng của ngôn ngữ, bao gồm slang, thành ngữ địa phương. Như người bản xứ.",
    icon: "👑",
    level: "C1-C2",
    prompt: "Use the full range of the language including colloquialisms, regional idioms, and native-like expressions. Translate as a native speaker would naturally express the ideas."
  },
  {
    id: "child-friendly",
    name: "Dành cho trẻ em",
    description: "Ngôn ngữ đơn giản, thân thiện với trẻ em. Tránh nội dung phức tạp hoặc không phù hợp.",
    icon: "🧒",
    level: "Kid-friendly",
    prompt: "Use child-friendly language with simple words and concepts. Make it engaging and easy for children to understand. Avoid complex or inappropriate content."
  }
];
