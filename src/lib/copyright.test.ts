import test from 'node:test'
import assert from 'node:assert/strict'

import { formatCopyrightYearRange } from './copyright.ts'

test('formatCopyrightYearRange returns single year when currentYear equals startYear', () => {
  assert.equal(formatCopyrightYearRange(2025, 2025), '2025')
})

test('formatCopyrightYearRange returns range when currentYear is after startYear', () => {
  assert.equal(formatCopyrightYearRange(2025, 2026), '2025–2026')
})

test('formatCopyrightYearRange returns start year when currentYear is before startYear', () => {
  assert.equal(formatCopyrightYearRange(2025, 2024), '2025')
})
