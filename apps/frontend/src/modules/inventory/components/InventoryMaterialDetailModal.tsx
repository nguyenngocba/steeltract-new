import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Building2, Clock, DollarSign, Download, Edit3, FileText, ImageIcon, MapPinned, Maximize2, Package, PackagePlus, Plus, Truck } from 'lucide-react'
import toast from 'react-hot-toast'

import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { API_BASE_URL } from '@/lib/api'
import { getAttachments, uploadAttachment } from '@/lib/attachments/attachments-api'
import type { Attachment } from '@/lib/attachments/attachment.types'
import {
  ModuleAnalyticsPanel,
  ModuleDataGrid,
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleKpiCard,
  ModuleKpiStrip,
  ModuleTabs,
  moduleMutedButton,
  moduleTableHead,
  moduleTableRow,
  type ModuleTone,
} from '@/shared/ui/modules'

type Props = {
  open: boolean
  detail?: any
  fallback?: any
  onClose: () => void
  onEdit?: () => void
}

type TabKey = 'overview' | 'transactions' | 'locations' | 'analytics' | 'projects' | 'suppliers' | 'images' | 'documents' | 'logs'

type TableRow = ReactNode[]

type AttachmentContext = {
  title: string
  subtitle: string
  attachments: Attachment[]
}

type AttachmentSourceRow = {
  attachment: Attachment
  source: string
  sourceDate: string
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'transactions', label: 'Nhập / Xuất' },
  { key: 'locations', label: 'Vị trí' },
  { key: 'analytics', label: 'Phân tích' },
  { key: 'projects', label: 'Công trình' },
  { key: 'suppliers', label: 'Nhà cung cấp' },

  { key: 'images', label: 'Hình ảnh vật tư' },
  { key: 'documents', label: 'Tài liệu vật tư' },

  { key: 'logs', label: 'Lịch sử' },
]

function num(value: any) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function fmt(value: any, digits = 3) {
  return formatQuantity(num(value), digits)
}

function money(value: any) {
  return formatCurrencyVnd(num(value))
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function MaterialImageGallery({
  images,
  selectedImage,
  uploading,
  onUpload,
  onSelect,
  onPreview,
}: {
  images: string[]
  selectedImage?: string
  uploading?: boolean
  onUpload: (file: File) => void | Promise<void>
  onSelect: (src: string) => void
  onPreview: (src: string) => void
}) {
  return (
    <ModuleAnalyticsPanel
      title="Hình ảnh vật tư"
      note={`${formatQuantity(images.length, 0)} ảnh · filesystem lưu file, database lưu metadata`}
      action={
        <label className={`${moduleMutedButton} cursor-pointer`}>
          <Plus size={14} />
          {uploading ? 'Đang tải...' : 'Thêm ảnh'}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void onUpload(file)
            }}
          />
        </label>
      }
    >
      {selectedImage ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onPreview(selectedImage)}
            className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/55"
          >
            <img src={selectedImage} alt="Hình ảnh vật tư" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-cyan-100 backdrop-blur">
              <Maximize2 size={13} />
              Zoom
            </span>
          </button>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => onSelect(src)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${src === selectedImage ? 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.24)]' : 'border-white/10 opacity-75 hover:opacity-100'}`}
                >
                  <img src={src} alt="Thumbnail vật tư" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <ModuleEmptyState
          icon={<ImageIcon size={18} />}
          title="Chưa có ảnh vật tư"
          description="UI đã sẵn sàng hiển thị gallery khi Material Master có imageUrl hoặc danh sách ảnh."
        />
      )}
    </ModuleAnalyticsPanel>
  )
}

function AttachmentCountChip({
  attachments,
  emptyLabel = 'Không có',
  onOpen,
}: {
  attachments: Attachment[]
  emptyLabel?: string
  onOpen: () => void
}) {
  if (!attachments.length) {
    return (
      <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[11px] font-semibold text-slate-500">
        {emptyLabel}
      </span>
    )
  }

  const first = attachments[0]
  const label = attachments.length === 1
    ? attachmentDisplayName(first)
    : `${formatQuantity(attachments.length, 0)} tài liệu`

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-left text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-400/15"
      title={attachments.map(attachmentDisplayName).join('\n')}
    >
      <FileText size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function MaterialDocumentsPanel({
  rows,
  onOpen,
}: {
  rows: AttachmentSourceRow[]
  onOpen: (context: AttachmentContext) => void
}) {
  return (
    <ModuleAnalyticsPanel title="Tài liệu vật tư" note={`${formatQuantity(rows.length, 0)} tài liệu theo nguồn phát sinh`}>
      {rows.length ? (
        <ModuleDataGrid>
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className={moduleTableHead}>
                <tr>
                  {['Tên file', 'Loại', 'Nguồn', 'Ngày tạo', 'Tải xuống'].map((header) => (
                    <th key={header} className="px-3 py-3 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const publicUrl = attachmentPublicUrl(row.attachment)
                  return (
                    <tr key={row.attachment.id} className={moduleTableRow}>
                      <td className="max-w-[280px] px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onOpen({
                            title: attachmentDisplayName(row.attachment),
                            subtitle: row.source,
                            attachments: [row.attachment],
                          })}
                          className="flex max-w-full items-center gap-2 text-left font-semibold text-cyan-100 hover:text-cyan-50"
                        >
                          <FileText size={14} className="shrink-0 text-cyan-300" />
                          <span className="truncate">{attachmentDisplayName(row.attachment)}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-lg border border-white/10 bg-white/[0.045] px-2 py-1 text-xs font-semibold text-slate-300">
                          {row.attachment.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{row.source}</td>
                      <td className="px-3 py-2 text-slate-400">{row.sourceDate ? formatDateTime(row.sourceDate) : '-'}</td>
                      <td className="px-3 py-2">
                        {publicUrl ? (
                          <a href={absoluteUploadUrl(publicUrl)} target="_blank" rel="noreferrer" className={moduleMutedButton}>
                            <Download size={14} />
                            Tải xuống
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">Không có URL</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ModuleDataGrid>
      ) : (
        <ModuleEmptyState icon={<FileText size={18} />} title="Chưa có tài liệu vật tư" description="Tài liệu sẽ xuất hiện theo nguồn: Master Material, giao dịch nhập/xuất, công trình hoặc nhà cung cấp." />
      )}
    </ModuleAnalyticsPanel>
  )
}

function MaterialAttachmentSummary({
  photoCount,
  documentCount,
  onOpenImages,
  onOpenDocuments,
}: {
  photoCount: number
  documentCount: number
  onOpenImages: () => void
  onOpenDocuments: () => void
}) {
  return (
    <ModuleAnalyticsPanel title="Hồ sơ vật tư" note="Tóm tắt ảnh và tài liệu theo hồ sơ vật tư">
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={onOpenImages}
          className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.055] p-3 text-left transition hover:border-emerald-300/35 hover:bg-emerald-400/10"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-100">Ảnh vật tư</span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
              {formatQuantity(photoCount, 0)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Mở gallery ảnh vật tư</div>
        </button>
        <button
          type="button"
          onClick={onOpenDocuments}
          className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3 text-left transition hover:border-cyan-300/35 hover:bg-cyan-400/10"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-100">Tài liệu</span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
              {formatQuantity(documentCount, 0)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Xem nguồn tài liệu liên quan</div>
        </button>
      </div>
    </ModuleAnalyticsPanel>
  )
}

function ImagePreviewDialog({ src, onClose }: { src: string; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/88 p-4 backdrop-blur-md" onClick={onClose}>
      <button type="button" className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.1]" onClick={onClose}>
        Đóng
      </button>
      <img src={src} alt="Preview vật tư" className="max-h-[86vh] max-w-[92vw] rounded-2xl border border-cyan-300/20 object-contain shadow-[0_30px_120px_rgba(0,0,0,0.55)]" onClick={(event) => event.stopPropagation()} />
    </div>,
    document.body,
  )
}

function AttachmentContextDrawer({
  context,
  onClose,
}: {
  context: AttachmentContext | null
  onClose: () => void
}) {
  return (
    <ModuleDetailDrawer
      open={Boolean(context)}
      title={context?.title ?? 'Tài liệu'}
      subtitle={context?.subtitle ?? 'Hồ sơ liên quan'}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <div className="space-y-2">
        {(context?.attachments ?? []).map((attachment) => {
          const publicUrl = attachmentPublicUrl(attachment)
          return (
            <div key={attachment.id} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                    <FileText size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{attachmentDisplayName(attachment)}</div>
                    <div className="mt-1 text-xs text-slate-500">{attachment.category} · {formatFileSize(attachment.fileSize)} · {formatDateTime(attachment.createdAt)}</div>
                  </div>
                </div>
                {publicUrl ? (
                  <a href={absoluteUploadUrl(publicUrl)} target="_blank" rel="noreferrer" className={moduleMutedButton}>
                    <Download size={14} />
                    Tải xuống
                  </a>
                ) : null}
              </div>
              {attachment.mimeType.startsWith('image/') && publicUrl ? (
                <img src={absoluteUploadUrl(publicUrl)} alt={attachmentDisplayName(attachment)} className="mt-3 max-h-72 w-full rounded-xl border border-white/10 object-contain" />
              ) : null}
            </div>
          )
        })}
        {!context?.attachments?.length ? (
          <ModuleEmptyState icon={<FileText size={18} />} title="Không có tài liệu" description="Nguồn này chưa có file đính kèm." />
        ) : null}
      </div>
    </ModuleDetailDrawer>
  )
}

export function InventoryMaterialDetailModal({ open, detail, fallback, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [focusedLocation, setFocusedLocation] = useState<any | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [attachmentContext, setAttachmentContext] = useState<AttachmentContext | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const queryClient = useQueryClient()

  const item = detail?.item ?? fallback ?? {}
  const code = item.code ?? fallback?.materialCode ?? fallback?.code ?? '-'
  const name = item.name ?? fallback?.materialName ?? fallback?.name ?? '-'
  const unit = item.unit ?? fallback?.unit ?? fallback?.unitCode ?? ''
  const currentStock = num(detail?.currentStock ?? fallback?.currentStock ?? fallback?.quantity)
  const averageCost = num(detail?.averageCost ?? fallback?.averageCost)
  const inventoryValue = num(fallback?.inventoryValue ?? detail?.inventoryValue ?? currentStock * averageCost)
  const minimumStock = num(item.minimumStock ?? fallback?.minimumStock)
  const materialUsageType = item.materialUsageType ?? fallback?.materialUsageType ?? 'PRIMARY'
  const inbound = detail?.inboundHistory ?? []
  const outbound = detail?.outboundHistory ?? []
  const projectRows = detail?.projectConsumptionHistory ?? []
  const supplierRows = detail?.supplierHistory ?? []
  const locationRows = detail?.locationBalances ?? []
  const materialId =
    item.id ??
    item.materialId ??
    item.inventoryItemId ??
    detail?.materialId ??
    detail?.inventoryItemId ??
    fallback?.materialId ??
    fallback?.inventoryItemId ??
    fallback?.id
  const attachmentQueryKey = ['attachments', 'inventory', 'material', materialId]
  const { data: attachmentResult = [] } = useQuery({
    queryKey: attachmentQueryKey,
    queryFn: () => getAttachments({ module: 'inventory', entityType: 'material', entityId: materialId }),
    enabled: Boolean(materialId),
  })
  const attachments = normalizeAttachmentList(attachmentResult)
  const photoAttachments = attachments.filter((attachment) => attachment.category === 'PHOTO' || attachment.mimeType.startsWith('image/'))
  const documentAttachments = attachments.filter((attachment) => !photoAttachments.some((photo) => photo.id === attachment.id))
  const mainQty = locationRows.filter((x: any) => x.warehouseCode !== 'PRODUCTION').reduce((sum: number, x: any) => sum + num(x.quantity), 0)
  const productionQty = locationRows.filter((x: any) => x.warehouseCode === 'PRODUCTION').reduce((sum: number, x: any) => sum + num(x.quantity), 0)
  const supplier = supplierRows[0]?.supplierName ?? '-'
  const transactionRows = useMemo(() => buildTransactionRows(inbound, outbound), [inbound, outbound])
  const { data: transactionAttachmentResult = [] } = useQuery({
    queryKey: ['attachments', 'inventory', 'transaction', 'material-detail', materialId],
    queryFn: () => getAttachments({ module: 'inventory', entityType: 'transaction' }),
    enabled: Boolean(materialId),
    staleTime: 10_000,
  })
  const allTransactionAttachments = normalizeAttachmentList(transactionAttachmentResult)
  const transactionRowsById = useMemo(() => {
    const map = new Map<string, any>()
    transactionRows.forEach((row) => {
      transactionEntityKeys(row).forEach((key) => map.set(key, row))
    })
    return map
  }, [transactionRows])
  const transactionAttachments = useMemo(() => {
    return allTransactionAttachments.filter((attachment) => {
      const entityId = String(attachment.entityId ?? '')
      if (entityId && transactionRowsById.has(entityId)) return true
      const transactionNo = String((attachment.metadata as any)?.transactionNo ?? '').trim()
      return Boolean(transactionNo && transactionRows.some((row) => String(row.transactionNo ?? '').trim() === transactionNo))
    })
  }, [allTransactionAttachments, transactionRows, transactionRowsById])
  const transactionAttachmentGroups = useMemo(() => groupTransactionAttachments(transactionAttachments, transactionRows), [transactionAttachments, transactionRows])
  const documentSourceRows = useMemo<AttachmentSourceRow[]>(() => {
    const materialRows = documentAttachments.map((attachment) => ({
      attachment,
      source: 'Master Material',
      sourceDate: attachment.createdAt,
    }))
    const transactionRowsWithSource = transactionAttachments
      .filter((attachment) => !isPhotoAttachment(attachment))
      .map((attachment) => {
        const sourceRow = findSourceTransactionRow(attachment, transactionRows)
        return {
          attachment,
          source: sourceRow ? transactionSourceLabel(sourceRow) : 'Inventory Transaction',
          sourceDate: attachment.createdAt,
        }
      })
    return [...materialRows, ...transactionRowsWithSource]
  }, [documentAttachments, transactionAttachments, transactionRows])
  const movementTrend = useMemo(() => buildMovementTrend(transactionRows), [transactionRows])
  const forecast = useMemo(() => buildForecast(currentStock, outbound), [currentStock, outbound])
  const imageUrls = useMemo(() => collectMaterialImages(detail, fallback, photoAttachments), [detail, fallback, photoAttachments])
  const primaryImage = selectedImage && imageUrls.includes(selectedImage) ? selectedImage : imageUrls[0]
  const materialAnalytics = useMemo(() => buildMaterialAnalytics(movementTrend, currentStock, forecast), [movementTrend, currentStock, forecast])
  const projectSummary = useMemo(() => buildUsageSummary(projectRows, averageCost), [projectRows, averageCost])
  const supplierSummary = useMemo(() => buildPurchaseSummary(supplierRows, averageCost), [supplierRows, averageCost])

  useEffect(() => {
    if (!import.meta.env.DEV || !open || !materialId) return

    console.debug('[inventory.material.attachments]', {
      queryParams: {
        module: 'inventory',
        entityType: 'material',
        entityId: materialId,
      },
      response: attachmentResult,
      mapped: {
        attachments: attachments.map(debugAttachment),
        imageUrls,
        primaryImage,
        documentAttachments: documentAttachments.map(debugAttachment),
      },
    })
  }, [
    attachmentResult,
    attachments,
    documentAttachments,
    imageUrls,
    materialId,
    open,
    primaryImage,
  ])

  async function handleImageUpload(file: File) {
    if (!materialId || !file) {
      toast.error('Không xác định được vật tư để upload ảnh')
      return
    }

    setUploadingImage(true)
    try {
      await uploadAttachment({
        file,
        title: file.name,
        category: 'PHOTO',
        module: 'inventory',
        entityType: 'material',
        entityId: materialId,
        purpose: 'material-image',
        metadata: {
          materialCode: code,
        },
      })
      setSelectedImage(null)
      await queryClient.invalidateQueries({ queryKey: attachmentQueryKey })
      toast.success('Đã thêm ảnh vật tư')
    } catch {
      toast.error('Không thể upload ảnh vật tư')
    } finally {
      setUploadingImage(false)
    }
  }

  if (!open) return null

  return createPortal(
    <>
      <ModuleDetailDrawer
        open={open}
        title={`${code} · ${name}`}
        subtitle={`${materialUsageLabel(materialUsageType)} · ${unit || 'Chưa có đơn vị'} · ${locationRows.length} vị trí lưu kho · ${formatQuantity(photoAttachments.length, 0)} ảnh · ${formatQuantity(documentSourceRows.length, 0)} tài liệu`}
        onClose={onClose}
        widthClass="max-w-7xl"
        actions={onEdit ? (
          <button type="button" onClick={onEdit} className={moduleMutedButton}>
            <Edit3 size={14} />
            Sửa vật tư
          </button>
        ) : null}
      >
        <div className="space-y-3">
          <ModuleKpiStrip className="md:grid-cols-2 xl:grid-cols-4">
            <ModuleKpiCard icon={<Package size={18} />} title="Current Stock" value={`${fmt(currentStock)} ${unit}`.trim()} note={`Tối thiểu ${fmt(minimumStock)}`} tone={currentStock <= minimumStock ? 'amber' : 'blue'} />
            <ModuleKpiCard icon={<DollarSign size={18} />} title="Average Cost" value={money(averageCost)} note="Đơn giá trung bình" tone="cyan" />
            <ModuleKpiCard icon={<BarChart3 size={18} />} title="Inventory Value" value={money(inventoryValue)} note="Tồn x giá trung bình" tone="emerald" />
            <ModuleKpiCard icon={<MapPinned size={18} />} title="Storage Locations" value={fmt(locationRows.length, 0)} note={`Kho chính ${fmt(mainQty)} · SX ${fmt(productionQty)}`} tone="purple" />
          </ModuleKpiStrip>

          <ModuleTabs tabs={tabs} active={activeTab} onChange={(tab) => setActiveTab(tab as TabKey)} />

          {activeTab === 'overview' && (
            <div className="grid gap-3 xl:grid-cols-[.8fr_1.2fr]">
              <div className="space-y-3">
                <MaterialAttachmentSummary
                  photoCount={photoAttachments.length}
                  documentCount={documentSourceRows.length}
                  onOpenImages={() => setActiveTab('images')}
                  onOpenDocuments={() => setActiveTab('documents')}
                />
                <MaterialImageGallery images={imageUrls} selectedImage={primaryImage} uploading={uploadingImage} onUpload={handleImageUpload} onSelect={setSelectedImage} onPreview={setPreviewImage} />
                <ModuleAnalyticsPanel title="Thông tin vật tư" note="Thông tin tổng hợp từ dữ liệu vật tư hiện có">
                  <InfoGrid rows={[
                    ['Mã vật tư', code],
                    ['Tên vật tư', name],
                    ['Loại vật tư', materialUsageLabel(materialUsageType)],
                    ['Đơn vị', unit || '-'],
                    ['Tồn tối thiểu', fmt(minimumStock)],
                    ['Nhà cung cấp gần nhất', supplier],
                  ]} />
                </ModuleAnalyticsPanel>
              </div>
              <ModuleAnalyticsPanel title="Tồn theo kho" note="Phân tách kho chính và kho vật tư sản xuất">
                <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                  <Donut rows={[
                    { label: 'Kho chính', value: mainQty, color: '#22c55e' },
                    { label: 'Kho SX', value: productionQty, color: '#f59e0b' },
                  ]} center={fmt(currentStock)} label={unit || 'tồn'} />
                  <div className="space-y-2">
                    <MetricLine label="Kho chính" value={`${fmt(mainQty)} ${unit}`.trim()} tone="emerald" />
                    <MetricLine label="Kho vật tư SX" value={`${fmt(productionQty)} ${unit}`.trim()} tone="amber" />
                    <MetricLine label="Trạng thái" value={currentStock <= 0 ? 'Hết hàng' : currentStock <= minimumStock ? 'Cảnh báo' : 'Bình thường'} tone={currentStock <= minimumStock ? 'amber' : 'emerald'} />
                  </div>
                </div>
              </ModuleAnalyticsPanel>
            </div>
          )}

          {activeTab === 'transactions' && (
            <DetailTable
              title="Lịch sử giao dịch"
              headers={['Thời gian', 'Loại', 'Đối tượng', 'Số lượng', 'Giá trị', 'Tài liệu']}
              rows={transactionRows.slice(0, 18).map((row) => [
                row.transactionDate ? formatDateTime(row.transactionDate) : '-',
                <TransactionTypeBadge key="type" type={row.type} />,
                row.counterparty,
                `${fmt(row.quantity)} ${unit}`.trim(),
                money(row.totalAmount),
                <AttachmentCountChip
                  key="attachments"
                  attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                  onOpen={() => setAttachmentContext({
                    title: row.transactionNo ?? 'Tài liệu giao dịch',
                    subtitle: transactionSourceLabel(row),
                    attachments: attachmentsForTransactionRow(row, transactionAttachmentGroups),
                  })}
                />,
              ])}
            />
          )}

          {activeTab === 'locations' && (
            <LocationBalancePanel rows={locationRows} unit={unit} onFocus={setFocusedLocation} />
          )}

          {activeTab === 'analytics' && (
            <MaterialAnalyticsCockpit analytics={materialAnalytics} forecast={forecast} unit={unit} minimumStock={minimumStock} />
          )}

          {activeTab === 'projects' && (
            <div className="space-y-3">
              <ModuleKpiStrip className="md:grid-cols-3">
                <ModuleKpiCard icon={<Building2 size={18} />} title="Usage summary" value={`${fmt(projectSummary.totalQty)} ${unit}`.trim()} note={`${fmt(projectSummary.projectCount, 0)} công trình`} tone="blue" />
                <ModuleKpiCard icon={<Truck size={18} />} title="Returned" value={`${fmt(projectSummary.returnedQty)} ${unit}`.trim()} note="Vật tư đã trả" tone="amber" />
                <ModuleKpiCard icon={<DollarSign size={18} />} title="Usage value" value={money(projectSummary.totalValue)} note="Giá trị xuất công trình" tone="emerald" />
              </ModuleKpiStrip>
              <DetailTable
                title="Top projects"
                headers={['Công trình', 'Đã xuất', 'Đã trả', 'Giá trị', 'Hồ sơ liên quan']}
                rows={projectRows.slice(0, 12).map((row: any) => [
                  row.projectName ?? 'Không rõ',
                  `${fmt(row.issuedQty ?? row.quantity)} ${unit}`.trim(),
                  `${fmt(row.returnedQty)} ${unit}`.trim(),
                  money(row.issuedValue ?? num(row.quantity) * averageCost),
                  <AttachmentCountChip
                    key="project-files"
                    attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                    onOpen={() => setAttachmentContext({
                      title: row.projectName ?? 'Hồ sơ công trình',
                      subtitle: 'Hồ sơ liên quan từ giao dịch xuất kho',
                      attachments: attachmentsForTransactionRow(row, transactionAttachmentGroups),
                    })}
                  />,
                ])}
              />
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-3">
              <ModuleKpiStrip className="md:grid-cols-3">
                <ModuleKpiCard icon={<PackagePlus size={18} />} title="Purchase summary" value={`${fmt(supplierSummary.totalQty)} ${unit}`.trim()} note={`${fmt(supplierSummary.supplierCount, 0)} nhà cung cấp`} tone="cyan" />
                <ModuleKpiCard icon={<DollarSign size={18} />} title="Purchase value" value={money(supplierSummary.totalValue)} note="Tổng giá trị nhập" tone="emerald" />
                <ModuleKpiCard icon={<Clock size={18} />} title="Latest supplier" value={supplier} note="Theo lịch sử nhập gần nhất" tone="purple" />
              </ModuleKpiStrip>
              <DetailTable
                title="Top suppliers"
                headers={['Nhà cung cấp', 'Số lượng nhập', 'Đơn giá nhập', 'Tổng giá trị', 'Chứng từ']}
                rows={supplierRows.slice(0, 12).map((row: any) => [
                  row.supplierName ?? 'Không rõ',
                  `${fmt(row.quantity)} ${unit}`.trim(),
                  money(row.unitPrice ?? row.latestUnitPrice ?? averageCost),
                  money(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost)),
                  <AttachmentCountChip
                    key="supplier-files"
                    attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                    onOpen={() => setAttachmentContext({
                      title: row.supplierName ?? 'Chứng từ nhà cung cấp',
                      subtitle: 'Chứng từ liên quan từ giao dịch nhập kho',
                      attachments: attachmentsForTransactionRow(row, transactionAttachmentGroups),
                    })}
                  />,
                ])}
              />
            </div>
          )}
          {activeTab === 'images' && (
            <MaterialImageGallery
              images={imageUrls}
              selectedImage={primaryImage}
              uploading={uploadingImage}
              onUpload={handleImageUpload}
              onSelect={(src) => setSelectedImage(src)}
              onPreview={(src) => setPreviewImage(src)}
            />
          )}
          {activeTab === 'documents' && (
            <MaterialDocumentsPanel
              rows={documentSourceRows}
              onOpen={setAttachmentContext}
            />
          )}

          {activeTab === 'logs' && (
            <ModuleAnalyticsPanel title="Lịch sử thay đổi" note="Tổng hợp nhanh từ giao dịch nhập/xuất gần nhất">
              <div className="space-y-2">
                {transactionRows.slice(0, 10).map((row, index) => (
                  <div key={`${row.transactionNo}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-300">
                    <span className="min-w-0 truncate">{row.transactionNo ?? 'Giao dịch'} · {row.counterparty}</span>
                    <span className="shrink-0 text-xs text-slate-500">{row.transactionDate ? formatDateTime(row.transactionDate) : '-'}</span>
                  </div>
                ))}
                {!transactionRows.length && <ModuleEmptyState title="Chưa có lịch sử thay đổi" description="Lịch sử sẽ xuất hiện khi vật tư có giao dịch." />}
              </div>
            </ModuleAnalyticsPanel>
          )}
        </div>
      </ModuleDetailDrawer>
      <AttachmentContextDrawer context={attachmentContext} onClose={() => setAttachmentContext(null)} />
      {focusedLocation ? <LocationFocusPreview location={focusedLocation} onClose={() => setFocusedLocation(null)} /> : null}
      {previewImage ? <ImagePreviewDialog src={previewImage} onClose={() => setPreviewImage(null)} /> : null}
    </>,
    document.body,
  )
}

function InfoGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
          <div className="text-[11px] text-slate-500">{label}</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</div>
        </div>
      ))}
    </div>
  )
}

function MetricLine({ label, value, tone = 'cyan' }: { label: string; value: string; tone?: ModuleTone }) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'blue' ? 'text-blue-300' : tone === 'purple' ? 'text-purple-300' : 'text-cyan-300'
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
      <span className="text-slate-400">{label}</span>
      <b className={color}>{value}</b>
    </div>
  )
}

function LocationBalancePanel({ rows, unit, onFocus }: { rows: any[]; unit: string; onFocus: (row: any) => void }) {
  const distribution = buildLocationDistribution(rows)
  return (
    <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
      <ModuleAnalyticsPanel title="Donut distribution" note="Phân bổ tồn theo kho/vị trí">
        <Donut rows={distribution} center={fmt(rows.reduce((sum, row) => sum + num(row.quantity), 0))} label={unit || 'tồn'} />
      </ModuleAnalyticsPanel>
      <DetailTable
        title="Location table"
        headers={['Kho', 'Zone', 'Ô', 'Tầng', 'Số lượng', 'Cập nhật', '2D']}
        rows={rows.map((row, index) => [
          row.warehouseName ?? '-',
          <span key="zone" className="text-cyan-300">{row.zoneName ?? row.zoneCode ?? '-'}</span>,
          row.slotId ?? '-',
          row.level ?? '-',
          `${fmt(row.quantity)} ${unit}`.trim(),
          row.updatedAt ? formatDateTime(row.updatedAt) : '-',
          <button key={`${row.zoneId ?? index}-focus`} type="button" onClick={() => onFocus(row)} className={moduleMutedButton}>Xem 2D</button>,
        ])}
      />
    </div>
  )
}

function TransactionTypeBadge({ type }: { type: string }) {
  const normalized = normalizeTransactionType(type)
  const config: Record<string, { label: string; className: string }> = {
    INBOUND: { label: 'Inbound', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
    OUTBOUND: { label: 'Outbound', className: 'border-red-500/30 bg-red-500/10 text-red-200' },
    TRANSFER: { label: 'Transfer', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' },
    ADJUSTMENT: { label: 'Adjustment', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
  }
  const item = config[normalized] ?? config.ADJUSTMENT
  return <span className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-semibold ${item.className}`}>{item.label}</span>
}

function MaterialAnalyticsCockpit({
  analytics,
  forecast,
  unit,
  minimumStock,
}: {
  analytics: ReturnType<typeof buildMaterialAnalytics>
  forecast: { outboundDaily: number; projected7d: number; daysOfCover: number }
  unit: string
  minimumStock: number
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <TrendPanel
        title="Inbound Trend"
        note="Khối lượng nhập theo ngày"
        rows={analytics.inboundTrend}
        color="#22c55e"
        footer={`${fmt(analytics.inboundTotal)} ${unit}`.trim()}
      />
      <TrendPanel
        title="Outbound Trend"
        note="Khối lượng xuất theo ngày"
        rows={analytics.outboundTrend}
        color="#ef4444"
        footer={`${fmt(analytics.outboundTotal)} ${unit}`.trim()}
      />
      <TrendPanel
        title="Inventory Trend"
        note="Tồn kho ước tính sau nhập/xuất"
        rows={analytics.inventoryTrend}
        color="#38bdf8"
        footer={`${fmt(analytics.currentStock)} ${unit}`.trim()}
      />
      <TrendPanel
        title="Forecast 7 Days"
        note="Tồn dự kiến nếu tốc độ xuất giữ nguyên"
        rows={analytics.forecastTrend}
        color={forecast.projected7d <= minimumStock ? '#f59e0b' : '#1d7cff'}
        footer={`${fmt(forecast.projected7d)} ${unit}`.trim()}
      />
      <ModuleAnalyticsPanel title="Inventory Turnover" note="Tỷ lệ xuất / tồn bình quân từ dữ liệu hiện có" className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricLine label="Xuất trung bình/ngày" value={`${fmt(forecast.outboundDaily)} ${unit}`.trim()} tone="amber" />
          <MetricLine label="Days of cover" value={`${fmt(forecast.daysOfCover, 1)} ngày`} tone={forecast.daysOfCover < 7 ? 'amber' : 'cyan'} />
          <MetricLine label="Turnover" value={`${fmt(analytics.turnover, 2)} vòng`} tone="purple" />
          <MetricLine label="Tồn bình quân" value={`${fmt(analytics.averageStock)} ${unit}`.trim()} tone="blue" />
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
          Forecast và turnover là analytics frontend từ lịch sử nhập/xuất hiện có; không tạo yêu cầu mua hàng hoặc thay đổi workflow.
        </div>
      </ModuleAnalyticsPanel>
    </div>
  )
}

function TrendPanel({
  title,
  note,
  rows,
  color,
  footer,
}: {
  title: string
  note: string
  rows: Array<{ label: string; value: number }>
  color: string
  footer: string
}) {
  return (
    <ModuleAnalyticsPanel title={title} note={note} action={footer}>
      {rows.length ? (
        <FoundationLineChart rows={rows} color={color} />
      ) : (
        <ModuleEmptyState title="Chưa đủ dữ liệu" description="Biểu đồ sẽ hiển thị khi vật tư có lịch sử giao dịch." />
      )}
    </ModuleAnalyticsPanel>
  )
}

function FoundationLineChart({ rows, color }: { rows: Array<{ label: string; value: number }>; color: string }) {
  const width = 720
  const height = 220
  const padding = 28
  const max = Math.max(1, ...rows.map((row) => row.value))
  const min = Math.min(0, ...rows.map((row) => row.value))
  const span = Math.max(1, max - min)
  const point = (row: { value: number }, index: number) => {
    const x = padding + (index / Math.max(1, rows.length - 1)) * (width - padding * 2)
    const y = height - padding - ((row.value - min) / span) * (height - padding * 2)
    return { x, y }
  }
  const points = rows.map(point)
  const path = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className="h-[260px] rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3)
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
        })}
        <path d={area} fill={`url(#area-${color.replace('#', '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, index) => (
          <g key={`${rows[index].label}-${index}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#08111f" stroke={color} strokeWidth="2" />
            <text x={p.x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px]">{rows[index].label}</text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{rows[0]?.label ?? '-'}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  )
}
function Donut({ rows, center, label }: { rows: Array<{ label: string; value: number; color: string }>; center: string; label: string }) {
  const filtered = rows.filter((row) => row.value > 0)
  const chartRows = filtered.length ? filtered : [{ label: 'No data', value: 1, color: '#334155' }]
  const total = Math.max(1, chartRows.reduce((sum, row) => sum + row.value, 0))
  let cursor = 0
  const gradient = chartRows.map((row) => {
    const start = cursor
    const end = cursor + row.value / total * 100
    cursor = end
    return `${row.color} ${start}% ${end}%`
  }).join(', ')
  return (
    <div className="grid grid-cols-[136px_1fr] items-center gap-4">
      <div className="relative h-32 w-32 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-4 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-white">{center}</div>
          <div className="text-[10px] text-slate-500">{label}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden text-[11px]">
        {chartRows.slice(0, 7).map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="truncate">{row.label}</span>
            </span>
            <b className="text-slate-100">{fmt(row.value)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailTable({ title, headers, rows }: { title: string; headers: string[]; rows: TableRow[] }) {
  return (
    <ModuleDataGrid>
      <div className="border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</div>
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className={moduleTableHead}>
            <tr>
              {headers.map((header) => <th key={header} className="px-3 py-3 text-left">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={moduleTableRow}>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-middle">{cell}</td>)}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={headers.length} className="px-3 py-8">
                  <ModuleEmptyState title="Chưa có dữ liệu" description="Bảng sẽ tự cập nhật khi có dữ liệu vận hành." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModuleDataGrid>
  )
}

function buildTransactionRows(inbound: any[], outbound: any[]) {
  return [
    ...inbound.map((x: any) => ({ ...x, type: normalizeTransactionType(x.type ?? x.transactionType ?? 'INBOUND') })),
    ...outbound.map((x: any) => ({ ...x, type: normalizeTransactionType(x.type ?? x.transactionType ?? 'OUTBOUND') })),
  ].map((row: any) => ({
    ...row,
    counterparty: row.supplierName ?? row.projectName ?? row.targetName ?? row.transactionNo ?? '-',
    quantity: Math.abs(num(row.quantity)),
    totalAmount: num(row.totalAmount ?? row.totalValue ?? num(row.quantity) * num(row.unitPrice)),
  })).sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt ?? 0) - +new Date(a.transactionDate ?? a.createdAt ?? 0))
}

function transactionEntityKeys(row: any) {
  return [
    row?.id,
    row?.transactionId,
    row?.inventoryTransactionId,
    row?.inventoryTransaction?.id,
    row?.transaction?.id,
    row?.transactionNo,
    row?.documentNo,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
}

function attachmentTransactionNo(attachment: Attachment) {
  return String(
    (attachment.metadata as any)?.transactionNo ??
    (attachment.metadata as any)?.documentNo ??
    '',
  ).trim()
}

function isPhotoAttachment(attachment: Attachment) {
  return attachment.category === 'PHOTO' || attachment.mimeType.startsWith('image/')
}

function attachmentDisplayName(attachment: Attachment) {
  const version = currentAttachmentVersion(attachment)
  return attachment.originalName ?? version?.originalName ?? attachment.title ?? 'Tài liệu'
}

function transactionSourceLabel(row: any) {
  const type = normalizeTransactionType(row?.type ?? row?.transactionType ?? row?.businessType)
  const transactionNo = String(row?.transactionNo ?? row?.documentNo ?? '').trim()
  const label = type === 'INBOUND'
    ? 'Inbound Transaction'
    : type === 'OUTBOUND'
      ? 'Outbound Transaction'
      : type === 'TRANSFER'
        ? 'Transfer Transaction'
        : 'Inventory Transaction'

  return transactionNo ? `${label} ${transactionNo}` : label
}

function findSourceTransactionRow(attachment: Attachment, rows: any[]) {
  const entityId = String(attachment.entityId ?? '').trim()
  const transactionNo = attachmentTransactionNo(attachment)

  return rows.find((row) => {
    const keys = transactionEntityKeys(row)
    if (entityId && keys.includes(entityId)) return true
    return Boolean(transactionNo && keys.includes(transactionNo))
  })
}

function groupTransactionAttachments(attachments: Attachment[], rows: any[]) {
  const groups = new Map<string, Attachment[]>()

  attachments.forEach((attachment) => {
    const sourceRow = findSourceTransactionRow(attachment, rows)
    const keys = sourceRow
      ? transactionEntityKeys(sourceRow)
      : [String(attachment.entityId ?? '').trim(), attachmentTransactionNo(attachment)].filter(Boolean)

    keys.forEach((key) => {
      const current = groups.get(key) ?? []
      if (!current.some((item) => item.id === attachment.id)) {
        current.push(attachment)
      }
      groups.set(key, current)
    })
  })

  return groups
}

function attachmentsForTransactionRow(row: any, groups: Map<string, Attachment[]>) {
  const found = transactionEntityKeys(row).flatMap((key) => groups.get(key) ?? [])
  return Array.from(new Map(found.map((attachment) => [attachment.id, attachment])).values())
}

function normalizeTransactionType(value: string) {
  const type = String(value ?? '').toUpperCase()
  if (type.includes('IN') || type.includes('IMPORT') || type.includes('RECEIPT')) return 'INBOUND'
  if (type.includes('OUT') || type.includes('EXPORT') || type.includes('ISSUE')) return 'OUTBOUND'
  if (type.includes('TRANSFER')) return 'TRANSFER'
  return 'ADJUSTMENT'
}

function buildMovementTrend(rows: any[]) {
  const map = new Map<string, { label: string; inbound: number; outbound: number }>()
  rows.forEach((row) => {
    const label = String(row.transactionDate ?? row.createdAt ?? '').slice(5, 10) || '-'
    const current = map.get(label) ?? { label, inbound: 0, outbound: 0 }
    if (row.type === 'INBOUND') current.inbound += num(row.quantity)
    if (row.type === 'OUTBOUND') current.outbound += num(row.quantity)
    map.set(label, current)
  })
  return Array.from(map.values()).slice(-10)
}

function buildForecast(currentStock: number, outbound: any[]) {
  const days = new Set(outbound.map((row: any) => String(row.transactionDate ?? row.createdAt ?? '').slice(0, 10)).filter(Boolean))
  const divisor = Math.max(1, Math.min(30, days.size || 7))
  const outboundDaily = outbound.reduce((sum: number, row: any) => sum + Math.abs(num(row.quantity)), 0) / divisor
  const projected7d = Math.max(0, currentStock - outboundDaily * 7)
  return {
    outboundDaily,
    projected7d,
    daysOfCover: currentStock / Math.max(0.001, outboundDaily || 1),
  }
}

function collectMaterialImages(detail: any, fallback: any, attachments: Attachment[]) {
  const candidates = [
    ...attachments.map((attachment) => {
      const publicUrl = attachmentPublicUrl(attachment)
      return publicUrl ? absoluteUploadUrl(publicUrl) : undefined
    }).filter(Boolean),
    detail?.item?.imageUrl,
    detail?.item?.photoUrl,
    detail?.item?.thumbnailUrl,
    detail?.imageUrl,
    detail?.photoUrl,
    fallback?.imageUrl,
    fallback?.photoUrl,
    fallback?.thumbnailUrl,
    ...(Array.isArray(detail?.images) ? detail.images.map((image: any) => image?.url ?? image?.imageUrl ?? image) : []),
    ...(Array.isArray(fallback?.images) ? fallback.images.map((image: any) => image?.url ?? image?.imageUrl ?? image) : []),
  ]

  return Array.from(new Set(candidates.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())))
}

function normalizeAttachmentList(result: Awaited<ReturnType<typeof getAttachments>>): Attachment[] {
  return Array.isArray(result) ? result : result.data
}

function currentAttachmentVersion(attachment: Attachment) {
  const versions = Array.isArray(attachment.versions) ? attachment.versions : []
  return versions.find((version) => version.id === attachment.currentVersionId) ?? versions[0]
}

function attachmentPublicUrl(attachment: Attachment) {
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

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${formatQuantity(size / 1024 / 1024, 1)} MB`
  if (size >= 1024) return `${formatQuantity(size / 1024, 1)} KB`
  return `${formatQuantity(size, 0)} B`
}

function debugAttachment(attachment: Attachment) {
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

function buildMaterialAnalytics(
  movementRows: Array<{ label: string; inbound: number; outbound: number }>,
  currentStock: number,
  forecast: { outboundDaily: number },
) {
  const inboundTrend = movementRows.map((row) => ({ label: row.label, value: row.inbound }))
  const outboundTrend = movementRows.map((row) => ({ label: row.label, value: row.outbound }))
  const netMovement = movementRows.reduce((sum, row) => sum + row.inbound - row.outbound, 0)
  let runningStock = Math.max(0, currentStock - netMovement)
  const inventoryTrend = movementRows.map((row) => {
    runningStock = Math.max(0, runningStock + row.inbound - row.outbound)
    return { label: row.label, value: runningStock }
  })
  const forecastTrend = Array.from({ length: 7 }, (_, index) => ({
    label: `D+${index + 1}`,
    value: Math.max(0, currentStock - forecast.outboundDaily * (index + 1)),
  }))
  const inboundTotal = inboundTrend.reduce((sum, row) => sum + row.value, 0)
  const outboundTotal = outboundTrend.reduce((sum, row) => sum + row.value, 0)
  const stockRows = inventoryTrend.length ? inventoryTrend : [{ label: 'Now', value: currentStock }]
  const averageStock = stockRows.reduce((sum, row) => sum + row.value, 0) / Math.max(1, stockRows.length)

  return {
    inboundTrend,
    outboundTrend,
    inventoryTrend: stockRows,
    forecastTrend,
    inboundTotal,
    outboundTotal,
    currentStock,
    averageStock,
    turnover: outboundTotal / Math.max(0.001, averageStock || currentStock || 1),
  }
}

function buildUsageSummary(rows: any[], averageCost: number) {
  const projects = new Set<string>()
  const totalQty = rows.reduce((sum: number, row: any) => {
    projects.add(row.projectName ?? row.projectId ?? 'unknown')
    return sum + num(row.issuedQty ?? row.quantity)
  }, 0)
  const returnedQty = rows.reduce((sum: number, row: any) => sum + num(row.returnedQty), 0)
  const totalValue = rows.reduce((sum: number, row: any) => sum + num(row.issuedValue ?? num(row.quantity) * averageCost), 0)
  return { totalQty, returnedQty, totalValue, projectCount: projects.size }
}

function buildPurchaseSummary(rows: any[], averageCost: number) {
  const suppliers = new Set<string>()
  const totalQty = rows.reduce((sum: number, row: any) => {
    suppliers.add(row.supplierName ?? row.supplierId ?? 'unknown')
    return sum + num(row.quantity)
  }, 0)
  const totalValue = rows.reduce((sum: number, row: any) => sum + num(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost)), 0)
  return { totalQty, totalValue, supplierCount: suppliers.size }
}

function buildLocationDistribution(rows: any[]) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const label = row.zoneName ?? row.warehouseName ?? row.zoneCode ?? 'Không rõ'
    map.set(label, (map.get(label) ?? 0) + num(row.quantity))
  })
  const palette = ['#1d7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8', '#14b8a6']
  return Array.from(map.entries()).map(([label, value], index) => ({ label, value, color: palette[index % palette.length] }))
}

function slotRow(slotId?: string | null) {
  return String(slotId ?? '').substring(0, 1)
}

function slotColumn(slotId?: string | null) {
  return String(slotId ?? '').substring(1)
}

function LocationFocusPreview({ location, onClose }: { location: any; onClose: () => void }) {
  const row = slotRow(location.slotId)
  const column = slotColumn(location.slotId)
  const rows = buildFocusRows(row)
  const columns = buildFocusColumns(column)
  const selectedKey = `${row}-${column}`

  return (
    <ModuleDetailDrawer
      open
      title={location.zoneName ?? 'Vị trí kho'}
      subtitle={`Focus vị trí 2D · Slot ${location.slotId ?? '-'} · Tầng ${location.level ?? '-'} · ${fmt(location.quantity)}`}
      onClose={onClose}
      widthClass="max-w-3xl"
    >
      <ModuleAnalyticsPanel title="Sơ đồ vị trí" note="Preview ô/tầng đang chứa vật tư">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(56px, 1fr))` }}>
          <div />
          {columns.map((column) => <div key={column} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-center text-xs text-slate-400">{column}</div>)}
          {rows.map((row) => [
            <div key={`${row}-label`} className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-3 text-center text-xs text-slate-400">{row}</div>,
            ...columns.map((column) => {
              const active = selectedKey === `${row}-${column}`
              return <div key={`${row}-${column}`} className={`min-h-[58px] rounded-lg border p-2 ${active ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.35)]' : 'border-slate-800 bg-slate-900/25 text-slate-700 opacity-40'}`}>
                <div className="text-xs font-semibold">{row}{column}</div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.12em]">{active ? 'Focused' : 'Dimmed'}</div>
              </div>
            }),
          ])}
        </div>
      </ModuleAnalyticsPanel>
    </ModuleDetailDrawer>
  )
}

function buildFocusRows(current?: string | null) {
  const base = ['A', 'B', 'C', 'D', 'E', 'F']
  const row = String(current ?? '').trim().toUpperCase()
  if (!row || base.includes(row)) return base
  return [row, ...base].slice(0, 6)
}

function buildFocusColumns(current?: string | null) {
  const base = ['01', '02', '03', '04', '05', '06']
  const column = String(current ?? '').trim().padStart(2, '0')
  if (!column || base.includes(column)) return base
  return [column, ...base].slice(0, 6)
}
