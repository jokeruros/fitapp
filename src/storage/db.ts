import { openDB } from 'idb'

export const dbPromise = openDB('fitness-db', 3, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'email' })
    }
    if (!db.objectStoreNames.contains('data')) {
      db.createObjectStore('data')
    }
  }
})
