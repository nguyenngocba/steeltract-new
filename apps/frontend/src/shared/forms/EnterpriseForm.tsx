import {
  useId,
  type FormEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

import { ModalShell } from '@/components/ui-system/ModalShell'

export const enterpriseControlClass =
  'h-9 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-slate-900/60 read-only:text-slate-300'

export const enterpriseSecondaryButton =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-40'

export const enterprisePrimaryButton =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-600 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-40'

export function EnterpriseForm({
  children,
  onSubmit,
  id,
  className = '',
}: {
  children: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
  id?: string
  className?: string
}) {
  return <form id={id} onSubmit={onSubmit} className={`space-y-4 ${className}`}>{children}</form>
}

export function EnterpriseFormSection({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-cyan-300/10 bg-slate-950/35 p-4 ${className}`}>
      {title || description || action ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="text-sm font-semibold text-slate-100">{title}</h3> : null}
            {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function EnterpriseFormGrid({
  children,
  columns = 2,
  className = '',
}: {
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}) {
  const columnsClass = columns === 1 ? '' : columns === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'
  return <div className={`grid grid-cols-1 gap-3 ${columnsClass} ${className}`}>{children}</div>
}

export function EnterpriseField({
  label,
  required = false,
  hint,
  error,
  htmlFor,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-300">
        {label}{required ? <span className="ml-1 text-red-300" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? <p role="alert" className="text-xs text-red-300">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function EnterpriseInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${enterpriseControlClass} ${className}`} />
}

export function EnterpriseNumberField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <EnterpriseInput inputMode="decimal" {...props} />
}

export function EnterpriseSelect({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${enterpriseControlClass} ${className}`}>{children}</select>
}

export function EnterpriseDatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <EnterpriseInput type="datetime-local" {...props} />
}

export function EnterpriseFormActions({
  onCancel,
  submitLabel,
  pendingLabel = 'Đang xử lý...',
  pending = false,
  disabled = false,
  form,
  secondary,
}: {
  onCancel: () => void
  submitLabel: string
  pendingLabel?: string
  pending?: boolean
  disabled?: boolean
  form?: string
  secondary?: ReactNode
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      {secondary}
      <button type="button" onClick={onCancel} disabled={pending} className={enterpriseSecondaryButton}>Hủy</button>
      <button type="submit" form={form} disabled={disabled || pending} className={enterprisePrimaryButton}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </div>
  )
}

export function EnterpriseModalForm({
  open,
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitLabel,
  pendingLabel,
  pending = false,
  submitDisabled = false,
  maxWidthClass = 'max-w-3xl',
  secondary,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel: string
  pendingLabel?: string
  pending?: boolean
  submitDisabled?: boolean
  maxWidthClass?: string
  secondary?: ReactNode
}) {
  const generatedId = useId()
  const formId = `enterprise-form-${generatedId.replace(/:/g, '')}`

  return (
    <ModalShell
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      closeDisabled={pending}
      maxWidthClass={maxWidthClass}
      footer={<EnterpriseFormActions onCancel={onClose} submitLabel={submitLabel} pendingLabel={pendingLabel} pending={pending} disabled={submitDisabled} form={formId} secondary={secondary} />}
    >
      <EnterpriseForm id={formId} onSubmit={onSubmit}>{children}</EnterpriseForm>
    </ModalShell>
  )
}
