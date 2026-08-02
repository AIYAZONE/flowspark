// 纯类型与常量，不依赖任何服务端模块，供客户端组件安全 import。
export type PersonaCategory =
  | 'strength'
  | 'value'
  | 'experience'
  | 'aspiration'
  | 'aversion'
  | 'context'
  | 'reflection'

export type PersonaConfidence = 'low' | 'medium' | 'high'
export type PersonaSource = 'chat' | 'manual' | 'inferred' | 'import'

export interface UserPersona {
  id: string
  user_id: string
  category: PersonaCategory
  title: string
  detail: string | null
  source: PersonaSource
  confidence: PersonaConfidence
  created_at: string
  updated_at: string
}

export const PERSONA_CATEGORY_LABELS: Record<PersonaCategory, string> = {
  strength: '优势',
  value: '价值观',
  experience: '经历',
  aspiration: '想成为的人',
  aversion: '抗拒点',
  context: '背景上下文',
  reflection: '复盘洞察',
}

export const PERSONA_CONFIDENCE_LABELS: Record<PersonaConfidence, string> = {
  low: '低',
  medium: '中',
  high: '高',
}
