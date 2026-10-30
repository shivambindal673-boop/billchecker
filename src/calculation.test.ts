import assert from 'node:assert/strict'
import test from 'node:test'
import { getBillStatus, parseRupeesToPaise, sumPaise } from './calculation'

test('adds rupees exactly in paise, including decimal values', () => {
  assert.equal(sumPaise(['310', '90', '400', '800']), 160_000)
  assert.equal(sumPaise(['1.25', '2.10']), 335)
})

test('rejects invalid and negative amounts', () => {
  assert.equal(parseRupeesToPaise(''), null)
  assert.equal(parseRupeesToPaise('-12'), null)
  assert.equal(parseRupeesToPaise('not money'), null)
})

test('does not report a match while the bill is incomplete', () => {
  assert.equal(getBillStatus(160_000, 160_000, false), 'review')
  assert.equal(getBillStatus(160_000, null, true), 'review')
  assert.equal(getBillStatus(160_000, 160_000, true), 'matched')
  assert.equal(getBillStatus(160_000, 150_000, true), 'mismatch')
  assert.equal(getBillStatus(160_000, 170_000, true), 'extra')
})