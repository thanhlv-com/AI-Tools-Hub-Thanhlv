import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptFormData, PromptExample } from "@/types/prompt";
import { 
  FileText, 
  Code, 
  Languages, 
  Download,
  Lightbulb,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const getPromptExamples = (t: (key: string) => string): PromptExample[] => [
  {
    id: "blog-content",
    title: "Tạo nội dung Blog",
    description: "Prompt cho việc tạo bài viết blog chuyên nghiệp với SEO tối ưu",
    use_case: "Content Marketing, Blogging, SEO",
    json: {
      prompt_goal: "Tạo bài viết blog chuyên nghiệp, hấp dẫn và tối ưu SEO về chủ đề được chỉ định",
      target_audience: "Độc giả quan tâm đến công nghệ, doanh nhân, và những người muốn học hỏi",
      output_format: "Markdown với cấu trúc heading, subheading, và bullet points",
      task: "Viết một bài blog hoàn chỉnh bao gồm: tiêu đề hấp dẫn, mở bài thu hút, nội dung chi tiết với ví dụ cụ thể, và kết luận có call-to-action",
      persona: "Chuyên gia content marketing với 10 năm kinh nghiệm, am hiểu SEO và storytelling",
      context: "Bài viết sẽ được đăng trên blog công ty công nghệ, nhắm đến việc tăng traffic và engagement",
      constraints: [
        "Độ dài: 1500-2000 từ",
        "Bao gồm ít nhất 5 heading phụ",
        "Sử dụng từ khóa được chỉ định tối thiểu 3-5 lần",
        "Tone of voice: Chuyên nghiệp nhưng thân thiện",
        "Bao gồm ít nhất 3 ví dụ thực tế"
      ],
      examples: `Input: "Viết blog về AI trong marketing"\n\nExpected Output:\n# AI trong Marketing: Cách Mạng Hóa Chiến Lược Kinh Doanh Thời Đại Số\n\n## Mở đầu\nTrí tuệ nhân tạo (AI) đang...\n\n## 1. AI Thay Đổi Cách Chúng Ta Hiểu Khách Hàng\n### Personalization ở Mức Độ Cá Nhân\n- Ví dụ: Netflix sử dụng AI để...\n\n## 2. Automation trong Email Marketing\n...\n\n## Kết luận\nBạn đã sẵn sàng áp dụng AI vào strategy marketing của mình chưa?`,
      metadata: {
        created_at: "2025-01-05",
        version: "1.0",
        ai_model_recommendation: "claude-3-sonnet"
      }
    }
  },
  {
    id: "code-analysis",
    title: "Phân tích Code",
    description: "Prompt để review và phân tích code với các gợi ý cải thiện",
    use_case: "Code Review, Debugging, Best Practices",
    json: {
      prompt_goal: "Thực hiện code review chi tiết và đưa ra các gợi ý cải thiện về performance, security và maintainability",
      target_audience: "Lập trình viên từ junior đến senior, team lead, và technical manager",
      output_format: "Structured report với các section: Tổng quan, Vấn đề phát hiện, Gợi ý cải thiện, và Code example",
      task: "Phân tích code được cung cấp và đưa ra báo cáo chi tiết bao gồm: đánh giá chất lượng code, phát hiện potential bugs, security issues, performance bottlenecks, và đề xuất refactoring",
      persona: "Senior Software Architect với chuyên môn về clean code, security, và system design",
      context: "Code review cho dự án production với yêu cầu high performance và security cao",
      constraints: [
        "Focus vào: Security, Performance, Maintainability, và Best Practices",
        "Đưa ra code examples cụ thể cho mỗi suggestion",
        "Phân loại issues theo mức độ: Critical, High, Medium, Low",
        "Giải thích lý do cho mỗi recommendation",
        "Không vượt quá 2000 từ cho toàn bộ report"
      ],
      examples: `Input: \`\`\`javascript\nfunction getUserData(id) {\n  return fetch('/api/users/' + id)\n    .then(res => res.json())\n}\n\`\`\`\n\nExpected Output:\n# Code Review Report\n\n## Tổng quan\nFunction getUserData có một số vấn đề về error handling...\n\n## Issues Phát hiện\n### 🔴 Critical: Thiếu Error Handling\n- **Problem**: Function không handle network errors\n- **Impact**: App có thể crash khi API fail\n- **Solution**: \`\`\`javascript\nfunction getUserData(id) {\n  return fetch('/api/users/' + id)\n    .then(res => {\n      if (!res.ok) throw new Error('Failed to fetch');\n      return res.json();\n    })\n    .catch(err => console.error('Error:', err));\n}\n\`\`\``,
      metadata: {
        created_at: "2025-01-05",
        version: "1.0",
        ai_model_recommendation: "claude-3-sonnet"
      }
    }
  },
  {
    id: "translation-rewrite",
    title: "Dịch thuật và Viết lại",
    description: "Prompt cho dịch thuật chuyên nghiệp và viết lại nội dung",
    use_case: "Translation, Content Adaptation, Localization",
    json: {
      prompt_goal: "Dịch và chuyển thể nội dung một cách tự nhiên, giữ nguyên ý nghĩa và tone của văn bản gốc",
      target_audience: "Translator, Content creator, Marketing team làm việc với multiple markets",
      output_format: "Text được dịch + bảng so sánh thuật ngữ chuyên môn + notes về cultural adaptation",
      task: "Dịch văn bản từ ngôn ngữ nguồn sang ngôn ngữ đích, đồng thời adapt cho cultural context và target audience cụ thể. Giải thích các quyết định translation quan trọng.",
      persona: "Professional translator với background về linguistics và cultural studies, chuyên về business và technical translation",
      context: "Dịch thuật cho tài liệu business, marketing materials, hoặc technical documentation cần độ chính xác cao",
      constraints: [
        "Giữ nguyên tone và style của văn bản gốc",
        "Adapt cultural references cho target audience",
        "Explain các thuật ngữ chuyên môn không thể dịch trực tiếp",
        "Đưa ra alternative translations cho các cụm từ ambiguous",
        "Format: Original text + Translation + Notes"
      ],
      examples: `Input: "Translate this English business proposal to Vietnamese for a formal B2B context"\n\nExpected Output:\n## Văn bản đã dịch\n[Vietnamese translation]\n\n## Bảng thuật ngữ\n| English | Vietnamese | Notes |\n|---------|------------|-------|\n| ROI | ROI (Return on Investment) | Giữ nguyên do là thuật ngữ quốc tế |\n| Stakeholder | Các bên liên quan | Dịch để dễ hiểu hơn |\n\n## Cultural Adaptation Notes\n- Adjusted greeting style để phù hợp với business culture Việt Nam\n- Thêm honorific expressions để thể hiện tôn trọng\n- Modified timeline expressions theo format dd/mm/yyyy`,
      metadata: {
        created_at: "2025-01-05",
        version: "1.0",
        ai_model_recommendation: "claude-3-sonnet"
      }
    }
  }
];

interface PromptExamplesProps {
  onLoadExample: (example: PromptFormData) => void;
}

export function PromptExamples({ onLoadExample }: PromptExamplesProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  
  const PROMPT_EXAMPLES = getPromptExamples(t);

  const copyExampleJSON = async (example: PromptExample) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(example.json, null, 2));
      setCopiedExample(example.id);
      setTimeout(() => setCopiedExample(null), 2000);
      toast({
        title: t("prompts.examples.copyJson"),
        description: t("prompts.examples.copyJsonDesc"),
      });
    } catch (error) {
      toast({
        title: t("prompts.examples.copyError"),
        description: t("prompts.examples.copyErrorDesc"),
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <span>{t("prompts.examples.title")}</span>
        </CardTitle>
        <CardDescription>
          {t("prompts.examples.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="blog-content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blog-content" className="text-xs">
              <FileText className="w-4 h-4 mr-1" />
              {t("prompts.examples.blogTitle").split(' ')[0]} {/* Blog */}
            </TabsTrigger>
            <TabsTrigger value="code-analysis" className="text-xs">
              <Code className="w-4 h-4 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="translation-rewrite" className="text-xs">
              <Languages className="w-4 h-4 mr-1" />
              {t("prompts.examples.translationTitle").split(' ')[0]} {/* Translation */}
            </TabsTrigger>
          </TabsList>
          
          {PROMPT_EXAMPLES.map((example) => (
            <TabsContent key={example.id} value={example.id} className="mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{example.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{example.description}</p>
                  <Badge variant="secondary">{example.use_case}</Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{t("prompts.examples.highlights")}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>{t("prompts.examples.goal")}</strong> {example.json.prompt_goal.substring(0, 100)}...</li>
                    <li>• <strong>{t("prompts.examples.audience")}</strong> {example.json.target_audience}</li>
                    <li>• <strong>{t("prompts.examples.format")}</strong> {example.json.output_format}</li>
                    <li>• <strong>{t("prompts.examples.constraints")}</strong> {t("prompts.examples.constraintsCount", { count: example.json.constraints.length })}</li>
                  </ul>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onLoadExample(example.json)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("prompts.examples.loadToForm")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyExampleJSON(example)}
                  >
                    {copiedExample === example.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}