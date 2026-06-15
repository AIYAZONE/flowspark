import test from 'node:test'
import assert from 'node:assert/strict'

import { getDailyQuote, getDailyQuoteByIndex, getDailyQuoteCandidates } from './daily-quote.ts'

test('同一天返回固定数量且不重复的候选金句', () => {
  const quotes = getDailyQuoteCandidates({
    locale: 'zh',
    dateISO: '2026-06-15',
    count: 5,
  })

  assert.equal(quotes.length, 5)
  assert.equal(new Set(quotes.map((quote) => quote.id)).size, 5)
  assert.ok(quotes.every((quote) => quote.locale === 'zh'))
  assert.ok(quotes.every((quote) => quote.tag === quotes[0]?.tag))
})

test('索引 0 的金句与默认每日金句一致', () => {
  const dailyQuote = getDailyQuote({
    locale: 'en',
    dateISO: '2026-06-16',
  })
  const indexedQuote = getDailyQuoteByIndex({
    locale: 'en',
    dateISO: '2026-06-16',
    index: 0,
  })

  assert.equal(indexedQuote.id, dailyQuote.id)
})

test('超出范围的索引会在当天候选内循环', () => {
  const quotes = getDailyQuoteCandidates({
    locale: 'zh',
    dateISO: '2026-06-17',
    count: 5,
  })
  const wrappedQuote = getDailyQuoteByIndex({
    locale: 'zh',
    dateISO: '2026-06-17',
    index: 7,
  })

  assert.equal(wrappedQuote.id, quotes[2]?.id)
})

