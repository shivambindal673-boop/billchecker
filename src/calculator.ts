export type CalculatorOperator = '+' | '−' | '×' | '÷'

export type CalculatorState = {
  display: string
  accumulator: number | null
  operator: CalculatorOperator | null
  waitingForOperand: boolean
  expression: string
}

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: CalculatorOperator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'sign' }
  | { type: 'percent' }

export const initialCalculatorState: CalculatorState = {
  display: '0',
  accumulator: null,
  operator: null,
  waitingForOperand: false,
  expression: '',
}

function normalized(value: number): string {
  if (!Number.isFinite(value)) return 'Error'
  return String(Number(value.toPrecision(12)))
}

function applyOperator(left: number, right: number, operator: CalculatorOperator): number {
  if (operator === '+') return left + right
  if (operator === '−') return left - right
  if (operator === '×') return left * right
  return right === 0 ? Number.NaN : left / right
}

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  if (action.type === 'clear') return initialCalculatorState

  if (action.type === 'digit') {
    const display = state.waitingForOperand || state.display === 'Error'
      ? action.value
      : state.display === '0' ? action.value : `${state.display}${action.value}`
    return { ...state, display, waitingForOperand: false, expression: '' }
  }

  if (action.type === 'decimal') {
    if (state.waitingForOperand || state.display === 'Error') return { ...state, display: '0.', waitingForOperand: false, expression: '' }
    return state.display.includes('.') ? state : { ...state, display: `${state.display}.`, expression: '' }
  }

  if (action.type === 'sign') {
    if (state.display === 'Error' || Number(state.display) === 0) return state
    return { ...state, display: normalized(-Number(state.display)), expression: '' }
  }

  if (action.type === 'percent') {
    if (state.display === 'Error') return state
    return { ...state, display: normalized(Number(state.display) / 100), expression: '' }
  }

  if (action.type === 'backspace') {
    if (state.waitingForOperand || state.display === 'Error') return state
    const shortened = state.display.slice(0, -1)
    return { ...state, display: shortened && shortened !== '-' ? shortened : '0', expression: '' }
  }

  if (action.type === 'operator') {
    const current = Number(state.display)
    if (state.operator && state.accumulator !== null && !state.waitingForOperand) {
      const result = applyOperator(state.accumulator, current, state.operator)
      return {
        display: normalized(result),
        accumulator: result,
        operator: action.value,
        waitingForOperand: true,
        expression: `${normalized(result)} ${action.value}`,
      }
    }
    const accumulator = state.operator && state.waitingForOperand ? state.accumulator : current
    return {
      ...state,
      accumulator,
      operator: action.value,
      waitingForOperand: true,
      expression: `${normalized(accumulator ?? current)} ${action.value}`,
    }
  }

  if (action.type === 'equals' && state.operator && state.accumulator !== null && !state.waitingForOperand) {
    const current = Number(state.display)
    const result = applyOperator(state.accumulator, current, state.operator)
    return {
      display: normalized(result),
      accumulator: null,
      operator: null,
      waitingForOperand: true,
      expression: `${normalized(state.accumulator)} ${state.operator} ${normalized(current)} =`,
    }
  }

  return state
}