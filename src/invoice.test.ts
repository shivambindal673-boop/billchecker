import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateInvoice, resolveSupplyType } from './invoice'

const sampleLine = {
  description: 'Oil tin',
  hsn: '15079010',
  quantity: '2',
  unit: 'pcs',
  rate: '1000',
  gstRate: '5',
}

test('splits intra-state GST evenly into CGST and SGST', () => {
  const invoice = calculateInvoice([sampleLine], 'intra')
  assert.equal(invoice.taxablePaise, 200_000)
  assert.equal(invoice.cgstPaise, 5_000)
  assert.equal(invoice.sgstPaise, 5_000)
  assert.equal(invoice.igstPaise, 0)
  assert.equal(invoice.totalPaise, 210_000)
})

test('uses IGST only for inter-state supply', () => {
  const invoice = calculateInvoice([sampleLine], 'inter')
  assert.equal(invoice.cgstPaise, 0)
  assert.equal(invoice.sgstPaise, 0)
  assert.equal(invoice.igstPaise, 10_000)
})

test('rounds tax and invoice totals to paise for decimal quantities', () => {
  const invoice = calculateInvoice([{ ...sampleLine, quantity: '1.5', rate: '9.99', gstRate: '18' }], 'intra')
  assert.equal(invoice.taxablePaise, 1_499)
  assert.equal(invoice.gstPaise, 270)
  assert.equal(invoice.totalPaise, 1_769)
})

test('accepts a manually entered custom GST percentage', () => {
  const invoice = calculateInvoice([{ ...sampleLine, quantity: '1', rate: '1000', gstRate: '7.5' }], 'intra')
  assert.equal(invoice.gstPaise, 7_500)
  assert.equal(invoice.totalPaise, 107_500)
})

test('chooses intra or inter-state supply from state codes and falls back when missing', () => {
  assert.equal(resolveSupplyType('08 Rajasthan', '08 Rajasthan', 'inter'), 'intra')
  assert.equal(resolveSupplyType('08', '27 Maharashtra', 'intra'), 'inter')
  assert.equal(resolveSupplyType('', '27', 'intra'), 'intra')
})