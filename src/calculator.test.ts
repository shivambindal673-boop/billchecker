import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatorReducer, initialCalculatorState } from './calculator'

function press(...actions: Parameters<typeof calculatorReducer>[1][]) {
  return actions.reduce(calculatorReducer, initialCalculatorState)
}

test('performs chained basic arithmetic', () => {
  const result = press(
    { type: 'digit', value: '1' }, { type: 'digit', value: '2' },
    { type: 'operator', value: '+' }, { type: 'digit', value: '3' },
    { type: 'operator', value: '×' }, { type: 'digit', value: '2' }, { type: 'equals' },
  )
  assert.equal(result.display, '30')
})

test('supports decimal input, sign, percent, and backspace', () => {
  const result = press(
    { type: 'digit', value: '2' }, { type: 'decimal' }, { type: 'digit', value: '5' },
    { type: 'sign' }, { type: 'percent' }, { type: 'backspace' },
  )
  assert.equal(result.display, '-0.02')
})

test('shows an error and recovers after division by zero', () => {
  const error = press(
    { type: 'digit', value: '8' }, { type: 'operator', value: '÷' },
    { type: 'digit', value: '0' }, { type: 'equals' },
  )
  assert.equal(error.display, 'Error')
  assert.equal(calculatorReducer(error, { type: 'digit', value: '5' }).display, '5')
})