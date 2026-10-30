export type BillStatus = 'matched' | 'mismatch' | 'extra' | 'review'

export function parseRupeesToPaise(value: string): number | null {
  if (!value.trim()) return null
  const rupees = Number(value.replaceAll(',', '').trim())
  if (!Number.isFinite(rupees) || rupees < 0) return null
  const paise = Math.round(rupees * 100)
  return Number.isSafeInteger(paise) ? paise : null
}

export function sumPaise(amounts: Array<string | null>): number {
  return amounts.reduce((total, amount) => total + (amount === null ? 0 : parseRupeesToPaise(amount) ?? 0), 0)
}

export function getBillStatus(calculated: number, written: number | null, complete: boolean): BillStatus {
  if (!complete || written === null) return 'review'
  if (calculated === written) return 'matched'
  return written > calculated ? 'extra' : 'mismatch'
}