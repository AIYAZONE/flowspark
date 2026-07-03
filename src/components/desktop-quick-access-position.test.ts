import test from 'node:test'
import assert from 'node:assert/strict'
import { clampPosition, snapToNearestSide } from './desktop-quick-access-position.ts'

test('snapToNearestSide snaps to left when closer to left', () => {
  const next = snapToNearestSide({ left: 120, top: 200 }, { viewportWidth: 1000, fabWidth: 56, edgeMargin: 12 })
  assert.equal(next.left, 12)
})

test('snapToNearestSide snaps to right when closer to right', () => {
  const next = snapToNearestSide({ left: 900, top: 200 }, { viewportWidth: 1000, fabWidth: 56, edgeMargin: 12 })
  assert.equal(next.left, 1000 - 56 - 12)
})

test('clampPosition clamps into viewport bounds', () => {
  const next = clampPosition(
    { left: -10, top: 99999 },
    { viewportWidth: 800, viewportHeight: 600, fabWidth: 56, fabHeight: 56, edgeMargin: 12, bottomReservedArea: 120 }
  )
  assert.equal(next.left, 12)
  assert.equal(next.top, 600 - 56 - 120)
})
