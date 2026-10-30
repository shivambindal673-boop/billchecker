import assert from 'node:assert/strict'
import test from 'node:test'
import { parseNumericLines } from './localOcr'

function numericLine(value: string, y: number, x = 100, confidence = 94) {
  return {
    text: value,
    confidence,
    bbox: { x0: x, y0: y, x1: x + 65, y1: y + 24 },
    words: [{
      text: value,
      confidence,
      bbox: { x0: x, y0: y, x1: x + 65, y1: y + 24 },
    }],
  }
}

test('reads only numeric rows and keeps a total equal to their sum separate', () => {
  const result = parseNumericLines([
    numericLine('310', 100),
    numericLine('90', 180),
    numericLine('400', 300),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90])
  assert.equal(result.writtenTotal, 400)
  assert.ok(result.totalConfidence <= 0.72)
})

test('chooses the amount in the dominant left column over right-side quantities', () => {
  const result = parseNumericLines([
    { ...numericLine('310', 100), bbox: { x0: 90, y0: 100, x1: 500, y1: 124 }, words: [
      { text: '310', confidence: 92, bbox: { x0: 100, y0: 100, x1: 145, y1: 124 } },
      { text: '2', confidence: 92, bbox: { x0: 460, y0: 100, x1: 475, y1: 124 } },
    ] },
    numericLine('90', 180, 100),
    numericLine('400', 300, 100),
    numericLine('1', 110, 460),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90])
  assert.equal(result.writtenTotal, 400)
  assert.ok(result.warnings.some((warning) => warning.includes('outside the main amount column')))
})

test('normalizes Devanagari numerals without reading words', () => {
  const result = parseNumericLines([
    numericLine('३१०', 100),
    numericLine('९०', 180),
    numericLine('४००', 300),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90])
  assert.equal(result.writtenTotal, 400)
})

test('ignores a date-like group of small numbers near the top', () => {
  const result = parseNumericLines([
    { ...numericLine('29 10 26', 20, 400), bbox: { x0: 400, y0: 20, x1: 490, y1: 44 }, words: [
      { text: '29', confidence: 96, bbox: { x0: 400, y0: 20, x1: 420, y1: 44 } },
      { text: '10', confidence: 96, bbox: { x0: 430, y0: 20, x1: 450, y1: 44 } },
      { text: '26', confidence: 96, bbox: { x0: 460, y0: 20, x1: 480, y1: 44 } },
    ] },
    numericLine('310', 100),
    numericLine('90', 180),
    numericLine('400', 300),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90])
  assert.equal(result.writtenTotal, 400)
})

test('keeps post-total balance figures out of the item sum', () => {
  const result = parseNumericLines([
    numericLine('310', 100),
    numericLine('90', 180),
    numericLine('400', 430),
    numericLine('250', 570),
    numericLine('150', 670),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90])
  assert.equal(result.writtenTotal, 400)
  assert.ok(result.warnings.some((warning) => warning.includes('below the possible total')))
})

test('does not silently infer an isolated amount when it does not match the sum', () => {
  const result = parseNumericLines([
    numericLine('310', 100),
    numericLine('90', 180),
    numericLine('9999', 300),
  ])

  assert.deepEqual(result.items.map((item) => item.amount), [310, 90, 9999])
  assert.equal(result.writtenTotal, null)
})

test('selects taxable amount column and adds tax rows for a printed GST invoice', () => {
  const rows = [
    ['15079010', '682.50', '103750.00'],
    ['15079010', '436.80', '66211.20'],
    ['15079010', '546.00', '81708.00'],
    ['15079010', '145.60', '23052.80'],
  ]
  const lines = rows.flatMap(([hsn, kilograms, taxable], index) => {
    const y = 360 + index * 36
    return [numericLine(hsn, y, 170), numericLine(kilograms, y, 690), numericLine(taxable, y, 800)]
  })
  lines.push(
    numericLine('1810.90', 510, 690),
    numericLine('274722.00', 510, 800),
    numericLine('6868.05', 550, 800),
    numericLine('6868.05', 574, 800),
    numericLine('288458.10', 610, 800),
  )

  const result = parseNumericLines(lines)
  assert.deepEqual(result.items.map((item) => item.amount), [103750, 66211.2, 81708, 23052.8, 6868.05, 6868.05])
  assert.equal(result.writtenTotal, 288458.1)
})