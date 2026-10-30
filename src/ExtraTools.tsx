import { useEffect, useRef, useReducer, useState } from 'react'
import { Calculator, Check, Download, FileImage, Share2, Upload, X } from 'lucide-react'
import { calculatorReducer, initialCalculatorState } from './calculator'
import { parseRupeesToPaise } from './calculation'
import { calculateInterest } from './interest'

type Language = 'en' | 'hi'
type Entry = { id: string; file: File; preview: string }
type ToolText = {
  title: string
  intro: string
  amount: string
  add: string
  remove: string
  clear: string
  total: string
  invalid: string
  pdfTitle: string
  pdfIntro: string
  addImages: string
  makePdf: string
  creating: string
  share: string
  download: string
  empty: string
  page: string
  removeImage: string
  shareHint: string
  downloaded: string
  shareError: string
  imageError: string
  pdfError: string
  privacy: string
  basic: string
  gst: string
  interest: string
  standardTitle: string
  standardIntro: string
  gstTitle: string
  gstIntro: string
  gstAmount: string
  gstRate: string
  gstMode: string
  priceExclusive: string
  priceInclusive: string
  intraState: string
  interState: string
  taxable: string
  tax: string
  cgst: string
  sgst: string
  igst: string
  totalWithTax: string
  interestTitle: string
  principal: string
  annualRate: string
  duration: string
  months: string
  years: string
  simple: string
  compound: string
  frequency: string
  monthly: string
  quarterly: string
  annually: string
  interestAmount: string
  maturityAmount: string
  calculatorError: string
}

const labels: Record<Language, ToolText> = {
  en: {
    title: 'Manual calculator',
    intro: 'Enter amounts below. The sum updates as you type.',
    amount: 'Amount in rupees',
    add: 'Add amount',
    remove: 'Remove amount',
    clear: 'Clear all',
    total: 'Calculated total',
    invalid: 'Enter a valid non-negative amount.',
    pdfTitle: 'Image to PDF',
    pdfIntro: 'Combine bill photos into a PDF, then download it or share the file.',
    addImages: 'Add images',
    makePdf: 'Create PDF',
    creating: 'Creating PDF…',
    share: 'Share PDF',
    download: 'Download PDF',
    empty: 'Choose one or more bill images to start.',
    page: 'page',
    removeImage: 'Remove image',
    shareHint: 'Your device share menu may offer Gmail, WhatsApp, Drive, Nearby/Quick Share, or Files, depending on installed apps and browser support.',
    downloaded: 'PDF downloaded. Attach it in your preferred app.',
    shareError: 'Could not open sharing. Download the PDF and share it from your device.',
    imageError: 'Choose image files supported by this browser.',
    pdfError: 'Could not create this PDF. Try smaller or clearer images.',
    privacy: 'Images are converted on this device.',
    basic: 'Basic', gst: 'GST', interest: 'Interest',
    standardTitle: 'Standard calculator', standardIntro: 'Use the keypad or your keyboard for everyday calculations.',
    gstTitle: 'GST calculator', gstIntro: 'Calculate tax from an inclusive or exclusive price.',
    gstAmount: 'Amount in rupees', gstRate: 'GST rate', gstMode: 'Price includes GST?',
    priceExclusive: 'Add GST to amount', priceInclusive: 'GST included in amount',
    intraState: 'Same state · CGST + SGST', interState: 'Different state · IGST',
    taxable: 'Taxable amount', tax: 'GST amount', cgst: 'CGST', sgst: 'SGST', igst: 'IGST', totalWithTax: 'Total with GST',
    interestTitle: 'Interest calculator', principal: 'Principal amount', annualRate: 'Annual interest rate (%)', duration: 'Time period',
    months: 'Months', years: 'Years', simple: 'Simple interest', compound: 'Compound interest', frequency: 'Compounding',
    monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', interestAmount: 'Interest earned', maturityAmount: 'Maturity amount',
    calculatorError: 'Enter valid amounts and rates.',
  },
  hi: {
    title: 'मैनुअल कैलकुलेटर',
    intro: 'नीचे रकम भरें। जोड़ अपने-आप अपडेट होगा।',
    amount: 'रकम रुपये में',
    add: 'रकम जोड़ें',
    remove: 'रकम हटाएँ',
    clear: 'सब साफ़ करें',
    total: 'कुल जोड़',
    invalid: 'सही शून्य या उससे बड़ी रकम डालें।',
    pdfTitle: 'Image से PDF',
    pdfIntro: 'एक या अधिक बिल तस्वीरों को PDF में जोड़ें, फिर डाउनलोड या शेयर करें।',
    addImages: 'तस्वीरें चुनें',
    makePdf: 'PDF बनाएँ',
    creating: 'PDF बन रही है…',
    share: 'PDF शेयर करें',
    download: 'PDF डाउनलोड करें',
    empty: 'शुरू करने के लिए बिल की एक या अधिक तस्वीरें चुनें।',
    page: 'पेज',
    removeImage: 'तस्वीर हटाएँ',
    shareHint: 'डिवाइस के share menu में Gmail, WhatsApp, Drive, Nearby/Quick Share या Files दिख सकते हैं; यह आपके apps और browser पर निर्भर है।',
    downloaded: 'PDF डाउनलोड हुई। इसे अपने पसंदीदा app में जोड़कर भेजें।',
    shareError: 'शेयर menu नहीं खुला। PDF डाउनलोड करके डिवाइस से भेजें।',
    imageError: 'इस browser में खुलने वाली image चुनें।',
    pdfError: 'PDF नहीं बन सकी। छोटी या साफ़ तस्वीरों से कोशिश करें।',
    privacy: 'तस्वीर इसी डिवाइस पर PDF में बदलती है।',
    basic: 'साधारण', gst: 'GST', interest: 'ब्याज',
    standardTitle: 'सामान्य कैलकुलेटर', standardIntro: 'रोज़ के हिसाब के लिए keypad या keyboard से गणना करें।',
    gstTitle: 'GST कैलकुलेटर', gstIntro: 'GST सहित या GST रहित रकम का टैक्स निकालें।',
    gstAmount: 'रकम रुपये में', gstRate: 'GST दर', gstMode: 'क्या रकम में GST शामिल है?',
    priceExclusive: 'रकम पर GST जोड़ें', priceInclusive: 'रकम में GST शामिल है',
    intraState: 'एक ही राज्य · CGST + SGST', interState: 'दूसरा राज्य · IGST',
    taxable: 'टैक्स योग्य रकम', tax: 'GST रकम', cgst: 'CGST', sgst: 'SGST', igst: 'IGST', totalWithTax: 'GST सहित कुल',
    interestTitle: 'ब्याज कैलकुलेटर', principal: 'मूल रकम', annualRate: 'सालाना ब्याज दर (%)', duration: 'समय अवधि',
    months: 'महीने', years: 'साल', simple: 'साधारण ब्याज', compound: 'चक्रवृद्धि ब्याज', frequency: 'ब्याज जुड़ने की अवधि',
    monthly: 'मासिक', quarterly: 'तिमाही', annually: 'सालाना', interestAmount: 'कुल ब्याज', maturityAmount: 'अंतिम रकम',
    calculatorError: 'सही रकम और दर भरें।',
  },
}

function money(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100)
}

function readPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not load image'))
    reader.readAsDataURL(file)
  })
}

async function imageToJpeg(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 3200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image conversion failed')), 'image/jpeg', 0.88)
  })
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height }
}

async function convertImagesToPdf(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  const document = await PDFDocument.create()
  for (const file of files) {
    const converted = await imageToJpeg(file)
    const image = await document.embedJpg(converted.bytes)
    const scale = Math.min(1, 1440 / Math.max(converted.width, converted.height))
    const width = converted.width * scale
    const height = converted.height * scale
    const margin = 28
    const page = document.addPage([width + margin * 2, height + margin * 2])
    page.drawImage(image, { x: margin, y: margin, width, height })
  }
  return new Blob([await document.save()], { type: 'application/pdf' })
}

export function ManualCalculator({ language }: { language: Language }) {
  const copy = labels[language]
  const [calculatorMode, setCalculatorMode] = useState<'basic' | 'gst' | 'interest'>('basic')
  const [calculator, dispatch] = useReducer(calculatorReducer, initialCalculatorState)
  const [gstAmount, setGstAmount] = useState('')
  const [gstRate, setGstRate] = useState('18')
  const [gstInclusive, setGstInclusive] = useState(false)
  const [supplyType, setSupplyType] = useState<'intra' | 'inter'>('intra')
  const [principal, setPrincipal] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [duration, setDuration] = useState('1')
  const [durationUnit, setDurationUnit] = useState<'months' | 'years'>('years')
  const [interestMode, setInterestMode] = useState<'simple' | 'compound'>('simple')
  const [compoundFrequency, setCompoundFrequency] = useState('12')

  useEffect(() => {
    if (calculatorMode !== 'basic') return
    function handleKey(event: KeyboardEvent) {
      if (/^[0-9]$/.test(event.key)) dispatch({ type: 'digit', value: event.key })
      else if (event.key === '.') dispatch({ type: 'decimal' })
      else if (event.key === 'Enter' || event.key === '=') dispatch({ type: 'equals' })
      else if (event.key === 'Backspace') dispatch({ type: 'backspace' })
      else if (event.key === 'Escape') dispatch({ type: 'clear' })
      else if (event.key === '+') dispatch({ type: 'operator', value: '+' })
      else if (event.key === '-') dispatch({ type: 'operator', value: '−' })
      else if (event.key === '*') dispatch({ type: 'operator', value: '×' })
      else if (event.key === '/') { event.preventDefault(); dispatch({ type: 'operator', value: '÷' }) }
      else if (event.key === '%') dispatch({ type: 'percent' })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [calculatorMode])

  const amountPaise = parseRupeesToPaise(gstAmount)
  const rate = Number(gstRate)
  const gstRateValid = gstRate.trim() !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 100
  const taxablePaise = amountPaise === null ? 0 : gstInclusive ? Math.round(amountPaise * 100 / (100 + rate)) : amountPaise
  const taxPaise = amountPaise === null || !gstRateValid ? 0 : gstInclusive ? amountPaise - taxablePaise : Math.round(taxablePaise * rate / 100)
  const gstCgst = supplyType === 'intra' ? Math.floor(taxPaise / 2) : 0
  const gstSgst = supplyType === 'intra' ? taxPaise - gstCgst : 0
  const gstIgst = supplyType === 'inter' ? taxPaise : 0
  const gstTotal = gstInclusive ? amountPaise ?? 0 : taxablePaise + taxPaise
  const principalValue = Number(principal)
  const rateValue = Number(annualRate)
  const periodYears = Number(duration) / (durationUnit === 'months' ? 12 : 1)
  const frequency = Number(compoundFrequency)
  const interestResult = calculateInterest(principalValue, rateValue, Number(duration), durationUnit, interestMode, frequency)
  const interestIsValid = principal.trim() !== '' && annualRate.trim() !== '' && duration.trim() !== '' && periodYears >= 0 && interestResult !== null
  const interestValue = interestResult?.interest ?? 0
  const maturityValue = interestResult?.maturity ?? 0
  const keypad: Array<{ label: string; action: Parameters<typeof calculatorReducer>[1]; className?: string }> = [
    { label: 'AC', action: { type: 'clear' }, className: 'key-utility' },
    { label: '±', action: { type: 'sign' }, className: 'key-utility' },
    { label: '%', action: { type: 'percent' }, className: 'key-utility' },
    { label: '÷', action: { type: 'operator', value: '÷' }, className: 'key-operator' },
    { label: '7', action: { type: 'digit', value: '7' } },
    { label: '8', action: { type: 'digit', value: '8' } },
    { label: '9', action: { type: 'digit', value: '9' } },
    { label: '×', action: { type: 'operator', value: '×' }, className: 'key-operator' },
    { label: '4', action: { type: 'digit', value: '4' } },
    { label: '5', action: { type: 'digit', value: '5' } },
    { label: '6', action: { type: 'digit', value: '6' } },
    { label: '−', action: { type: 'operator', value: '−' }, className: 'key-operator' },
    { label: '1', action: { type: 'digit', value: '1' } },
    { label: '2', action: { type: 'digit', value: '2' } },
    { label: '3', action: { type: 'digit', value: '3' } },
    { label: '+', action: { type: 'operator', value: '+' }, className: 'key-operator' },
    { label: '⌫', action: { type: 'backspace' }, className: 'key-utility' },
    { label: '0', action: { type: 'digit', value: '0' } },
    { label: '.', action: { type: 'decimal' } },
    { label: '=', action: { type: 'equals' }, className: 'key-equals' },
  ]

  return (
    <section className="tool-page">
      <header className="tool-page-heading"><span className="tool-heading-icon"><Calculator size={22} /></span><div><h1>{copy.title}</h1><p>{copy.standardIntro}</p></div></header>
      <div className="calculator-mode-tabs" role="tablist" aria-label={copy.title}>
        {(['basic', 'gst', 'interest'] as const).map((mode) => <button key={mode} role="tab" aria-selected={calculatorMode === mode} className={calculatorMode === mode ? 'active' : ''} onClick={() => setCalculatorMode(mode)}>{copy[mode]}</button>)}
      </div>

      {calculatorMode === 'basic' && <div className="standard-calculator">
        <div className="standard-display"><span>{calculator.expression || copy.standardIntro}</span><strong>{calculator.display}</strong></div>
        <div className="calculator-keypad">{keypad.map((key) => <button key={key.label} className={key.className ?? 'key-number'} onClick={() => dispatch(key.action)}>{key.label}</button>)}</div>
      </div>}

      {calculatorMode === 'gst' && <div className="calculator-tool gst-tool">
        <h2>{copy.gstTitle}</h2><p>{copy.gstIntro}</p>
        <div className="gst-input-grid">
          <label className="field-label">{copy.gstAmount}<span className="field-input"><b>₹</b><input type="number" min="0" step="0.01" value={gstAmount} onChange={(event) => setGstAmount(event.target.value)} placeholder="0.00" /></span></label>
          <label className="field-label">{copy.gstRate}<span className="field-input"><input type="number" min="0" max="100" step="0.01" value={gstRate} onChange={(event) => setGstRate(event.target.value)} placeholder="18.00" /><b>%</b></span></label>
        </div>
        {!gstRateValid && <p className="tool-error">{copy.calculatorError}</p>}
        <div className="form-fieldset"><span>{copy.gstMode}</span><div className="choice-row"><label><input type="checkbox" checked={gstInclusive} onChange={(event) => setGstInclusive(event.target.checked)} />{gstInclusive ? copy.priceInclusive : copy.priceExclusive}</label></div></div>
        <div className="form-fieldset"><span>Supply type</span><div className="choice-row"><label><input type="radio" name="gst-supply" checked={supplyType === 'intra'} onChange={() => setSupplyType('intra')} />{copy.intraState}</label><label><input type="radio" name="gst-supply" checked={supplyType === 'inter'} onChange={() => setSupplyType('inter')} />{copy.interState}</label></div></div>
        <div className="gst-summary">
          <div><span>{copy.taxable}</span><strong>{money(taxablePaise)}</strong></div>
          <div><span>{copy.tax}</span><strong>{money(taxPaise)}</strong></div>
          {supplyType === 'intra' ? <><div><span>{copy.cgst}</span><strong>{money(gstCgst)}</strong></div><div><span>{copy.sgst}</span><strong>{money(gstSgst)}</strong></div></> : <div><span>{copy.igst}</span><strong>{money(gstIgst)}</strong></div>}
          <div className="gst-total"><span>{copy.totalWithTax}</span><strong>{money(gstTotal)}</strong></div>
        </div>
      </div>}

      {calculatorMode === 'interest' && <div className="calculator-tool interest-tool">
        <h2>{copy.interestTitle}</h2>
        <div className="interest-fields">
          <label className="field-label">{copy.principal}<span className="field-input"><b>₹</b><input type="number" min="0" step="0.01" value={principal} onChange={(event) => setPrincipal(event.target.value)} placeholder="0.00" /></span></label>
          <label className="field-label">{copy.annualRate}<span className="field-input"><input type="number" min="0" step="0.01" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} placeholder="0.00" /><b>%</b></span></label>
          <label className="field-label">{copy.duration}<span className="duration-input"><input type="number" min="0" step="0.1" value={duration} onChange={(event) => setDuration(event.target.value)} /><select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as 'months' | 'years')}><option value="months">{copy.months}</option><option value="years">{copy.years}</option></select></span></label>
        </div>
        <div className="choice-row interest-choice"><label><input type="radio" name="interest-mode" checked={interestMode === 'simple'} onChange={() => setInterestMode('simple')} />{copy.simple}</label><label><input type="radio" name="interest-mode" checked={interestMode === 'compound'} onChange={() => setInterestMode('compound')} />{copy.compound}</label></div>
        {interestMode === 'compound' && <label className="field-label frequency-field">{copy.frequency}<span className="field-input"><select value={compoundFrequency} onChange={(event) => setCompoundFrequency(event.target.value)}><option value="12">{copy.monthly}</option><option value="4">{copy.quarterly}</option><option value="1">{copy.annually}</option></select></span></label>}
        {!interestIsValid && <p className="tool-error">{copy.calculatorError}</p>}
        <div className="interest-summary"><div><span>{copy.interestAmount}</span><strong>{money(Math.round(interestValue * 100))}</strong></div><div><span>{copy.maturityAmount}</span><strong>{money(Math.round(maturityValue * 100))}</strong></div></div>
      </div>}
    </section>
  )
}

export function ImagePdfTool({ language }: { language: Language }) {
  const copy = labels[language]
  const [images, setImages] = useState<Entry[]>([])
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    const selected = Array.from(files)
    if (selected.some((file) => !file.type.startsWith('image/'))) {
      setError(copy.imageError)
      return
    }
    try {
      const entries = await Promise.all(selected.map(async (file) => ({ id: crypto.randomUUID(), file, preview: await readPreview(file) })))
      setImages((current) => [...current, ...entries])
      setPdfUrl((current) => { if (current) URL.revokeObjectURL(current); return '' })
      setPdfFile(null)
      setError('')
      setNote('')
    } catch {
      setError(copy.imageError)
    }
  }

  function removeImage(id: string) {
    setImages((current) => current.filter((entry) => entry.id !== id))
    setPdfUrl((current) => { if (current) URL.revokeObjectURL(current); return '' })
    setPdfFile(null)
  }

  async function createPdf() {
    if (!images.length) return
    setWorking(true)
    setError('')
    setNote('')
    try {
      const blob = await convertImagesToPdf(images.map((entry) => entry.file))
      setPdfFile(new File([blob], 'bill-images.pdf', { type: 'application/pdf' }))
      setPdfUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(blob) })
    } catch {
      setError(copy.pdfError)
    } finally {
      setWorking(false)
    }
  }

  async function sharePdf() {
    if (!pdfFile) return
    try {
      if (navigator.canShare?.({ files: [pdfFile] }) && navigator.share) {
        await navigator.share({ files: [pdfFile], title: 'Bill images PDF' })
      } else {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = 'bill-images.pdf'
        link.click()
        setNote(copy.downloaded)
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') return
      setNote(copy.shareError)
    }
  }

  return (
    <section className="tool-page">
      <header className="tool-page-heading"><span className="tool-heading-icon"><FileImage size={22} /></span><div><h1>{copy.pdfTitle}</h1><p>{copy.pdfIntro}</p></div></header>
      <div className="pdf-tool">
        <div className="pdf-toolbar"><button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={17} />{copy.addImages}</button><span>{images.length} {copy.page}{images.length === 1 ? '' : 's'}</span><input ref={fileInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = '' }} /></div>
        {images.length === 0 ? <button className="pdf-empty" onClick={() => fileInput.current?.click()}><span><FileImage size={25} /></span><strong>{copy.empty}</strong><small>{copy.privacy}</small></button> : <div className="pdf-image-grid">{images.map((entry, index) => <article className="pdf-image-item" key={entry.id}><img src={entry.preview} alt={`PDF page ${index + 1}`} /><span className="pdf-page-number">{String(index + 1).padStart(2, '0')}</span><button aria-label={`${copy.removeImage} ${index + 1}`} title={copy.removeImage} onClick={() => removeImage(entry.id)}><X size={15} /></button></article>)}</div>}
        {error && <p className="tool-error" role="alert">{error}</p>}
        {note && <p className="tool-note" role="status">{note}</p>}
        {pdfUrl && <div className="pdf-ready"><Check size={17} /><span>PDF ready · {images.length} {copy.page}{images.length === 1 ? '' : 's'}</span><a href={pdfUrl} download="bill-images.pdf"><Download size={15} />{copy.download}</a><button onClick={() => void sharePdf()}><Share2 size={15} />{copy.share}</button></div>}
        <div className="pdf-actions"><button className="primary-button" onClick={() => void createPdf()} disabled={working || images.length === 0}>{working ? copy.creating : copy.makePdf}</button></div>
        <p className="share-hint">{copy.shareHint}</p>
      </div>
    </section>
  )
}
