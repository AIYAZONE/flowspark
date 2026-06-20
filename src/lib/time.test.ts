import test from 'node:test'
import assert from 'node:assert/strict'

import { getDateBucketInTZ, shiftDateBucket } from './time.ts'

test('getDateBucketInTZ returns the correct local bucket for a positive offset timezone', () => {
  assert.equal(
    getDateBucketInTZ('2026-06-20T16:30:00.000Z', 'Asia/Shanghai'),
    '2026-06-21'
  )
})

test('getDateBucketInTZ returns the correct local bucket for a negative offset timezone', () => {
  assert.equal(
    getDateBucketInTZ('2026-06-20T03:30:00.000Z', 'America/Los_Angeles'),
    '2026-06-19'
  )
})

test('shiftDateBucket supports moving backward and forward across month boundaries', () => {
  assert.equal(shiftDateBucket('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDateBucket('2026-12-31', 1), '2027-01-01')
})
