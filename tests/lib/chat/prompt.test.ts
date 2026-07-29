import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildChatSystemPrompt } from '../../../src/lib/chat/prompt.ts'
import type { ChatContext } from '../../../src/lib/chat/context.ts'
import type {
  SelfModelCard,
  SelfModelSignalSummary,
  TodayPersonalization
} from '../../../src/lib/self-model.ts'

// P3 自检：验证"人生系统大脑"确实被渲染进聊天系统提示词。
// 这是「自用验收」的可复现闸门——只要本测试通过，就能确认 chat 不再是 todolist 壳。

function makeFullContext(): ChatContext {
  const cards: SelfModelCard[] = [
    {
      key: 'rhythm',
      label: '节奏',
      title: '深耕期',
      body: '你偏好长时间专注单一主题。',
      evidence: '近 7 天 20m 选项占比高。',
      todayEffect: '今天适合安排一段不被打断的深耕。'
    },
    {
      key: 'decision',
      label: '决策',
      title: '谨慎推进者',
      body: '重大决定前会反复权衡。',
      evidence: '完成率与采纳率双高。',
      todayEffect: '给结论时附上权衡依据。'
    }
  ]
  const today: TodayPersonalization = {
    eyebrow: '今日解读',
    title: '连续第 5 天在推进',
    body: '节奏稳定，注意别在晚上透支。'
  }
  const signals: SelfModelSignalSummary = {
    shortSelectionCount: 1,
    longSelectionCount: 4,
    adoptedRecentCount: 3,
    completedRecentCount: 2,
    topFeedbackLabel: 'not_fit_tone'
  }
  return {
    goals: [
      { title: '写好人生系统', category: '自我', priority: 'high' },
      { title: '每周复盘', category: null, priority: null }
    ],
    todayActions: [
      { title: '推进 Self Model 接入', type: 'core', priority: 'medium' },
      { title: '写周报', type: null, priority: 'low' }
    ],
    today: '2026-07-29',
    selfModelCards: cards,
    todayPersonalization: today,
    streak: { currentStreak: 5, longestStreak: 12, completedToday: true },
    preferences: ['回复保持短', '不要主动复述偏好'],
    signals
  }
}

test('full context renders all enrichment sections (brain is plugged in)', () => {
  const prompt = buildChatSystemPrompt({ context: makeFullContext(), locale: 'zh' })

  // 基础框架
  assert.match(prompt, /【当前系统上下文】/)
  assert.match(prompt, /进行中的路径（目标）/)
  assert.match(prompt, /今天可执行/)

  // P0 个性化上下文全部就位
  assert.match(prompt, /连续 5 天（最长 12 天）/)
  assert.match(prompt, /已完成至少一个行动/)
  assert.match(prompt, /回复保持短、不要主动复述偏好/)
  assert.match(prompt, /近 7 天 AI 建议：被采纳 3 条，已完成 2 条/)
  assert.match(prompt, /用户最常反馈「not_fit_tone」/)

  // Self Model 画像
  assert.match(prompt, /【人生系统画像（Self Model）】/)
  assert.match(prompt, /【节奏】深耕期/)
  assert.match(prompt, /【决策】谨慎推进者/)
  assert.match(prompt, /今天影响：今天适合安排一段不被打断的深耕/)

  // 今日系统解读
  assert.match(prompt, /【今日系统解读】/)
  assert.match(prompt, /【今日解读】连续第 5 天在推进/)
})

test('English locale renders english framing without crashing', () => {
  const prompt = buildChatSystemPrompt({ context: makeFullContext(), locale: 'en' })
  assert.match(prompt, /Respond in English/)
  assert.match(prompt, /Life OS/)
})

test('degraded context still renders (no data must not break chat)', () => {
  const empty: ChatContext = {
    goals: [],
    todayActions: [],
    today: '2026-07-29',
    selfModelCards: [],
    todayPersonalization: null,
    streak: { currentStreak: 0, longestStreak: 0, completedToday: false },
    preferences: [],
    signals: {
      shortSelectionCount: 0,
      longSelectionCount: 0,
      adoptedRecentCount: 0,
      completedRecentCount: 0,
      topFeedbackLabel: null
    }
  }
  const prompt = buildChatSystemPrompt({ context: empty, locale: 'zh' })
  assert.match(prompt, /（暂无进行中的路径）/)
  assert.match(prompt, /（今天暂无待推进的行动）/)
  assert.match(prompt, /（暂无画像数据）/)
  assert.match(prompt, /（暂无）/)
  assert.match(prompt, /连续 0 天（最长 0 天）/)
  assert.match(prompt, /（暂无）/)
})
