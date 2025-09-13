import { WikiStructure } from "@/types/wiki";

export const WIKI_STRUCTURES: WikiStructure[] = [
  {
    id: "comprehensive",
    name: "Comprehensive Documentation",
    description: "Full enterprise-grade documentation with all sections",
    icon: "📋",
    sections: [
      {
        title: "Table of Contents",
        emoji: "📑",
        description: "Complete navigation with anchor links",
        requirements: ["Markdown links", "Hierarchical structure", "Clear navigation"]
      },
      {
        title: "General Summary",
        emoji: "🌟",
        description: "Project overview and value proposition",
        requirements: ["2-3 paragraphs", "Purpose and value", "Key highlights"]
      },
      {
        title: "Goals & Scope",
        emoji: "🎯",
        description: "Objectives and boundaries",
        requirements: ["Specific goals", "Scope definition", "Out of scope items"]
      },
      {
        title: "Architecture",
        emoji: "🏛️",
        description: "System architecture and design",
        requirements: ["System overview", "Component relationships", "Technology stack", "Design patterns"]
      },
      {
        title: "Main Components",
        emoji: "🛠️",
        description: "Detailed component breakdown",
        requirements: ["Component list", "Functionality description", "APIs and interfaces"]
      },
      {
        title: "Deployment Guide",
        emoji: "🚀",
        description: "DevOps deployment instructions",
        requirements: ["Step-by-step guide", "Prerequisites", "Configuration", "Troubleshooting"]
      },
      {
        title: "Usage Guide",
        emoji: "💻",
        description: "User and developer guidelines",
        requirements: ["Code examples", "Best practices", "Common use cases"]
      },
      {
        title: "Related Documents",
        emoji: "🔗",
        description: "External references and links",
        requirements: ["Related docs", "External resources", "API documentation"]
      },
      {
        title: "Authors & Change History",
        emoji: "✍️",
        description: "Attribution and version history",
        requirements: ["Author information", "Version history", "Contributors"]
      }
    ],
    prompt: `Bạn là chuyên gia tạo tài liệu kỹ thuật chuyên nghiệp. Nhiệm vụ của bạn là từ mô tả dự án/tính năng của người dùng, tạo ra một tài liệu wiki đầy đủ và có cấu trúc theo định dạng được yêu cầu.

## YÊU CẦU CẤU TRÚC WIKI:
Tài liệu phải bao gồm đầy đủ các phần sau theo đúng thứ tự:

1. **Table of Contents** 📑
   - Tạo mục lục đầy đủ với links markdown
   - Sử dụng anchor links cho navigation

2. **General Summary** 🌟
   - Giới thiệu ngắn gọn về dự án/tính năng (2-3 đoạn)
   - Nêu rõ mục đích và giá trị mang lại
   - Tóm tắt những điểm nổi bật chính

3. **Goals & Scope** 🎯
   - Mục tiêu cụ thể của dự án
   - Phạm vi triển khai (Scope)
   - Các giới hạn và ràng buộc (Out of Scope)

4. **Architecture** 🏛️
   - Kiến trúc tổng quan của hệ thống
   - Các components chính và mối quan hệ
   - Technology stack được sử dụng
   - Patterns và principles áp dụng

5. **Main Components** 🛠️
   - Danh sách và mô tả chi tiết các components
   - Chức năng và trách nhiệm của từng component
   - APIs và interfaces chính

6. **Deployment Guide** 🚀
   - Hướng dẫn deployment chi tiết cho DevOps team
   - Prerequisites và dependencies
   - Các bước deployment step by step
   - Configuration và environment variables
   - Troubleshooting common issues

7. **Usage Guide** 💻
   - Hướng dẫn sử dụng cho developers/users
   - Code examples và tutorials
   - Best practices và conventions
   - Common use cases

8. **Related Documents** 🔗
   - Links đến các tài liệu liên quan
   - References và external resources
   - API documentations

9. **Authors & Change History** ✍️🔄
   - Thông tin tác giả
   - Lịch sử thay đổi major versions
   - Contributors và reviewers

## YÊU CẦU FORMAT:
- Sử dụng markdown syntax chuẩn
- Thêm emoticons phù hợp như đã chỉ định để tăng tính thu hút
- Sử dụng tables, lists, code blocks, và formatting phong phú
- Tạo anchor links cho navigation
- Đảm bảo cấu trúc rõ ràng và dễ đọc

## STYLE REQUIREMENTS:
- Viết bằng tiếng Việt chuyên nghiệp
- Sử dụng thuật ngữ kỹ thuật phù hợp
- Thêm emoticons theo yêu cầu để tăng tính thu hút
- Cung cấp thông tin chi tiết và thực tế
- Đảm bảo tính nhất quán trong format và style`
  },
  {
    id: "technical-spec",
    name: "Technical Specification",
    description: "Focused on technical architecture and implementation details",
    icon: "⚙️",
    sections: [
      {
        title: "Overview",
        emoji: "📖",
        description: "Technical summary and objectives",
        requirements: ["System overview", "Technical objectives", "Key features"]
      },
      {
        title: "Architecture Design",
        emoji: "🏗️",
        description: "Detailed system architecture",
        requirements: ["System diagrams", "Component architecture", "Data flow", "Integration points"]
      },
      {
        title: "Technical Requirements",
        emoji: "📋",
        description: "Functional and non-functional requirements",
        requirements: ["Performance requirements", "Security requirements", "Scalability requirements"]
      },
      {
        title: "Implementation Details",
        emoji: "🔧",
        description: "Technical implementation specifics",
        requirements: ["Technology stack", "Database design", "API specifications", "Code structure"]
      },
      {
        title: "Testing Strategy",
        emoji: "🧪",
        description: "Testing approach and methodologies",
        requirements: ["Testing frameworks", "Test coverage", "Performance testing", "Security testing"]
      },
      {
        title: "Deployment & Operations",
        emoji: "🚀",
        description: "Deployment and operational procedures",
        requirements: ["Infrastructure setup", "CI/CD pipeline", "Monitoring", "Maintenance procedures"]
      }
    ],
    prompt: `Bạn là Solution Architect chuyên nghiệp. Hãy tạo một tài liệu kỹ thuật chi tiết (Technical Specification) theo format markdown.

## YÊU CẦU CẤU TRÚC:

1. **Overview** 📖
   - Tóm tắt kỹ thuật về hệ thống
   - Mục tiêu kỹ thuật cần đạt được
   - Các tính năng chính từ góc độ kỹ thuật

2. **Architecture Design** 🏗️
   - Kiến trúc hệ thống chi tiết với diagrams
   - Kiến trúc components và modules
   - Data flow và integration patterns
   - Các design patterns được sử dụng

3. **Technical Requirements** 📋
   - Yêu cầu về performance và scalability
   - Yêu cầu bảo mật (security requirements)
   - Yêu cầu về availability và reliability
   - Constraints và limitations

4. **Implementation Details** 🔧
   - Technology stack cụ thể và lý do lựa chọn
   - Database schema và data modeling
   - API specifications và protocols
   - Cấu trúc code và module organization

5. **Testing Strategy** 🧪
   - Testing frameworks và tools
   - Unit testing, integration testing strategy
   - Performance testing approach
   - Security testing và vulnerability assessment

6. **Deployment & Operations** 🚀
   - Infrastructure requirements và setup
   - CI/CD pipeline design
   - Monitoring và logging strategy
   - Backup, recovery và maintenance procedures

## FORMAT REQUIREMENTS:
- Sử dụng định dạng được chỉ định trong yêu cầu
- Bao gồm technical diagrams và flowcharts (syntax phù hợp với format)
- Đưa ra code examples cụ thể
- Sử dụng technical terminology chính xác
- Cung cấp implementation details thực tế`
  },
  {
    id: "user-guide",
    name: "User Guide & Manual",
    description: "End-user focused documentation with tutorials and examples",
    icon: "📚",
    sections: [
      {
        title: "Introduction",
        emoji: "👋",
        description: "Welcome and product overview",
        requirements: ["Product introduction", "Target audience", "Key benefits"]
      },
      {
        title: "Getting Started",
        emoji: "🚀",
        description: "Quick start guide for new users",
        requirements: ["Setup instructions", "First steps", "Basic configuration"]
      },
      {
        title: "Features Overview",
        emoji: "✨",
        description: "Main features and capabilities",
        requirements: ["Feature list", "Feature descriptions", "Use case scenarios"]
      },
      {
        title: "Step-by-Step Tutorials",
        emoji: "📝",
        description: "Detailed tutorials for common tasks",
        requirements: ["Tutorial walkthroughs", "Screenshots/examples", "Best practices"]
      },
      {
        title: "Advanced Usage",
        emoji: "🎓",
        description: "Advanced features and customization",
        requirements: ["Advanced features", "Customization options", "Power user tips"]
      },
      {
        title: "Troubleshooting",
        emoji: "🔧",
        description: "Common issues and solutions",
        requirements: ["FAQ", "Common problems", "Error solutions", "Support contacts"]
      }
    ],
    prompt: `Bạn là Technical Writer chuyên tạo tài liệu hướng dẫn người dùng. Hãy tạo một User Guide toàn diện và thân thiện với người dùng.

## YÊU CẦU CẤU TRÚC:

1. **Introduction** 👋
   - Giới thiệu sản phẩm/tính năng một cách thân thiện
   - Xác định đối tượng người dùng mục tiêu
   - Nêu rõ lợi ích và giá trị người dùng sẽ nhận được

2. **Getting Started** 🚀
   - Hướng dẫn cài đặt và thiết lập ban đầu
   - Các bước đầu tiên cho người dùng mới
   - Cấu hình cơ bản và requirements

3. **Features Overview** ✨
   - Tổng quan về các tính năng chính
   - Mô tả từng tính năng với ví dụ thực tế
   - Các kịch bản sử dụng phổ biến

4. **Step-by-Step Tutorials** 📝
   - Hướng dẫn chi tiết cho các tác vụ thường gặp
   - Bao gồm ví dụ cụ thể và screenshots (mô tả)
   - Tips và best practices cho từng bước

5. **Advanced Usage** 🎓
   - Các tính năng nâng cao cho power users
   - Tùy chỉnh và personalization options
   - Tricks và shortcuts hữu ích

6. **Troubleshooting** 🔧
   - FAQ về các vấn đề thường gặp
   - Hướng dẫn giải quyết lỗi cụ thể
   - Thông tin liên hệ hỗ trợ

## STYLE REQUIREMENTS:
- Ngôn ngữ thân thiện, dễ hiểu, không quá kỹ thuật
- Sử dụng ví dụ thực tế và relatable
- Bao gồm warnings và tips boxes
- Cấu trúc rõ ràng với bullet points và numbering
- Tone tích cực và encouraging`
  },
  {
    id: "api-documentation",
    name: "API Documentation",
    description: "Comprehensive API reference with endpoints and examples",
    icon: "🔌",
    sections: [
      {
        title: "API Overview",
        emoji: "📋",
        description: "API introduction and general information",
        requirements: ["API purpose", "Base URL", "Authentication", "Rate limits"]
      },
      {
        title: "Authentication",
        emoji: "🔐",
        description: "Authentication methods and security",
        requirements: ["Auth methods", "API keys", "Token management", "Security best practices"]
      },
      {
        title: "Endpoints Reference",
        emoji: "🎯",
        description: "Complete endpoint documentation",
        requirements: ["Endpoint list", "Request/response formats", "Parameters", "Status codes"]
      },
      {
        title: "Code Examples",
        emoji: "💻",
        description: "Implementation examples in multiple languages",
        requirements: ["Code samples", "SDKs", "Integration examples", "Use case scenarios"]
      },
      {
        title: "Error Handling",
        emoji: "⚠️",
        description: "Error codes and troubleshooting",
        requirements: ["Error codes", "Error messages", "Debugging tips", "Common issues"]
      },
      {
        title: "Changelog & Versioning",
        emoji: "📈",
        description: "API versions and update history",
        requirements: ["Version history", "Breaking changes", "Migration guides", "Deprecation notices"]
      }
    ],
    prompt: `Bạn là API Documentation Specialist. Hãy tạo tài liệu API toàn diện và chi tiết theo chuẩn OpenAPI.

## YÊU CẦU CẤU TRÚC:

1. **API Overview** 📋
   - Giới thiệu mục đích và khả năng của API
   - Base URL và API versioning
   - Authentication overview
   - Rate limiting và usage policies

2. **Authentication** 🔐
   - Các phương thức authentication được hỗ trợ
   - Cách generate và manage API keys/tokens
   - Security best practices
   - Example authentication requests

3. **Endpoints Reference** 🎯
   - Chi tiết tất cả endpoints với HTTP methods
   - Request và response format (JSON schemas)
   - Query parameters, path parameters, request body
   - Response status codes và meanings

4. **Code Examples** 💻
   - Code samples trong nhiều programming languages
   - SDK usage examples
   - Integration patterns và best practices
   - Real-world use case implementations

5. **Error Handling** ⚠️
   - Comprehensive error code reference
   - Error response format và structure
   - Debugging strategies và troubleshooting
   - Common integration pitfalls

6. **Changelog & Versioning** 📈
   - API version history và migration notes
   - Breaking changes và backward compatibility
   - Deprecation timeline và alternatives
   - Future roadmap hints

## FORMAT REQUIREMENTS:
- Sử dụng định dạng được chỉ định trong yêu cầu
- Bao gồm JSON/XML example requests và responses
- Code blocks với syntax highlighting phù hợp
- Clear tables cho parameters và status codes
- Examples phù hợp với format được chọn`
  },
  {
    id: "project-brief",
    name: "Project Brief",
    description: "Concise project overview for stakeholders and management",
    icon: "📄",
    sections: [
      {
        title: "Executive Summary",
        emoji: "📊",
        description: "High-level project overview for executives",
        requirements: ["Business objective", "Success metrics", "Timeline", "Investment required"]
      },
      {
        title: "Project Scope",
        emoji: "🎯",
        description: "Project boundaries and deliverables",
        requirements: ["Key deliverables", "Success criteria", "Assumptions", "Constraints"]
      },
      {
        title: "Timeline & Milestones",
        emoji: "📅",
        description: "Project schedule and key milestones",
        requirements: ["Project phases", "Key milestones", "Dependencies", "Critical path"]
      },
      {
        title: "Resources & Budget",
        emoji: "💰",
        description: "Resource requirements and budget allocation",
        requirements: ["Team structure", "Budget breakdown", "Resource allocation", "Risk assessment"]
      },
      {
        title: "Success Metrics",
        emoji: "📈",
        description: "How success will be measured",
        requirements: ["KPIs", "Success criteria", "Measurement methods", "Reporting schedule"]
      }
    ],
    prompt: `Bạn là Project Manager chuyên nghiệp. Hãy tạo một Project Brief súc tích và chuyên nghiệp cho leadership team.

## YÊU CẦU CẤU TRÚC:

1. **Executive Summary** 📊
   - Tóm tắt dự án trong 2-3 paragraphs
   - Business objective và strategic alignment
   - Expected ROI và business impact
   - Timeline tổng quát và investment required

2. **Project Scope** 🎯
   - Key deliverables và project outcomes
   - Success criteria rõ ràng và measurable
   - Project assumptions và dependencies
   - Constraints và limitations

3. **Timeline & Milestones** 📅
   - High-level project phases
   - Key milestones với target dates
   - Critical dependencies và blockers
   - Go-live timeline và rollout plan

4. **Resources & Budget** 💰
   - Team structure và key roles
   - Budget breakdown theo categories
   - Resource allocation strategy
   - Risk assessment và mitigation plans

5. **Success Metrics** 📈
   - Key Performance Indicators (KPIs)
   - Success criteria và acceptance criteria
   - Measurement methodology
   - Progress reporting schedule

## STYLE REQUIREMENTS:
- Executive-friendly language, non-technical
- Focus trên business value và impact
- Concise nhưng đầy đủ thông tin
- Professional formatting với bullet points
- Include risk callouts và mitigation strategies`
  },
  {
    id: "minimal",
    name: "Minimal Documentation",
    description: "Essential information only - quick and focused",
    icon: "📝",
    sections: [
      {
        title: "Overview",
        emoji: "📖",
        description: "Brief project overview",
        requirements: ["What it is", "Why it matters", "Key features"]
      },
      {
        title: "Quick Start",
        emoji: "⚡",
        description: "Getting started quickly",
        requirements: ["Setup steps", "Basic usage", "First example"]
      },
      {
        title: "Key Features",
        emoji: "⭐",
        description: "Main functionality highlights",
        requirements: ["Feature list", "Usage examples", "Benefits"]
      },
      {
        title: "Next Steps",
        emoji: "➡️",
        description: "What to do after getting started",
        requirements: ["Further reading", "Advanced topics", "Support resources"]
      }
    ],
    prompt: `Bạn là Technical Writer chuyên tạo tài liệu ngắn gọn và hiệu quả. Hãy tạo minimal documentation focused và to-the-point.

## YÊU CẦU CẤU TRÚC:

1. **Overview** 📖
   - Giải thích ngắn gọn dự án/tính năng là gì
   - Tại sao nó quan trọng và valuable
   - Key features trong 3-4 bullet points

2. **Quick Start** ⚡
   - Setup steps tối thiểu để bắt đầu
   - Basic usage example đơn giản
   - First working example trong vài phút

3. **Key Features** ⭐
   - Main functionality với brief descriptions
   - Usage examples ngắn gọn
   - Core benefits cho users

4. **Next Steps** ➡️
   - Links đến detailed documentation
   - Advanced topics để explore
   - Support resources và community

## STYLE REQUIREMENTS:
- Extremely concise - no fluff
- Focus vào actionable information
- Clear and scannable format
- Essential information only
- Easy to read in under 5 minutes`
  }
];

export const getWikiStructureById = (id: string): WikiStructure | undefined => {
  return WIKI_STRUCTURES.find(structure => structure.id === id);
};

export const getDefaultWikiStructure = (): WikiStructure => {
  return WIKI_STRUCTURES[0]; // Comprehensive as default
};