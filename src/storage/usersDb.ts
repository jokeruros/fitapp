import { dbPromise } from './db'

export async function register(email: string, password: string) {
  const db = await dbPromise
  const existing = await db.get('users', email)
  if (existing) throw new Error('User exists')
  await db.put('users', { email, password })
}

export async function login(email: string, password: string) {
  const db = await dbPromise
  const user = await db.get('users', email)
  if (!user || user.password !== password) throw new Error('Invalid login')
  return { email }
}
