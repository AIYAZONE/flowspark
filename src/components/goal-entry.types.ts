'use client'

export interface GoalEntry {
	id: string
	kind: 'inspiration' | 'journey'
	status: 'open' | 'archived'
	content: string
	note: string
	created_at: string
}
