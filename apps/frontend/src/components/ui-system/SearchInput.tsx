import {
  Search,
} from 'lucide-react'

interface SearchInputProps {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function SearchInput({
  value,
  placeholder = 'Search',
  onChange,
}: SearchInputProps) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-cyan-500"
      />
    </label>
  )
}
