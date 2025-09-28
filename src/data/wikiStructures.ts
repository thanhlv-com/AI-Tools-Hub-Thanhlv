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
  },
  {
    id: "deployment-checklist",
    name: "Deployment Checklist",
    description: "Comprehensive deployment checklist for software releases",
    icon: "🚀",
    sections: [
      {
        title: "Schedule",
        emoji: "📅",
        description: "Deployment timeline and scheduling information",
        requirements: ["Deployment date and time", "Time zone specifications", "Duration estimates", "Maintenance windows"]
      },
      {
        title: "Scope & Detail Tasks",
        emoji: "🎯",
        description: "Deployment scope and detailed task breakdown",
        requirements: ["Task list with titles", "Assigned PICs (Person In Charge)", "Task descriptions", "Dependencies and prerequisites"]
      },
      {
        title: "Pre-Release Checklist",
        emoji: "✅",
        description: "Tasks to complete before deployment",
        requirements: ["Communication and notifications", "Code reviews and approvals", "Testing completion", "Documentation updates"]
      },
      {
        title: "Release Steps",
        emoji: "🔄",
        description: "Step-by-step deployment process",
        requirements: ["Sequential deployment steps", "Configuration changes", "System updates", "Verification checkpoints"]
      },
      {
        title: "Post-Release Verification",
        emoji: "🔍",
        description: "Verification and validation after deployment",
        requirements: ["System health checks", "Functional testing", "Performance monitoring", "User acceptance validation"]
      },
      {
        title: "Rollback Plan",
        emoji: "⏪",
        description: "Rollback procedures if issues occur",
        requirements: ["Rollback triggers", "Rollback steps", "Recovery procedures", "Verification after rollback"]
      },
      {
        title: "Monitoring & Support",
        emoji: "📊",
        description: "Post-deployment monitoring and support",
        requirements: ["Monitoring channels", "Alert configurations", "Support contacts", "Escalation procedures"]
      }
    ],
    prompt: `Bạn là Release Manager chuyên nghiệp. Hãy tạo một deployment checklist toàn diện và chi tiết cho việc triển khai phần mềm với rất nhiều bảng (tables) để theo dõi và quản lý.

## YÊU CẦU CẤU TRÚC DEPLOYMENT CHECKLIST (SỬ DỤNG NHIỀU TABLES):

1. **Schedule** 📅
   - **Deployment Timeline Table**:
     | Phase | Start Time | End Time | Duration | Owner | Notes |
     |-------|------------|----------|----------|-------|-------|
   - **Time Zone Reference Table**:
     | Location | Time Zone | Local Time | UTC Offset |
     |----------|-----------|------------|------------|
   - **Maintenance Window Table**:
     | System/Service | Downtime Start | Downtime End | Impact Level | Users Affected |
     |----------------|----------------|--------------|--------------|----------------|

2. **Scope & Detail Tasks** 🎯
   - **Main Tasks Table**:
     | # | Task Title | PIC | Priority | Dependencies | Estimated Time | Status | Notes |
     |---|------------|-----|----------|--------------|---------------|--------|-------|
   - **Dependencies Matrix Table**:
     | Task ID | Depends On | Blocking | Critical Path | Risk Level |
     |---------|------------|----------|---------------|------------|
   - **Resource Requirements Table**:
     | Task | Required Skills | Tools/Access | Environment | Team Size |
     |------|----------------|--------------|-------------|-----------|

3. **Pre-Release Checklist** ✅
   - **Communication Checklist Table**:
     | Action | Target Audience | Channel | Responsible | Deadline | Status |
     |--------|----------------|---------|-------------|----------|--------|
   - **Code Review Status Table**:
     | Component | Reviewers | PR Link | Status | Issues | Resolution |
     |-----------|-----------|---------|--------|--------|------------|
   - **Testing Completion Table**:
     | Test Type | Coverage | Pass Rate | Issues Found | Resolution Status | Sign-off |
     |-----------|----------|-----------|--------------|------------------|----------|
   - **Documentation Updates Table**:
     | Document | Owner | Status | Review Date | Approval | Version |
     |----------|-------|--------|-------------|----------|---------|

4. **Release Steps** 🔄
   - **Deployment Steps Table**:
     | Step # | Action | Command/Process | Expected Result | Verification | Owner | Time Limit |
     |--------|--------|-----------------|-----------------|--------------|-------|------------|
   - **Configuration Changes Table**:
     | Service | Config File | Parameter | Old Value | New Value | Backup Location |
     |---------|-------------|-----------|-----------|-----------|-----------------|
   - **Database Migration Table**:
     | Migration | Version | Tables Affected | Downtime | Rollback Script | Verification Query |
     |-----------|---------|-----------------|----------|-----------------|-------------------|
   - **Go/No-Go Decision Matrix**:
     | Checkpoint | Criteria | Current Status | Decision | Responsible | Action If No-Go |
     |------------|----------|----------------|----------|-------------|-----------------|

5. **Post-Release Verification** 🔍
   - **System Health Checks Table**:
     | System/Service | Health Endpoint | Expected Response | Actual Status | Check Time | Issues |
     |----------------|-----------------|-------------------|---------------|------------|--------|
   - **Functional Testing Table**:
     | Feature | Test Case | Expected Result | Actual Result | Pass/Fail | Notes |
     |---------|-----------|-----------------|---------------|-----------|-------|
   - **Performance Monitoring Table**:
     | Metric | Baseline | Current | Threshold | Status | Action Required |
     |--------|----------|---------|-----------|--------|-----------------|
   - **User Acceptance Table**:
     | Feature | User Group | Feedback | Rating | Issues | Resolution |
     |---------|------------|----------|--------|--------|------------|

6. **Rollback Plan** ⏪
   - **Rollback Triggers Table**:
     | Trigger Condition | Severity | Decision Maker | Auto/Manual | Time Limit |
     |-------------------|----------|----------------|-------------|------------|
   - **Rollback Steps Table**:
     | Step # | Action | Command | Expected Time | Verification | Owner |
     |--------|--------|---------|---------------|--------------|-------|
   - **Recovery Procedures Table**:
     | Component | Recovery Method | Data Loss Risk | Recovery Time | Verification Steps |
     |-----------|-----------------|----------------|---------------|-------------------|

7. **Monitoring & Support** 📊
   - **Monitoring Channels Table**:
     | System | Dashboard URL | Alert Channel | Threshold | Escalation Path |
     |--------|---------------|---------------|-----------|-----------------|
   - **Support Contacts Table**:
     | Role | Name | Primary Contact | Secondary Contact | Availability | Expertise |
     |------|------|-----------------|-------------------|--------------|-----------|
   - **Alert Configuration Table**:
     | Alert Type | Condition | Notification | Recipients | Severity | Response SLA |
     |------------|-----------|--------------|------------|----------|--------------|
   - **Escalation Matrix Table**:
     | Issue Level | Response Time | Contact Person | Backup Contact | Authority Level |
     |-------------|---------------|----------------|----------------|-----------------|

## ADDITIONAL TABLES REQUIREMENTS:

8. **Risk Assessment Tables** ⚠️
   - **Risk Register Table**:
     | Risk ID | Description | Probability | Impact | Risk Level | Mitigation | Owner |
     |---------|-------------|-------------|--------|------------|------------|-------|
   - **Contingency Plans Table**:
     | Scenario | Trigger | Response Plan | Resources Needed | Timeline | Success Criteria |
     |----------|---------|---------------|------------------|----------|------------------|

9. **Resource & Environment Tables** 🔧
   - **Environment Checklist Table**:
     | Environment | Status | Last Updated | Config Version | Access Verified | Issues |
     |-------------|--------|--------------|----------------|-----------------|--------|
   - **Infrastructure Status Table**:
     | Component | Current Version | Target Version | Capacity | Health Status | Notes |
     |-----------|-----------------|----------------|----------|---------------|-------|

10. **Post-Deployment Review Tables** 📋
    - **Lessons Learned Table**:
      | Issue/Success | Description | Impact | Root Cause | Action Items | Owner |
      |---------------|-------------|--------|------------|--------------|-------|
    - **Metrics Summary Table**:
      | KPI | Target | Actual | Variance | Status | Comments |
      |-----|--------|--------|----------|--------|----------|

## CRITICAL TABLE FORMAT REQUIREMENTS:
- **TẤT CẢ tables phải có markdown format chuẩn với | separators**
- **Mỗi section phải có ít nhất 2-3 tables chi tiết**
- **Tables phải có header row với alignment indicators (|:--|:--:|--:|)**
- **Status columns sử dụng emojis: ✅ ❌ ⏳ ⚠️ 🔄**
- **Include clickable links trong tables cho tools và documentation**
- **Tables phải có empty rows để teams có thể fill in thông tin thực tế**
- **Sử dụng color coding cho priority levels: 🔴 High, 🟡 Medium, 🟢 Low**

## STYLE REQUIREMENTS:
- **MỖI SECTION PHẢI BẮT ĐẦU VỚI MỘT TABLE TỔNG QUAN**
- Professional và actionable language
- Specific người chịu trách nhiệm cho mỗi task
- Clear success/failure criteria với measurable metrics
- Include emergency contacts và procedures trong tables
- Risk mitigation strategies được document trong table format
- **TABLES PHẢI CHIẾM ÍT NHẤT 70% NỘI DUNG CỦA TÀI LIỆU**`
  },
  {
    id: "wiki-development-framework",
    name: "Wiki Development Framework",
    description: "Comprehensive framework for planning and structuring wiki development projects",
    icon: "🏗️",
    sections: [
      {
        title: "Wiki Architecture Overview",
        emoji: "🏛️",
        description: "System architecture and technical foundation",
        requirements: ["Information architecture", "Content taxonomy", "Navigation structure", "Technology stack"]
      },
      {
        title: "Content Strategy & Governance",
        emoji: "📊",
        description: "Content planning and management guidelines",
        requirements: ["Content types taxonomy", "Editorial guidelines", "Review processes", "Maintenance schedules"]
      },
      {
        title: "User Experience Design",
        emoji: "🎨",
        description: "UX/UI considerations for wiki users",
        requirements: ["User personas", "Information findability", "Navigation patterns", "Mobile responsiveness"]
      },
      {
        title: "Content Creation Workflows",
        emoji: "⚡",
        description: "Processes for creating and maintaining content",
        requirements: ["Content creation templates", "Review workflows", "Version control", "Publishing pipelines"]
      },
      {
        title: "Integration Strategies",
        emoji: "🔗",
        description: "Integration with development tools and systems",
        requirements: ["API integrations", "Tool connections", "Data synchronization", "Automation workflows"]
      },
      {
        title: "Quality Assurance Framework",
        emoji: "✅",
        description: "Quality control and consistency measures",
        requirements: ["Content standards", "Review checklists", "Testing procedures", "Performance metrics"]
      },
      {
        title: "Scalability & Maintenance",
        emoji: "📈",
        description: "Long-term sustainability and growth planning",
        requirements: ["Growth strategies", "Maintenance procedures", "Performance optimization", "Migration planning"]
      }
    ],
    prompt: `You are a Wiki Development Specialist with expertise in information architecture, content strategy, and developer documentation systems. Create a comprehensive Wiki Development Framework that serves as a blueprint for software teams building and maintaining wiki systems.

## FRAMEWORK STRUCTURE REQUIREMENTS:

1. **Wiki Architecture Overview** 🏛️
   - Information Architecture design principles
   - Content taxonomy and categorization strategies
   - Navigation structure and hierarchy planning
   - Technology stack recommendations (platforms, tools, integrations)
   - Performance and scalability considerations

2. **Content Strategy & Governance** 📊
   - Content types taxonomy (documentation, tutorials, API refs, troubleshooting)
   - Editorial guidelines and style guides
   - Content review and approval processes
   - Maintenance schedules and lifecycle management
   - Ownership and responsibility matrices

3. **User Experience Design** 🎨
   - User personas and journey mapping for different developer roles
   - Information findability and search optimization
   - Navigation patterns and interface design principles
   - Mobile and responsive design considerations
   - Accessibility standards and inclusive design

4. **Content Creation Workflows** ⚡
   - Standardized content creation templates
   - Review and collaboration workflows
   - Version control and change management
   - Publishing pipelines and automation
   - Content migration and import strategies

5. **Integration Strategies** 🔗
   - API documentation generation and synchronization
   - Integration with development tools (IDEs, version control, CI/CD)
   - Real-time data synchronization strategies
   - Automation workflows and bot integrations
   - Cross-platform content distribution

6. **Quality Assurance Framework** ✅
   - Content quality standards and guidelines
   - Review checklists and validation procedures
   - Automated testing for documentation accuracy
   - Performance metrics and analytics
   - User feedback collection and incorporation

7. **Scalability & Maintenance** 📈
   - Growth planning and capacity management
   - Regular maintenance procedures and schedules
   - Performance optimization strategies
   - Migration planning for platform changes
   - Community contribution and crowdsourcing strategies

## TECHNICAL IMPLEMENTATION FOCUS:
- Include specific tool recommendations and comparisons
- Provide code examples for automation scripts
- Detail API integration patterns
- Include performance benchmarking guidelines
- Specify security and access control considerations

## DELIVERABLE FORMAT:
- Actionable frameworks with implementation steps
- Decision matrices for tool selection
- Template libraries and boilerplates
- Automation script examples
- Best practices checklists`
  },
  {
    id: "developer-knowledge-base",
    name: "Developer Knowledge Base",
    description: "Structured knowledge management system for development teams",
    icon: "🧠",
    sections: [
      {
        title: "Knowledge Architecture",
        emoji: "🗂️",
        description: "Information organization and structure",
        requirements: ["Knowledge taxonomy", "Content hierarchies", "Cross-referencing systems", "Tagging strategies"]
      },
      {
        title: "Developer Onboarding",
        emoji: "🚀",
        description: "New team member integration resources",
        requirements: ["Onboarding paths", "Learning progressions", "Skill assessments", "Mentorship programs"]
      },
      {
        title: "Technical Documentation",
        emoji: "📚",
        description: "Comprehensive technical knowledge repository",
        requirements: ["Code documentation", "Architecture guides", "Best practices", "Decision records"]
      },
      {
        title: "Troubleshooting Database",
        emoji: "🔧",
        description: "Problem-solving knowledge and solutions",
        requirements: ["Issue taxonomies", "Solution databases", "Diagnostic procedures", "Escalation paths"]
      },
      {
        title: "Learning & Development",
        emoji: "🎓",
        description: "Continuous learning and skill development",
        requirements: ["Learning paths", "Skill matrices", "Training resources", "Certification tracking"]
      },
      {
        title: "Collaboration Tools",
        emoji: "🤝",
        description: "Knowledge sharing and collaboration systems",
        requirements: ["Discussion forums", "Expert networks", "Collaboration workflows", "Knowledge sharing incentives"]
      }
    ],
    prompt: `You are a Knowledge Management Architect specializing in developer-focused information systems. Create a comprehensive Developer Knowledge Base framework that enables software teams to capture, organize, and share technical knowledge effectively.

## KNOWLEDGE BASE FRAMEWORK:

1. **Knowledge Architecture** 🗂️
   - Multi-dimensional knowledge taxonomy for technical content
   - Content hierarchies and relationship mapping
   - Cross-referencing and linking strategies
   - Tagging and metadata frameworks
   - Search and discovery optimization

2. **Developer Onboarding** 🚀
   - Role-based onboarding learning paths
   - Progressive skill development tracks
   - Interactive tutorials and hands-on exercises
   - Skill assessment and gap analysis tools
   - Mentorship program integration

3. **Technical Documentation** 📚
   - Living code documentation strategies
   - Architecture decision records (ADRs)
   - Best practices libraries and coding standards
   - Design pattern catalogs
   - Legacy system knowledge preservation

4. **Troubleshooting Database** 🔧
   - Systematic issue categorization and taxonomy
   - Solution databases with search capabilities
   - Diagnostic flowcharts and decision trees
   - Escalation procedures and expert networks
   - Post-incident knowledge capture processes

5. **Learning & Development** 🎓
   - Competency-based learning paths
   - Technology-specific skill matrices
   - Curated training resources and certifications
   - Progress tracking and achievement systems
   - Knowledge sharing recognition programs

6. **Collaboration Tools** 🤝
   - Expert identification and networking systems
   - Discussion forums and Q&A platforms
   - Collaborative editing and review workflows
   - Knowledge contribution gamification
   - Cross-team knowledge sharing initiatives

## IMPLEMENTATION GUIDELINES:
- Focus on developer-centric user experiences
- Include automation for knowledge capture
- Provide metrics for knowledge base effectiveness
- Detail integration with development workflows
- Specify content lifecycle management processes`
  },
  {
    id: "agile-wiki-methodology",
    name: "Agile Wiki Methodology",
    description: "Agile-aligned wiki development and maintenance processes",
    icon: "🔄",
    sections: [
      {
        title: "Agile Documentation Principles",
        emoji: "📋",
        description: "Core principles for agile documentation",
        requirements: ["Just-enough documentation", "Living documents", "Iterative improvement", "Value-driven content"]
      },
      {
        title: "Sprint-Based Wiki Development",
        emoji: "🏃",
        description: "Sprint planning and execution for wiki projects",
        requirements: ["Sprint planning", "User stories for documentation", "Definition of done", "Sprint retrospectives"]
      },
      {
        title: "Continuous Integration",
        emoji: "🔄",
        description: "CI/CD for documentation and wiki content",
        requirements: ["Automated testing", "Content validation", "Deployment pipelines", "Version control"]
      },
      {
        title: "Stakeholder Collaboration",
        emoji: "👥",
        description: "Collaborative processes with stakeholders",
        requirements: ["Stakeholder mapping", "Feedback loops", "Review processes", "Communication protocols"]
      },
      {
        title: "Metrics & Analytics",
        emoji: "📊",
        description: "Measuring wiki effectiveness and ROI",
        requirements: ["Usage analytics", "Content performance", "User satisfaction", "Business impact metrics"]
      },
      {
        title: "Adaptive Planning",
        emoji: "🎯",
        description: "Flexible planning and adaptation strategies",
        requirements: ["Backlog management", "Priority frameworks", "Change management", "Risk mitigation"]
      }
    ],
    prompt: `You are an Agile Coach with expertise in documentation strategy and knowledge management systems. Create an Agile Wiki Methodology that aligns wiki development with agile software development practices.

## AGILE WIKI METHODOLOGY:

1. **Agile Documentation Principles** 📋
   - Just-enough documentation philosophy
   - Living documents that evolve with code
   - Iterative improvement and feedback incorporation
   - Value-driven content creation and maintenance
   - Documentation as code practices

2. **Sprint-Based Wiki Development** 🏃
   - Documentation sprint planning and estimation
   - User stories for wiki features and content
   - Definition of done for documentation tasks
   - Sprint retrospectives focused on documentation effectiveness
   - Cross-functional team collaboration on wiki development

3. **Continuous Integration** 🔄
   - Automated testing for documentation accuracy
   - Content validation and quality gates
   - Deployment pipelines for wiki updates
   - Version control integration with development workflows
   - Automated content generation from code

4. **Stakeholder Collaboration** 👥
   - Stakeholder mapping and engagement strategies
   - Regular feedback loops and review cycles
   - Collaborative review and approval processes
   - Communication protocols for documentation changes
   - Cross-team coordination and alignment

5. **Metrics & Analytics** 📊
   - Usage analytics and content performance tracking
   - User satisfaction and feedback metrics
   - Business impact measurement and ROI analysis
   - Content lifecycle and maintenance metrics
   - Team productivity and efficiency indicators

6. **Adaptive Planning** 🎯
   - Documentation backlog management
   - Priority frameworks for content development
   - Change management for evolving requirements
   - Risk identification and mitigation strategies
   - Scaling strategies for growing teams

## AGILE IMPLEMENTATION FOCUS:
- Emphasize collaboration over process
- Provide lightweight, flexible frameworks
- Include ceremony adaptations for documentation teams
- Detail integration with existing agile practices
- Focus on delivering value to end users`
  },
  {
    id: "enterprise-wiki-architecture",
    name: "Enterprise Wiki Architecture",
    description: "Large-scale wiki systems for enterprise environments",
    icon: "🏢",
    sections: [
      {
        title: "Enterprise Requirements Analysis",
        emoji: "📋",
        description: "Business and technical requirements gathering",
        requirements: ["Stakeholder analysis", "Business requirements", "Technical constraints", "Compliance needs"]
      },
      {
        title: "System Architecture Design",
        emoji: "🏗️",
        description: "Scalable and secure architecture planning",
        requirements: ["Infrastructure design", "Security architecture", "Integration patterns", "Performance specifications"]
      },
      {
        title: "Governance Framework",
        emoji: "⚖️",
        description: "Policies and procedures for enterprise use",
        requirements: ["Content governance", "Access control", "Compliance procedures", "Audit requirements"]
      },
      {
        title: "Integration Strategy",
        emoji: "🔗",
        description: "Enterprise system integrations",
        requirements: ["SSO integration", "Directory services", "Business system connections", "Data synchronization"]
      },
      {
        title: "Security & Compliance",
        emoji: "🔒",
        description: "Security measures and regulatory compliance",
        requirements: ["Security policies", "Access controls", "Data protection", "Regulatory compliance"]
      },
      {
        title: "Migration & Change Management",
        emoji: "🔄",
        description: "Enterprise-scale migration and change processes",
        requirements: ["Migration strategies", "Change management", "Training programs", "Adoption metrics"]
      }
    ],
    prompt: `You are an Enterprise Architect with deep expertise in large-scale information systems and corporate wiki deployments. Create a comprehensive Enterprise Wiki Architecture framework for organizations implementing wiki systems at scale.

## ENTERPRISE WIKI ARCHITECTURE:

1. **Enterprise Requirements Analysis** 📋
   - Multi-stakeholder requirements gathering processes
   - Business case development and ROI analysis
   - Technical constraint identification and assessment
   - Regulatory and compliance requirement mapping
   - Cross-departmental needs analysis

2. **System Architecture Design** 🏗️
   - Scalable infrastructure architecture patterns
   - High availability and disaster recovery planning
   - Security architecture and threat modeling
   - Integration architecture and API design
   - Performance and capacity planning specifications

3. **Governance Framework** ⚖️
   - Enterprise content governance policies
   - Role-based access control and permissions
   - Content lifecycle and retention policies
   - Compliance monitoring and audit procedures
   - Risk management and mitigation strategies

4. **Integration Strategy** 🔗
   - Single Sign-On (SSO) and identity management
   - Active Directory and LDAP integration
   - Enterprise system connectivity (ERP, CRM, etc.)
   - Real-time data synchronization strategies
   - API management and service mesh architecture

5. **Security & Compliance** 🔒
   - Enterprise security policy implementation
   - Multi-layered access control systems
   - Data classification and protection schemes
   - Regulatory compliance frameworks (GDPR, HIPAA, SOX)
   - Security monitoring and incident response

6. **Migration & Change Management** 🔄
   - Large-scale content migration strategies
   - Organizational change management programs
   - Training and adoption enablement
   - Success metrics and KPI frameworks
   - Continuous improvement processes

## ENTERPRISE FOCUS AREAS:
- Emphasize scalability and reliability
- Include detailed security and compliance considerations
- Provide governance and policy templates
- Detail integration with enterprise systems
- Focus on change management at organizational scale`
  }
];

export const getWikiStructureById = (id: string): WikiStructure | undefined => {
  return WIKI_STRUCTURES.find(structure => structure.id === id);
};

export const getDefaultWikiStructure = (): WikiStructure => {
  return WIKI_STRUCTURES[0]; // Comprehensive as default
};