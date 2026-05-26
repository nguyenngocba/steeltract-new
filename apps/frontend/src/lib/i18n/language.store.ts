import { create } from 'zustand'

export type LanguageCode = 'vi' | 'en'

interface LanguageState {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'vi'
  }

  const stored = window.localStorage.getItem(
    'steeltrack.language',
  )

  return stored === 'en' ? 'en' : 'vi'
}

export const useLanguageStore =
  create<LanguageState>((set) => ({
    language: getInitialLanguage(),
    setLanguage: (language) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'steeltrack.language',
          language,
        )
      }

      set({ language })
    },
  }))

