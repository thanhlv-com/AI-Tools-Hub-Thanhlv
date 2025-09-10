import { TemplateType, TemplateStyle, TemplateTone } from "@/types/confluence";

export const TEMPLATE_TYPES: TemplateType[] = [
  {
    id: "project-documentation",
    name: "Project Documentation",
    description: "Comprehensive project documentation template",
    defaultStructure: [
      "Project Overview",
      "Goals and Objectives", 
      "Requirements",
      "Architecture",
      "Implementation Plan",
      "Testing Strategy",
      "Deployment Guide",
      "Maintenance"
    ]
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Structured meeting documentation template",
    defaultStructure: [
      "Meeting Information",
      "Attendees",
      "Agenda",
      "Discussion Points",
      "Decisions Made",
      "Action Items",
      "Next Steps"
    ]
  },
  {
    id: "process-documentation",
    name: "Process Documentation",
    description: "Standard operating procedures template",
    defaultStructure: [
      "Process Overview",
      "Purpose and Scope",
      "Roles and Responsibilities",
      "Step-by-Step Procedures",
      "Tools and Resources",
      "Quality Checks",
      "Troubleshooting"
    ]
  },
  {
    id: "technical-specification",
    name: "Technical Specification",
    description: "Detailed technical requirements and specifications",
    defaultStructure: [
      "Executive Summary",
      "System Requirements",
      "Technical Architecture",
      "API Specifications",
      "Database Design",
      "Security Considerations",
      "Performance Requirements",
      "Testing Criteria"
    ]
  },
  {
    id: "user-guide",
    name: "User Guide",
    description: "End-user documentation and tutorials",
    defaultStructure: [
      "Getting Started",
      "System Requirements",
      "Installation Guide",
      "Basic Features",
      "Advanced Features",
      "Troubleshooting",
      "FAQ",
      "Support Information"
    ]
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base Article",
    description: "Knowledge sharing and documentation template",
    defaultStructure: [
      "Article Summary",
      "Problem Description",
      "Solution Overview",
      "Detailed Steps",
      "Examples",
      "Related Articles",
      "Additional Resources"
    ]
  },
  {
    id: "release-notes",
    name: "Release Notes",
    description: "Software release documentation template",
    defaultStructure: [
      "Release Information",
      "New Features",
      "Improvements",
      "Bug Fixes",
      "Breaking Changes",
      "Migration Guide",
      "Known Issues"
    ]
  },
  {
    id: "training-material",
    name: "Training Material",
    description: "Educational content and training documentation",
    defaultStructure: [
      "Learning Objectives",
      "Prerequisites",
      "Course Overview",
      "Modules",
      "Hands-on Exercises",
      "Assessment",
      "Additional Resources"
    ]
  }
];

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Formal, business-appropriate tone and structure"
  },
  {
    id: "casual",
    name: "Casual",
    description: "Relaxed, friendly tone with accessible language"
  },
  {
    id: "technical",
    name: "Technical",
    description: "Detailed, precise language for technical audiences"
  },
  {
    id: "educational",
    name: "Educational",
    description: "Clear, instructional style for learning materials"
  },
  {
    id: "concise",
    name: "Concise",
    description: "Brief, to-the-point content with minimal fluff"
  },
  {
    id: "comprehensive",
    name: "Comprehensive",
    description: "Thorough, detailed coverage of all aspects"
  }
];

export const TEMPLATE_TONES: TemplateTone[] = [
  {
    id: "formal",
    name: "Formal",
    description: "Official, professional communication style"
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, approachable, and conversational"
  },
  {
    id: "authoritative",
    name: "Authoritative",
    description: "Confident, expert-level communication"
  },
  {
    id: "helpful",
    name: "Helpful",
    description: "Supportive, guidance-oriented approach"
  },
  {
    id: "neutral",
    name: "Neutral",
    description: "Balanced, objective, and unbiased tone"
  },
  {
    id: "enthusiastic",
    name: "Enthusiastic",
    description: "Energetic, positive, and engaging style"
  }
];