import type { DraftGoalCandidate } from './types.ts'

export type GoalLite = { id: string; title: string }

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function pickTopGoalCandidates(params: {
  mainPath: GoalLite | null
  recentActive: GoalLite[]
  allGoals: GoalLite[]
  queryText: string
}): DraftGoalCandidate[] {
  const { mainPath, recentActive, allGoals, queryText } = params
  const picked: DraftGoalCandidate[] = []
  const seen = new Set<string>()

  if (mainPath) {
    picked.push({ id: mainPath.id, title: mainPath.title, reason: 'main_path' })
    seen.add(mainPath.id)
  }

  for (const g of recentActive) {
    if (picked.length >= 2) break
    if (seen.has(g.id)) continue
    picked.push({ id: g.id, title: g.title, reason: 'recent_active' })
    seen.add(g.id)
  }

  const q = normalize(queryText)
  if (q) {
    const matched = allGoals
      .map((g) => ({ goal: g, score: normalize(g.title).includes(q) ? 2 : 0 }))
      .filter((row) => row.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.goal.title.localeCompare(b.goal.title)
      )
      .map((row) => row.goal)

    for (const g of matched) {
      if (picked.length >= 3) break
      if (seen.has(g.id)) continue
      picked.push({ id: g.id, title: g.title, reason: 'text_match' })
      seen.add(g.id)
    }
  }

  for (const g of allGoals) {
    if (picked.length >= 3) break
    if (seen.has(g.id)) continue
    picked.push({ id: g.id, title: g.title, reason: 'recent_active' })
    seen.add(g.id)
  }

  return picked.slice(0, 3)
}
