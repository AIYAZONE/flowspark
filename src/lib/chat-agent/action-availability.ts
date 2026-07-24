export function filterExecutableActionsForToday<T extends { start_date: string | null }>(params: {
  actions: T[]
  today: string
}) {
  return params.actions.filter((action) => {
    const startDate = action.start_date || ''
    if (!startDate) return true
    return startDate <= params.today
  })
}
