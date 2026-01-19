import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const KEY = 'current-user'

export function setCurrentUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY)
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('current-user')
  window.dispatchEvent(new Event('auth-changed'))
}
