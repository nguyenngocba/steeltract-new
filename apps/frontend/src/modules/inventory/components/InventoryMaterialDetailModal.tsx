import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Building2, Clock, RefreshCw, RotateCcw, DollarSign, Download, Edit3, FileText, ImageIcon, MapPinned, Maximize2, Package, PackagePlus, Plus, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrencyVnd, formatDateTime, formatQuantity, parseLocaleNumber } from '@/shared/utils/number-format';
import { API_BASE_URL } from '@/lib/api';
import { getAttachments, uploadAttachment } from '@/lib/attachments/attachments-api';
import type { Attachment } from '@/lib/attachments/attachment.types';
import { InventoryPagination } from '../components/InventoryVisuals'
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
} from '@/shared/ui/modules';
import { useMaterialTransactions } from '../hooks/useInventoryReadModels';

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

function formatCompactCurrency(value: number): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1).replace('.', ',') + ' triệu';
  }
  return formatCurrencyVnd(value);
}

function num(value: any) {
  const n = parseLocaleNumber(value)
  return Number.isFinite(n) ? n : 0
}

function fmt(value: any, digits = 3) {
  return formatQuantity(num(value), digits)
}

function money(value: any) {
  return formatCurrencyVnd(num(value))
}

function isMainWarehouseLocation(location: any) {
  const code = String(location?.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location?.warehouseName ?? '').trim().toLowerCase()
  return code === 'MAIN' || name.includes('kho chính') || name.includes('kho chinh')
}

function isProductionWarehouseLocation(location: any) {
  const code = String(location?.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location?.warehouseName ?? '').trim().toLowerCase()
  return code === 'PRODUCTION' || name.includes('sản xuất') || name.includes('san xuat')
}

function sumLocationQty(rows: any[]) {
  return rows.reduce((sum: number, row: any) => sum + num(row.quantity), 0)
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
      note={`${formatQuantity(images.length, 0)}. UI đã sẵn sàng hiển thị gallery khi Material Master có imageUrl hoặc danh sách ảnh.`}
      action={
        <label className={`${moduleMutedButton} cursor-pointer whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1`}>
          <Plus size={12} />
          {uploading ? 'Đang tải...' : 'Thêm ảnh'}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void onUpload(file);
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
  knownCount,
  emptyLabel = 'Không có',
  onOpen,
}: {
  attachments: Attachment[]
  knownCount?: number
  emptyLabel?: string
  onOpen: () => void
}) {
  if (!attachments.length && !knownCount) {
    return (
      <span className="inline-flex rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1 text-[11px] font-semibold text-slate-500">
        {emptyLabel}
      </span>
    )
  }

  const first = attachments[0]
  const count = attachments.length || knownCount || 0
  const label = attachments.length === 1
    ? attachmentDisplayName(first)
    : `${formatQuantity(count, 0)} tài liệu`

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-left text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-400/15"
      title={attachments.length
        ? attachments.map(attachmentDisplayName).join('\n')
        : 'Mở tài liệu giao dịch'}
    >
      <FileText size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}
function parseTransactionSource(source: string): { type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | null; transactionNo: string | null } {
  const inboundMatch = source.match(/^Inbound Transaction\s+(.+)/);
  if (inboundMatch) return { type: 'INBOUND', transactionNo: inboundMatch[1] };
  const outboundMatch = source.match(/^Outbound Transaction\s+(.+)/);
  if (outboundMatch) return { type: 'OUTBOUND', transactionNo: outboundMatch[1] };
  const transferMatch = source.match(/^Transfer Transaction\s+(.+)/);
  if (transferMatch) return { type: 'TRANSFER', transactionNo: transferMatch[1] };
  return { type: null, transactionNo: null };
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
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] text-sm table-fixed">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col className="w-[80px]" />
              <col className="w-[200px]" />
              <col className="w-[80px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className={moduleTableHead}>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Ngày tạo</th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Tên file</th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Loại</th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Nguồn</th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Dung lượng</th>
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Tải xuống</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const publicUrl = attachmentPublicUrl(row.attachment)
                const parsed = parseTransactionSource(row.source)
                return (
                  <tr key={row.attachment.id} className={moduleTableRow}>
                    <td className="px-2 py-1.5 text-slate-400">{row.sourceDate ? formatDateTime(row.sourceDate) : '-'}</td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => onOpen({
                          title: attachmentDisplayName(row.attachment),
                          subtitle: row.source,
                          attachments: [row.attachment],
                        })}
                        className="flex w-full items-center gap-2 text-left font-semibold text-cyan-100 hover:text-cyan-50 truncate"
                        title={attachmentDisplayName(row.attachment)}
                      >
                        <FileText size={14} className="shrink-0 text-cyan-300" />
                        <span className="truncate">{attachmentDisplayName(row.attachment)}</span>
                      </button>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="rounded-lg border border-white/10 bg-white/[0.045] px-2 py-0.5 text-xs font-semibold text-slate-300">
                        {row.attachment.category}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      {parsed.type ? (
                        <div className="flex items-center gap-2">
                          <TransactionTypeBadge type={parsed.type} />
                          <span className="text-sm font-semibold text-slate-200 truncate" title={parsed.transactionNo ?? ''}>
                            {parsed.transactionNo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">{row.source}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-300">
                      {formatFileSize(row.attachment.fileSize)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {publicUrl ? (
                        <a
                          href={absoluteUploadUrl(publicUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded border border-cyan-400/20 bg-cyan-400/10 p-1.5 text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/20 hover:text-cyan-200"
                          title="Tải xuống"
                        >
                          <Download size={14} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước ảnh vật tư"
      className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/88 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button type="button" aria-label="Đóng xem trước ảnh" className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70" onClick={onClose}>
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
// ================= COMPONENT SPARKLINE =================
function KpiSparkline({ values, line, fill }: { values: number[]; line: string; fill: string }) {
  const rows = values.length ? values : [0, 0, 0, 0, 0, 0];
  const min = Math.min(...rows);
  const max = Math.max(...rows);
  const range = Math.max(1, max - min);
  const points = rows.map((value, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100;
    const y = 34 - ((value - min) / range) * 24 - 5;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] opacity-95">
      <polyline points={`0,34 ${points} 100,34`} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={line} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ================= COMPONENT METRIC CARD =================
function InventoryMetricCard({
  title,
  value,
  note,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
  compact = false,
}: {
  title: string;
  value: string;
  note?: string;
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple';
  icon: React.ReactNode;
  trend: number[];
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const color: Record<string, { text: string; bg: string; line: string; fill: string; note: string }> = {
    blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.24)', note: 'text-emerald-400' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.22)', note: 'text-emerald-400' },
    cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.22)', note: 'text-emerald-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.18)', note: 'text-red-400' },
    red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.18)', note: 'text-red-400' },
    purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.18)', note: 'text-emerald-400' },
  };
  const item = color[tone];
  const content = (
    <>
      <div className={`relative z-10 flex items-start justify-between gap-2 ${compact ? 'gap-1' : 'gap-3'}`}>
        <div className="min-w-0">
          <div className={`truncate font-bold uppercase tracking-[0.12em] text-slate-400 ${compact ? 'text-[10px]' : 'text-[10px]'}`}>{title}</div>
          <div className={`mt-1 truncate font-semibold tracking-tight text-white ${compact ? 'text-sm' : 'text-xl'}`}>{value}</div>
          {note ? <div className={`mt-0.5 truncate font-semibold ${item.note} ${compact ? 'text-[9px]' : 'text-[11px]'}`}>{note}</div> : null}
        </div>
        <div className={`grid shrink-0 place-items-center rounded-lg ${item.bg} ${item.text} ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}>
          {icon}
        </div>
      </div>
      <KpiSparkline values={trend} line={item.line} fill={item.fill} />
    </>
  );
  const className = `relative overflow-hidden rounded-xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(10,20,40,0.85),rgba(5,10,25,0.75)_55%,rgba(15,25,50,0.65))] text-left shadow-[0_14px_42px_rgba(0,0,0,0.2)] ring-1 ring-cyan-400/[0.055] transition ${
  active ? 'border-cyan-400/55 bg-cyan-400/10' : ''
} ${onClick ? 'cursor-pointer hover:border-cyan-400/35 hover:bg-white/[0.055]' : ''} h-[92px] p-3`;
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>;
  return <section className={className}>{content}</section>;
}

export function InventoryMaterialDetailModal({ open, detail, fallback, onClose, onEdit }: Props) {
  // ===== 1. STATE =====
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [focusedLocation, setFocusedLocation] = useState<any | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [attachmentContext, setAttachmentContext] = useState<AttachmentContext | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const queryClient = useQueryClient()

  // Phân trang giao dịch
  const [transactionPage, setTransactionPage] = useState(1)
  const transactionPageSize = 13

  // Phân trang công trình
  const [projectPage, setProjectPage] = useState(1)
  const projectPageSize = 10

  // Phân trang nhà cung cấp
  const [supplierPage, setSupplierPage] = useState(1);
  const supplierPageSize = 10

  // Phân trang lịch sử
  const [logPage, setLogPage] = useState(1);
  const logPageSize = 15

  // ===== 2. LẤY DỮ LIỆU TỪ PROPS =====
  const item = detail?.item ?? fallback ?? {}
  const code = item.code ?? fallback?.materialCode ?? fallback?.code ?? '-'
  const name = item.name ?? fallback?.materialName ?? fallback?.name ?? '-'
  const unit = item.unit ?? fallback?.unit ?? fallback?.unitCode ?? ''
  const currentStock = num(detail?.currentStock ?? fallback?.currentStock ?? fallback?.quantity)
  const averageCost = num(detail?.averageCost ?? fallback?.averageCost)
  const inventoryValue = num(detail?.inventoryValue ?? currentStock * averageCost)
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

  // ===== 3. QUERY ATTACHMENTS =====
  const attachmentQueryKey = ['attachments', 'inventory', 'material', materialId]
  const { data: attachmentResult = [] } = useQuery({
    queryKey: attachmentQueryKey,
    queryFn: () => getAttachments({ module: 'inventory', entityType: 'material', entityId: materialId }),
    enabled: Boolean(materialId) && ['overview', 'images', 'documents'].includes(activeTab),
  })
  const attachments = normalizeAttachmentList(attachmentResult)
  const photoAttachments = attachments.filter((attachment) => attachment.category === 'PHOTO' || attachment.mimeType.startsWith('image/'))
  const documentAttachments = attachments.filter((attachment) => !photoAttachments.some((photo) => photo.id === attachment.id))

  // ===== 4. TÍNH TOÁN KHO =====
  const mainLocationRows = locationRows.filter(isMainWarehouseLocation)
  const productionLocationRows = locationRows.filter(isProductionWarehouseLocation)
  const mainQty = sumLocationQty(mainLocationRows)
  const productionQty = sumLocationQty(productionLocationRows)
  const supplier = supplierRows[0]?.supplierName ?? '-'

  // ===== 5. TRANSACTIONS (useMemo) =====
  const transactionRows = useMemo(() => buildTransactionRows(inbound, outbound), [inbound, outbound])
  const historyPage = activeTab === 'logs' ? logPage : transactionPage
  const materialTransactionsQuery = useMaterialTransactions(
    materialId ? String(materialId) : undefined,
    historyPage,
    transactionPageSize,
    activeTab === 'transactions' || activeTab === 'logs',
  )
  const serverTransactionRows = useMemo(
    () => buildServerTransactionRows(materialTransactionsQuery.data?.data ?? []),
    [materialTransactionsQuery.data],
  )
  const pagedTransactionRows = activeTab === 'transactions'
    ? serverTransactionRows
    : []
  const totalTransactionPages = materialTransactionsQuery.data?.totalPages ?? 1

  // Phân trang logs
  const pagedLogRows = activeTab === 'logs' ? serverTransactionRows : []
  const totalLogPages = materialTransactionsQuery.data?.totalPages ?? 1

  // ===== 6. TRANSACTION ATTACHMENTS =====
  const allTransactionAttachments: Attachment[] = []
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
  async function openTransactionAttachments(row: any) {
    const transactionId = String(row.transactionId ?? row.id ?? '')
    if (!transactionId) return
    const result = await queryClient.fetchQuery({
      queryKey: ['attachments', 'inventory', 'transaction', transactionId],
      queryFn: () => getAttachments({
        module: 'inventory',
        entityType: 'transaction',
        entityId: transactionId,
      }),
      staleTime: 10_000,
    })
    setAttachmentContext({
      title: row.transactionNo ?? 'Tài liệu giao dịch',
      subtitle: transactionSourceLabel(row),
      attachments: normalizeAttachmentList(result),
    })
  }

  // ===== 7. DOCUMENT SOURCE ROWS =====
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

  // ===== 8. ANALYTICS & FORECAST (useMemo) =====
  const movementTrend = useMemo(() => buildMovementTrend(transactionRows), [transactionRows])
  const forecast = useMemo(() => buildForecast(currentStock, outbound), [currentStock, outbound])
  const imageUrls = useMemo(() => collectMaterialImages(detail, fallback, photoAttachments), [detail, fallback, photoAttachments])
  const primaryImage = selectedImage && imageUrls.includes(selectedImage) ? selectedImage : imageUrls[0]
  const materialAnalytics = useMemo(() => buildMaterialAnalytics(movementTrend, currentStock, forecast), [movementTrend, currentStock, forecast])

  // ===== 9. PROJECTS (useMemo) =====
  const projectSummary = useMemo(() => buildUsageSummary(projectRows, averageCost), [projectRows, averageCost])

  // BOM Usage (phân bố theo công trình)
  const bomUsage = useMemo(() => {
    const map = new Map<string, number>();
    projectRows.forEach((row) => {
      const projectName = row.projectName ?? 'Khác';
      // Sử dụng giá trị tuyệt đối để tránh dữ liệu âm
      const qty = Math.abs(num(row.quantity ?? row.issuedQty ?? 0));
      if (qty > 0) {
        map.set(projectName, (map.get(projectName) || 0) + qty);
      }
    });
    if (!map.size) {
      return [{ label: 'No data', value: 1, color: '#334155' }];
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], index) => ({
        label,
        value,
        color: ['#1d7cff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
      }));
  }, [projectRows]);

  // Phân trang cho Project rows
  const pagedProjectRows = useMemo(() => {
    const start = (projectPage - 1) * projectPageSize
    return projectRows.slice(start, start + projectPageSize)
  }, [projectRows, projectPage])
  const totalProjectPages = Math.ceil(projectRows.length / projectPageSize)


  // Dữ liệu Donut cho Suppliers
  const supplierDonutData = useMemo(() => {
    const map = new Map<string, number>();
    supplierRows.forEach((row) => {
      const name = row.supplierName ?? 'Khác';
      map.set(name, (map.get(name) || 0) + num(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost)));
    });
    if (!map.size) {
      return [{ label: 'Chưa có dữ liệu', value: 1, color: '#334155' }];
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], index) => ({
        label,
        value,
        color: ['#1d7cff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
      }));
  }, [supplierRows, averageCost]);

  // Phân trang cho supplierRows
  const pagedSupplierRows = useMemo(() => {
    const start = (supplierPage - 1) * supplierPageSize;
    return supplierRows.slice(start, start + supplierPageSize);
  }, [supplierRows, supplierPage]);

  const totalSupplierPages = Math.ceil(supplierRows.length / supplierPageSize);
    // ===== 10. SUPPLIERS (useMemo) =====
  const supplierSummary = useMemo(() => buildPurchaseSummary(supplierRows, averageCost), [supplierRows, averageCost])

  // ===== 11. KPI TRENDS =====
  const stockTrend = materialAnalytics.inventoryTrend.slice(-6).map(d => d.value)
  const inboundTrend = materialAnalytics.inboundTrend.slice(-6).map(d => d.value)
  const outboundTrend = materialAnalytics.outboundTrend.slice(-6).map(d => d.value)
  const valueTrend = materialAnalytics.inventoryTrend.slice(-6).map(d => d.value * averageCost)
  const costTrend = buildCostTrend(inbound, averageCost)

  // Tổng nhập/xuất gần đây
  const totalInbound = transactionRows.filter(tx => tx.type === 'INBOUND').reduce((sum, tx) => sum + Math.abs(tx.quantity), 0)
  const totalOutbound = transactionRows.filter(tx => tx.type === 'OUTBOUND').reduce((sum, tx) => sum + Math.abs(tx.quantity), 0)

  // ===== 12. EFFECTS & HANDLERS =====
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
  }, [attachmentResult, attachments, documentAttachments, imageUrls, materialId, open, primaryImage])

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

  // ===== 13. RENDER =====
  return createPortal(
    <>
      <ModuleDetailDrawer
        open={open}
        title={`${code} · ${name}`}
        subtitle={`${materialUsageLabel(materialUsageType)} · ${unit || 'Chưa có đơn vị'} · ${locationRows.length} vị trí lưu kho · ${formatQuantity(photoAttachments.length, 0)} ảnh · ${formatQuantity(documentSourceRows.length, 0)} tài liệu`}
        onClose={onClose}
        size="lg"
        actions={onEdit ? (
          <button type="button" onClick={onEdit} className={moduleMutedButton}>
            <Edit3 size={14} />
            Sửa vật tư
          </button>
        ) : null}
      >
        {/* 6 KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1 mb-1 -mt-4">
          <InventoryMetricCard
            compact
            title="Tồn hiện tại"
            value={`${fmt(currentStock)} ${unit}`.trim()}
            note={`Tối thiểu ${fmt(minimumStock)}`}
            tone={currentStock <= minimumStock ? 'amber' : 'blue'}
            icon={<Package size={12} />}
            trend={stockTrend.length ? stockTrend : [0,0,0,0,0,0]}
          />
          <InventoryMetricCard
            compact
            title="Đơn giá trung bình"
            value={money(averageCost)}
            note="Đơn giá trung bình"
            tone="cyan"
            icon={<DollarSign size={12} />}
            trend={costTrend}
          />
          <InventoryMetricCard
            compact
            title="Giá trị tồn kho"
            value={money(inventoryValue)}
            note="Tồn x giá trung bình"
            tone="emerald"
            icon={<BarChart3 size={12} />}
            trend={valueTrend.length ? valueTrend : [0,0,0,0,0,0]}
          />
          <InventoryMetricCard
            compact
            title="Số vị trí lưu kho"
            value={fmt(locationRows.length, 0)}
            note={`Kho chính ${fmt(mainQty)} · SX ${fmt(productionQty)}`}
            tone="purple"
            icon={<MapPinned size={12} />}
            trend={[0,0,0,0,0,0]}
          />
          <InventoryMetricCard
            compact
            title="Nhập (30 ngày)"
            value={`${fmt(totalInbound)} ${unit}`.trim()}
            note="Tổng nhập gần đây"
            tone="emerald"
            icon={<PackagePlus size={12} />}
            trend={inboundTrend.length ? inboundTrend : [0,0,0,0,0,0]}
          />
          <InventoryMetricCard
            compact
            title="Xuất (30 ngày)"
            value={`${fmt(totalOutbound)} ${unit}`.trim()}
            note="Tổng xuất gần đây"
            tone="red"
            icon={<Truck size={12} />}
            trend={outboundTrend.length ? outboundTrend : [0,0,0,0,0,0]}
          />
        </div>

        <ModuleTabs tabs={tabs} active={activeTab} onChange={(tab) => setActiveTab(tab as TabKey)} />

          {activeTab === 'overview' && (
            <div className="grid gap-1 xl:grid-cols-[1fr_1fr] mt-1">
              {/* Cột trái: Hồ sơ vật tư + Hình ảnh vật tư */}
              <div className="space-y-1">
                <MaterialAttachmentSummary
                  photoCount={photoAttachments.length}
                  documentCount={documentSourceRows.length}
                  onOpenImages={() => setActiveTab('images')}
                  onOpenDocuments={() => setActiveTab('documents')}
                />
                <MaterialImageGallery
                  images={imageUrls}
                  selectedImage={primaryImage}
                  uploading={uploadingImage}
                  onUpload={handleImageUpload}
                  onSelect={setSelectedImage}
                  onPreview={setPreviewImage}
                />
              </div>

              {/* Cột phải: Tồn theo kho + Thông tin vật tư */}
              <div className="space-y-1">
                <ModuleAnalyticsPanel title="Tồn theo kho" note="Phân tách kho chính và kho vật tư sản xuất">
                  <div className="grid gap-3 md:grid-cols-[280px_1fr]">
                    <Donut
                      rows={[
                        { label: 'Kho chính', value: mainQty, color: '#22c55e' },
                        { label: 'Kho SX', value: productionQty, color: '#f59e0b' },
                      ]}
                      center={fmt(currentStock)}
                      label={unit || 'tổng'}
                      compact
                    />
                    <div className="space-y-1">
                      <MetricLine label="Kho chính" value={`${fmt(mainQty)} ${unit}`.trim()} tone="emerald" />
                      <MetricLine label="Kho vật tư SX" value={`${fmt(productionQty)} ${unit}`.trim()} tone="amber" />
                      <MetricLine label="Trạng thái kho chính" value={mainQty <= 0 ? 'Hết hàng' : mainQty <= minimumStock ? 'Cảnh báo' : 'Bình thường'} tone={mainQty <= minimumStock ? 'amber' : 'emerald'} />
                    </div>
                  </div>
                </ModuleAnalyticsPanel>

                <ModuleAnalyticsPanel title="Thông tin vật tư" note="Thông tin tổng hợp từ dữ liệu vật tư hiện có">
                  <div className="space-y-2">
                    <InfoGrid rows={[
                      ['Mã vật tư', code],
                      ['Tên vật tư', name],
                      ['Loại vật tư', materialUsageLabel(materialUsageType)],
                      ['Đơn vị', unit || '-'],
                      ['Nhóm vật tư', item.category ?? fallback?.category ?? '-'],
                      ['Quy cách', item.materialType ?? item.specification ?? fallback?.materialType ?? '-'],
                      ['Tồn tối thiểu', fmt(minimumStock)],
                      ['Nhà cung cấp gần nhất', supplier],
                    ]} />
                    {/* Ghi chú - chiếm full width */}
                    <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                      <div className="text-[11px] text-slate-500">Ghi chú</div>
                      <div className="mt-1 text-sm text-slate-100">{item.note ?? fallback?.note ?? 'Chưa có ghi chú'}</div>
                    </div>
                  </div>
                </ModuleAnalyticsPanel>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <ModuleAnalyticsPanel title="Lịch sử giao dịch" className="mt-1">
              <div className="overflow-auto">
                <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full min-w-[900px] text-sm table-fixed">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col className="w-[110px]" />
                    <col className="w-[80px]" />
                    <col className="w-[150px]" />
                    <col className="w-[80px]" />
                    <col className="w-[140px]" />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Thời gian</th>
                      <th className="px-2 py-1.5 text-left font-medium">Mã giao dịch</th>
                      <th className="px-2 py-1.5 text-left font-medium">Loại</th>
                      <th className="px-2 py-1.5 text-left font-medium">Đối tượng</th>
                      <th className="px-2 py-1.5 text-right font-medium">Số lượng</th>
                      <th className="px-2 py-1.5 text-right font-medium">Giá trị</th>
                      <th className="px-2 py-1.5 text-left font-medium">Tài liệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTransactionRows.map((row) => {
                      const isAdjustment = row.type === 'ADJUSTMENT';
                      const isProjectReturn = isProjectReturnReceived(row);
                      const colorClass = isAdjustment
                        ? row.quantity >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : row.type === 'INBOUND' || isProjectReturn || row.type === 'RETURN'
                          ? 'text-emerald-400'
                          : row.type === 'OUTBOUND'
                            ? 'text-amber-400'
                            : row.type === 'TRANSFER'
                              ? 'text-purple-400'
                              : 'text-slate-300';

                      const displayQty = isAdjustment
                        ? `${row.quantity > 0 ? '+' : ''}${fmt(row.quantity)}`
                        : isProjectReturn || row.type === 'RETURN'
                          ? `+${fmt(Math.abs(row.quantity))}`
                          : fmt(Math.abs(row.quantity));
                      return (
                        <tr key={row.transactionNo || row.id} className="border-t border-white/10 hover:bg-white/[0.04]">
                          <td className="truncate px-2 py-1.5 text-slate-300" title={row.transactionDate ? formatDateTime(row.transactionDate) : '-'}>
                            {row.transactionDate ? formatDateTime(row.transactionDate) : '-'}
                          </td>
                          <td className="truncate px-2 py-1.5 text-cyan-300" title={row.transactionNo ?? '-'}>{row.transactionNo ?? '-'}</td>
                          <td className="px-2 py-1.5"><TransactionTypeBadge row={row} type={row.type} isPositive={row.quantity >= 0} /></td>
                          <td className="truncate px-2 py-1.5 text-slate-200" title={row.counterparty}>{row.counterparty}</td>
                          <td className={`px-2 py-1.5 text-right font-medium tabular-nums font-semibold ${colorClass}`}>
                            {`${displayQty} ${unit}`.trim()}
                          </td>
                          <td className={`px-2 py-1.5 text-right font-medium tabular-nums font-semibold ${colorClass}`}>
                            {money(row.totalAmount)}
                          </td>
                          <td className="truncate px-2 py-1.5 text-left">
                            <AttachmentCountChip
                              attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                              knownCount={num(row.attachmentCount)}
                              onOpen={() => void openTransactionAttachments(row)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {!pagedTransactionRows.length && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
              <InventoryPagination
              page={transactionPage}
              pageCount={totalTransactionPages}
              total={materialTransactionsQuery.data?.total ?? 0}
              pageSize={transactionPageSize}
              onPageChange={setTransactionPage}
              containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-1 text-xs text-slate-400 md:grid-cols-3 border-t-0"
              />
            </ModuleAnalyticsPanel>
          )}

          {activeTab === 'locations' && (
            <LocationBalancePanel rows={locationRows} unit={unit} onFocus={setFocusedLocation} />
          )}

          {activeTab === 'analytics' && (
            <MaterialAnalyticsCockpit analytics={materialAnalytics} forecast={forecast} unit={unit} minimumStock={minimumStock} />
          )}

          {activeTab === 'projects' && (
            <div className="space-y-1 mt-1">
              {/* 3 KPI cards - Sử dụng InventoryMetricCard đồng bộ với các card khác */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <InventoryMetricCard
                  title="Tổng xuất"
                  value={`${fmt(projectSummary.totalQty)} ${unit}`.trim()}
                  note={`${fmt(projectSummary.projectCount, 0)} công trình`}
                  tone="blue"
                  icon={<Building2 size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
                <InventoryMetricCard
                  title="Đã trả lại"
                  value={`${fmt(projectSummary.returnedQty)} ${unit}`.trim()}
                  note="Vật tư đã trả"
                  tone="amber"
                  icon={<Truck size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
                <InventoryMetricCard
                  title="Giá trị xuất"
                  value={money(projectSummary.totalValue)}
                  note="Tổng giá trị đã xuất"
                  tone="emerald"
                  icon={<DollarSign size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
              </div>

              {/* Donut + Bảng - sát lại và cao hơn */}
              <div className="grid gap-1 xl:grid-cols-[280px_1fr]">
              {/* Donut tỷ lệ sử dụng */}
              <ModuleAnalyticsPanel title="Tỷ lệ sử dụng" note="Phân bổ theo công trình" className="min-h-[240px]">
                <Donut
                  rows={bomUsage}
                  center={fmt(bomUsage.reduce((sum, item) => sum + item.value, 0))}
                  label={unit}
                  compact={false}
                  vertical={true}
                />
              </ModuleAnalyticsPanel>

              {/* Bảng Top projects */}
              <ModuleAnalyticsPanel title="Danh sách công trình" note="Top 10 công trình sử dụng nhiều nhất" className="min-h-[540px]">
                <div className="overflow-auto h-[470px]">
                  <table className="w-full min-w-[700px] text-sm table-fixed">
                    <colgroup>
                      <col className="w-[100px]" />
                      <col className="w-[140px]" />
                      <col className="w-[60px]" />
                      <col className="w-[60px]" />
                      <col className="w-[120px]" />
                      <col className="w-[160px]" />
                    </colgroup>
                    <thead className={moduleTableHead}>
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Thời gian</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Công trình</th>
                        <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Đã xuất</th>
                        <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Đã trả</th>
                        <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Giá trị</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Hồ sơ</th>
                      </tr>
                    </thead>
                    <tbody>
                        {pagedProjectRows.map((row: any, index: number) => (
                          <tr key={row.projectId ?? row.id ?? `${projectPage}:${index}`} className={moduleTableRow}>
                          <td className="truncate px-3 py-2 text-slate-400" title={row.transactionDate ? formatDateTime(row.transactionDate) : (row.createdAt ? formatDateTime(row.createdAt) : '-')}>
                            {row.transactionDate ? formatDateTime(row.transactionDate) : (row.createdAt ? formatDateTime(row.createdAt) : '-')}
                          </td>
                          <td className="truncate px-2 py-1.5 text-slate-200" title={row.projectName ?? 'Không rõ'}>
                            {row.projectName ?? 'Không rõ'}
                          </td>
                          <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums font-semibold text-emerald-400" title={`${fmt(row.issuedQty ?? row.quantity)} ${unit}`.trim()}>
                            {`${fmt(row.issuedQty ?? row.quantity)} ${unit}`.trim()}
                          </td>
                          <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums text-amber-400" title={`${fmt(row.returnedQty)} ${unit}`.trim()}>
                            {`${fmt(row.returnedQty)} ${unit}`.trim()}
                          </td>
                          <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums font-semibold text-cyan-300" title={money(row.issuedValue ?? num(row.quantity) * averageCost)}>
                            {money(row.issuedValue ?? num(row.quantity) * averageCost)}
                          </td>
                          <td className="px-2 py-1.5 text-left">
                            <AttachmentCountChip
                              attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                              onOpen={() => setAttachmentContext({
                                title: row.projectName ?? 'Hồ sơ công trình',
                                subtitle: 'Hồ sơ liên quan từ giao dịch xuất kho',
                                attachments: attachmentsForTransactionRow(row, transactionAttachmentGroups),
                              })}
                            />
                          </td>
                        </tr>
                      ))}
                      {!pagedProjectRows.length && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center">
                            <ModuleEmptyState title="Chưa có dữ liệu" description="Chưa có công trình sử dụng vật tư này." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {totalProjectPages > 1 && (
                  <div className="flex items-center justify-between gap-3 px-4 py-1 text-xs text-slate-400 border-t border-white/10">
                    <span>
                      Hiển thị {(projectPage - 1) * projectPageSize + 1}-
                      {Math.min(projectPage * projectPageSize, projectRows.length)}/{projectRows.length} công trình
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                        disabled={projectPage <= 1}
                        className={moduleMutedButton}
                      >
                        Trước
                      </button>
                      <span className="px-2 py-1 text-slate-300">{projectPage}/{totalProjectPages}</span>
                      <button
                        onClick={() => setProjectPage((p) => Math.min(totalProjectPages, p + 1))}
                        disabled={projectPage >= totalProjectPages}
                        className={moduleMutedButton}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </ModuleAnalyticsPanel>
            </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-1 mt-1">
              {/* 3 KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <InventoryMetricCard
                  title="Tổng nhập"
                  value={`${fmt(supplierSummary.totalQty)} ${unit}`.trim()}
                  note={`${fmt(supplierSummary.supplierCount, 0)} nhà cung cấp`}
                  tone="cyan"
                  icon={<PackagePlus size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
                <InventoryMetricCard
                  title="Giá trị nhập"
                  value={money(supplierSummary.totalValue)}
                  note="Tổng giá trị đã nhập"
                  tone="emerald"
                  icon={<DollarSign size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
                <InventoryMetricCard
                  title="Nhà cung cấp mới nhất"
                  value={supplier}
                  note="Theo lịch sử nhập gần nhất"
                  tone="purple"
                  icon={<Clock size={15} />}
                  trend={[0,0,0,0,0,0]}
                />
              </div>

              {/* Donut + Bảng */}
              <div className="grid gap-1 xl:grid-cols-[280px_1fr]">
                 {/* Donut phân bổ nhà cung cấp (vertical) */}
                <ModuleAnalyticsPanel title="Phân bổ theo nhà cung cấp" note="Theo giá trị nhập" className="min-h-[240px]">
                  <Donut
                    rows={supplierDonutData}
                    center={formatCompactCurrency(supplierDonutData.reduce((sum, item) => sum + item.value, 0))}
                    label="VNĐ"
                    compact={false}
                    vertical={true}
                  />
                </ModuleAnalyticsPanel>

                {/* Bảng danh sách nhà cung cấp tùy chỉnh */}
                <ModuleAnalyticsPanel title="Danh sách nhà cung cấp" note="Top 10 nhà cung cấp chính" className="min-h-[470px]">
                  <div className="overflow-auto h-[470px]">
                    <table className="w-full min-w-[700px] text-sm table-fixed">
                      <colgroup>
                        <col className="w-[100px]" />
                        <col className="w-[140px]" />
                        <col className="w-[80px]" />
                        <col className="w-[80px]" />
                        <col className="w-[120px]" />
                        <col className="w-[160px]" />
                      </colgroup>
                      <thead className={moduleTableHead}>
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Thời gian</th>
                          <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Nhà cung cấp</th>
                          <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Số lượng</th>
                          <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Đơn giá</th>
                          <th className="px-2 py-1.5 text-right font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Tổng giá trị</th>
                          <th className="px-2 py-1.5 text-left font-medium text-slate-400 text-xs uppercase tracking-[0.08em]">Chứng từ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedSupplierRows.map((row: any, index: number) => (
                          <tr key={row.supplierId ?? row.id ?? `${supplierPage}:${index}`} className={moduleTableRow}>
                            <td className="truncate px-3 py-2 text-slate-400" title={row.transactionDate ? formatDateTime(row.transactionDate) : (row.createdAt ? formatDateTime(row.createdAt) : '-')}>
                              {row.transactionDate ? formatDateTime(row.transactionDate) : (row.createdAt ? formatDateTime(row.createdAt) : '-')}
                            </td>
                            <td className="truncate px-2 py-1.5 text-slate-200" title={row.supplierName ?? 'Không rõ'}>
                              {row.supplierName ?? 'Không rõ'}
                            </td>
                            <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums font-semibold text-emerald-400" title={`${fmt(row.quantity)} ${unit}`.trim()}>
                              {`${fmt(row.quantity)} ${unit}`.trim()}
                            </td>
                            <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums text-cyan-300" title={money(row.unitPrice ?? row.latestUnitPrice ?? averageCost)}>
                              {money(row.unitPrice ?? row.latestUnitPrice ?? averageCost)}
                            </td>
                            <td className="truncate px-2 py-1.5 text-right font-mono tabular-nums font-semibold text-cyan-300" title={money(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost))}>
                              {money(row.totalValue ?? row.totalAmount ?? num(row.quantity) * num(row.unitPrice ?? averageCost))}
                            </td>
                            <td className="truncate px-2 py-1.5 text-left">
                              <AttachmentCountChip
                                attachments={attachmentsForTransactionRow(row, transactionAttachmentGroups)}
                                onOpen={() => setAttachmentContext({
                                  title: row.supplierName ?? 'Chứng từ nhà cung cấp',
                                  subtitle: 'Chứng từ liên quan từ giao dịch nhập kho',
                                  attachments: attachmentsForTransactionRow(row, transactionAttachmentGroups),
                                })}
                              />
                            </td>
                          </tr>
                        ))}
                        {!pagedSupplierRows.length && (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                              <ModuleEmptyState title="Chưa có dữ liệu" description="Chưa có nhà cung cấp cho vật tư này." />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Phân trang */}
                  {totalSupplierPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-1.5 text-xs text-slate-400 border-t border-white/10">
                      <span>
                        Hiển thị {(supplierPage - 1) * supplierPageSize + 1}-
                        {Math.min(supplierPage * supplierPageSize, supplierRows.length)}/{supplierRows.length} nhà cung cấp
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                          disabled={supplierPage <= 1}
                          className={moduleMutedButton}
                        >
                          Trước
                        </button>
                        <span className="px-2 py-1 text-slate-300">{supplierPage}/{totalSupplierPages}</span>
                        <button
                          onClick={() => setSupplierPage((p) => Math.min(totalSupplierPages, p + 1))}
                          disabled={supplierPage >= totalSupplierPages}
                          className={moduleMutedButton}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </ModuleAnalyticsPanel>
              </div>
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
            <div className="space-y-1 mt-1">
              <ModuleAnalyticsPanel title="Lịch sử thay đổi" note="Tổng hợp từ các giao dịch nhập/xuất gần nhất">
                <div className="overflow-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.08em] text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Thời gian</th>
                        <th className="px-3 py-2 text-left">Loại</th>
                        <th className="px-3 py-2 text-left">Mã giao dịch</th>
                        <th className="px-3 py-2 text-left">Đối tượng</th>
                        <th className="px-3 py-2 text-right">Số lượng</th>
                        <th className="px-3 py-2 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedLogRows.map((row, index) => (
                        <tr key={row.transactionNo ?? row.id ?? `${logPage}:${index}`} className="border-t border-white/10 hover:bg-white/[0.04]">
                          <td className="px-3 py-2 text-slate-300">
                            {row.transactionDate ? formatDateTime(row.transactionDate) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <TransactionTypeBadge type={row.type} isPositive={row.quantity >= 0} />
                          </td>
                          <td className="px-3 py-2 text-cyan-300">{row.transactionNo ?? '-'}</td>
                          <td className="px-3 py-2 text-slate-200">{row.counterparty}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-white">
                            {`${fmt(row.quantity)} ${unit}`.trim()}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-cyan-300">
                            {money(row.totalAmount)}
                          </td>
                        </tr>
                      ))}
                      {!pagedLogRows.length && (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center">
                            <ModuleEmptyState title="Chưa có lịch sử thay đổi" description="Lịch sử sẽ xuất hiện khi vật tư có giao dịch." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {totalLogPages > 1 && (
                  <div className="flex items-center justify-between gap-3 px-4 py-1 text-xs text-slate-400 border-t border-white/10">
                    <span>
                      Hiển thị {(logPage - 1) * logPageSize + 1}-
                        {Math.min(logPage * logPageSize, materialTransactionsQuery.data?.total ?? 0)}/{materialTransactionsQuery.data?.total ?? 0} giao dịch
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        disabled={logPage <= 1}
                        className={moduleMutedButton}
                      >
                        Trước
                      </button>
                      <span className="px-2 py-1 text-slate-300">{logPage}/{totalLogPages}</span>
                      <button
                        onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                        disabled={logPage >= totalLogPages}
                        className={moduleMutedButton}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </ModuleAnalyticsPanel>
            </div>
          )}
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

function MetricLine({
  label,
  value,
  tone = 'cyan',
  icon,
}: {
  label: string
  value: string
  tone?: ModuleTone
  icon?: ReactNode
}) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'blue' ? 'text-blue-300' : tone === 'purple' ? 'text-purple-300' : 'text-cyan-300'
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
      <span className="flex items-center gap-2 text-slate-400">
        {icon ? <span className={color}>{icon}</span> : null}
        {label}
      </span>
      <b className={color}>{value}</b>
    </div>
  )
}

function LocationBalancePanel({ rows, unit, onFocus }: { rows: any[]; unit: string; onFocus: (row: any) => void }) {
  const distribution = buildLocationDistribution(rows);
  const mainRows = rows.filter(isMainWarehouseLocation);
  const productionRows = rows.filter(isProductionWarehouseLocation);
  const otherRows = rows.filter((row) => !isMainWarehouseLocation(row) && !isProductionWarehouseLocation(row));
  const totalQty = rows.reduce((sum, row) => sum + num(row.quantity), 0);

  // Thêm dữ liệu phân bố theo tầng (nếu có)
  const levelDistribution = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const level = row.level ?? 'Khác';
      map.set(level, (map.get(level) || 0) + num(row.quantity));
    });
    return Array.from(map.entries()).map(([label, value], index) => ({
      label,
      value,
      color: ['#38bdf8', '#f59e0b', '#ef4444', '#8b5cf6'][index % 4],
    }));
  }, [rows]);

  return (
    <div className="grid gap-1 xl:grid-cols-[400px_1fr]">
      <div className="space-y-1 mt-1">
        <ModuleAnalyticsPanel title="Phân bố tồn theo vị trí" note="Donut biểu thị tỷ lệ" className="min-h-[240px]">
          <Donut rows={distribution} center={fmt(totalQty)} label={unit || 'tồn'} />
        </ModuleAnalyticsPanel>
        {levelDistribution.length > 1 && (
          <ModuleAnalyticsPanel title="Phân bố theo tầng" note="Số lượng theo tầng lưu trữ">
            <div className="space-y-1">
              {levelDistribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.label}</span>
                  </span>
                  <span className="font-mono text-slate-100">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </ModuleAnalyticsPanel>
        )}
      </div>
      <div className="mt-1">
      <ModuleAnalyticsPanel title="Danh sách vị trí lưu kho" note="Tổng hợp theo từng khu vực">
        <div className="space-y-3">
          <LocationGroup title="Kho chính" rows={mainRows} unit={unit} onFocus={onFocus} />
          <LocationGroup title="Kho sản xuất" rows={productionRows} unit={unit} onFocus={onFocus} />
          {otherRows.length > 0 && <LocationGroup title="Kho khác" rows={otherRows} unit={unit} onFocus={onFocus} />}
        </div>
      </ModuleAnalyticsPanel>
      </div>
    </div>
  );
}

function LocationGroup({ title, rows, unit, onFocus }: { title: string; rows: any[]; unit: string; onFocus: (row: any) => void }) {
  const total = sumLocationQty(rows);
  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-300">{title}</h4>
        <span className="text-xs font-semibold text-slate-300">{fmt(total)} {unit}</span>
      </div>
      {rows.length ? (
        <div className="space-y-1.5">
          {rows.map((row, index) => (
            <div
              key={`${title}-${row.zoneId ?? index}-${row.slotId ?? ''}-${row.level ?? ''}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm"
            >
              <div className="min-w-0 overflow-hidden">
                <div className="truncate font-medium text-slate-100" title={row.zoneName ?? row.zoneCode ?? '-'}>
                  {row.zoneName ?? row.zoneCode ?? '-'}
                </div>
                <div className="text-xs text-slate-500">
                  {row.slotId ?? '-'} · {row.level ?? '-'}
                </div>
              </div>
              <div className="font-mono tabular-nums text-cyan-300 whitespace-nowrap">
                {fmt(row.quantity)} {unit}
              </div>
              <button
                type="button"
                onClick={() => onFocus(row)}
                className={moduleMutedButton}
              >
                2D
              </button>
            </div>
          ))}
        </div>
      ) : (
        <ModuleEmptyState title="Không có tồn kho" description={`${title} chưa có tồn kho cho vật tư này.`} />
      )}
    </section>
  );
}

function TransactionTypeBadge({ type, isPositive, row }: { type: string; isPositive?: boolean; row?: any }) {
  if (row && isProjectReturnReceived(row)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
        <RotateCcw size={12} />
        Trả từ công trình
      </span>
    )
  }
  const normalized = normalizeTransactionType(type);
  const config: Record<string, { label: string; className: string }> = {
    INBOUND: { label: 'Nhập kho', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
    OUTBOUND: { label: 'Xuất kho', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
    RETURN: { label: 'Trả kho', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
    TRANSFER: { label: 'Điều chuyển', className: 'border-purple-500/30 bg-purple-500/10 text-purple-200' },
    ADJUSTMENT: { 
      label: 'Điều chỉnh', 
      className: isPositive !== undefined
        ? isPositive
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/30 bg-red-500/10 text-red-200'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    },
  };
  const item = config[normalized] ?? config.ADJUSTMENT;
  return <span className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-semibold ${item.className}`}>{item.label}</span>;
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
  const getTrend = (rows: Array<{ label: string; value: number }>) => {
  if (rows.length < 2) return null;
  const last = rows[rows.length - 1].value;      
  const previous = rows[rows.length - 2].value;

  if (previous === 0) {
    if (last === 0) return null;
    return {
      direction: last > 0 ? '↑' : '↓',
      percent: '∞',
      color: last > 0 ? 'text-emerald-400' : 'text-red-400'
    };
  }

  const change = ((last - previous) / Math.abs(previous)) * 100;
  const direction = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  const percent = Math.abs(change).toFixed(1);
  const color = change >= 0 ? 'text-emerald-400' : 'text-red-400';
  return { direction, percent, color };
};

  const inboundRows = analytics.inboundTrend
  const outboundRows = analytics.outboundTrend
  const inventoryRows = analytics.inventoryTrend

  // Tính trend cho từng chuỗi
  const inboundTrend = getTrend(inboundRows);
  const outboundTrend = getTrend(outboundRows);
  const inventoryTrend = getTrend(inventoryRows);

  return (
    <div className="grid gap-1 xl:grid-cols-1 mt-1">
      <TrendPanel
          title="Xu hướng nhập kho"
          rows={inboundRows}
          color="#38bdf8"
          unit={unit}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">{fmt(analytics.inboundTotal)} {unit}</span>
              {inboundTrend && (
                <span className={`text-sm font-bold ${inboundTrend.color}`}>
                  {inboundTrend.direction} {inboundTrend.percent !== '∞' ? `(${inboundTrend.percent}%)` : ''}
                </span>
              )}
            </div>
          }
        />
        <TrendPanel
          title="Xu hướng xuất kho"
          rows={outboundRows}
          color="#f59e0b"
          unit={unit}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">{fmt(analytics.outboundTotal)} {unit}</span>
              {outboundTrend && (
                <span className={`text-sm font-bold ${outboundTrend.color}`}>
                  {outboundTrend.direction} {outboundTrend.percent !== '∞' ? `(${outboundTrend.percent}%)` : ''}
                </span>
              )}
            </div>
          }
        />
        <TrendPanel
          title="Xu hướng tồn kho"
          rows={inventoryRows}
          color="#f83838"
          unit={unit}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">{fmt(analytics.currentStock)} {unit}</span>
              {inventoryTrend && (
                <span className={`text-sm font-bold ${inventoryTrend.color}`}>
                  {inventoryTrend.direction} {inventoryTrend.percent !== '∞' ? `(${inventoryTrend.percent}%)` : ''}
                </span>
              )}
            </div>
          }
        />
      <TrendPanel
        title="Dự báo 7 ngày"
        rows={analytics.forecastTrend}
        color={forecast.projected7d <= minimumStock ? '#42f50b' : '#1d7cff'}
        unit={unit}
        footer={
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">{fmt(forecast.projected7d)} {unit}</span>
            {forecast.projected7d < analytics.currentStock ? (
              <span className="text-sm font-bold text-red-400">↓ (-{((1 - forecast.projected7d / analytics.currentStock) * 100).toFixed(1)}%)</span>
            ) : (
              <span className="text-sm font-bold text-emerald-400">↑ (+{((forecast.projected7d / analytics.currentStock - 1) * 100).toFixed(1)}%)</span>
            )}
          </div>
        }
      />
      <ModuleAnalyticsPanel title="Tỷ lệ xuất / tồn bình quân" className="xl:col-span-2">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <MetricLine
            label="Xuất trung bình/ngày"
            value={`${fmt(forecast.outboundDaily)} ${unit}`.trim()}
            tone="amber"
            icon={<Truck size={14} />}
          />
          <MetricLine
            label="Số ngày bao phủ"
            value={`${fmt(forecast.daysOfCover, 1)} ngày`}
            tone={forecast.daysOfCover < 7 ? 'red' : forecast.daysOfCover < 14 ? 'amber' : 'emerald'}
            icon={<Clock size={14} />}
          />
          <MetricLine
            label="Vòng quay"
            value={`${fmt(analytics.turnover, 2)} vòng`}
            tone={analytics.turnover > 2 ? 'emerald' : analytics.turnover > 1 ? 'amber' : 'red'}
            icon={<RefreshCw size={14} />}
          />
          <MetricLine
            label="Tồn bình quân"
            value={`${fmt(analytics.averageStock)} ${unit}`.trim()}
            tone="blue"
            icon={<Package size={14} />}
          />
        </div>

        {/* Dòng trạng thái tổng hợp */}
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
          {forecast.daysOfCover < 7 ? (
            <span className="text-red-300 font-semibold">⚠️ Cảnh báo: Tồn kho chỉ đủ dùng trong {fmt(forecast.daysOfCover, 1)} ngày, cần bổ sung.</span>
          ) : forecast.daysOfCover < 14 ? (
            <span className="text-amber-300 font-semibold">⚡ Lưu ý: Tồn kho đủ dùng trong {fmt(forecast.daysOfCover, 1)} ngày, nên lên kế hoạch nhập sớm.</span>
          ) : (
            <span className="text-emerald-300 font-semibold">✅ Tồn kho ổn định, đủ dùng trong {fmt(forecast.daysOfCover, 1)} ngày.</span>
          )}
        </div>
      </ModuleAnalyticsPanel>
    </div>
  )
}

function TrendPanel({
  title,
  rows,
  color,
  footer,
  unit,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  color: string;
  footer: ReactNode;
  unit: string;
}) {
  return (
    <ModuleAnalyticsPanel title={title} action={footer}>
      {rows.length ? (
        <FoundationLineChart rows={rows} color={color} unit={unit} />
      ) : (
        <ModuleEmptyState title="Chưa đủ dữ liệu" description="Biểu đồ sẽ hiển thị khi có lịch sử." />
      )}
    </ModuleAnalyticsPanel>
  );
}


function FoundationLineChart({ rows, color, unit }: { rows: AnalyticsPoint[]; color: string; unit: string }) {
  const width = 720
  const height = 220
  const padding = 28
  const max = Math.max(1, ...rows.map((row) => row.value))
  const min = Math.min(0, ...rows.map((row) => row.value))
  const span = Math.max(1, max - min)

  const formatFullDate = (row: AnalyticsPoint) => {
    const dateKey = row.dateKey
    if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const [year, month, day] = dateKey.split('-')
      return `${day}/${month}/${year}`
    }
    return row.label
  }

  const point = (row: { value: number }, index: number) => {
    const x = padding + (index / Math.max(1, rows.length - 1)) * (width - padding * 2)
    const y = height - padding - ((row.value - min) / span) * (height - padding * 2)
    return { x, y }
  }
  const points = rows.map(point)
  const path = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className="h-[195px] rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Đường kẻ ngang */}
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3)
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
        })}

        {/* Vùng diện tích và đường */}
        <path d={area} fill={`url(#area-${color.replace('#', '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, index) => (
          <g key={`${rows[index].label}-${index}`}>
            {/* Vùng bắt sự kiện rộng */}
            <rect
              x={p.x - 20}
              y={padding}
              width="40"
              height={height - padding * 2}
              fill="transparent"
              stroke="none"
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
            >
              {/* Tooltip với ngày đầy đủ và số lượng in đậm */}
              <title>{`Ngày: ${formatFullDate(rows[index])}\nSố lượng: ${fmt(rows[index].value)} ${unit}`}</title>
            </rect>

            {/* Điểm tròn nhỏ trang trí */}
            <circle cx={p.x} cy={p.y} r="4" fill="#08111f" stroke={color} strokeWidth="2" />

            {/* Nhãn ngày */}
            <text x={p.x} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {rows[index].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
function Donut({
  rows,
  center,
  label,
  compact = false,
  vertical = false,
}: {
  rows: Array<{ label: string; value: number; color: string }>;
  center: string;
  label: string;
  compact?: boolean;
  vertical?: boolean;
}) {
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

  const donutSize = compact ? 'h-20 w-20' : 'h-32 w-32'
  const inset = compact ? 'inset-2' : 'inset-3'
  const centerText = compact ? 'text-base' : 'text-xl'
  const labelText = compact ? 'text-[8px]' : 'text-[10px]'
  const spaceY = compact ? 'space-y-1' : 'space-y-1.5'
  const itemText = compact ? 'text-[10px]' : 'text-[11px]'
  const isNoData = chartRows.length === 1 && chartRows[0].label === 'No data'

  // Hiển thị No data
  if (isNoData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={`relative ${donutSize} rounded-full`} style={{ background: `conic-gradient(${gradient})` }}>
          <div className={`absolute ${inset} rounded-full bg-[#08111f]`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className={`font-semibold text-white ${centerText}`}>{center}</div>
            <div className={`text-slate-500 ${labelText}`}>{label}</div>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          No data <span className="text-white font-semibold">({chartRows[0].value} (100.0%))</span>
        </div>
      </div>
    )
  }

  // Layout mặc định (grid ngang)
  if (!vertical) {
    const gridCols = compact ? 'grid-cols-[100px_1fr]' : 'grid-cols-[136px_1fr]'
    const gap = compact ? 'gap-2' : 'gap-4'
    return (
      <div className={`grid ${gridCols} items-center ${gap}`}>
        <div className={`relative ${donutSize} rounded-full`} style={{ background: `conic-gradient(${gradient})` }}>
          <div className={`absolute ${inset} rounded-full bg-[#08111f]`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className={`font-semibold text-white ${centerText}`}>{center}</div>
            <div className={`text-slate-500 ${labelText}`}>{label}</div>
          </div>
        </div>
        <div className={`${spaceY} overflow-hidden ${itemText}`}>
          {chartRows.slice(0, 7).map((row) => {
            const percent = ((row.value / total) * 100).toFixed(1)
            return (
              <div key={row.label} className="flex justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                  <i className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="truncate">{row.label}</span>
                </span>
                <b className="text-slate-100 whitespace-nowrap">
                  {formatCompactCurrency(row.value)}
                  <span className="text-slate-500 font-normal"> ({percent}%)</span>
                </b>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Layout dọc (chart trên, danh sách dưới)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${donutSize} rounded-full`} style={{ background: `conic-gradient(${gradient})` }}>
        <div className={`absolute ${inset} rounded-full bg-[#08111f]`} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className={`font-semibold text-white ${centerText}`}>{center}</div>
          <div className={`text-slate-500 ${labelText}`}>{label}</div>
        </div>
      </div>
      <div className={`${spaceY} overflow-hidden ${itemText} w-full max-w-[200px]`}>
        {chartRows.slice(0, 7).map((row) => {
          const percent = ((row.value / total) * 100).toFixed(1)
          return (
            <div key={row.label} className="flex justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <i className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.label}</span>
              </span>
              <b className="text-slate-100 whitespace-nowrap">
                {formatCompactCurrency(row.value)} <span className="text-slate-500 font-normal">({percent}%)</span>
              </b>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailTable({ title, headers, rows }: { title: string; headers: string[]; rows: TableRow[] }) {
  return (
    <ModuleDataGrid>
      <div className="border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</div>
      <div className="overflow-auto">
        <table className="w-full min-w-[850px] text-sm table-fixed">
          <colgroup>
            <col className="w-[50px]" />
            <col className="w-[50px]" />
            <col className="w-[40px]" />
            <col className="w-[60px]" />
            <col className="w-[50px]" />
            <col className="w-[60px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead className={moduleTableHead}>
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-3 text-left">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={moduleTableRow}>
                {row.map((cell, cellIndex) => {
                  const isString = typeof cell === 'string'
                  return (
                    <td
                      key={cellIndex}
                      className="px-3 py-2 align-middle truncate overflow-hidden"
                      title={isString ? cell : undefined}
                    >
                      {cell}
                    </td>
                  )
                })}
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
    ...inbound.map((x: any) => ({
      ...x,
      type: normalizeTransactionType(
        x.type ?? x.transactionType ?? 'INBOUND',
      ),
    })),
    ...outbound.map((x: any) => ({
      ...x,
      type: normalizeTransactionType(
        x.type ?? x.transactionType ?? 'OUTBOUND',
      ),
    })),
  ]
    .map((row: any) => ({
      ...row,
      counterparty:
        projectReturnCounterparty(row) ??
        row.supplierName ??
        row.projectName ??
        row.targetName ??
        row.transactionNo ??
        '-',

      quantity: num(row.quantity),

      totalAmount: num(
        row.totalAmount ??
        row.totalValue ??
        num(row.quantity) * num(row.unitPrice),
      ),
    }))
    .sort(
      (a: any, b: any) =>
        +new Date(
          b.transactionDate ??
          b.createdAt ??
          0,
        ) -
        +new Date(
          a.transactionDate ??
          a.createdAt ??
          0,
        ),
    )
}

function buildServerTransactionRows(transactions: any[]) {
  return transactions.flatMap((transaction: any) => {
    const items = Array.isArray(transaction?.items) ? transaction.items : []
    return items.map((line: any) => ({
      ...line,
      id: line.id ?? `${transaction.id}:${line.inventoryItemId}`,
      transactionId: transaction.id,
      transactionNo: transaction.transactionNo ?? transaction.code,
      transactionDate: transaction.transactionDate ?? transaction.createdAt,
      type: transaction.businessType ?? transaction.type,
      rawType: transaction.rawType,
      direction: transaction.direction,
      quantity: num(line.quantity),
      unitPrice: num(line.unitPrice),
      totalAmount: num(
        line.totalAmount ?? num(line.quantity) * num(line.unitPrice),
      ),
      supplierId: transaction.supplierId,
      supplierName: transaction.supplierName,
      projectId: transaction.projectId,
      projectName: transaction.projectName,
      projectCode: transaction.project?.code,
      referenceModule: transaction.referenceModule,
      referenceId: transaction.referenceId,
      note: transaction.note,
      remarks: transaction.remarks,
      attachmentCount: num(transaction.attachmentCount),
      counterparty:
        transaction.projectName ??
        transaction.supplierName ??
        transaction.performedBy ??
        '-',
    }))
  })
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
  if (type.includes('RETURN')) return 'RETURN'
  if (type.includes('TRANSFER')) return 'TRANSFER'
  return 'ADJUSTMENT'
}

function transactionMetadata(row: any) {
  if (!row?.note || typeof row.note !== 'string') return null
  try {
    return JSON.parse(row.note)
  } catch {
    return null
  }
}

function isProjectReturnReceived(row: any) {
  const meta = transactionMetadata(row)
  return (
    meta?.source === 'PROJECT_RETURN' ||
    String(row?.referenceModule ?? '').toLowerCase() === 'return-workflow'
  ) && normalizeTransactionType(row?.type ?? '') === 'RETURN'
}

function projectReturnCounterparty(row: any) {
  if (!isProjectReturnReceived(row)) return null
  const meta = transactionMetadata(row)
  const project = meta?.projectCode || meta?.projectName
    ? `${meta?.projectCode ?? ''}${meta?.projectCode && meta?.projectName ? ' · ' : ''}${meta?.projectName ?? ''}`
    : row.projectName
  const returnNo = meta?.returnNo ?? row.referenceId
  return [
    project ? `Công trình: ${project}` : null,
    meta?.taskName ? `Task: ${meta.taskName}` : null,
    returnNo ? `Phiếu: ${returnNo}` : null,
  ].filter(Boolean).join(' · ') || 'Trả từ công trình'
}

type MovementBucket = {
  dateKey: string
  label: string
  inbound: number
  outbound: number
}

type AnalyticsPoint = {
  label: string
  value: number
  dateKey?: string
}

function buildMovementTrend(rows: any[]) {
  const map = new Map<string, { dateKey: string; label: string; inbound: number; outbound: number }>()
  rows.forEach((row) => {
    const dateKey = String(row.transactionDate ?? row.createdAt ?? '').slice(0, 10) || '-'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return
    const label = dateKey === '-' ? '-' : dateKey.slice(5, 10)
    const current = map.get(dateKey) ?? { dateKey, label, inbound: 0, outbound: 0 }
    if (row.type === 'INBOUND') current.inbound += Math.abs(num(row.quantity))
    if (row.type === 'OUTBOUND') current.outbound += Math.abs(num(row.quantity))
    map.set(dateKey, current)
  })

  const sortedDateKeys = Array.from(map.keys()).sort()
  if (!sortedDateKeys.length) return []

  return buildDateRange(sortedDateKeys[0], sortedDateKeys[sortedDateKeys.length - 1])
    .map((dateKey) => map.get(dateKey) ?? {
      dateKey,
      label: dateKey.slice(5, 10),
      inbound: 0,
      outbound: 0,
    })
}

function buildCostTrend(inbound: any[], fallbackCost: number) {
  const rows = inbound
    .map((row: any) => ({
      dateKey: String(row.transactionDate ?? row.createdAt ?? '').slice(0, 10) || '-',
      cost: num(row.unitPrice ?? (num(row.quantity) ? num(row.totalAmount) / Math.abs(num(row.quantity)) : fallbackCost)),
    }))
    .filter((row) => row.cost > 0)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-6)
    .map((row) => row.cost)

  return rows.length ? rows : Array.from({ length: 6 }, () => fallbackCost)
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

function buildDateRange(startKey: string, endKey: string) {
  const start = new Date(`${startKey}T00:00:00.000Z`)
  const end = new Date(`${endKey}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return []
  }

  const keys: string[] = []
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    keys.push(cursor.toISOString().slice(0, 10))
  }

  return keys
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
  movementRows: MovementBucket[],
  currentStock: number,
  forecast: { outboundDaily: number },
) {
  const inboundTrend = movementRows.map((row) => ({ label: row.label, value: row.inbound, dateKey: row.dateKey }))
  const outboundTrend = movementRows.map((row) => ({ label: row.label, value: row.outbound, dateKey: row.dateKey }))
  const netMovement = movementRows.reduce((sum, row) => sum + row.inbound - row.outbound, 0)
  let runningStock = Math.max(0, currentStock - netMovement)
  const inventoryTrend = movementRows.map((row) => {
    runningStock = Math.max(0, runningStock + row.inbound - row.outbound)
    return { label: row.label, value: runningStock, dateKey: row.dateKey }
  })
  const forecastTrend = Array.from({ length: 7 }, (_, index) => ({
    label: `D+${index + 1}`,
    value: Math.max(0, currentStock - forecast.outboundDaily * (index + 1)),
  }))
  const inboundTotal = inboundTrend.reduce((sum, row) => sum + row.value, 0)
  const outboundTotal = outboundTrend.reduce((sum, row) => sum + row.value, 0)
  const stockRows: AnalyticsPoint[] =
    inventoryTrend.length
      ? inventoryTrend
      : [{ label: 'Now', value: currentStock }]
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
