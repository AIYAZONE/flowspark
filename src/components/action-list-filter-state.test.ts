import test from 'node:test'
import assert from 'node:assert/strict'

import {
    applyDraftActionFilters,
    countActiveActionFilters,
    createActionFilterUiState,
    resetDraftActionFilters,
    syncDraftFromApplied,
    updateAppliedActionFilters,
    updateDraftActionFilters,
} from './action-list-filter-state.ts'

test('桌面端更新筛选时立即提交并同步草稿态', () => {
    const initialState = createActionFilterUiState()

    const nextState = updateAppliedActionFilters(initialState, {
        statusFilter: 'completed',
        typeFilter: 'core',
    })

    assert.deepEqual(nextState.applied, {
        goalFilter: 'all',
        statusFilter: 'completed',
        typeFilter: 'core',
        priorityFilter: 'all',
    })
    assert.deepEqual(nextState.draft, nextState.applied)
})

test('移动端草稿筛选在点击完成前不影响已提交筛选', () => {
    const initialState = createActionFilterUiState()
    const draftUpdatedState = updateDraftActionFilters(initialState, {
        statusFilter: 'completed',
        priorityFilter: 'high',
    })

    assert.deepEqual(draftUpdatedState.applied, initialState.applied)
    assert.deepEqual(draftUpdatedState.draft, {
        goalFilter: 'all',
        statusFilter: 'completed',
        typeFilter: 'all',
        priorityFilter: 'high',
    })

    const committedState = applyDraftActionFilters(draftUpdatedState)

    assert.deepEqual(committedState.applied, committedState.draft)
    assert.equal(committedState.applied.statusFilter, 'completed')
    assert.equal(committedState.applied.priorityFilter, 'high')
})

test('关闭弹窗时会丢弃未提交的草稿筛选', () => {
    const initialState = createActionFilterUiState({
        statusFilter: 'completed',
        priorityFilter: 'medium',
    })
    const draftUpdatedState = updateDraftActionFilters(initialState, {
        priorityFilter: 'high',
    })

    const discardedState = syncDraftFromApplied(draftUpdatedState)

    assert.deepEqual(discardedState.draft, initialState.applied)
    assert.equal(discardedState.draft.priorityFilter, 'medium')
})

test('移动端重置只清空草稿态且不影响当前已提交筛选', () => {
    const initialState = createActionFilterUiState({
        goalFilter: 'goal-1',
        statusFilter: 'completed',
        typeFilter: 'maintenance',
        priorityFilter: 'high',
    })

    const nextState = resetDraftActionFilters(initialState)

    assert.deepEqual(nextState.applied, initialState.applied)
    assert.deepEqual(nextState.draft, {
        goalFilter: 'all',
        statusFilter: 'incomplete',
        typeFilter: 'all',
        priorityFilter: 'all',
    })
})

test('激活筛选计数基于当前已提交筛选', () => {
    const state = createActionFilterUiState({
        goalFilter: 'goal-1',
        statusFilter: 'completed',
        typeFilter: 'core',
        priorityFilter: 'high',
    })
    const draftUpdatedState = updateDraftActionFilters(state, {
        priorityFilter: 'low',
    })

    assert.equal(countActiveActionFilters(draftUpdatedState.applied, false), 4)
    assert.equal(countActiveActionFilters(draftUpdatedState.applied, true), 3)
})
