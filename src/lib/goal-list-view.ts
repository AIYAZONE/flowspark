export type GoalListViewGoal = {
  id: string
  title: string
  description?: string | null
  start_date: string
  end_date: string
  status: string
  priority?: string | null
  category?: string | null
  is_starred?: boolean | null
}

type GoalListViewModelParams = {
  goals: GoalListViewGoal[]
  search: string
  statusFilter: string
}

type GoalStatusRank = Record<string, number>
type GoalPriorityRank = Record<string, number>

const statusRank: GoalStatusRank = {
  active: 3,
  completed: 2,
  abandoned: 1,
}

const priorityRank: GoalPriorityRank = {
  high: 3,
  medium: 2,
  low: 1,
}

function compareGoalListItems(a: GoalListViewGoal, b: GoalListViewGoal) {
  const starredA = a.is_starred ? 1 : 0
  const starredB = b.is_starred ? 1 : 0
  if (starredA !== starredB) return starredB - starredA

  const statusA = statusRank[a.status] ?? 0
  const statusB = statusRank[b.status] ?? 0
  if (statusA !== statusB) return statusB - statusA

  const priorityA = priorityRank[a.priority || 'medium'] ?? 2
  const priorityB = priorityRank[b.priority || 'medium'] ?? 2
  if (priorityA !== priorityB) return priorityB - priorityA

  if (a.end_date !== b.end_date) return a.end_date.localeCompare(b.end_date)
  if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date)
  return a.title.localeCompare(b.title)
}

export function buildGoalListViewModel({ goals, search, statusFilter }: GoalListViewModelParams) {
  const normalizedSearch = search.trim().toLowerCase()

  let filteredGoals = [...goals]

  if (normalizedSearch) {
    filteredGoals = filteredGoals.filter((goal) => {
      const title = goal.title.toLowerCase()
      const description = (goal.description || '').toLowerCase()
      return title.includes(normalizedSearch) || description.includes(normalizedSearch)
    })
  }

  if (statusFilter !== 'all') {
    filteredGoals = filteredGoals.filter((goal) => goal.status === statusFilter)
  }

  const sortedGoals = filteredGoals.sort(compareGoalListItems)
  const mainGoals = sortedGoals.filter((goal) => goal.status !== 'archived')
  const archivedGoals = sortedGoals.filter((goal) => goal.status === 'archived')

  return {
    mainGoals,
    archivedGoals,
    totalGoals: mainGoals.length + archivedGoals.length,
  }
}
