import test from 'node:test'
import assert from 'node:assert/strict'

import { getTrajectoryLuxuryVariant } from './landing-trajectory-luxury.ts'

test('direction / rhythm / stability 各自映射到固定 luxury variant', () => {
  assert.deepEqual(getTrajectoryLuxuryVariant('direction'), {
    dotClass: 'bg-emerald-300/85',
    glowClass: 'shadow-[0_0_32px_rgba(110,231,183,0.18)]',
    dividerClass: 'via-emerald-200/18',
  })

  assert.deepEqual(getTrajectoryLuxuryVariant('rhythm'), {
    dotClass: 'bg-amber-200/85',
    glowClass: 'shadow-[0_0_32px_rgba(253,230,138,0.14)]',
    dividerClass: 'via-amber-100/18',
  })

  assert.deepEqual(getTrajectoryLuxuryVariant('stability'), {
    dotClass: 'bg-sky-300/85',
    glowClass: 'shadow-[0_0_32px_rgba(125,211,252,0.16)]',
    dividerClass: 'via-sky-200/18',
  })
})

test('luxury variant 保留分隔线与辉光语义，供组件做 premium signals', () => {
  const variant = getTrajectoryLuxuryVariant('direction')

  assert.match(variant.dotClass, /emerald/)
  assert.match(variant.glowClass, /shadow-\[0_0_32px/)
  assert.match(variant.dividerClass, /via-emerald-200\/18/)
})
