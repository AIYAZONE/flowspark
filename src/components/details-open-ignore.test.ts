import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldIgnoreDetailsOpenInteraction } from './details-open-ignore.ts'

test('详情弹窗：命中 Radix Select 的弹出层交互（listbox/option）时应忽略打开详情', () => {
	assert.equal(
		shouldIgnoreDetailsOpenInteraction({
			isNativeInteractive: false,
			isRadixSelectOverlay: true,
			isNestedButton: false
		}),
		true
	)
})

test('详情弹窗：命中 Dialog 遮罩/内容区域的交互时应忽略打开详情', () => {
	assert.equal(
		shouldIgnoreDetailsOpenInteraction({
			isNativeInteractive: false,
			isRadixSelectOverlay: false,
			isNestedButton: false,
			isDialogLayer: true
		} as any),
		true
	)
})

test('详情弹窗：未命中任何交互忽略条件时不应忽略打开详情', () => {
	assert.equal(
		shouldIgnoreDetailsOpenInteraction({
			isNativeInteractive: false,
			isRadixSelectOverlay: false,
			isNestedButton: false
		}),
		false
	)
})
