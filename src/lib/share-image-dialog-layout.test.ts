import test from 'node:test'
import assert from 'node:assert/strict'
import { canOpenSharePreviewFullscreen, getSharePreviewHeightClass } from './share-image-dialog-layout.ts'

test('share preview height class uses larger mobile height', () => {
  assert.equal(getSharePreviewHeightClass(), 'h-[min(52vh,560px)] md:h-[min(62vh,720px)]')
})

test('share preview fullscreen open is gated by image and generation status', () => {
  assert.equal(canOpenSharePreviewFullscreen({ imageDataUrl: null, isGenerating: false }), false)
  assert.equal(canOpenSharePreviewFullscreen({ imageDataUrl: 'data:image/png;base64,xxx', isGenerating: true }), false)
  assert.equal(canOpenSharePreviewFullscreen({ imageDataUrl: 'data:image/png;base64,xxx', isGenerating: false }), true)
})
