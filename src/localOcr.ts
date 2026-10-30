import type * as Tesseract from 'tesseract.js'
import type { OcrItem, RecognitionResult } from './types'

type OcrWord = {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}
type OcrLine = {
  text: string
  confidence: number
  bbox?: { x0: number; y0: number; x1: number; y1: number }
  words?: OcrWord[]
}
type NumberPoint = { value: number; x: number; confidence: number }
type NumberRow = { item: OcrItem; value: number; y: number; x: number }
type ColumnEntry = { line: OcrLine; point: NumberPoint; lineIndex: number; y: number }
type NumericColumn = { x: number; entries: ColumnEntry[] }
type ProgressCallback = (status: string, progress: number) => void
type OcrWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>

const digitCharacters = '0123456789०१२३४५६७८९,.'
const devanagariDigits: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
}
let workerPromise: Promise<OcrWorker> | null = null
let reportProgress: ProgressCallback = () => undefined

function getWorker(onProgress: ProgressCallback): Promise<OcrWorker> {
  reportProgress = onProgress
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker(['eng', 'hin'], 1, {
      logger: ({ status, progress }) => reportProgress(status, progress),
    })).catch((error: unknown) => {
      workerPromise = null
      throw error
    })
  }
  return workerPromise
}

function normalizedDigits(text: string): string {
  return text.replace(/[०-९]/g, (digit) => devanagariDigits[digit] ?? digit)
}

function amountTokens(text: string): number[] {
  const matches = normalizedDigits(text).match(/(?<![A-Za-z0-9])(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?(?![A-Za-z0-9])/g) ?? []
  return matches.map((token) => Number(token.replaceAll(',', ''))).filter((value) => Number.isFinite(value) && value >= 0)
}

function numberPoints(line: OcrLine): NumberPoint[] {
  const points = line.words?.flatMap((word) => amountTokens(word.text).map((value) => ({
    value,
    x: word.bbox.x1,
    confidence: Math.max(0, Math.min(1, word.confidence / 100)),
  })))
  if (points?.length) return points
  return amountTokens(line.text).map((value) => ({
    value,
    x: line.bbox?.x1 ?? 0,
    confidence: Math.max(0, Math.min(1, line.confidence / 100)),
  }))
}

function dominantColumn(points: NumberPoint[], pageWidth: number): number {
  if (points.length === 0) return 0
  const radius = Math.max(12, pageWidth * 0.1)
  return points.map((point) => point.x).sort((a, b) => {
    const countA = points.filter((candidate) => Math.abs(candidate.x - a) <= radius).length
    const countB = points.filter((candidate) => Math.abs(candidate.x - b) <= radius).length
    return countB - countA
  })[0]
}

function makeItem(value: number, line: OcrLine, confidence: number, reason: string): OcrItem {
  return {
    amount: confidence < 0.28 ? null : value,
    confidence,
    text: line.text.trim().slice(0, 120),
    reason,
  }
}

function closeAmount(value: number, expected: number): boolean {
  return Math.abs(value - expected) <= Math.max(2, expected * 0.005)
}

function inferTabularInvoice(
  pointsByLine: Array<{ line: OcrLine; points: NumberPoint[] }>,
  pageWidth: number,
  pageHeight: number,
): RecognitionResult | null {
  const clusterTolerance = Math.max(8, pageWidth * 0.025)
  const columns: NumericColumn[] = []

  pointsByLine.forEach(({ line, points }, lineIndex) => {
    const y = line.bbox ? (line.bbox.y0 + line.bbox.y1) / 2 : 0
    for (const point of points) {
      let column = columns.find((candidate) => Math.abs(candidate.x - point.x) <= clusterTolerance)
      if (!column) {
        column = { x: point.x, entries: [] }
        columns.push(column)
      }
      if (!column.entries.some((entry) => entry.lineIndex === lineIndex)) column.entries.push({ line, point, lineIndex, y })
    }
  })

  const subtotalCandidates: Array<{ column: NumericColumn; start: number; end: number; error: number; rowCount: number }> = []
  for (const column of columns.filter((candidate) => candidate.x > pageWidth * 0.38)) {
    const entries = [...column.entries].sort((a, b) => a.y - b.y)
    if (entries.length < 3) continue
    for (let end = 2; end < entries.length; end += 1) {
      const subtotal = entries[end]
      if (subtotal.y < pageHeight * 0.2) continue
      for (let start = Math.max(0, end - 8); start <= end - 2; start += 1) {
        const products = entries.slice(start, end)
        const hasLargeGap = products.some((entry, index) => index > 0 && entry.y - products[index - 1].y > pageHeight * 0.12)
        if (hasLargeGap || subtotal.y - products[products.length - 1].y > pageHeight * 0.12) continue
        const sum = products.reduce((total, entry) => total + entry.point.value, 0)
        if (sum <= 0 || subtotal.point.value < sum * 0.5 || subtotal.point.value > sum * 1.5) continue
        const error = Math.abs(subtotal.point.value - sum) / sum
        if (error <= 0.02) subtotalCandidates.push({ column, start, end, error, rowCount: products.length })
      }
    }
  }

  const subtotalMatch = subtotalCandidates.sort((a, b) => b.rowCount - a.rowCount || b.column.x - a.column.x || a.error - b.error)[0]
  if (!subtotalMatch) return null

  const columnEntries = [...subtotalMatch.column.entries].sort((a, b) => a.y - b.y)
  const productEntries = columnEntries.slice(subtotalMatch.start, subtotalMatch.end)
  const subtotalEntry = columnEntries[subtotalMatch.end]
  const subtotalValue = subtotalEntry.point.value
  const taxEntries: ColumnEntry[] = []
  let taxSum = 0
  let grandTotalEntry: ColumnEntry | null = null

  for (const entry of columnEntries.slice(subtotalMatch.end + 1)) {
    const value = entry.point.value
    if (value === 0) continue
    if (taxSum > 0 && closeAmount(value, subtotalValue + taxSum)) {
      grandTotalEntry = entry
      break
    }
    if (closeAmount(value, subtotalValue)) {
      grandTotalEntry = entry
      break
    }
    if (value < subtotalValue * 0.3) {
      taxEntries.push(entry)
      taxSum += value
      continue
    }
    break
  }

  const countedEntries = grandTotalEntry ? [...productEntries, ...taxEntries] : productEntries
  const items = countedEntries.map((entry, index) => makeItem(
    entry.point.value,
    entry.line,
    Math.min(entry.point.confidence, 0.68),
    index < productEntries.length ? 'Selected from the aligned amount column; confirm it is a separate item amount.' : 'Tax component included in the invoice total; confirm it on the bill.',
  ))
  const writtenEntry = grandTotalEntry ?? subtotalEntry
  const writtenTotal = writtenEntry.point.value
  const warnings = [
    grandTotalEntry
      ? 'The item subtotal and aligned tax rows were combined to identify the written grand total. Review every row.'
      : 'A lower-page subtotal matching the aligned item amounts was found; verify it is the bill total, not a subtotal.',
    'Digits-only OCR cannot read row labels. Confirm quantities, tax rows, and the final total against the image.',
  ]

  return {
    items,
    writtenTotal,
    totalConfidence: Math.min(writtenEntry.point.confidence, subtotalEntry.point.confidence, 0.68),
    warnings,
    unreadable: false,
  }
}

export function parseNumericLines(lines: OcrLine[], fullText = ''): RecognitionResult {
  const warnings: string[] = []
  const pageWidth = Math.max(1, ...lines.map((line) => line.bbox?.x1 ?? 0))
  const pageHeight = Math.max(1, ...lines.map((line) => line.bbox?.y1 ?? 0))
  const pointsByLine = lines.map((line) => ({ line, points: numberPoints(line) }))
  const isSmallHeaderDate = ({ line, points }: typeof pointsByLine[number]) => {
    const y = line.bbox ? (line.bbox.y0 + line.bbox.y1) / 2 : 0
    return points.length >= 3 && points.every((point) => point.value <= 31) && y < pageHeight * 0.2
  }
  const tableResult = inferTabularInvoice(pointsByLine.filter((entry) => !isSmallHeaderDate(entry)), pageWidth, pageHeight)
  if (tableResult) return tableResult
  const allPoints = pointsByLine.filter((entry) => !isSmallHeaderDate(entry)).flatMap(({ points }) => points)
  const amountColumn = dominantColumn(allPoints, pageWidth)
  const columnTolerance = pageWidth * 0.06
  const numberRows: NumberRow[] = []

  for (const { line, points } of pointsByLine) {
    if (points.length === 0) continue
    const y = line.bbox ? (line.bbox.y0 + line.bbox.y1) / 2 : 0
    if (isSmallHeaderDate({ line, points })) {
      warnings.push('A small group of numbers near the top may be a date; it was not counted as an item.')
      continue
    }

    const selected = points.reduce((closest, point) => Math.abs(point.x - amountColumn) < Math.abs(closest.x - amountColumn) ? point : closest)
    const distance = Math.abs(selected.x - amountColumn)
    if (distance > columnTolerance) {
      numberRows.push({
        value: selected.value,
        y,
        x: selected.x,
        item: makeItem(selected.value, line, Math.min(selected.confidence, 0.48), 'This number is outside the main amount column. Check whether it is a total or balance.'),
      })
      continue
    }

    const severalNumbers = points.length > 1
    const confidence = Math.min(selected.confidence, severalNumbers ? 0.68 : 0.78)
    numberRows.push({
      value: selected.value,
      y,
      x: selected.x,
      item: makeItem(
        selected.value,
        line,
        confidence,
        severalNumbers ? 'Several numbers share this line. The main amount-column number was selected; check it.' : 'Number-only OCR cannot tell an item amount from a quantity. Confirm this amount.',
      ),
    })

    if (severalNumbers) warnings.push('Lines with multiple numbers may contain quantities; the value in the dominant amount column was selected.')
  }

  numberRows.sort((a, b) => a.y - b.y)
  const mainRows = numberRows.filter((row) => Math.abs(row.x - amountColumn) <= columnTolerance)
  let writtenTotal: number | null = null
  let totalConfidence = 0
  let itemRows = mainRows

  const totalCandidates = numberRows
    .map((row) => {
      const before = mainRows.filter((item) => item.y < row.y)
      const sumBefore = before.reduce((total, item) => total + item.value, 0)
      const relativeDifference = sumBefore > 0 ? Math.abs(row.value - sumBefore) / sumBefore : Number.POSITIVE_INFINITY
      return { row, sumBefore, relativeDifference }
    })
    .filter(({ row, sumBefore }) => row.y > pageHeight * 0.58 && sumBefore > 0 && row.value >= sumBefore * 0.55 && row.value <= sumBefore * 1.8)
    .sort((a, b) => a.relativeDifference - b.relativeDifference)

  const inferred = totalCandidates[0]
  if (inferred && inferred.relativeDifference <= 0.2) {
    writtenTotal = inferred.row.value
    totalConfidence = inferred.relativeDifference < 0.015 ? Math.min(inferred.row.item.confidence, 0.72) : Math.min(inferred.row.item.confidence, 0.48)
    itemRows = mainRows.filter((row) => row.y < inferred.row.y)
    warnings.push('A possible written total was inferred by comparing the lower-page number with the item sum. Confirm it manually.')
    if (numberRows.some((row) => row.y > inferred.row.y)) warnings.push('Numbers below the possible total were not included; check whether they are balances or payments.')
  } else warnings.push('No written total could be identified using numbers alone. Enter the bill total manually after checking the image.')

  if (numberRows.some((row) => Math.abs(row.x - amountColumn) > columnTolerance)) {
    warnings.push('Numbers outside the main amount column were not added; review them in the image in case an item was missed.')
  }
  if (itemRows.length > 0) warnings.push('Digits-only recognition cannot identify quantities or item labels. Confirm every selected amount and the full list.')

  const items = itemRows.map((row) => row.item)
  return {
    items,
    writtenTotal,
    totalConfidence,
    warnings: [...new Set(warnings)].slice(0, 12),
    unreadable: lines.length === 0 || (items.length === 0 && writtenTotal === null && fullText.trim().length < 3),
  }
}

export async function recognizeBillLocally(image: string, onProgress: ProgressCallback): Promise<RecognitionResult> {
  const worker = await getWorker(onProgress)
  await worker.setParameters({
    tessedit_pageseg_mode: '12' as Tesseract.PSM,
    tessedit_char_whitelist: digitCharacters,
    preserve_interword_spaces: '1',
  })
  const result = await worker.recognize(image, {}, { blocks: true })
  const lines = result.data.blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines)) ?? []
  return parseNumericLines(lines, result.data.text)
}