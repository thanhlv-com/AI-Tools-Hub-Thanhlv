import { JSONPrompt, CopyFormat } from "@/types/prompt";

// Format conversion functions
export const formatToJSON = (prompt: JSONPrompt): string => {
  return JSON.stringify(prompt, null, 2);
};

export const formatToPlainText = (prompt: JSONPrompt): string => {
  const sections = [
    `MỤC TIÊU: ${prompt.prompt_goal}`,
    `ĐỐI TƯỢNG: ${prompt.target_audience}`,
    `ĐỊNH DẠNG: ${prompt.output_format}`,
    `NHIỆM VỤ: ${prompt.task}`,
    `VAI TRÒ: ${prompt.persona}`,
    `BỐI CẢNH: ${prompt.context}`,
  ];

  if (prompt.constraints && prompt.constraints.length > 0) {
    sections.push(`RÀNG BUỘC:\n${prompt.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`);
  }

  if (prompt.examples) {
    sections.push(`VÍ DỤ: ${prompt.examples}`);
  }

  sections.push(`\n--- METADATA ---`);
  sections.push(`Ngày tạo: ${prompt.metadata.created_at}`);
  sections.push(`Phiên bản: ${prompt.metadata.version}`);
  sections.push(`Model đề xuất: ${prompt.metadata.ai_model_recommendation}`);

  return sections.join('\n\n');
};

export const formatToMarkdown = (prompt: JSONPrompt): string => {
  let markdown = `# AI Prompt\n\n`;
  
  markdown += `## 🎯 Mục tiêu\n${prompt.prompt_goal}\n\n`;
  markdown += `## 👥 Đối tượng mục tiêu\n${prompt.target_audience}\n\n`;
  markdown += `## 📄 Định dạng đầu ra\n${prompt.output_format}\n\n`;
  markdown += `## ✅ Nhiệm vụ cụ thể\n${prompt.task}\n\n`;
  markdown += `## 👤 Vai trò/Persona\n${prompt.persona}\n\n`;
  markdown += `## 📝 Bối cảnh\n${prompt.context}\n\n`;
  
  if (prompt.constraints && prompt.constraints.length > 0) {
    markdown += `## ⚠️ Ràng buộc\n`;
    prompt.constraints.forEach((constraint, index) => {
      markdown += `${index + 1}. ${constraint}\n`;
    });
    markdown += '\n';
  }
  
  if (prompt.examples) {
    markdown += `## 💡 Ví dụ\n${prompt.examples}\n\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `### 📊 Metadata\n`;
  markdown += `- **Ngày tạo**: ${prompt.metadata.created_at}\n`;
  markdown += `- **Phiên bản**: ${prompt.metadata.version}\n`;
  markdown += `- **Model đề xuất**: ${prompt.metadata.ai_model_recommendation}\n`;
  
  return markdown;
};

export const formatToYAML = (prompt: JSONPrompt): string => {
  const yamlLines = [
    'prompt:',
    `  goal: "${prompt.prompt_goal.replace(/"/g, '\\"')}"`,
    `  target_audience: "${prompt.target_audience.replace(/"/g, '\\"')}"`,
    `  output_format: "${prompt.output_format.replace(/"/g, '\\"')}"`,
    `  task: "${prompt.task.replace(/"/g, '\\"')}"`,
    `  persona: "${prompt.persona.replace(/"/g, '\\"')}"`,
    `  context: "${prompt.context.replace(/"/g, '\\"')}"`,
  ];

  if (prompt.constraints && prompt.constraints.length > 0) {
    yamlLines.push('  constraints:');
    prompt.constraints.forEach(constraint => {
      yamlLines.push(`    - "${constraint.replace(/"/g, '\\"')}"`);
    });
  }

  if (prompt.examples) {
    yamlLines.push(`  examples: "${prompt.examples.replace(/"/g, '\\"')}"`);
  }

  yamlLines.push('  metadata:');
  yamlLines.push(`    created_at: "${prompt.metadata.created_at}"`);
  yamlLines.push(`    version: "${prompt.metadata.version}"`);
  yamlLines.push(`    ai_model_recommendation: "${prompt.metadata.ai_model_recommendation}"`);

  return yamlLines.join('\n');
};

export const formatToCSV = (prompt: JSONPrompt): string => {
  const escapeCSV = (text: string) => `"${text.replace(/"/g, '""')}"`;
  
  const headers = [
    'Field',
    'Value'
  ];

  const rows = [
    ['Mục tiêu', prompt.prompt_goal],
    ['Đối tượng mục tiêu', prompt.target_audience],
    ['Định dạng đầu ra', prompt.output_format],
    ['Nhiệm vụ', prompt.task],
    ['Vai trò/Persona', prompt.persona],
    ['Bối cảnh', prompt.context],
    ['Ràng buộc', prompt.constraints ? prompt.constraints.join('; ') : ''],
    ['Ví dụ', prompt.examples || ''],
    ['Ngày tạo', prompt.metadata.created_at],
    ['Phiên bản', prompt.metadata.version],
    ['Model đề xuất', prompt.metadata.ai_model_recommendation]
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
};

export const formatToXML = (prompt: JSONPrompt): string => {
  const escapeXML = (text: string) => 
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<prompt>\n';
  xml += `  <goal>${escapeXML(prompt.prompt_goal)}</goal>\n`;
  xml += `  <target_audience>${escapeXML(prompt.target_audience)}</target_audience>\n`;
  xml += `  <output_format>${escapeXML(prompt.output_format)}</output_format>\n`;
  xml += `  <task>${escapeXML(prompt.task)}</task>\n`;
  xml += `  <persona>${escapeXML(prompt.persona)}</persona>\n`;
  xml += `  <context>${escapeXML(prompt.context)}</context>\n`;
  
  if (prompt.constraints && prompt.constraints.length > 0) {
    xml += '  <constraints>\n';
    prompt.constraints.forEach(constraint => {
      xml += `    <constraint>${escapeXML(constraint)}</constraint>\n`;
    });
    xml += '  </constraints>\n';
  }
  
  if (prompt.examples) {
    xml += `  <examples>${escapeXML(prompt.examples)}</examples>\n`;
  }
  
  xml += '  <metadata>\n';
  xml += `    <created_at>${escapeXML(prompt.metadata.created_at)}</created_at>\n`;
  xml += `    <version>${escapeXML(prompt.metadata.version)}</version>\n`;
  xml += `    <ai_model_recommendation>${escapeXML(prompt.metadata.ai_model_recommendation)}</ai_model_recommendation>\n`;
  xml += '  </metadata>\n';
  xml += '</prompt>';
  
  return xml;
};

// Copy format configurations
export const COPY_FORMATS: CopyFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Structured JSON format for APIs and programming',
    icon: '{}',
    format: formatToJSON
  },
  {
    id: 'plain',
    name: 'Plain Text',
    description: 'Simple text format for easy reading',
    icon: '📄',
    format: formatToPlainText
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Formatted text for documentation and blogs',
    icon: '📝',
    format: formatToMarkdown
  },
  {
    id: 'yaml',
    name: 'YAML',
    description: 'Human-readable data format',
    icon: '📋',
    format: formatToYAML
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Spreadsheet-compatible tabular format',
    icon: '📊',
    format: formatToCSV
  },
  {
    id: 'xml',
    name: 'XML',
    description: 'Structured markup language format',
    icon: '🏷️',
    format: formatToXML
  }
];

// Utility function to get format by ID
export const getFormatById = (id: string): CopyFormat | undefined => {
  return COPY_FORMATS.find(format => format.id === id);
};