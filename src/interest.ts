export type InterestMode = 'simple' | 'compound'
export type DurationUnit = 'months' | 'years'

export type InterestResult = {
  interest: number
  maturity: number
}

export function calculateInterest(
  principal: number,
  annualRate: number,
  duration: number,
  durationUnit: DurationUnit,
  mode: InterestMode,
  compoundsPerYear = 12,
): InterestResult | null {
  if (![principal, annualRate, duration].every(Number.isFinite) || principal < 0 || annualRate < 0 || duration < 0) return null
  const years = duration / (durationUnit === 'months' ? 12 : 1)
  if (mode === 'simple') {
    const interest = principal * annualRate / 100 * years
    return { interest, maturity: principal + interest }
  }
  if (!Number.isInteger(compoundsPerYear) || compoundsPerYear < 1) return null
  const maturity = principal * Math.pow(1 + annualRate / (100 * compoundsPerYear), compoundsPerYear * years)
  return { interest: maturity - principal, maturity }
}