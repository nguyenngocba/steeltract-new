import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, ImageIcon, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { API_BASE_URL } from '@/lib/api'
import { getAttachments, uploadAttachment } from '@/lib/attachments/attachments-api'
import type { Attachment, AttachmentCategory } from '@/lib/attachments/attachment.types'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { ModuleDetailDrawer } from '@/shared/ui/modules'

export type InventoryAttachmentDraft = {
  id: string
  file: File
  category: AttachmentCategory
}

export type InventoryAttachmentMap = Map<string, Attachment[]>

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const inventoryAttachmentCategories: Array<{
  value: AttachmentCategory
  label: string
}> = [
  { value: 'INVOICE', label: 'Hóa đơn' },
  { value: 'DELIVERY_NOTE', label: 'Phiếu giao nhận' },
  { value: 'PACKING_LIST', label: 'Packing list' },
  { value: 'CO', label: 'CO' },
  { value: 'CQ', label: 'CQ' },
  { value: 'PHOTO', label: 'Ảnh' },
  { value: 'REPORT', label: 'Báo cáo' },
  { value: 'OTHER', label: 'Khác' },
]

export function InventoryAttachmentPicker({
  files,
  onChange,
}: {
  files: InventoryAttachmentDraft[]
  onChange: (files: InventoryAttachmentDraft[]) => void
}) {
  const [category, setCategory] = useState<AttachmentCategory>('INVOICE')

  function addFiles(list: FileList | null) {
    const nextFiles = Array.from(list ?? [])
    if (!nextFiles.length) return

    const accepted: InventoryAttachmentDraft[] = []

    for (const file of nextFiles) {
      if (!isAllowedAttachmentFile(file)) {
        toast.error(`${file.name}: định dạng không hỗ trợ`)
        continue
      }

      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name}: vượt quá 25 MB`)
        continue
      }

      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        file,
        category,
      })
    }

    if (accepted.length) {
      onChange([...files, ...accepted])
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Tài liệu đính kèm</div>
          <div className="text-xs text-slate-400">Upload sau khi phiếu được lưu thành công</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value as AttachmentCategory)} className="h-9 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-slate-100">
            {inventoryAttachmentCategories.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-slate-200 hover:bg-white/10">
            <Plus size={14} />
            Upload File
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {files.length ? (
        <div className="space-y-2">
          {files.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-100">{item.file.name}</div>
                <div className="mt-0.5 text-slate-500">{categoryLabel(item.category)} · {formatFileSize(item.file.size)}</div>
              </div>
              <button type="button" onClick={() => onChange(files.filter((file) => file.id !== item.id))} className="rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/15">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
          Chưa chọn file. Hỗ trợ PDF, DOCX, XLSX, JPG, PNG, WEBP.
        </div>
      )}
    </div>
  )
}

export function InventoryAttachmentList({
  attachments,
}: {
  attachments: Attachment[]
}) {
  if (!attachments.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
        Chưa có tài liệu đính kèm cho giao dịch này.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const version = currentAttachmentVersion(attachment)
        const publicUrl = absoluteUploadUrl(attachmentPublicUrl(attachment))
        const isImage = attachment.mimeType.startsWith('image/')

        return (
          <div key={attachment.id} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                  {isImage ? <ImageIcon size={17} /> : <FileText size={17} />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-100">
                    {attachment.originalName ?? version?.originalName ?? attachment.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {categoryLabel(attachment.category)} · {formatFileSize(attachment.fileSize)} · {formatDateTime(attachment.createdAt)}
                  </div>
                </div>
              </div>
              {publicUrl ? (
                <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
                  <Download size={14} />
                  Tải xuống
                </a>
              ) : null}
            </div>
            {isImage && publicUrl ? (
              <img src={publicUrl} alt={attachment.originalName ?? attachment.title} className="mt-3 max-h-72 w-full rounded-xl border border-white/10 object-contain" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function useInventoryTransactionAttachmentMap() {
  const { data } = useQuery({
    queryKey: ['attachments', 'inventory', 'transaction', 'all'],
    queryFn: () => getAttachments({
      module: 'inventory',
      entityType: 'transaction',
    }),
    staleTime: 10_000,
  })
  const attachments = normalizeAttachmentList(data)

  return useMemo(() => {
    const map: InventoryAttachmentMap = new Map()

    attachments.forEach((attachment) => {
      transactionAttachmentKeys(attachment).forEach((key) => {
        const current = map.get(key) ?? []
        if (!current.some((item) => item.id === attachment.id)) {
          current.push(attachment)
        }
        map.set(key, current)
      })
    })

    return map
  }, [attachments])
}

export function inventoryTransactionKeys(transaction: any) {
  return [
    transaction?.id,
    transaction?.transactionId,
    transaction?.inventoryTransactionId,
    transaction?.inventoryTransaction?.id,
    transaction?.transaction?.id,
    transaction?.transactionNo,
    transaction?.documentNo,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
}

export function getInventoryTransactionAttachments(transaction: any, attachmentMap: InventoryAttachmentMap) {
  const attachments = inventoryTransactionKeys(transaction).flatMap((key) => attachmentMap.get(key) ?? [])
  return Array.from(new Map(attachments.map((attachment) => [attachment.id, attachment])).values())
}

export function InventoryTransactionAttachmentButton({
  transaction,
  attachmentMap,
  onOpen,
}: {
  transaction: any
  attachmentMap: InventoryAttachmentMap
  onOpen: (attachments: Attachment[]) => void
}) {
  const attachments = getInventoryTransactionAttachments(transaction, attachmentMap)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(attachments)
      }}
      className={`inline-flex h-6 min-w-[40px] items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold transition ${
        attachments.length
          ? 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300/50 hover:bg-cyan-400/15'
          : 'border-white/10 bg-white/[0.035] text-slate-500 hover:text-slate-300'
      }`}
      title={`${attachments.length} tài liệu`}
    >
      <span aria-hidden="true">📎</span>
      {formatQuantity(attachments.length, 0)}
    </button>
  )
}

export function InventoryTransactionAttachmentDrawer({
  open,
  transaction,
  attachments,
  onClose,
}: {
  open: boolean
  transaction?: any
  attachments: Attachment[]
  onClose: () => void
}) {
  return (
    <ModuleDetailDrawer
      open={open}
      title={`📎 ${formatQuantity(attachments.length, 0)} tài liệu`}
      subtitle={transaction?.transactionNo ?? transaction?.documentNo ?? 'Hồ sơ giao dịch'}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <InventoryAttachmentList attachments={attachments} />
    </ModuleDetailDrawer>
  )
}

export async function uploadInventoryTransactionAttachments({
  transaction,
  files,
}: {
  transaction: any
  files: InventoryAttachmentDraft[]
}) {
  if (!files.length) return
  const transactionId = transaction?.id
  if (!transactionId) {
    throw new Error('Transaction id is required before uploading attachments')
  }

  const transactionType = String(transaction?.businessType ?? transaction?.type ?? transaction?.rawType ?? 'TRANSACTION').toUpperCase()

  for (const item of files) {
    await uploadAttachment({
      file: item.file,
      title: item.file.name,
      category: item.category,
      module: 'inventory',
      entityType: 'transaction',
      entityId: transactionId,
      purpose: 'inventory-transaction',
      metadata: {
        transactionNo: transaction?.transactionNo,
        transactionType,
      },
    })
  }
}

export function useInventoryTransactionAttachments(transactionId?: string) {
  return useMemo(() => ({
    queryKey: ['attachments', 'inventory', 'transaction', transactionId],
    queryFn: () => getAttachments({
      module: 'inventory',
      entityType: 'transaction',
      entityId: transactionId,
    }),
    enabled: Boolean(transactionId),
  }), [transactionId])
}

export function normalizeAttachmentList(result: Awaited<ReturnType<typeof getAttachments>> | undefined): Attachment[] {
  if (!result) return []
  return Array.isArray(result) ? result : result.data
}

function isAllowedAttachmentFile(file: File) {
  return allowedTypes.includes(file.type) || file.type.startsWith('image/')
}

function currentAttachmentVersion(attachment: Attachment) {
  const versions = Array.isArray(attachment.versions) ? attachment.versions : []
  return versions.find((version) => version.id === attachment.currentVersionId) ?? versions[0]
}

function transactionAttachmentKeys(attachment: Attachment) {
  return [
    attachment.entityId,
    (attachment.metadata as any)?.transactionNo,
    (attachment.metadata as any)?.documentNo,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
}

export function attachmentPublicUrl(attachment: Attachment) {
  const currentVersion = currentAttachmentVersion(attachment)
  const directUrl =
    (attachment as any).publicUrl ??
    (attachment as any).url ??
    (attachment as any).currentVersion?.publicUrl ??
    (attachment as any).latestVersion?.publicUrl

  if (currentVersion?.publicUrl) return currentVersion.publicUrl
  if (directUrl) return String(directUrl)
  if (attachment.storagePath) return `/uploads/${attachment.storagePath}`

  return ''
}

function absoluteUploadUrl(url: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export function debugAttachment(attachment: Attachment) {
  return {
    id: attachment.id,
    module: attachment.module,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    category: attachment.category,
    mimeType: attachment.mimeType,
    storagePath: attachment.storagePath,
    versionCount: Array.isArray(attachment.versions) ? attachment.versions.length : 0,
    publicUrl: attachmentPublicUrl(attachment),
  }
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${formatQuantity(size / 1024 / 1024, 1)} MB`
  if (size >= 1024) return `${formatQuantity(size / 1024, 1)} KB`
  return `${formatQuantity(size, 0)} B`
}

function categoryLabel(category: AttachmentCategory) {
  return inventoryAttachmentCategories.find((item) => item.value === category)?.label ?? category
}
