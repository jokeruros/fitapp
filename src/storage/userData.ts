import { dbPromise } from './db'
import { getCurrentUser } from './session'

function key(name: string) {
  const user = getCurrentUser()
  if (!user) throw new Error('Not logged in')
  return `${name}:${user.email}`
}

export async function load<T>(name: string, def: T): Promise<T> {
  const db = await dbPromise
  const v = await db.get('data', key(name))
  return v ?? def
}

export async function save<T>(name: string, value: T) {
  const db = await dbPromise
  await db.put('data', value, key(name))
}
