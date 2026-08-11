import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRightLeft,
  ClipboardCheck,
  MoreHorizontal,
  PackageMinus,
  PackagePlus,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  AdjustmentTransactionModal,
  InboundTransactionModal,
  OutboundTransactionModal,
  StockTakeTransactionModal,
  TransferTransactionModal,
} from './InventoryTransactionModals'
import { MaterialDrawer } from './material-table/MaterialDrawer'
import { ActionGuard, usePermission } from '@/shared/permissions/PermissionGuard'

type MoreAction = {
  label: string
  permission: string
  icon: typeof ArrowRightLeft
  path?: string
  action?: () => void
}

export function InventoryGlobalActionBar() {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const moreButtonRef = useRef<HTMLButtonElement | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [materialDrawerOpen, setMaterialDrawerOpen] = useState(false)
  const [transactionModal, setTransactionModal] = useState<null | 'inbound' | 'outbound' | 'transfer' | 'stock-take' | 'adjustment'>(null)
  const canTransfer = usePermission('inventory.transfer')
  const canAdjust = usePermission('inventory.adjust')
  const canCreate = usePermission('inventory.create')

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !moreButtonRef.current?.contains(target)) {
        setMoreOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMoreOpen(false)
      moreButtonRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function toggleMoreMenu() {
    const rect = moreButtonRef.current?.getBoundingClientRect()
    if (rect) {
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - 224),
      })
    }
    setMoreOpen((open) => !open)
  }

  const moreActions: MoreAction[] = [
    { label: 'Điều chuyển', permission: 'inventory.transfer', icon: ArrowRightLeft, action: () => setTransactionModal('transfer') },
    { label: 'Kiểm kê', permission: 'inventory.adjust', icon: ClipboardCheck, action: () => setTransactionModal('stock-take') },
    { label: 'Điều chỉnh tồn kho', permission: 'inventory.adjust', icon: SlidersHorizontal, action: () => setTransactionModal('adjustment') },
    {
      label: 'Tạo vật tư mới',
      permission: 'inventory.create',
      icon: Plus,
      action: () => setMaterialDrawerOpen(true),
    },
  ].filter((action) => ({
    'inventory.transfer': canTransfer,
    'inventory.adjust': canAdjust,
    'inventory.create': canCreate,
  })[action.permission])

  function handleMoreAction(action: MoreAction) {
    setMoreOpen(false)
    if (action.path) navigate(action.path)
    action.action?.()
  }

  return (
    <>
      <MaterialDrawer
        open={materialDrawerOpen}
        material={null}
        onClose={() => setMaterialDrawerOpen(false)}
      />
      <InboundTransactionModal
        open={transactionModal === 'inbound'}
        onClose={() => setTransactionModal(null)}
      />
      <OutboundTransactionModal
        open={transactionModal === 'outbound'}
        onClose={() => setTransactionModal(null)}
      />
      <TransferTransactionModal
        open={transactionModal === 'transfer'}
        onClose={() => setTransactionModal(null)}
      />
      <StockTakeTransactionModal
        open={transactionModal === 'stock-take'}
        onClose={() => setTransactionModal(null)}
      />
      <AdjustmentTransactionModal
        open={transactionModal === 'adjustment'}
        onClose={() => setTransactionModal(null)}
      />

      <div className="flex shrink-0 items-center gap-2">
        <ActionGuard permission="inventory.receive"><button
          type="button"
          onClick={() => setTransactionModal('inbound')}
          aria-label="Mở phiếu nhập kho"
          className="flex h-9 items-center gap-2 rounded-md border border-blue-400/30 bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
        >
          <PackagePlus size={15} aria-hidden="true" />
          Nhập kho
        </button></ActionGuard>
        <ActionGuard permission="inventory.issue"><button
          type="button"
          onClick={() => setTransactionModal('outbound')}
          aria-label="Mở phiếu xuất kho"
          className="flex h-9 items-center gap-2 rounded-md border border-cyan-300/25 bg-slate-900/80 px-3 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-cyan-300/50 hover:bg-slate-800"
        >
          <PackageMinus size={15} aria-hidden="true" />
          Xuất kho
        </button></ActionGuard>
        {moreActions.length > 0 && <div className="relative">
          <button
            type="button"
            ref={moreButtonRef}
            onClick={toggleMoreMenu}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className="flex h-9 items-center gap-2 rounded-md border border-white/15 bg-slate-900/80 px-3 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-white/25 hover:bg-slate-800"
          >
            <MoreHorizontal size={15} aria-hidden="true" />
            Khác
          </button>

          {moreOpen && createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label="Thao tác kho khác"
              className="fixed z-[9999] w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 p-1 shadow-2xl shadow-black/40 backdrop-blur-xl"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {moreActions.map((action) => (
                <button
                  type="button"
                  key={action.label}
                  onClick={() => handleMoreAction(action)}
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <action.icon size={15} aria-hidden="true" />
                  {action.label}
                </button>
              ))}
            </div>,
            document.body,
          )}
        </div>}
      </div>
    </>
  )
}
