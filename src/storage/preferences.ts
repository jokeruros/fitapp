import { load, save } from './userData'
import { languages, type LanguageCode } from '../i18n'

const appLanguageCacheKey = 'nutritrack-app-language'

export function getCachedAppLanguage(): LanguageCode {
  try {
    const cached = localStorage.getItem(appLanguageCacheKey)
    if (languages.some(language => language.code === cached)) return cached as LanguageCode
  } catch {
    // Storage can be disabled in private browsing; fall back to the default.
  }
  return defaultPreferences.appLanguage
}

export function setCachedAppLanguage(language: LanguageCode) {
  try { localStorage.setItem(appLanguageCacheKey, language) } catch {
    // The database preference remains authoritative when local storage is unavailable.
  }
}

export interface UserPreferences {
  appLanguage: LanguageCode
  foodLanguage: LanguageCode
}

export const defaultPreferences: UserPreferences = {
  appLanguage: 'en',
  foodLanguage: 'sr'
}

export async function getPreferences(): Promise<UserPreferences> {
  const stored = await load<Partial<UserPreferences>>('settings', {})
  const preferences = {
    appLanguage: stored.appLanguage ?? getCachedAppLanguage(),
    foodLanguage: stored.foodLanguage ?? defaultPreferences.foodLanguage
  }
  setCachedAppLanguage(preferences.appLanguage)
  return preferences
}

export async function savePreferences(preferences: UserPreferences) {
  await save('settings', preferences)
  setCachedAppLanguage(preferences.appLanguage)
}
