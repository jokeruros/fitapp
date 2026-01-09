export interface User {
  email: string
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('currentUser')
  return raw ? JSON.parse(raw) : null
}

export function setCurrentUser(user: User) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem('currentUser')
}
