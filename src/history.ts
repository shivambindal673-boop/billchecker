import type { SavedBill } from './types'

const databaseName = 'bill-total-checker'
const storeName = 'bills'

function openHistory(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listBills(): Promise<SavedBill[]> {
  const db = await openHistory()
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    request.onsuccess = () => resolve((request.result as SavedBill[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    request.onerror = () => reject(request.error)
    request.addEventListener('loadend', () => db.close(), { once: true })
  })
}

export async function saveBill(bill: SavedBill): Promise<void> {
  const db = await openHistory()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(bill)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
    transaction.addEventListener('complete', () => db.close(), { once: true })
  })
}