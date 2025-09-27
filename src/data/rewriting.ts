import { WritingStyle, WritingTone, WritingLength, WritingComplexity } from "@/types/rewriting";
import { LANGUAGES } from "@/data/translation";

export const WRITING_STYLES: WritingStyle[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clear, formal, and business-appropriate tone",
    icon: "💼",
    prompt: "Rewrite in a professional, business-appropriate style with clear and formal language."
  },
  {
    id: "casual",
    name: "Casual",
    description: "Relaxed, conversational, and friendly tone",
    icon: "😊",
    prompt: "Rewrite in a casual, conversational style that feels friendly and approachable."
  },
  {
    id: "academic",
    name: "Academic",
    description: "Scholarly, research-oriented, and formal style",
    icon: "🎓",
    prompt: "Rewrite in an academic style with scholarly language, proper citations structure, and formal tone."
  },
  {
    id: "creative",
    name: "Creative",
    description: "Imaginative, engaging, and expressive writing",
    icon: "🎨",
    prompt: "Rewrite in a creative style with imaginative language, engaging descriptions, and expressive tone."
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precise, detailed, and specification-focused",
    icon: "⚙️",
    prompt: "Rewrite in a technical style with precise terminology, detailed explanations, and specification-focused language."
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Persuasive, compelling, and action-oriented",
    icon: "📢",
    prompt: "Rewrite in a marketing style with persuasive language, compelling messaging, and action-oriented tone."
  },
  {
    id: "journalistic",
    name: "Journalistic",
    description: "Objective, factual, and news-style reporting",
    icon: "📰",
    prompt: "Rewrite in a journalistic style with objective reporting, factual presentation, and news-appropriate tone."
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Narrative-driven, engaging, and descriptive",
    icon: "📚",
    prompt: "Rewrite in a storytelling style with narrative flow, engaging descriptions, and compelling structure."
  },
  {
    id: "romantic",
    name: "Romantic",
    description: "Emotionally rich, intimate, and relationship-focused",
    icon: "💕",
    prompt: "Rewrite in a romantic style with emotional depth, intimate expressions, and focus on relationships and connections between people."
  },
  {
    id: "poetic",
    name: "Poetic",
    description: "Lyrical, metaphorical, and beautifully expressive",
    icon: "🌸",
    prompt: "Rewrite in a poetic style with lyrical language, metaphors, beautiful imagery, and emotional resonance."
  },
  {
    id: "dramatic",
    name: "Dramatic",
    description: "Intense, emotional, and theatrically engaging",
    icon: "🎭",
    prompt: "Rewrite in a dramatic style with intense emotions, theatrical elements, and powerful emotional impact."
  },
  {
    id: "philosophical",
    name: "Philosophical",
    description: "Thoughtful, introspective, and intellectually deep",
    icon: "🤔",
    prompt: "Rewrite in a philosophical style with deep thinking, introspective analysis, and exploration of life's deeper meanings."
  },
  {
    id: "conversational",
    name: "Conversational",
    description: "Natural dialogue-focused and relationship-oriented",
    icon: "💬",
    prompt: "Rewrite in a conversational style that focuses on natural dialogue, interpersonal dynamics, and realistic human interactions."
  }
];

export const WRITING_TONES: WritingTone[] = [
  {
    id: "neutral",
    name: "Neutral",
    description: "Balanced and objective tone",
    icon: "⚖️",
    prompt: "Use a neutral, balanced tone that is objective and even-handed."
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, welcoming, and approachable",
    icon: "🤝",
    prompt: "Use a friendly, warm tone that is welcoming and approachable."
  },
  {
    id: "authoritative",
    name: "Authoritative",
    description: "Confident, expert, and commanding",
    icon: "👑",
    prompt: "Use an authoritative tone that demonstrates confidence and expertise."
  },
  {
    id: "enthusiastic",
    name: "Enthusiastic",
    description: "Energetic, excited, and passionate",
    icon: "🔥",
    prompt: "Use an enthusiastic tone that conveys energy, excitement, and passion."
  },
  {
    id: "empathetic",
    name: "Empathetic",
    description: "Understanding, caring, and supportive",
    icon: "❤️",
    prompt: "Use an empathetic tone that shows understanding, care, and support."
  },
  {
    id: "humorous",
    name: "Humorous",
    description: "Light-hearted, witty, and entertaining",
    icon: "😄",
    prompt: "Use a humorous tone with appropriate wit and light-hearted elements."
  },
  {
    id: "urgent",
    name: "Urgent",
    description: "Immediate, pressing, and time-sensitive",
    icon: "⚡",
    prompt: "Use an urgent tone that conveys immediacy and time-sensitivity."
  },
  {
    id: "inspirational",
    name: "Inspirational",
    description: "Motivating, uplifting, and encouraging",
    icon: "🌟",
    prompt: "Use an inspirational tone that motivates, uplifts, and encourages action."
  },
  {
    id: "passionate",
    name: "Passionate",
    description: "Intense, fervent, and emotionally charged",
    icon: "🔥",
    prompt: "Use a passionate tone that conveys intense emotions, fervor, and deep emotional connection."
  },
  {
    id: "tender",
    name: "Tender",
    description: "Gentle, loving, and emotionally sensitive",
    icon: "🤗",
    prompt: "Use a tender tone that is gentle, loving, caring, and emotionally sensitive to relationships and feelings."
  },
  {
    id: "melancholic",
    name: "Melancholic",
    description: "Wistful, reflective, and bittersweet",
    icon: "🌙",
    prompt: "Use a melancholic tone that conveys wistfulness, deep reflection, and bittersweet emotions."
  },
  {
    id: "intimate",
    name: "Intimate",
    description: "Close, personal, and emotionally connected",
    icon: "💝",
    prompt: "Use an intimate tone that feels close, personal, and creates emotional connection between people."
  }
];

export const WRITING_LENGTHS: WritingLength[] = [
  {
    id: "much-shorter",
    name: "Much Shorter",
    description: "Significantly condense the content (50% or less)",
    icon: "📝",
    multiplier: 0.5,
    prompt: "Significantly shorten the text to about 50% or less of the original length while keeping key information."
  },
  {
    id: "shorter",
    name: "Shorter",
    description: "Condense the content (about 75% of original)",
    icon: "✂️",
    multiplier: 0.75,
    prompt: "Shorten the text to about 75% of the original length while maintaining important details."
  },
  {
    id: "same",
    name: "Same Length",
    description: "Keep approximately the same length",
    icon: "↔️",
    multiplier: 1.0,
    prompt: "Maintain approximately the same length as the original text."
  },
  {
    id: "longer",
    name: "Longer",
    description: "Expand the content (about 125% of original)",
    icon: "📄",
    multiplier: 1.25,
    prompt: "Expand the text to about 125% of the original length with additional details and explanations."
  },
  {
    id: "much-longer",
    name: "Much Longer",
    description: "Significantly expand the content (150% or more)",
    icon: "📋",
    multiplier: 1.5,
    prompt: "Significantly expand the text to 150% or more of the original length with comprehensive details and examples."
  }
];

export const WRITING_COMPLEXITIES: WritingComplexity[] = [
  {
    id: "simple",
    name: "Simple",
    description: "Easy to understand, basic vocabulary",
    icon: "🟢",
    level: "Elementary",
    prompt: "Use simple language with basic vocabulary that is easy to understand for a general audience."
  },
  {
    id: "moderate",
    name: "Moderate",
    description: "Balanced complexity, accessible to most readers",
    icon: "🟡",
    level: "Intermediate",
    prompt: "Use moderate complexity with balanced vocabulary that is accessible to most readers."
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Sophisticated language, specialized terminology",
    icon: "🟠",
    level: "Advanced",
    prompt: "Use advanced language with sophisticated vocabulary and specialized terminology appropriate for expert audiences."
  },
  {
    id: "expert",
    name: "Expert",
    description: "Highly technical, industry-specific language",
    icon: "🔴",
    level: "Expert",
    prompt: "Use expert-level language with highly technical and industry-specific terminology for specialist audiences."
  }
];

// Output languages for rewriting - includes "keep original" option plus all translation languages
export const OUTPUT_LANGUAGES = [
  { code: "original", name: "Keep Original Language", nativeName: "Keep Original", flag: "🔄" },
  ...LANGUAGES.filter(lang => lang.code !== "auto") // Exclude auto-detect for output
];