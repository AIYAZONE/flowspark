import test from 'node:test'
import assert from 'node:assert/strict'

import { getQuoteShareFooterStyle } from './quote-share-image.ts'

test('浅色模板使用细描边签名条', () => {
  const style = getQuoteShareFooterStyle('calm')

  assert.equal(style.variant, 'outlined-chip')
  assert.equal(style.showContainer, true)
  assert.equal(style.showBorder, true)
})

test('深色模板使用同平面署名区', () => {
  const spotlight = getQuoteShareFooterStyle('spotlight')
  const dusk = getQuoteShareFooterStyle('dusk')

  assert.equal(spotlight.variant, 'flat-inline')
  assert.equal(spotlight.showContainer, false)
  assert.equal(dusk.variant, 'flat-inline')
  assert.equal(dusk.showContainer, false)
})
