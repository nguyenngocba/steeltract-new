import clsx from 'clsx'
import {
  Check,
  Languages,
} from 'lucide-react'
import {
  useState,
} from 'react'

import {
  useLanguageStore,
} from '../../lib/i18n/language.store'

import type {
  LanguageCode,
} from '../../lib/i18n/language.store'

const languageOptions: Array<{
  code: LanguageCode
  label: string
  shortLabel: string
}> = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    shortLabel: 'VI',
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
  },
]

export function LanguageSwitcher() {
  const language = useLanguageStore(
    (state) => state.language,
  )
  const setLanguage = useLanguageStore(
    (state) => state.setLanguage,
  )
  const [open, setOpen] = useState(false)
  const active =
    languageOptions.find(
      (option) => option.code === language,
    ) ?? languageOptions[0]

  function handleSelect(code: LanguageCode) {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change display language"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/15 bg-zinc-950/70 px-3 text-xs font-semibold uppercase tracking-wide text-cyan-100 shadow-inner hover:border-cyan-500/35 hover:bg-cyan-500/10"
      >
        <Languages className="h-4 w-4 text-cyan-300" />
        {active.shortLabel}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-cyan-500/15 bg-[#071321]/95 p-1 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() =>
                handleSelect(option.code)
              }
              className={clsx(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                option.code === language
                  ? 'bg-blue-500/15 text-white'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <span>{option.label}</span>
              {option.code === language ? (
                <Check className="h-4 w-4 text-blue-300" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

