export const COPYRIGHT_START_YEAR = 2025

export function formatCopyrightYearRange(
  startYear: number,
  currentYear: number = new Date().getFullYear()
): string {
  if (currentYear <= startYear) {
    return `${startYear}`
  }

  return `${startYear}–${currentYear}`
}
