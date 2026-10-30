import { parseRupeesToPaise } from './calculation'

export type SupplyType = 'intra' | 'inter'

export function resolveSupplyType(supplierState: string, destinationState: string, fallback: SupplyType): SupplyType {
  const supplierCode = supplierState.trim().match(/^\d{2}/)?.[0]
  const destinationCode = destinationState.trim().match(/^\d{2}/)?.[0]
  if (!supplierCode || !destinationCode) return fallback
  return supplierCode === destinationCode ? 'intra' : 'inter'
}

export type InvoiceLineInput = {
  description: string
  hsn: string
  quantity: string
  unit: string
  rate: string
  gstRate: string
}

export type CalculatedInvoiceLine = InvoiceLineInput & {
  taxablePaise: number
  gstPaise: number
  cgstPaise: number
  sgstPaise: number
  igstPaise: number
  totalPaise: number
}

export type InvoiceTotals = {
  lines: CalculatedInvoiceLine[]
  taxablePaise: number
  cgstPaise: number
  sgstPaise: number
  igstPaise: number
  gstPaise: number
  totalPaise: number
  roundedTotalPaise: number
  roundOffPaise: number
}

export function calculateInvoice(lines: InvoiceLineInput[], supplyType: SupplyType): InvoiceTotals {
  const calculatedLines = lines.map((line): CalculatedInvoiceLine => {
    const ratePaise = parseRupeesToPaise(line.rate) ?? 0
    const quantity = Number(line.quantity)
    const gstRate = Number(line.gstRate)
    const taxablePaise = Number.isFinite(quantity) && quantity > 0 ? Math.round(ratePaise * quantity) : 0
    const gstPaise = Math.round(taxablePaise * (Number.isFinite(gstRate) && gstRate >= 0 ? gstRate : 0) / 100)
    const cgstPaise = supplyType === 'intra' ? Math.floor(gstPaise / 2) : 0
    const sgstPaise = supplyType === 'intra' ? gstPaise - cgstPaise : 0
    const igstPaise = supplyType === 'inter' ? gstPaise : 0

    return {
      ...line,
      taxablePaise,
      gstPaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      totalPaise: taxablePaise + gstPaise,
    }
  })

  const taxablePaise = calculatedLines.reduce((sum, line) => sum + line.taxablePaise, 0)
  const cgstPaise = calculatedLines.reduce((sum, line) => sum + line.cgstPaise, 0)
  const sgstPaise = calculatedLines.reduce((sum, line) => sum + line.sgstPaise, 0)
  const igstPaise = calculatedLines.reduce((sum, line) => sum + line.igstPaise, 0)
  const totalPaise = taxablePaise + cgstPaise + sgstPaise + igstPaise
  const roundedTotalPaise = Math.round(totalPaise / 100) * 100

  return {
    lines: calculatedLines,
    taxablePaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    gstPaise: cgstPaise + sgstPaise + igstPaise,
    totalPaise,
    roundedTotalPaise,
    roundOffPaise: roundedTotalPaise - totalPaise,
  }
}