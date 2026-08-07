import type {
  ContentIdea,
  ContentIdeaStatus,
  ContentCalendarEntry,
} from '@/lib/contentBrand'
import type {
  ContentAsset,
  ContentAssetKind,
  CreatorDimension,
} from '@/lib/contentAsset'

// PROTO: 原型阶段使用的本地假数据。确认方向后由 actions.ts + /api/brand-studio/* 真实读写替换。

// 账号矩阵：同一 IP 下跨平台 / 跨账号经营。platform 字段存「账号标识」而非笼统平台名。
export interface AccountProfile {
  id: string
  name: string // 账号标识，例如「视频号·东方经典」
  platform: '视频号' | '公众号' | '小红书' | '抖音' | '播客' | 'B站'
  tone: string // 该账号的内容调性
  isPrimary?: boolean
  publishedTotal: number
}

export interface BrandStudioMock {
  ideas: ContentIdea[]
  calendar: ContentCalendarEntry[]
  assets: ContentAsset[]
  dimensions: CreatorDimension[]
  accounts: AccountProfile[]
  positioning: {
    summary: string
    pillars: string[]
  }
}

const now = new Date()
function daysFromNow(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}
function isoDate(n: number): string {
  return daysFromNow(n).slice(0, 10)
}

const STATUS: ContentIdeaStatus[] = ['idea', 'approved', 'produced', 'published', 'archived']

function idea(
  id: string,
  title: string,
  angle: string,
  hook: string,
  notes: string,
  status: ContentIdeaStatus,
  score: number,
  age: number,
  upd: number
): ContentIdea {
  return {
    id,
    user_id: 'mock',
    title,
    angle,
    hook,
    notes,
    raw_markdown: `## 钩子\n${hook}\n\n## 正文\n${notes}`,
    status,
    persona_check_score: score,
    source: 'manual',
    created_at: daysFromNow(age),
    updated_at: daysFromNow(upd),
  }
}

export const brandStudioMock: BrandStudioMock = {
  positioning: {
    summary:
      '以「东方经典 × 现代生活」为内核的知识型 IP：用通俗语言重述《心经》《长短经》等经典，帮助都市人建立内在秩序与决策智慧。',
    pillars: ['经典重述', '决策智慧', '内在秩序', '生活应用'],
  },
  ideas: [
    idea('idea-1', '《心经》260字，到底在讲什么？', '用一张图讲清「色即是空」', '你背了十年心经，可能一直理解反了', '从「照见五蕴皆空」破题，拆解焦虑来源。', 'published', 0.92, -21, -18),
    idea('idea-2', '《长短经》教我的 3 个识人术', '领导怎么快速看穿一个人', '曾国藩和赵蕤，用的是同一套底层逻辑', '对比「貌」「言」「事」三层识人法。', 'produced', 0.81, -14, -6),
    idea('idea-3', '把《论语》变成你的晨间仪式', '每天一句，重建生活节奏', '不读经的人，正在被算法安排一天', '设计 7 天论语晨间打卡模板。', 'approved', 0.74, -9, -3),
    idea('idea-4', '用《道德经》解释「内卷」', '反者道之动，卷到极致会反转', '老子在 2500 年前就预言了 996', '用「柔弱胜刚强」重新解读竞争策略。', 'idea', 0.68, -5, -5),
    idea('idea-5', '《资治通鉴》里的 5 个失败决策', '大佬是怎么把一手好牌打烂的', '历史不会重复，但会押韵', '拆解 5 个著名翻车案例，提炼决策清单。', 'idea', 0.71, -4, -4),
    idea('idea-6', '禅修 5 分钟，比刷手机更解压', '一个能上班偷懒做的练习', '老板以为你在发呆，其实你在重置', '录制引导式呼吸音频，配图文步骤。', 'approved', 0.79, -7, -2),
    idea('idea-7', '《易经》不是算命，是决策框架', '用变易思维做选择题', '你以为的玄学，其实是贝叶斯', '把「变易／简易／不易」映射到日常决策。', 'archived', 0.55, -30, -20),
    idea('idea-8', '周末读书会 vlog 脚本', '把书房变成内容资产', '一个人的书房，正在被一万个人围观', '记录一期线下读书会的真实剪辑。', 'published', 0.86, -12, -10),
  ],
  calendar: [
    { id: 'cal-1', user_id: 'mock', idea_id: 'idea-1', planned_date: isoDate(-3), platform: '视频号·东方经典', status: 'published', note: '心经拆解正片发布', created_at: daysFromNow(-10), updated_at: daysFromNow(-10) },
    { id: 'cal-2', user_id: 'mock', idea_id: 'idea-8', planned_date: isoDate(-1), platform: '视频号·东方经典', status: 'published', note: '读书会 vlog 发布', created_at: daysFromNow(-8), updated_at: daysFromNow(-8) },
    { id: 'cal-3', user_id: 'mock', idea_id: 'idea-2', planned_date: isoDate(1), platform: '公众号·深度长文', status: 'planned', note: '识人术长图文', created_at: daysFromNow(-6), updated_at: daysFromNow(-6) },
    { id: 'cal-4', user_id: 'mock', idea_id: 'idea-3', planned_date: isoDate(2), platform: '小红书·图文卡片', status: 'planned', note: '论语晨间打卡预告', created_at: daysFromNow(-3), updated_at: daysFromNow(-3) },
    { id: 'cal-5', user_id: 'mock', idea_id: 'idea-6', planned_date: isoDate(4), platform: '播客·内在秩序', status: 'planned', note: '禅修引导音频上线', created_at: daysFromNow(-2), updated_at: daysFromNow(-2) },
    { id: 'cal-6', user_id: 'mock', idea_id: null, planned_date: isoDate(5), platform: '抖音·金句短视频', status: 'planned', note: '本周直播：回答粉丝经典疑问', created_at: daysFromNow(-1), updated_at: daysFromNow(-1) },
  ],
  assets: [
    { id: 'asset-1', user_id: 'mock', folder_id: 'f1', kind: 'strategy', title: '心经拆解主视觉', summary: '260字心经竖排长图，水墨风格', body_markdown: null, status: 'published', source: 'manual', chat_session_id: null, tags: ['心经', '视觉'], created_at: daysFromNow(-18), updated_at: daysFromNow(-18) },
    { id: 'asset-2', user_id: 'mock', folder_id: 'f2', kind: 'data', title: '识人术录音原档', summary: '棚录 18 分钟，待剪辑', body_markdown: null, status: 'captured', source: 'manual', chat_session_id: null, tags: ['长短经', '识人'], created_at: daysFromNow(-6), updated_at: daysFromNow(-6) },
    { id: 'asset-3', user_id: 'mock', folder_id: 'f3', kind: 'tool', title: '论语晨间打卡模板', summary: '7 天图文卡片 Figma 源文件', body_markdown: null, status: 'refined', source: 'manual', chat_session_id: null, tags: ['论语', '模板'], created_at: daysFromNow(-3), updated_at: daysFromNow(-3) },
    { id: 'asset-4', user_id: 'mock', folder_id: 'f1', kind: 'other', title: '读书会 vlog 成片', summary: '4 分 12 秒，已发布视频号', body_markdown: null, status: 'published', source: 'manual', chat_session_id: null, tags: ['vlog'], created_at: daysFromNow(-10), updated_at: daysFromNow(-10) },
    { id: 'asset-5', user_id: 'mock', folder_id: 'f4', kind: 'note', title: '禅修引导词参考', summary: '外部冥想引导文章集合', body_markdown: null, status: 'captured', source: 'link', chat_session_id: null, tags: ['禅修'], created_at: daysFromNow(-2), updated_at: daysFromNow(-2) },
  ],
  dimensions: [
    { name: '经典重述', goalCount: 3, assetCount: 4, goals: [{ id: 'g1', title: '读经典', status: 'active' }], assets: [{ id: 'a1', name: '心经拆解主视觉', kind: 'strategy' }] },
    { name: '决策智慧', goalCount: 2, assetCount: 3, goals: [{ id: 'g2', title: '识人术', status: 'active' }], assets: [{ id: 'a2', name: '识人术录音原档', kind: 'data' }] },
    { name: '内在秩序', goalCount: 1, assetCount: 2, goals: [{ id: 'g3', title: '禅修练习', status: 'active' }], assets: [{ id: 'a5', name: '禅修引导词参考', kind: 'note' }] },
    { name: '生活应用', goalCount: 2, assetCount: 3, goals: [{ id: 'g4', title: '晨间仪式', status: 'active' }], assets: [{ id: 'a3', name: '论语晨间打卡模板', kind: 'tool' }] },
  ],
  accounts: [
    { id: 'acc-1', name: '视频号·东方经典', platform: '视频号', tone: '竖屏讲解 · 经典拆解正片', isPrimary: true, publishedTotal: 42 },
    { id: 'acc-2', name: '公众号·深度长文', platform: '公众号', tone: '长图文 · 决策智慧深度稿', publishedTotal: 18 },
    { id: 'acc-3', name: '小红书·图文卡片', platform: '小红书', tone: '卡片图文 · 晨间仪式打卡', publishedTotal: 27 },
    { id: 'acc-4', name: '播客·内在秩序', platform: '播客', tone: '音频引导 · 禅修与内在整理', publishedTotal: 9 },
    { id: 'acc-5', name: '抖音·金句短视频', platform: '抖音', tone: '15s 金句 · 经典反差梗', publishedTotal: 35 },
  ],
}

export const MOCK_IDEA_STATUSES = STATUS
