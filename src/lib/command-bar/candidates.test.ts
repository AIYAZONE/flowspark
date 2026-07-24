import test from 'node:test'
import assert from 'node:assert/strict'

import { pickTopGoalCandidates } from './candidates.ts'

test('pickTopGoalCandidates returns main path first, then recent, then match', () => {
  const result = pickTopGoalCandidates({
    mainPath: { id: 'g1', title: '英语口语' },
    recentActive: [{ id: 'g2', title: '面试准备' }],
    allGoals: [
      { id: 'g1', title: '英语口语' },
      { id: 'g2', title: '面试准备' },
      { id: 'g3', title: '个人品牌' },
    ],
    queryText: '英语',
  })
  assert.deepEqual(result.map((x) => x.id), ['g1', 'g2', 'g3'])
})

test('pickTopGoalCandidates skips duplicates and caps at 3', () => {
  const result = pickTopGoalCandidates({
    mainPath: { id: 'g1', title: '英语口语' },
    recentActive: [{ id: 'g1', title: '英语口语' }, { id: 'g2', title: '面试准备' }],
    allGoals: [
      { id: 'g1', title: '英语口语' },
      { id: 'g2', title: '面试准备' },
      { id: 'g3', title: '个人品牌' },
      { id: 'g4', title: '健身' },
    ],
    queryText: '',
  })
  assert.equal(result.length, 3)
  assert.deepEqual(result.map((x) => x.id), ['g1', 'g2', 'g3'])
})
