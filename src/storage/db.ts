import { openDB } from 'idb'

export const dbPromise = openDB('fitness-db', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('foods')) {
      db.createObjectStore('foods', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('meals')) {
      db.createObjectStore('meals', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings')
    }
  }
})
