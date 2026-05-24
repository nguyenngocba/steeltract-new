import type {
  ReactNode,
} from 'react'

interface FormGridProps {
  children: ReactNode
}

interface FormFieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function FormGrid({
  children,
}: FormGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {children}
    </div>
  )
}

export function FormField({
  label,
  children,
  hint,
}: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-300">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs text-zinc-500">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
