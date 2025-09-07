import { DiagramType, DiagramStyle, DiagramComplexity, DiagramFormat } from "@/types/diagram";
import { Language } from "@/types/translation";

export const DIAGRAM_FORMATS: DiagramFormat[] = [
  {
    id: "mermaid",
    name: "Mermaid",
    description: "Mermaid.js - Tương thích với GitHub, GitLab, Notion, và nhiều platform khác",
    icon: "🧜‍♀️",
    fileExtension: ".mmd",
    syntax: "mermaid"
  },
  {
    id: "plantuml", 
    name: "PlantUML",
    description: "PlantUML - Mạnh mẽ cho UML và sơ đồ kỹ thuật, hỗ trợ nhiều IDE",
    icon: "🌱",
    fileExtension: ".puml",
    syntax: "plantuml"
  },
  {
    id: "graphviz",
    name: "Graphviz DOT",
    description: "Graphviz DOT - Chuyên nghiệp cho sơ đồ phức tạp và network diagrams",
    icon: "🔗",
    fileExtension: ".dot",
    syntax: "dot"
  },
  {
    id: "drawio",
    name: "Draw.io XML",
    description: "Draw.io/Diagrams.net XML - Tương thích với Draw.io và VS Code",
    icon: "✏️",
    fileExtension: ".drawio",
    syntax: "xml"
  },
  {
    id: "ascii",
    name: "ASCII Art",
    description: "ASCII Art - Text-based diagrams, tương thích với mọi editor",
    icon: "📝",
    fileExtension: ".txt",
    syntax: "text"
  },
  {
    id: "tikz",
    name: "TikZ/LaTeX",
    description: "TikZ/LaTeX - Chất lượng cao cho tài liệu học thuật và xuất bản",
    icon: "📐",
    fileExtension: ".tex",
    syntax: "latex"
  }
];

export const DIAGRAM_OUTPUT_LANGUAGES: Language[] = [
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
  { code: "it", name: "Tiếng Ý", nativeName: "Italiano", flag: "🇮🇹" }
];

export const DIAGRAM_TYPES: DiagramType[] = [
  // UML Diagrams
  {
    id: "class-diagram",
    name: "Sơ đồ lớp",
    description: "Mô tả cấu trúc lớp, thuộc tính, phương thức và mối quan hệ giữa các lớp trong hệ thống",
    icon: "📦",
    category: "UML",
    supportedFormats: ["mermaid", "plantuml", "drawio"],
    prompt: "Generate a UML class diagram. Include classes, attributes, methods, and relationships (inheritance, association, composition, aggregation)."
  },
  {
    id: "sequence-diagram",
    name: "Sơ đồ tuần tự",
    description: "Hiển thị tương tác giữa các đối tượng theo thời gian, thứ tự gửi nhận tin nhắn",
    icon: "🔄",
    category: "UML",
    supportedFormats: ["mermaid", "plantuml", "ascii"],
    prompt: "Generate a UML sequence diagram. Show the interaction between objects/actors over time with messages and lifelines."
  },
  {
    id: "use-case-diagram",
    name: "Sơ đồ ca sử dụng",
    description: "Mô tả các chức năng của hệ thống từ góc nhìn người dùng",
    icon: "👤",
    category: "UML",
    supportedFormats: ["plantuml", "drawio", "ascii"],
    prompt: "Generate a UML use case diagram. Include actors, use cases, and relationships (includes, extends, generalizes)."
  },
  {
    id: "activity-diagram",
    name: "Sơ đồ hoạt động",
    description: "Mô tả luồng công việc, quy trình kinh doanh hoặc thuật toán",
    icon: "⚡",
    category: "UML",
    supportedFormats: ["plantuml", "mermaid", "drawio"],
    prompt: "Generate a UML activity diagram. Show the workflow, decision points, and parallel activities."
  },
  {
    id: "state-diagram",
    name: "Sơ đồ trạng thái",
    description: "Mô tả các trạng thái của đối tượng và chuyển đổi giữa chúng",
    icon: "🔀",
    category: "UML",
    supportedFormats: ["mermaid", "plantuml", "graphviz"],
    prompt: "Generate a UML state diagram. Show states, transitions, events, and conditions."
  },
  {
    id: "component-diagram",
    name: "Sơ đồ thành phần",
    description: "Hiển thị cấu trúc và phụ thuộc giữa các thành phần phần mềm",
    icon: "🧩",
    category: "UML",
    supportedFormats: ["plantuml", "drawio", "graphviz"],
    prompt: "Generate a UML component diagram. Show components, interfaces, and dependencies."
  },
  
  // Process & Flow Diagrams
  {
    id: "flowchart",
    name: "Sơ đồ luồng",
    description: "Biểu diễn quy trình, thuật toán hoặc luồng công việc với các bước và điều kiện",
    icon: "🌊",
    category: "Process",
    supportedFormats: ["mermaid", "drawio", "ascii", "graphviz"],
    prompt: "Generate a flowchart. Include decision points, processes, start/end nodes, and clear flow direction."
  },
  {
    id: "mind-map",
    name: "Sơ đồ tư duy",
    description: "Tổ chức ý tưởng và thông tin theo cấu trúc phân cấp từ trung tâm",
    icon: "🧠",
    category: "Process",
    supportedFormats: ["mermaid", "ascii", "drawio"],
    prompt: "Generate a mind map. Organize ideas hierarchically from a central topic with branches and sub-branches."
  },
  {
    id: "timeline",
    name: "Dòng thời gian",
    description: "Hiển thị chuỗi sự kiện theo thứ tự thời gian",
    icon: "📅",
    category: "Process",
    supportedFormats: ["mermaid", "ascii", "tikz"],
    prompt: "Generate a timeline diagram. Show events chronologically with dates, milestones, and descriptions."
  },
  
  // System Architecture
  {
    id: "system-architecture",
    name: "Kiến trúc hệ thống",
    description: "Mô tả cấu trúc tổng thể của hệ thống phần mềm",
    icon: "🏗️",
    category: "Architecture",
    supportedFormats: ["mermaid", "drawio", "plantuml", "graphviz"],
    prompt: "Generate a system architecture diagram. Show system components, databases, external services, and data flow."
  },
  {
    id: "network-diagram",
    name: "Sơ đồ mạng",
    description: "Hiển thị cấu trúc mạng, thiết bị và kết nối",
    icon: "🌐",
    category: "Architecture",
    supportedFormats: ["graphviz", "drawio", "plantuml", "ascii"],
    prompt: "Generate a network diagram. Include network devices, connections, IP ranges, and protocols."
  },
  {
    id: "database-erd",
    name: "Mô hình ER",
    description: "Sơ đồ thực thể-mối quan hệ cho cơ sở dữ liệu",
    icon: "🗄️",
    category: "Architecture",
    supportedFormats: ["mermaid", "plantuml", "drawio", "graphviz"],
    prompt: "Generate an Entity Relationship Diagram (ERD). Show entities, attributes, primary keys, and relationships."
  },
  
  // Business & Organization
  {
    id: "org-chart",
    name: "Sơ đồ tổ chức",
    description: "Cấu trúc tổ chức và phân cấp trong doanh nghiệp",
    icon: "🏢",
    category: "Business",
    supportedFormats: ["mermaid", "drawio", "graphviz", "ascii"],
    prompt: "Generate an organizational chart. Show hierarchy, roles, departments, and reporting relationships."
  },
  {
    id: "gantt-chart",
    name: "Biểu đồ Gantt",
    description: "Lập kế hoạch dự án và theo dõi tiến độ công việc",
    icon: "📊",
    category: "Business",
    supportedFormats: ["mermaid", "tikz", "ascii"],
    prompt: "Generate a Gantt chart. Include tasks, durations, dependencies, and milestones."
  },
  
  // Custom Diagrams
  {
    id: "git-graph",
    name: "Git Graph",
    description: "Sơ đồ nhánh và lịch sử commit trong Git",
    icon: "🌳",
    category: "Development",
    supportedFormats: ["mermaid", "ascii", "graphviz"],
    prompt: "Generate a Git graph. Show branches, commits, merges, and repository history."
  },
  {
    id: "user-journey",
    name: "Hành trình người dùng",
    description: "Mô tả trải nghiệm người dùng qua các bước tương tác",
    icon: "🚶",
    category: "UX",
    supportedFormats: ["mermaid", "drawio", "ascii"],
    prompt: "Generate a user journey map. Show user actions, touchpoints, emotions, and pain points."
  }
];

export const DIAGRAM_STYLES: DiagramStyle[] = [
  {
    id: "clean-minimal",
    name: "Sạch sẽ - Tối giản",
    description: "Thiết kế đơn giản, sạch sẽ với ít màu sắc và trang trí",
    icon: "✨",
    prompt: "Use a clean, minimal style with simple lines, limited colors, and clear typography. Focus on clarity and readability."
  },
  {
    id: "professional",
    name: "Chuyên nghiệp",
    description: "Phong cách trang trọng, phù hợp với môi trường doanh nghiệp",
    icon: "💼",
    prompt: "Use professional styling with corporate colors (blue, gray, white), clear fonts, and business-appropriate design elements."
  },
  {
    id: "colorful-vibrant",
    name: "Đầy màu sắc",
    description: "Sử dụng nhiều màu sắc tươi sáng để tạo điểm nhấn",
    icon: "🌈",
    prompt: "Use vibrant, colorful styling with bright colors to differentiate elements and create visual interest while maintaining readability."
  },
  {
    id: "modern-tech",
    name: "Hiện đại - Công nghệ",
    description: "Phong cách hiện đại với màu xanh công nghệ và thiết kế sắc nét",
    icon: "💻",
    prompt: "Use modern tech styling with blues, teals, and grays. Include tech-inspired icons and sleek, contemporary design elements."
  },
  {
    id: "hand-drawn",
    name: "Vẽ tay",
    description: "Phong cách như được vẽ tay, thân thiện và cá nhân hóa",
    icon: "✏️",
    prompt: "Use hand-drawn style with sketchy lines, informal fonts, and personal touches to create a friendly, approachable feel."
  },
  {
    id: "dark-theme",
    name: "Chế độ tối",
    description: "Nền tối với text sáng, phù hợp cho developers",
    icon: "🌙",
    prompt: "Use dark theme styling with dark backgrounds, light text, and colors optimized for dark mode viewing."
  }
];

export const DIAGRAM_COMPLEXITIES: DiagramComplexity[] = [
  {
    id: "simple",
    name: "Đơn giản",
    description: "Ít thành phần, dễ hiểu, phù hợp cho người mới bắt đầu",
    icon: "🟢",
    level: "Cơ bản",
    prompt: "Keep the diagram simple with 3-5 main elements. Use clear, basic relationships and avoid complex details."
  },
  {
    id: "moderate",
    name: "Vừa phải",
    description: "Cân bằng giữa đơn giản và chi tiết, phù hợp cho hầu hết trường hợp",
    icon: "🟡",
    level: "Trung bình",
    prompt: "Create a moderately detailed diagram with 5-10 elements. Include important details while maintaining clarity."
  },
  {
    id: "detailed",
    name: "Chi tiết",
    description: "Nhiều thành phần và mối quan hệ phức tạp, thông tin đầy đủ",
    icon: "🟠",
    level: "Nâng cao",
    prompt: "Generate a detailed diagram with 10+ elements. Include comprehensive information, detailed relationships, and thorough coverage."
  },
  {
    id: "comprehensive",
    name: "Toàn diện",
    description: "Rất chi tiết với tất cả các thành phần và mối quan hệ có thể",
    icon: "🔴",
    level: "Chuyên gia",
    prompt: "Create a comprehensive diagram covering all aspects. Include extensive details, multiple layers of information, and complete system coverage."
  }
];