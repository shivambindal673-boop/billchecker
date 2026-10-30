import { useState } from 'react'
import { Download, FileText, Plus, Share2, Trash2 } from 'lucide-react'
import { calculateInvoice, resolveSupplyType, type InvoiceLineInput, type SupplyType } from './invoice'

type Language = 'en' | 'hi'
type Party = { name: string; gstin: string; pan: string; address: string; state: string; pincode: string; phone: string; email: string }
type InvoiceLine = InvoiceLineInput & { id: string }

type Copy = {
  title: string; intro: string; seller: string; customer: string; businessName: string; gstin: string; pan: string
  address: string; state: string; pincode: string; phone: string; email: string; invoiceDetails: string; invoiceNo: string; date: string
  place: string; supply: string; autoSupply: string; intra: string; inter: string; products: string; description: string; hsn: string
  quantity: string; unit: string; rate: string; taxRate: string; addProduct: string; remove: string; summary: string
  taxable: string; cgst: string; sgst: string; igst: string; gst: string; roundOff: string; total: string
  transport: string; vehicle: string; challan: string; reverseCharge: string; notes: string; terms: string
  makePdf: string; makingPdf: string; download: string; share: string; valid: string; fillRequired: string
  gstinInvalid: string; pincodeInvalid: string; pdfError: string; shared: string; shareHint: string; customDetails: string
}

const copy: Record<Language, Copy> = {
  en: {
    title: 'GST bill maker', intro: 'Create a clear tax invoice. Add your details and products; taxes and totals calculate automatically.',
    seller: 'Supplier details', customer: 'Bill to', businessName: 'Firm / business name', gstin: 'GSTIN', pan: 'PAN',
    address: 'Address', state: 'State', pincode: 'PIN code', phone: 'Phone', email: 'Email', invoiceDetails: 'Invoice details',
    invoiceNo: 'Invoice number', date: 'Invoice date', place: 'Place of supply', supply: 'Supply type', autoSupply: 'Auto-detected from states',
    intra: 'Same state · CGST + SGST', inter: 'Different state · IGST', products: 'Products / services',
    description: 'Description', hsn: 'HSN / SAC', quantity: 'Qty', unit: 'Unit', rate: 'Rate (₹)', taxRate: 'GST %',
    addProduct: 'Add product', remove: 'Remove row', summary: 'Invoice totals', taxable: 'Taxable value', cgst: 'CGST',
    sgst: 'SGST', igst: 'IGST', gst: 'Total GST', roundOff: 'Round off', total: 'Invoice total', transport: 'Delivery & notes',
    vehicle: 'Vehicle number', challan: 'Delivery challan / order no.', reverseCharge: 'Reverse charge applicable',
    notes: 'Additional details / remarks', terms: 'Terms & conditions', makePdf: 'Create tax invoice PDF',
    makingPdf: 'Creating PDF…', download: 'Download PDF', share: 'Share invoice', valid: 'Invoice details are ready.',
    fillRequired: 'Add supplier and customer names, and complete each product description, quantity and rate.',
    gstinInvalid: 'GSTIN must be 15 characters. Check the highlighted GSTIN.', pincodeInvalid: 'PIN code must contain 6 digits.',
    pdfError: 'Could not create the invoice PDF. Check the invoice fields and try again.',
    shared: 'Invoice shared.',
    shareHint: 'Sharing options depend on your browser and installed apps. PDF download is always available.',
    customDetails: 'Add details you want printed: payment information, reference, or other notes.',
  },
  hi: {
    title: 'GST बिल मेकर', intro: 'टैक्स इनवॉइस बनाएँ। फर्म और सामान की जानकारी भरें; टैक्स और कुल अपने-आप जुड़ेंगे।',
    seller: 'विक्रेता की जानकारी', customer: 'ग्राहक की जानकारी', businessName: 'फर्म / कारोबार का नाम', gstin: 'GSTIN', pan: 'PAN',
    address: 'पता', state: 'राज्य', pincode: 'पिनकोड', phone: 'फोन', email: 'ईमेल', invoiceDetails: 'बिल की जानकारी',
    invoiceNo: 'बिल नंबर', date: 'बिल की तारीख', place: 'आपूर्ति का स्थान', supply: 'आपूर्ति का प्रकार', autoSupply: 'चुने गए राज्यों से अपने-आप तय',
    intra: 'एक ही राज्य · CGST + SGST', inter: 'दूसरा राज्य · IGST', products: 'सामान / सेवाएँ',
    description: 'विवरण', hsn: 'HSN / SAC', quantity: 'मात्रा', unit: 'इकाई', rate: 'दर (₹)', taxRate: 'GST %',
    addProduct: 'सामान जोड़ें', remove: 'पंक्ति हटाएँ', summary: 'बिल का हिसाब', taxable: 'टैक्स योग्य रकम', cgst: 'CGST',
    sgst: 'SGST', igst: 'IGST', gst: 'कुल GST', roundOff: 'राउंड ऑफ', total: 'बिल का कुल', transport: 'डिलीवरी और नोट',
    vehicle: 'गाड़ी नंबर', challan: 'डिलीवरी चालान / ऑर्डर नंबर', reverseCharge: 'रिवर्स चार्ज लागू है',
    notes: 'अतिरिक्त जानकारी / टिप्पणी', terms: 'नियम और शर्तें', makePdf: 'टैक्स बिल PDF बनाएँ',
    makingPdf: 'PDF बन रही है…', download: 'PDF डाउनलोड करें', share: 'बिल शेयर करें', valid: 'बिल की जानकारी तैयार है।',
    fillRequired: 'विक्रेता और ग्राहक का नाम, हर सामान का विवरण, मात्रा और दर भरें।',
    gstinInvalid: 'GSTIN 15 अक्षर का होना चाहिए। निशान लगी GSTIN जाँचें।', pincodeInvalid: 'पिनकोड 6 अंकों का होना चाहिए।',
    pdfError: 'बिल PDF नहीं बन सकी। जानकारी जाँचकर फिर कोशिश करें।',
    shared: 'बिल शेयर हो गया।',
    shareHint: 'शेयर विकल्प browser और डिवाइस के apps पर निर्भर हैं। PDF डाउनलोड हमेशा कर सकते हैं।',
    customDetails: 'प्रिंट होने वाली अतिरिक्त जानकारी भरें: भुगतान विवरण, संदर्भ या अन्य नोट।',
  },
}

const newLine = (): InvoiceLine => ({
  id: crypto.randomUUID(), description: '', hsn: '', quantity: '1', unit: 'pcs', rate: '', gstRate: '5',
})
const indianStates = [
  ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'],
  ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'], ['13', 'Nagaland'], ['14', 'Manipur'],
  ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'],
  ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'], ['28', 'Andhra Pradesh'],
  ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'], ['33', 'Tamil Nadu'],
  ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'], ['37', 'Andhra Pradesh'],
  ['38', 'Ladakh'],
] as const
const stateName = (code: string) => indianStates.find(([value]) => value === code)?.[1] ?? code
const emptyParty = (): Party => ({ name: '', gstin: '', pan: '', address: '', state: '', pincode: '', phone: '', email: '' })
const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100)
const pdfMoney = (paise: number) => `INR ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100)}`

function pdfSafe(value: string) {
  return value.replace(/₹/g, 'INR ').replace(/[^\x20-\x7E]/g, '?')
}

function textField(label: string, value: string, onChange: (value: string) => void, options: { type?: string; placeholder?: string; wide?: boolean; uppercase?: boolean } = {}) {
  return <label className={`field-label ${options.wide ? 'field-wide' : ''}`}>{label}<span className="field-input"><input type={options.type ?? 'text'} value={value} placeholder={options.placeholder} onChange={(event) => onChange(options.uppercase ? event.target.value.toUpperCase() : event.target.value)} /></span></label>
}

export function BillMaker({ language }: { language: Language }) {
  const t = copy[language]
  const [seller, setSeller] = useState<Party>(emptyParty)
  const [buyer, setBuyer] = useState<Party>(emptyParty)
  const [invoiceNo, setInvoiceNo] = useState(`INV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [place, setPlace] = useState('')
  const [supplyType, setSupplyType] = useState<SupplyType>('intra')
  const [lines, setLines] = useState<InvoiceLine[]>([newLine()])
  const [vehicle, setVehicle] = useState('')
  const [challan, setChallan] = useState('')
  const [reverseCharge, setReverseCharge] = useState(false)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const supplierLocation = seller.state || seller.gstin
  const placeStateCode = place.trim().match(/^\d{2}/)?.[0]
  const destinationLocation = placeStateCode || buyer.state || buyer.gstin
  const sellerState = supplierLocation.trim().match(/^\d{2}/)?.[0]
  const destinationState = destinationLocation.trim().match(/^\d{2}/)?.[0]
  const effectiveSupplyType = resolveSupplyType(supplierLocation, destinationLocation, supplyType)
  const detectedSupplyType = sellerState && destinationState ? effectiveSupplyType : null
  const totals = calculateInvoice(lines, effectiveSupplyType)
  const gstinBad = [seller.gstin, buyer.gstin].some((value) => value.trim() !== '' && !/^\d{2}[A-Z0-9]{13}$/.test(value.trim()))
  const pincodeBad = [seller.pincode, buyer.pincode].some((value) => value.trim() !== '' && !/^\d{6}$/.test(value.trim()))
  const ready = seller.name.trim() !== '' && buyer.name.trim() !== '' && lines.length > 0 && lines.every((line) => line.description.trim() && Number(line.quantity) > 0 && line.rate.trim() !== '' && Number.isFinite(Number(line.rate)) && Number(line.rate) >= 0 && Number.isFinite(Number(line.gstRate)) && Number(line.gstRate) >= 0 && Number(line.gstRate) <= 100) && !gstinBad && !pincodeBad

  function invalidatePdf() {
    setPdfUrl((current) => { if (current) URL.revokeObjectURL(current); return '' })
    setPdfFile(null)
  }

  function updateMetadata(setter: (value: string) => void, value: string) {
    setter(value)
    invalidatePdf()
  }

  function updateParty(which: 'seller' | 'buyer', field: keyof Party, value: string) {
    const setter = which === 'seller' ? setSeller : setBuyer
    setter((party) => ({ ...party, [field]: value }))
    invalidatePdf()
  }

  function updateLine(id: string, field: keyof InvoiceLineInput, value: string) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, [field]: value } : line))
    invalidatePdf()
  }

  async function createInvoicePdf() {
    if (!ready) {
      setError(gstinBad ? t.gstinInvalid : pincodeBad ? t.pincodeInvalid : t.fillRequired)
      return
    }
    setWorking(true)
    setError('')
    setNotice('')
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
      const document = await PDFDocument.create()
      const regular = await document.embedFont(StandardFonts.Helvetica)
      const bold = await document.embedFont(StandardFonts.HelveticaBold)
      const pageWidth = 595.28
      const pageHeight = Math.max(842, 690 + lines.length * 24)
      const page = document.addPage([pageWidth, pageHeight])
      const ink = rgb(0.13, 0.19, 0.16)
      const muted = rgb(0.36, 0.42, 0.38)
      const green = rgb(0.09, 0.36, 0.26)
  const soft = rgb(0.92, 0.96, 0.92)
      const draw = (value: string, x: number, y: number, size = 9, strong = false, color = ink) => {
        page.drawText(pdfSafe(value || '-'), { x, y, size, font: strong ? bold : regular, color, maxWidth: pageWidth - x - 34 })
      }
      const line = (y: number) => page.drawLine({ start: { x: 34, y }, end: { x: pageWidth - 34, y }, thickness: 0.6, color: rgb(0.82, 0.86, 0.82) })
      page.drawRectangle({ x: 0, y: pageHeight - 108, width: pageWidth, height: 108, color: soft })
      draw('TAX INVOICE', 34, pageHeight - 48, 19, true, green)
      draw(seller.name, 34, pageHeight - 69, 12, true)
      draw(`Invoice No: ${invoiceNo}    Date: ${invoiceDate}`, 365, pageHeight - 48, 9, true)
      draw('Supplier', 34, pageHeight - 130, 9, true, green)
      draw(seller.name, 34, pageHeight - 146, 10, true)
      draw(`GSTIN: ${seller.gstin}   PAN: ${seller.pan}`, 34, pageHeight - 162, 8)
      draw(seller.address, 34, pageHeight - 178, 8)
      draw(`State: ${stateName(seller.state)} (${seller.state})   PIN: ${seller.pincode}   Phone: ${seller.phone}`, 34, pageHeight - 194, 8)
      draw(`Email: ${seller.email}`, 34, pageHeight - 210, 8)
      draw('Bill to', 310, pageHeight - 130, 9, true, green)
      draw(buyer.name, 310, pageHeight - 146, 10, true)
      draw(`GSTIN: ${buyer.gstin}`, 310, pageHeight - 162, 8)
      draw(buyer.address, 310, pageHeight - 178, 8)
      draw(`State: ${stateName(buyer.state)} (${buyer.state})   PIN: ${buyer.pincode}   Phone: ${buyer.phone}`, 310, pageHeight - 194, 8)
      draw(`Email: ${buyer.email}`, 310, pageHeight - 210, 8)
      line(pageHeight - 226)
      draw(`Place of supply: ${place || stateName(buyer.state)}`, 34, pageHeight - 244, 8, true)
      draw(`Supply: ${effectiveSupplyType === 'intra' ? 'Intra-state (CGST + SGST)' : 'Inter-state (IGST)'}`, 310, pageHeight - 244, 8, true)
      draw(`Vehicle: ${vehicle}   Delivery challan / order: ${challan}`, 34, pageHeight - 260, 8)
      draw(`Reverse charge: ${reverseCharge ? 'Yes' : 'No'}`, 310, pageHeight - 260, 8)
      const tableTop = pageHeight - 286
      page.drawRectangle({ x: 34, y: tableTop - 22, width: pageWidth - 68, height: 22, color: green })
      draw('Description', 40, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('HSN', 215, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('Qty', 272, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('Rate', 320, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('GST', 378, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('Taxable', 419, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('Tax', 485, tableTop - 15, 7, true, rgb(1, 1, 1))
      draw('Amount', 531, tableTop - 15, 7, true, rgb(1, 1, 1))
      let y = tableTop - 39
      totals.lines.forEach((item, index) => {
        if (index % 2 === 1) page.drawRectangle({ x: 34, y: y - 6, width: pageWidth - 68, height: 22, color: rgb(0.97, 0.98, 0.96) })
        draw(item.description, 40, y, 7.5)
        draw(item.hsn, 215, y, 7.5)
        draw(`${item.quantity} ${item.unit}`, 272, y, 7.5)
        draw((Number(item.rate) || 0).toFixed(2), 320, y, 7.5)
        draw(`${item.gstRate}%`, 378, y, 7.5)
        draw((item.taxablePaise / 100).toFixed(2), 419, y, 7.5)
        draw((item.gstPaise / 100).toFixed(2), 485, y, 7.5)
        draw((item.totalPaise / 100).toFixed(2), 531, y, 7.5)
        y -= 24
      })
      line(y + 7)
      y -= 12
      const totalsX = 375
      draw(`Taxable value    ${pdfMoney(totals.taxablePaise)}`, totalsX, y, 8)
      y -= 15
      if (effectiveSupplyType === 'intra') {
        draw(`CGST             ${pdfMoney(totals.cgstPaise)}`, totalsX, y, 8); y -= 15
        draw(`SGST             ${pdfMoney(totals.sgstPaise)}`, totalsX, y, 8); y -= 15
      } else {
        draw(`IGST             ${pdfMoney(totals.igstPaise)}`, totalsX, y, 8); y -= 15
      }
      draw(`Total GST        ${pdfMoney(totals.gstPaise)}`, totalsX, y, 8); y -= 15
      draw(`Round off        ${pdfMoney(totals.roundOffPaise)}`, totalsX, y, 8); y -= 19
      page.drawRectangle({ x: totalsX - 7, y: y - 7, width: pageWidth - totalsX - 27, height: 25, color: green })
      draw(`INVOICE TOTAL   ${pdfMoney(totals.roundedTotalPaise)}`, totalsX, y + 2, 10, true, rgb(1, 1, 1))
      y -= 30
      if (notes) { draw('Remarks / additional details', 34, y, 8, true, green); y -= 14; draw(notes, 34, y, 8); y -= 18 }
      if (terms) { draw('Terms & conditions', 34, y, 8, true, green); y -= 14; draw(terms, 34, y, 8); y -= 18 }
      draw('Authorised signature', pageWidth - 145, 54, 8, true, muted)
      line(70)
      draw(`${seller.name}  ·  Tax invoice`, 34, 52, 8, false, muted)
      const blob = new Blob([await document.save()], { type: 'application/pdf' })
      const file = new File([blob], `${invoiceNo || 'tax-invoice'}.pdf`, { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfUrl((current) => { if (current) URL.revokeObjectURL(current); return url })
      setPdfFile(file)
    } catch (caught) {
      console.error('Invoice PDF creation failed:', caught)
      setError(t.pdfError)
    } finally {
      setWorking(false)
    }
  }

  async function shareInvoice() {
    if (!pdfFile) return
    try {
      if (navigator.canShare?.({ files: [pdfFile] }) && navigator.share) await navigator.share({ files: [pdfFile], title: invoiceNo })
      else {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = pdfFile.name
        link.click()
      }
      setNotice(t.shared)
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') return
      setError(t.pdfError)
    }
  }

  return (
    <section className="invoice-page">
      <header className="tool-page-heading"><span className="tool-heading-icon"><FileText size={22} /></span><div><h1>{t.title}</h1><p>{t.intro}</p></div></header>
      <div className="invoice-metadata invoice-panel">
        <h2>{t.invoiceDetails}</h2><div className="invoice-grid">
          {textField(t.invoiceNo, invoiceNo, (value) => updateMetadata(setInvoiceNo, value))}
          {textField(t.date, invoiceDate, (value) => updateMetadata(setInvoiceDate, value), { type: 'date' })}
          {textField(t.place, place, (value) => updateMetadata(setPlace, value), { placeholder: '08 - Rajasthan' })}
        </div>
      </div>

      <div className="party-grid">
        {([['seller', seller, t.seller], ['buyer', buyer, t.customer]] as const).map(([which, party, title]) => <section className="invoice-panel party-panel" key={which}>
          <h2>{title}</h2><div className="invoice-grid">
            {textField(t.businessName, party.name, (value) => updateParty(which, 'name', value), { wide: true })}
            {textField(t.gstin, party.gstin, (value) => updateParty(which, 'gstin', value), { uppercase: true })}
            {textField(t.pan, party.pan, (value) => updateParty(which, 'pan', value), { uppercase: true })}
            {textField(t.address, party.address, (value) => updateParty(which, 'address', value), { wide: true })}
            <label className="field-label">{t.state}<span className="field-input"><select value={party.state} onChange={(event) => updateParty(which, 'state', event.target.value)}><option value="">Select state</option>{indianStates.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></span></label>
            {textField(t.pincode, party.pincode, (value) => updateParty(which, 'pincode', value.replace(/\D/g, '').slice(0, 6)), { placeholder: '302001' })}
            {textField(t.phone, party.phone, (value) => updateParty(which, 'phone', value), { type: 'tel' })}
            {textField(t.email, party.email, (value) => updateParty(which, 'email', value), { type: 'email' })}
          </div>
        </section>)}
      </div>

      <section className="invoice-panel supply-panel"><h2>{t.supply}</h2>{detectedSupplyType && <p className="supply-detected">{t.autoSupply}: {stateName(sellerState ?? '')} → {stateName(destinationState ?? '')} · {effectiveSupplyType === 'intra' ? t.intra : t.inter}</p>}<div className="choice-row">
        <label><input type="radio" name="invoice-supply" checked={effectiveSupplyType === 'intra'} onChange={() => { setSupplyType('intra'); invalidatePdf() }} />{t.intra}</label>
        <label><input type="radio" name="invoice-supply" checked={effectiveSupplyType === 'inter'} onChange={() => { setSupplyType('inter'); invalidatePdf() }} />{t.inter}</label>
      </div></section>

      <section className="invoice-panel products-panel"><div className="invoice-section-head"><h2>{t.products}</h2><button className="secondary-button" onClick={() => { setLines((current) => [...current, newLine()]); invalidatePdf() }}><Plus size={16} />{t.addProduct}</button></div>
        <div className="invoice-table-wrap"><table className="invoice-table"><thead><tr><th>{t.description}</th><th>{t.hsn}</th><th>{t.quantity}</th><th>{t.unit}</th><th>{t.rate}</th><th>{t.taxRate}</th><th>{t.total}</th><th /></tr></thead><tbody>
          {totals.lines.map((line, index) => {
            const id = lines[index].id
            return <tr key={id}>
              <td><input aria-label={t.description} value={line.description} onChange={(event) => updateLine(id, 'description', event.target.value)} placeholder={t.description} /></td>
              <td><input aria-label={t.hsn} value={line.hsn} onChange={(event) => updateLine(id, 'hsn', event.target.value)} placeholder="HSN" /></td>
              <td><input aria-label={t.quantity} type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(id, 'quantity', event.target.value)} /></td>
              <td><input aria-label={t.unit} value={line.unit} onChange={(event) => updateLine(id, 'unit', event.target.value)} /></td>
              <td><input aria-label={t.rate} type="number" min="0" step="0.01" value={line.rate} onChange={(event) => updateLine(id, 'rate', event.target.value)} placeholder="0.00" /></td>
              <td><input aria-label={t.taxRate} type="number" min="0" max="100" step="0.01" value={line.gstRate} onChange={(event) => updateLine(id, 'gstRate', event.target.value)} /></td>
              <td className="invoice-line-total">{money(line.totalPaise)}</td>
              <td><button className="remove-button" title={t.remove} aria-label={`${t.remove} ${index + 1}`} disabled={lines.length === 1} onClick={() => { setLines((current) => current.filter((entry) => entry.id !== id)); invalidatePdf() }}><Trash2 size={15} /></button></td>
            </tr>
          })}
        </tbody></table></div>
      </section>

      <section className="invoice-panel delivery-panel"><h2>{t.transport}</h2><div className="invoice-grid">
        {textField(t.vehicle, vehicle, (value) => updateMetadata(setVehicle, value))}{textField(t.challan, challan, (value) => updateMetadata(setChallan, value))}
        <label className="invoice-checkbox field-wide"><input type="checkbox" checked={reverseCharge} onChange={(event) => { setReverseCharge(event.target.checked); invalidatePdf() }} />{t.reverseCharge}</label>
        {textField(t.notes, notes, (value) => updateMetadata(setNotes, value), { wide: true })}{textField(t.terms, terms, (value) => updateMetadata(setTerms, value), { wide: true })}
      </div></section>

      <section className="invoice-panel invoice-summary"><h2>{t.summary}</h2><div className="summary-rows">
        <div><span>{t.taxable}</span><strong>{money(totals.taxablePaise)}</strong></div>
        {effectiveSupplyType === 'intra' ? <><div><span>{t.cgst}</span><strong>{money(totals.cgstPaise)}</strong></div><div><span>{t.sgst}</span><strong>{money(totals.sgstPaise)}</strong></div></> : <div><span>{t.igst}</span><strong>{money(totals.igstPaise)}</strong></div>}
        <div><span>{t.gst}</span><strong>{money(totals.gstPaise)}</strong></div><div><span>{t.roundOff}</span><strong>{money(totals.roundOffPaise)}</strong></div>
        <div className="invoice-grand-total"><span>{t.total}</span><strong>{money(totals.roundedTotalPaise)}</strong></div>
      </div></section>

      {error && <p className="tool-error" role="alert">{error}</p>}{notice && <p className="tool-note" role="status">{notice}</p>}
      <div className="invoice-actions"><button className="primary-button" onClick={() => void createInvoicePdf()} disabled={working}>{working ? t.makingPdf : t.makePdf}</button>
        {pdfUrl && <><a className="secondary-button" href={pdfUrl} download={`${invoiceNo || 'tax-invoice'}.pdf`}><Download size={16} />{t.download}</a><button className="secondary-button" onClick={() => void shareInvoice()}><Share2 size={16} />{t.share}</button></>}
      </div>
      <p className="invoice-share-hint">{ready ? t.valid : t.fillRequired} {t.shareHint}</p>
    </section>
  )
}
