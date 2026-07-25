import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { moduleInput, moduleMutedButton, modulePanel, modulePrimaryButton } from '@/shared/ui/modules'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatCurrencyVnd, parseLocaleNumber } from '@/shared/utils/number-format'
import type { CreateProjectPayload, ProjectRuntimeRow, ProjectStatus, ProjectTemplate } from '../api/projects.api'

const input = `${moduleInput} h-9 px-3`
const primaryButton = modulePrimaryButton
const mutedButton = moduleMutedButton

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-slate-400">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function ProjectFormDialog({
  mode,
  open = true,
  project = null,
  templates = [],
  saving = false,
  error = null,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: {
  mode: 'create' | 'edit'
  open?: boolean
  project?: ProjectRuntimeRow | null
  templates?: ProjectTemplate[]
  saving?: boolean
  error?: unknown
  onClose: () => void
  onSubmitCreate?: (payload: CreateProjectPayload) => void
  onSubmitEdit?: (id: string, payload: Partial<CreateProjectPayload>) => void
}) {
  const isEdit = mode === 'edit'
  const [code, setCode] = useState(isEdit ? project?.code ?? '' : nextLocalCode('CT'))
  const [name, setName] = useState(isEdit ? project?.name ?? '' : '')
  const [owner, setOwner] = useState(isEdit ? (project?.owner === '-' ? '' : project?.owner ?? '') : '')
  const [location, setLocation] = useState(isEdit ? (project?.location === '-' ? '' : project?.location ?? '') : '')
  const [type, setType] = useState(isEdit ? (project?.type === '-' ? '' : project?.type ?? '') : 'Nhà xưởng')
  const [status, setStatus] = useState<ProjectStatus>(isEdit ? project?.status ?? 'PLANNING' : 'PLANNING')
  const [startDate, setStartDate] = useState(isEdit ? toDateInput(project?.startedAt) : new Date().toISOString().slice(0, 10))
  const [handoverDate, setHandoverDate] = useState(isEdit ? toDateInput(project?.plannedEndAt) : '')
  const [contractValue, setContractValue] = useState(isEdit ? (project?.contractValue ? formatCurrencyVnd(project.contractValue).replace(' đ', '') : '') : '')
  const [templateId, setTemplateId] = useState('')
  const [note, setNote] = useState(isEdit ? project?.description ?? '' : '')

  const publishedTemplates = templates.filter((template) => template.status === 'PUBLISHED')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && project) {
        setCode(project.code)
        setName(project.name)
        setOwner(project.owner === '-' ? '' : project.owner)
        setLocation(project.location === '-' ? '' : project.location)
        setType(project.type === '-' ? '' : project.type)
        setStatus(project.status)
        setStartDate(toDateInput(project.startedAt))
        setHandoverDate(toDateInput(project.plannedEndAt))
        setContractValue(project.contractValue ? formatCurrencyVnd(project.contractValue).replace(' đ', '') : '')
        setTemplateId('')
        setNote(project.description ?? '')
      } else if (mode === 'create') {
        setCode(nextLocalCode('CT'))
        setName('')
        setOwner('')
        setLocation('')
        setType('Nhà xưởng')
        setStatus('PLANNING')
        setStartDate(new Date().toISOString().slice(0, 10))
        setHandoverDate('')
        setContractValue('')
        setTemplateId(publishedTemplates.find((t) => t.isDefault)?.id ?? publishedTemplates[0]?.id ?? '')
        setNote('')
      }
    }
  }, [open, mode, project?.id, templates])

  if (!open) return null

  const submit = () => {
    if (!name.trim()) return
    if (mode === 'create') {
      if (!code.trim()) return
      onSubmitCreate?.({
        code: code.trim(),
        name: name.trim(),
        status,
        description: note.trim(),
        customerName: owner.trim(),
        location: location.trim(),
        projectType: type.trim(),
        startDate: startDate || null,
        handoverDate: handoverDate || null,
        contractValue: parseLocaleNumber(contractValue),
        templateId: templateId || undefined,
      })
    } else if (mode === 'edit' && project) {
      onSubmitEdit?.(project.id, {
        name: name.trim(),
        status,
        description: note.trim(),
        customerName: owner.trim(),
        location: location.trim(),
        projectType: type.trim(),
        startDate: startDate || null,
        handoverDate: handoverDate || null,
        contractValue: parseLocaleNumber(contractValue),
        templateId: templateId || undefined,
      })
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <section className={`w-[min(920px,94vw)] overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl ${modulePanel}`}>
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              {isEdit ? 'Chỉnh sửa thông tin công trình' : 'Low Data Entry'}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {isEdit ? `Sửa công trình: ${project?.code}` : 'Tạo công trình từ template'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300 hover:bg-white/10">
            <X size={16} />
          </button>
        </header>

        <div className="grid gap-1 p-5 md:grid-cols-2 text-xs">
          <Field label="Mã công trình">
            <input
              value={code}
              disabled={isEdit}
              onChange={(event) => setCode(event.target.value)}
              className={`${input} w-full ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </Field>
          <Field label="Tên công trình">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${input} w-full`}
              placeholder="Nhà máy kết cấu thép..."
            />
          </Field>
          <Field label="Khách hàng">
            <input value={owner} onChange={(event) => setOwner(event.target.value)} className={`${input} w-full`} />
          </Field>
          <Field label="Địa điểm">
            <input value={location} onChange={(event) => setLocation(event.target.value)} className={`${input} w-full`} />
          </Field>
          <Field label="Ngày khởi công">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${input} w-full`} />
          </Field>
          <Field label="Ngày bàn giao">
            <input type="date" value={handoverDate} onChange={(event) => setHandoverDate(event.target.value)} className={`${input} w-full`} />
          </Field>
          <Field label="Giá trị hợp đồng">
            <input
              value={contractValue}
              onFocus={() => setContractValue(String(parseLocaleNumber(contractValue) || ''))}
              onBlur={() => setContractValue(parseLocaleNumber(contractValue) ? formatCurrencyVnd(parseLocaleNumber(contractValue)).replace(' đ', '') : '')}
              onChange={(event) => setContractValue(event.target.value)}
              inputMode="decimal"
              className={`${input} w-full`}
            />
          </Field>
          <Field label="Template">
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className={`${input} w-full`}>
              <option value="">Không dùng template</option>
              {publishedTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.isDefault ? '★ ' : ''}{template.code} · {template.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Loại">
            <select value={type} onChange={(event) => setType(event.target.value)} className={`${input} w-full`}>
              {['Nhà xưởng', 'Kho bãi', 'Tòa nhà', 'Hạ tầng', 'Văn phòng'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className={`${input} w-full`}>
              <option value="PLANNING">Chưa khởi công</option>
              <option value="ACTIVE">Đang thi công</option>
              <option value="ON_HOLD">Tạm dừng</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </Field>
          <label className="text-xs text-slate-400 md:col-span-2">
            Ghi chú
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${input} mt-1 min-h-24 w-full py-2`} />
          </label>
          {error ? (
            <p className="rounded border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-200 md:col-span-2">
              Không thể xử lý. Vui lòng kiểm tra mã trùng hoặc dữ liệu nhập.
            </p>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={onClose} className={mutedButton}>
            Hủy
          </button>
          <button
            type="button"
            disabled={saving || (!isEdit && !code.trim()) || !name.trim()}
            onClick={submit}
            className={primaryButton}
          >
            {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : isEdit ? 'Lưu thay đổi' : 'Tạo công trình'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
