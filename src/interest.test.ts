import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateInterest } from './interest'

test('calculates simple interest for yearly and monthly periods', () => {
  assert.deepEqual(calculateInterest(10_000, 12, 2, 'years', 'simple'), { interest: 2_400, maturity: 12_400 })
  assert.deepEqual(calculateInterest(10_000, 12, 6, 'months', 'simple'), { interest: 600, maturity: 10_600 })
})

test('calculates compound interest using the selected frequency', () => {
  const result = calculateInterest(10_000, 12, 1, 'years', 'compound', 4)
  assert.ok(result)
  assert.ok(Math.abs(result.maturity - 11_255.0881) < 0.01)
})

test('rejects invalid principal, rate, duration, and compounding frequency', () => {
  assert.equal(calculateInterest(-1, 5, 1, 'years', 'simple'), null)
  assert.equal(calculateInterest(100, Number.NaN, 1, 'years', 'simple'), null)
  assert.equal(calculateInterest(100, 5, 1, 'years', 'compound', 0), null)
})