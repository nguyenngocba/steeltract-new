import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import {
  InboundTransactionModal,
  OutboundTransactionModal,
  StockTakeTransactionModal,
  TransferTransactionModal,
} from './InventoryTransactionModals'
import { MaterialDrawer } from './material-table/MaterialDrawer'

type MoreAction = {
  label: string
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
  const [transactionModal, setTransactionModal] = useState<null | 'inbound' | 'outbound' | 'transfer' | 'stock-take'>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !moreButtonRef.current?.contains(target)) {
        setMoreOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
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
    { label: 'Điều chuyển', action: () => setTransactionModal('transfer') },
    { label: 'Kiểm kê', action: () => setTransactionModal('stock-take') },
    { label: 'Điều chỉnh tồn kho', path: '/inventory/adjustments' },
    {
      label: 'Tạo vật tư mới',
      action: () => setMaterialDrawerOpen(true),
    },
  ]

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

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setTransactionModal('inbound')}
          className="h-12 rounded-lg border border-blue-400/30 bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
        >
          Nhập kho
        </button>
        <button
          onClick={() => setTransactionModal('outbound')}
          className="h-12 rounded-lg border border-cyan-300/25 bg-slate-900/80 px-4 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-cyan-300/50 hover:bg-slate-800"
        >
          Xuất kho
        </button>
        <div className="relative">
          <button
            ref={moreButtonRef}
            onClick={toggleMoreMenu}
            className="h-12 rounded-lg border border-white/15 bg-slate-900/80 px-4 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-white/25 hover:bg-slate-800"
          >
            Khác
          </button>

          {moreOpen && createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 p-1 shadow-2xl shadow-black/40 backdrop-blur-xl"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {moreActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleMoreAction(action)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  {action.label}
                </button>
              ))}
            </div>,
            document.body,
          )}
        </div>
      </div>
    </>
  )
}
