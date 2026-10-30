export type RecognizedAmount = {
  id: string
  amount: number | null
  confidence: number
  text: string
  reason: string
  confirmed: boolean
}

export type RecognitionResult = {
  items: OcrItem[]
  writtenTotal: number | null
  totalConfidence: number
  warnings: string[]
  unreadable: boolean
}

export type OcrItem = {
  amount: number | null
  confidence: number
  text: string
  reason: string
}

export type SavedBill = {
  id: string
  createdAt: string
  image: string
  items: RecognizedAmount[]
  writtenTotal: number | null
  calculatedTotal: number
  status: 'matched' | 'mismatch' | 'extra' | 'review'
}