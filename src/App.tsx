import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  FileImage,
  FileText,
  Languages,
  LoaderCircle,
  Plus,
  RotateCcw,
  ScanLine,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { getBillStatus, parseRupeesToPaise, sumPaise } from './calculation'
import { listBills, saveBill } from './history'
import { recognizeBillLocally } from './localOcr'
import type { RecognitionResult, RecognizedAmount, SavedBill } from './types'

const ManualCalculator = lazy(() => import('./ExtraTools').then((module) => ({ default: module.ManualCalculator })))
const ImagePdfTool = lazy(() => import('./ExtraTools').then((module) => ({ default: module.ImagePdfTool })))
const BillMaker = lazy(() => import('./BillMaker').then((module) => ({ default: module.BillMaker })))

type Language = 'en' | 'hi'
type ReviewAmount = RecognizedAmount & { value: string }

const text = {
  en: {
    subtitle: 'One App. All Your Business Calculations.',
    history: 'Recent bills',
    newBill: 'New check',
    eyebrow: 'BILL VERIFICATION',
    headline: 'Check the sum.\nKeep the proof.',
    intro: 'Photograph a handwritten bill, review the amounts, and verify the total.',
    camera: 'Open camera',
    upload: 'Upload bill',
    capture: 'Capture bill',
    retake: 'Retake photo',
    choose: 'Choose another image',
    check: 'Check Bill Total',
    checking: 'Reading bill…',
    crop: 'Crop and position the bill',
    rotate: 'Rotate 90°',
    zoom: 'Zoom',
    enhance: 'Improve clarity',
    amounts: 'Recognized amounts',
    lineItems: 'Line items only',
    amount: 'Amount (₹)',
    confidence: 'Reading confidence',
    written: 'Written bill total',
    add: 'Add amount',
    remove: 'Remove amount',
    confirmed: 'I checked this amount',
    totalConfirmed: 'I checked the written total',
    complete: 'I reviewed the image and this list includes all item amounts.',
    recalculate: 'Recalculate Total',
    verify: 'Verify and save result',
    calculated: 'Calculated total',
    difference: 'Difference',
    matched: 'TOTAL MATCHED',
    mismatch: 'TOTAL MISMATCH',
    extra: 'WRITTEN TOTAL IS EXTRA',
    needsReview: 'REVIEW BEFORE VERIFYING',
    uncertain: 'Some amounts could not be recognized correctly. Please review the highlighted numbers.',
    duplicates: 'Repeated amounts found. Confirm whether each one is a separate bill item.',
    unreadable: 'This image is too unclear to verify. Retake it in good light with the full bill in focus.',
    warnings: 'Please review these notes',
    ready: 'Check every highlighted amount and confirm the written total before verification.',
    saved: 'Saved to bill history on this device.',
    emptyHistory: 'Checked bills will appear here.',
    noImage: 'Add a bill photo to begin',
    noImageHint: 'Use your camera or choose a clear photo of the full bill.',
    manual: 'Manual amount',
    source: 'Your image is read on this device; saved history stays here.',
    loadingHistory: 'Loading history…',
    serviceError: 'Could not start local OCR. Check your internet connection and try again.',
    ocrNote: 'OCR reads digits and column positions only. Handwriting can be unclear, so check every amount.',
    currencyExtra: 'written above the calculated total',
    currencyShort: 'short of the written total',
    rupees: '₹',
    date: 'Date',
    confidenceHigh: 'High confidence',
    confidenceMedium: 'Check reading',
    confidenceLow: 'Unclear reading',
    historyMatched: 'Matched',
    historyMismatch: 'Mismatch',
    historyExtra: 'Extra',
    historyReview: 'Review',
    high: 'HIGH',
    medium: 'CHECK',
    low: 'UNCLEAR',
    english: 'English',
    hindi: 'हिन्दी',
    closeCamera: 'Close camera',
    changeLanguage: 'Change language',
    saving: 'Saving…',
    fileType: 'Choose an image format supported by this browser.',
    ocrProgress: 'Loading language data and reading image',
    toolBill: 'Bill checker',
    toolCalculator: 'Calculator',
    toolPdf: 'Image to PDF',
    toolInvoice: 'GST bill maker',
  },
  hi: {
    subtitle: 'One App. All Your Business Calculations.',
    history: 'हाल के बिल',
    newBill: 'नया बिल',
    eyebrow: 'बिल की जाँच',
    headline: 'जोड़ जाँचें।\nहिसाब साफ़ रखें।',
    intro: 'हस्तलिखित बिल की तस्वीर लें, रकम जाँचें और कुल जोड़ की पुष्टि करें।',
    camera: 'कैमरा खोलें',
    upload: 'बिल अपलोड करें',
    capture: 'तस्वीर लें',
    retake: 'फिर से तस्वीर लें',
    choose: 'दूसरी तस्वीर चुनें',
    check: 'बिल का कुल जाँचें',
    checking: 'बिल पढ़ रहे हैं…',
    crop: 'बिल को काटें और ठीक करें',
    rotate: '90° घुमाएँ',
    zoom: 'ज़ूम',
    enhance: 'तस्वीर साफ़ करें',
    amounts: 'पहचानी गई रकम',
    lineItems: 'सिर्फ़ सामान की रकम',
    amount: 'रकम (₹)',
    confidence: 'पढ़ने का भरोसा',
    written: 'बिल पर लिखा कुल',
    add: 'रकम जोड़ें',
    remove: 'रकम हटाएँ',
    confirmed: 'मैंने यह रकम जाँच ली',
    totalConfirmed: 'मैंने लिखा हुआ कुल जाँच लिया',
    complete: 'मैंने तस्वीर जाँची है और सूची में सभी सामान की रकम हैं।',
    recalculate: 'कुल दोबारा जोड़ें',
    verify: 'जाँचें और सेव करें',
    calculated: 'जोड़ से कुल',
    difference: 'फ़र्क',
    matched: 'कुल सही है',
    mismatch: 'कुल में अंतर है',
    extra: 'लिखा कुल ज़्यादा है',
    needsReview: 'जाँच पूरी करें',
    uncertain: 'कुछ रकम साफ़ नहीं पढ़ी गई। कृपया निशान लगी रकम जाँचें।',
    duplicates: 'एक जैसी रकम दोहराई गई है। जाँचें कि हर रकम अलग सामान की है।',
    unreadable: 'तस्वीर साफ़ नहीं है। पूरी पर्ची को रोशनी में फिर से लें।',
    warnings: 'इन बातों की जाँच करें',
    ready: 'जाँच से पहले निशान लगी रकम और बिल पर लिखा कुल जाँचें।',
    saved: 'इस डिवाइस पर बिल हिस्ट्री में सेव हुआ।',
    emptyHistory: 'जाँचे गए बिल यहाँ दिखेंगे।',
    noImage: 'शुरू करने के लिए बिल की तस्वीर जोड़ें',
    noImageHint: 'कैमरा खोलें या पूरे बिल की साफ़ तस्वीर चुनें।',
    manual: 'खुद जोड़ी गई रकम',
    source: 'तस्वीर इसी डिवाइस पर पढ़ी और हिस्ट्री में सेव होती है।',
    loadingHistory: 'हिस्ट्री लोड हो रही है…',
    serviceError: 'लोकल OCR शुरू नहीं हो सका। इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।',
    ocrNote: 'OCR सिर्फ़ अंक और उनकी जगह देखता है। हस्तलिखित रकम गलत पढ़ी जा सकती है, इसलिए जाँचें।',
    currencyExtra: 'जोड़ से ज़्यादा लिखा है',
    currencyShort: 'लिखे कुल से कम है',
    rupees: '₹',
    date: 'तारीख',
    confidenceHigh: 'पढ़ने का भरोसा अच्छा',
    confidenceMedium: 'रकम जाँचें',
    confidenceLow: 'रकम साफ़ नहीं',
    historyMatched: 'सही',
    historyMismatch: 'अंतर',
    historyExtra: 'ज़्यादा',
    historyReview: 'जाँचें',
    high: 'साफ़',
    medium: 'जाँचें',
    low: 'अस्पष्ट',
    english: 'English',
    hindi: 'हिन्दी',
    closeCamera: 'कैमरा बंद करें',
    changeLanguage: 'भाषा बदलें',
    saving: 'सेव हो रहा है…',
    fileType: 'इस ब्राउज़र में खुलने वाली तस्वीर चुनें।',
    ocrProgress: 'भाषा डेटा लोड हो रहा है और तस्वीर पढ़ी जा रही है',
    toolBill: 'बिल जाँच',
    toolCalculator: 'कैलकुलेटर',
    toolPdf: 'तस्वीर से PDF',
    toolInvoice: 'GST बिल मेकर',
  },
} satisfies Record<Language, Record<string, string>>

function amountToInput(value: number | null): string {
  return value === null ? '' : String(value)
}

function money(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100)
}

function makeReviewRows(result: RecognitionResult): ReviewAmount[] {
  const counts = new Map<number, number>()
  for (const item of result.items) {
    const key = item.amount === null ? null : parseRupeesToPaise(String(item.amount))
    if (key !== null) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return result.items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    value: amountToInput(item.amount),
    confirmed: item.amount !== null && item.confidence >= 0.82 && (counts.get(parseRupeesToPaise(String(item.amount))!) ?? 0) < 2,
  }))
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

function rotateBounds(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  }
}

async function getCroppedImage(source: string, area: Area, rotation: number, enhance: boolean): Promise<string> {
  const image = new Image()
  image.src = source
  await image.decode()

  const bounds = rotateBounds(image.naturalWidth, image.naturalHeight, rotation)
  const rotated = document.createElement('canvas')
  rotated.width = Math.round(bounds.width)
  rotated.height = Math.round(bounds.height)
  const context = rotated.getContext('2d')
  if (!context) throw new Error('Image editing is unavailable in this browser.')
  context.translate(rotated.width / 2, rotated.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.filter = enhance ? 'grayscale(1) contrast(1.22) brightness(1.06)' : 'none'
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const crop = document.createElement('canvas')
  const scale = Math.min(1, 4096 / Math.max(area.width, area.height))
  crop.width = Math.max(1, Math.round(area.width * scale))
  crop.height = Math.max(1, Math.round(area.height * scale))
  const cropContext = crop.getContext('2d')
  if (!cropContext) throw new Error('Image editing is unavailable in this browser.')
  cropContext.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, crop.width, crop.height)
  return crop.toDataURL('image/jpeg', 0.82)
}

async function getImageAspect(source: string): Promise<number> {
  const image = new Image()
  image.src = source
  await image.decode()
  return image.naturalWidth / image.naturalHeight
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [activeTool, setActiveTool] = useState<'bill' | 'calculator' | 'pdf' | 'invoice'>('bill')
  const [image, setImage] = useState<string | null>(null)
  const [imageAspect, setImageAspect] = useState(0.75)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [enhance, setEnhance] = useState(false)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const [rows, setRows] = useState<ReviewAmount[]>([])
  const [writtenTotal, setWrittenTotal] = useState('')
  const [writtenTotalConfirmed, setWrittenTotalConfirmed] = useState(false)
  const [reviewComplete, setReviewComplete] = useState(false)
  const [unreadable, setUnreadable] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [verified, setVerified] = useState(false)
  const [bills, setBills] = useState<SavedBill[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [calculatedTotal, setCalculatedTotal] = useState(0)
  const uploadInput = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const copy = text[language]

  useEffect(() => {
    void listBills().then(setBills).catch(() => setError('Bill history is unavailable in this browser.')).finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return
    videoRef.current.srcObject = cameraStream
    void videoRef.current.play()
    return () => cameraStream.getTracks().forEach((track) => track.stop())
  }, [cameraStream])

  useEffect(() => {
    setCalculatedTotal(sumPaise(rows.map((row) => row.value)))
  }, [rows])

  const writtenPaise = parseRupeesToPaise(writtenTotal)
  const rowsValid = rows.length > 0 && rows.every((row) => parseRupeesToPaise(row.value) !== null && row.confirmed)
  const amountGroups = new Map<number, string[]>()
  for (const row of rows) {
    const amount = parseRupeesToPaise(row.value)
    if (amount !== null) amountGroups.set(amount, [...(amountGroups.get(amount) ?? []), row.id])
  }
  const duplicateIds = new Set([...amountGroups.values()].filter((ids) => ids.length > 1).flat())
  const duplicateNeedsReview = [...duplicateIds].some((id) => !rows.find((row) => row.id === id)?.confirmed)
  const canVerify = Boolean(image && !unreadable && rowsValid && reviewComplete && writtenPaise !== null && writtenTotalConfirmed)
  const currentStatus = getBillStatus(calculatedTotal, writtenPaise, canVerify)
  const hasUncertainReadings = unreadable || warnings.length > 0 || duplicateNeedsReview || rows.some((row) => !row.confirmed && (row.amount === null || row.confidence < 0.82))
  const difference = writtenPaise === null ? 0 : Math.abs(calculatedTotal - writtenPaise)

  function clearReview() {
    setRows([])
    setWrittenTotal('')
    setWrittenTotalConfirmed(false)
    setReviewComplete(false)
    setUnreadable(false)
    setWarnings([])
    setVerified(false)
    setMessage('')
  }

  async function acceptFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(copy.fileType)
      return
    }
    try {
      const source = await readImage(file)
      setImageAspect(await getImageAspect(source))
      setImage(source)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setEnhance(false)
      setCropArea(null)
      clearReview()
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.serviceError)
    }
  }

  async function openCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access needs HTTPS or localhost and a supported browser.')
      return
    }
    try {
      setCameraStream(await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 2560 } },
      }))
    } catch {
      setCameraError('Camera permission was denied or no camera is available. You can upload a photo instead.')
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop())
    setCameraStream(null)
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 4096 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    setImageAspect(canvas.width / canvas.height)
    setImage(canvas.toDataURL('image/jpeg', 0.9))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCropArea(null)
    clearReview()
    setError('')
    closeCamera()
  }

  async function recognizeBill() {
    if (!image || !cropArea) {
      setError('Adjust the image crop before checking the bill.')
      return
    }
    setIsChecking(true)
    setOcrProgress(0)
    setError('')
    setMessage('')
    clearReview()
    try {
      const croppedImage = await getCroppedImage(image, cropArea, rotation, enhance)
      const data: RecognitionResult = await recognizeBillLocally(croppedImage, (_status, progress) => {
        setOcrProgress(Math.max(0, Math.min(100, Math.round(progress * 100))))
      })
      setRows(makeReviewRows(data))
      setWrittenTotal(amountToInput(data.writtenTotal))
      setWrittenTotalConfirmed(data.writtenTotal !== null && data.totalConfidence >= 0.82)
      setWarnings(data.warnings)
      setUnreadable(data.unreadable)
      setReviewComplete(false)
      if (data.unreadable) setError(copy.unreadable)
      else if (data.items.length === 0) setError(copy.uncertain)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.serviceError)
    } finally {
      setIsChecking(false)
    }
  }

  function updateAmount(id: string, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, value, confirmed: false } : row))
    setVerified(false)
    setReviewComplete(false)
  }

  function addAmount() {
    setRows((current) => [...current, {
      id: crypto.randomUUID(),
      amount: null,
      value: '',
      confidence: 1,
      text: copy.manual,
      reason: '',
      confirmed: true,
    }])
    setVerified(false)
    setReviewComplete(false)
  }

  function removeAmount(id: string) {
    setRows((current) => current.filter((row) => row.id !== id))
    setVerified(false)
    setReviewComplete(false)
  }

  async function verifyAndSave() {
    if (!canVerify || !image) return
    const status = getBillStatus(calculatedTotal, writtenPaise, true)
    setIsSaving(true)
    setError('')
    const bill: SavedBill = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      image,
      items: rows.map(({ value, ...row }) => ({ ...row, amount: parseRupeesToPaise(value)! / 100 })),
      writtenTotal: writtenPaise! / 100,
      calculatedTotal: calculatedTotal / 100,
      status,
    }
    try {
      await saveBill(bill)
      setBills((current) => [bill, ...current])
      setVerified(true)
      setMessage(copy.saved)
    } catch {
      setError('Could not save this bill. Check available browser storage and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function openSavedBill(bill: SavedBill) {
    setImage(bill.image)
    void getImageAspect(bill.image).then(setImageAspect).catch(() => setImageAspect(0.75))
    setRows(bill.items.map((row) => ({ ...row, value: amountToInput(row.amount) })))
    setWrittenTotal(amountToInput(bill.writtenTotal))
    setWrittenTotalConfirmed(true)
    setReviewComplete(true)
    setUnreadable(false)
    setWarnings([])
    setVerified(true)
    setError('')
    setMessage(copy.saved)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  function newBill() {
    closeCamera()
    setImage(null)
    setCropArea(null)
    clearReview()
    setError('')
    setCameraError('')
  }

  const statusLabel = verified
    ? currentStatus === 'matched' ? copy.matched : currentStatus === 'extra' ? copy.extra : copy.mismatch
    : copy.needsReview
  const statusClass = verified ? currentStatus : 'review'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="HisabOne home">
          <span className="brand-mark"><ScanLine size={20} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>HisabOne</strong><small>{copy.subtitle}</small></span>
        </a>
        <div className="topbar-actions">
          <button className="language-switch" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} aria-label={copy.changeLanguage} title={copy.changeLanguage}>
            <Languages size={17} /> {language === 'en' ? copy.hindi : copy.english}
          </button>
          {activeTool === 'bill' && image && <button className="quiet-button" onClick={newBill}><Plus size={16} /> {copy.newBill}</button>}
        </div>
      </header>

      <nav className="tool-navigation" aria-label="App tools">
        <button className={activeTool === 'bill' ? 'active' : ''} onClick={() => setActiveTool('bill')}><ScanLine size={17} />{copy.toolBill}</button>
        <button className={activeTool === 'calculator' ? 'active' : ''} onClick={() => setActiveTool('calculator')}><Calculator size={17} />{copy.toolCalculator}</button>
        <button className={activeTool === 'pdf' ? 'active' : ''} onClick={() => setActiveTool('pdf')}><FileImage size={17} />{copy.toolPdf}</button>
        <button className={activeTool === 'invoice' ? 'active' : ''} onClick={() => setActiveTool('invoice')}><FileText size={17} />{copy.toolInvoice}</button>
      </nav>

      <main id="top" className="page">
        {activeTool === 'bill' && <>
        <section className="page-intro">
          <p className="eyebrow"><span />{copy.eyebrow}</p>
          <div className="intro-row">
            <div>
              <h1>{copy.headline.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
              <p className="intro-copy">{copy.intro}</p>
            </div>
            <div className="privacy-note"><span className="privacy-dot" />{copy.source}</div>
          </div>
        </section>

        {(error || cameraError) && <div className="alert alert-error" role="alert"><AlertTriangle size={18} /><span>{error || cameraError}</span><button aria-label="Dismiss" onClick={() => { setError(''); setCameraError('') }}><X size={17} /></button></div>}
        {message && <div className="alert alert-success" role="status"><Check size={18} /><span>{message}</span><button aria-label="Dismiss" onClick={() => setMessage('')}><X size={17} /></button></div>}

        <section className="workspace" aria-label="Bill checker">
          <div className="image-column">
            <div className="section-heading">
              <div><span className="step-number">01</span><div><h2>{copy.crop}</h2><p>01 / 02</p></div></div>
            </div>

            <div className={`image-stage ${!image && !cameraStream ? 'image-stage-empty' : ''}`}>
              {cameraStream ? (
                <div className="camera-live">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-guide" aria-hidden="true"><span /></div>
                  <button className="close-camera icon-button" aria-label={copy.closeCamera} title={copy.closeCamera} onClick={closeCamera}><X size={19} /></button>
                  <button className="shutter-button" aria-label={copy.capture} title={copy.capture} onClick={capturePhoto}><span /></button>
                </div>
              ) : image ? (
                <div className="crop-stage">
                  <Cropper
                    image={image}
                    aspect={rotation % 180 === 0 ? imageAspect : 1 / imageAspect}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={(_area, pixels) => setCropArea(pixels)}
                    mediaProps={{ style: { filter: enhance ? 'grayscale(1) contrast(1.22) brightness(1.06)' : undefined } }}
                  />
                </div>
              ) : (
                <div className="empty-prompt">
                  <div className="paper-icon"><FileImage size={26} strokeWidth={1.6} /></div>
                  <strong>{copy.noImage}</strong>
                  <p>{copy.noImageHint}</p>
                  <div className="empty-actions">
                    <button className="primary-button" onClick={() => void openCamera()}><Camera size={18} />{copy.camera}</button>
                    <button className="secondary-button" onClick={() => uploadInput.current?.click()}><Upload size={17} />{copy.upload}</button>
                  </div>
                </div>
              )}
            </div>

            <input ref={uploadInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => { void acceptFile(event.target.files?.[0]); event.currentTarget.value = '' }} />

            {image && !cameraStream && <div className="image-controls">
              <div className="control-actions">
                <button className="tool-button" onClick={() => setRotation((value) => (value + 90) % 360)} title={copy.rotate}><RotateCcw size={16} />{copy.rotate}</button>
                <button className="tool-button" onClick={() => uploadInput.current?.click()} title={copy.choose}><Upload size={16} />{copy.choose}</button>
                <label className="enhance-toggle"><input type="checkbox" checked={enhance} onChange={(event) => setEnhance(event.target.checked)} /><span className="toggle-track" /><span>{copy.enhance}</span></label>
              </div>
              <label className="zoom-control"><span>{copy.zoom}</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><output>{Math.round(zoom * 100)}%</output></label>
              <div className="capture-actions">
                <button className="secondary-button" onClick={() => void openCamera()}><Camera size={17} />{copy.retake}</button>
                <button className="primary-button check-button" onClick={() => void recognizeBill()} disabled={isChecking || !cropArea}>
                  {isChecking ? <LoaderCircle className="spin" size={18} /> : <ScanLine size={18} />}{isChecking ? copy.checking : copy.check}
                </button>
              </div>
            </div>}

            {!image && !cameraStream && <div className="camera-shortcut"><button onClick={() => void openCamera()}><Camera size={17} />{copy.capture}</button><span>·</span><button onClick={() => uploadInput.current?.click()}><Upload size={16} />{copy.upload}</button></div>}
          </div>

          <section className="review-column" aria-labelledby="review-heading">
            <div className="section-heading">
              <div><span className="step-number">02</span><div><h2 id="review-heading">{copy.amounts}</h2><p>{copy.lineItems}</p></div></div>
              {rows.length > 0 && <span className="count-badge">{rows.length}</span>}
            </div>

            {!image ? (
              <div className="review-placeholder"><span>02</span><p>{copy.noImageHint}</p></div>
            ) : rows.length === 0 && !isChecking ? (
              <div className="review-placeholder"><span><ScanLine size={21} /></span><p>{copy.ready}</p></div>
            ) : isChecking ? (
              <div className="review-placeholder loading-placeholder"><LoaderCircle className="spin" size={25} /><div className="ocr-progress"><p>{copy.ocrProgress}</p><progress max="100" value={ocrProgress} /><small>{ocrProgress}%</small></div></div>
            ) : (
              <>
                {hasUncertainReadings && <div className="uncertain-banner"><AlertTriangle size={18} /><span>{copy.uncertain}</span></div>}
                <div className="local-ocr-note">{copy.ocrNote}</div>
                {duplicateNeedsReview && <div className="uncertain-banner duplicate-banner"><AlertTriangle size={18} /><span>{copy.duplicates}</span></div>}
                {unreadable && <div className="warning-banner">{copy.unreadable}</div>}
                {warnings.length > 0 && <div className="model-warnings"><strong>{copy.warnings}</strong>{warnings.map((warning, index) => <p key={`${index}-${warning}`}>{warning}</p>)}</div>}

                <div className="amount-list">
                  <div className="list-header"><span>#</span><span>{copy.amount}</span><span>{copy.confidence}</span><span /></div>
                  {rows.map((row, index) => {
                    const confidenceLevel = row.amount === null || row.confidence < 0.55 ? 'low' : row.confidence < 0.82 || (duplicateIds.has(row.id) && !row.confirmed) ? 'medium' : 'high'
                    const confidenceLabel = confidenceLevel === 'high' ? copy.high : confidenceLevel === 'medium' ? copy.medium : copy.low
                    return <article className={`amount-row ${confidenceLevel}`} key={row.id}>
                      <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
                      <label className="amount-input-wrap"><span className="currency-prefix">₹</span><input aria-label={`${copy.amount} ${index + 1}`} type="number" min="0" step="0.01" value={row.value} placeholder="0.00" onChange={(event) => updateAmount(row.id, event.target.value)} /><span className="sr-only">{row.text}</span></label>
                      <div className="confidence-cell"><span className={`confidence-pill ${confidenceLevel}`}>{confidenceLevel === 'low' && <AlertTriangle size={12} />}{confidenceLabel}</span><label className="row-confirm"><input type="checkbox" checked={row.confirmed} onChange={(event) => { setRows((current) => current.map((item) => item.id === row.id ? { ...item, confirmed: event.target.checked } : item)); setVerified(false) }} />{copy.confirmed}</label></div>
                      <button className="remove-button" title={copy.remove} aria-label={`${copy.remove} ${index + 1}`} onClick={() => removeAmount(row.id)}><Trash2 size={16} /></button>
                      {(confidenceLevel !== 'high' || row.reason) && <p className="row-note">{row.reason || (duplicateIds.has(row.id) ? copy.duplicates : copy.confidenceMedium)} <span>{row.text}</span></p>}
                    </article>
                  })}
                </div>

                <button className="add-amount-button" onClick={addAmount}><Plus size={16} />{copy.add}</button>
                <div className="total-entry">
                  <label htmlFor="written-total">{copy.written}</label>
                  <div className={`total-input-wrap ${writtenPaise === null && writtenTotal ? 'invalid' : ''}`}><span>₹</span><input id="written-total" type="number" min="0" step="0.01" value={writtenTotal} placeholder="0.00" onChange={(event) => { setWrittenTotal(event.target.value); setWrittenTotalConfirmed(false); setVerified(false) }} /></div>
                  <label className="total-confirm"><input type="checkbox" checked={writtenTotalConfirmed} onChange={(event) => { setWrittenTotalConfirmed(event.target.checked); setVerified(false) }} />{copy.totalConfirmed}</label>
                </div>

                <label className="complete-check"><input type="checkbox" checked={reviewComplete} onChange={(event) => { setReviewComplete(event.target.checked); setVerified(false) }} /><span className="check-box"><Check size={13} /></span><span>{copy.complete}</span></label>

                <div className="calculation-card">
                  <div className="calculation-head"><span>{copy.calculated}</span><button onClick={() => setCalculatedTotal(sumPaise(rows.map((row) => row.value)))}>{copy.recalculate}</button></div>
                  <div className="equation" aria-label={`Calculated total ${money(calculatedTotal)}`}>
                    {rows.length ? rows.map((row, index) => <span key={row.id}>{index > 0 && <b>+</b>}<strong className={parseRupeesToPaise(row.value) === null ? 'invalid-number' : ''}>{row.value || '?'}</strong></span>) : <span>0</span>}
                    <b>=</b><strong>{money(calculatedTotal)}</strong>
                  </div>
                  <div className="calculation-summary"><span>{copy.written}<strong>{writtenPaise === null ? '—' : money(writtenPaise)}</strong></span><span>{copy.difference}<strong>{writtenPaise === null ? '—' : money(difference)}</strong></span></div>
                  <div className={`status-strip ${statusClass}`}><span className="status-indicator" /><strong>{statusLabel}</strong>
                    {verified && currentStatus !== 'matched' && <small>{currentStatus === 'extra' ? copy.currencyExtra : copy.currencyShort}</small>}
                  </div>
                  {!verified && <p className="review-hint">{copy.ready}</p>}
                </div>

                <button className="verify-button" disabled={!canVerify || isSaving} onClick={() => void verifyAndSave()}>
                  {isSaving ? <LoaderCircle className="spin" size={18} /> : verified ? <Check size={18} /> : <ArrowUpRight size={18} />}
                  {isSaving ? copy.saving : verified ? copy.saved : copy.verify}
                </button>
              </>
            )}
          </section>
        </section>

        <section className="history-section" aria-labelledby="history-heading">
          <div className="history-title"><div><Clock3 size={18} /><h2 id="history-heading">{copy.history}</h2></div><span>{bills.length}</span></div>
          {historyLoading ? <p className="history-empty">{copy.loadingHistory}</p> : bills.length === 0 ? <p className="history-empty">{copy.emptyHistory}</p> : (
            <div className="history-list">{bills.slice(0, 8).map((bill) => {
              const statusText = bill.status === 'matched' ? copy.historyMatched : bill.status === 'mismatch' ? copy.historyMismatch : bill.status === 'extra' ? copy.historyExtra : copy.historyReview
              return <button className="history-item" key={bill.id} onClick={() => openSavedBill(bill)}>
                <img src={bill.image} alt="" />
                <span className="history-date">{new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(bill.createdAt))}</span>
                <span className="history-amount">{money(Math.round(bill.calculatedTotal * 100))}</span>
                <span className={`history-status ${bill.status}`}>{statusText}</span>
                <ChevronDown className="history-open" size={17} />
              </button>
            })}</div>
          )}
        </section>
        </>}

        <Suspense fallback={<div className="tool-loading">Loading tool…</div>}>
          {activeTool === 'calculator' && <ManualCalculator language={language} />}
          {activeTool === 'pdf' && <ImagePdfTool language={language} />}
          {activeTool === 'invoice' && <BillMaker language={language} />}
        </Suspense>

        <footer className="footer-note"><span>HO</span><p>{copy.source}</p><div className="footer-credit"><strong>Developed by Shivam Bindal</strong><span>Powered by Bindal Pvt. Ltd.</span></div></footer>
      </main>
    </div>
  )
}