import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Layers, MapPinned, Plus, ArrowRightLeft, Upload, Download } from 'lucide-react'
import { useYardActions } from '../context/YardActionContext'

export interface YardGlobalActionBarProps {
  onInbound?: () => void
  onOutbound?: () => void
  onTransfer?: () => void
  onCreateZone?: () => void
  onCreateSlot?: () => void
}

export function YardGlobalActionBar({
  onInbound,
  onOutbound,
  onTransfer,
  onCreateZone,
  onCreateSlot,
}: YardGlobalActionBarProps = {}) {
  const actions = useYardActions()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleInbound = onInbound ?? (() => actions.openInbound())
  const handleOutbound = onOutbound ?? (() => actions.openOutbound())
  const handleTransfer = onTransfer ?? (() => actions.openTransfer())
  const handleCreateZone = onCreateZone ?? (() => actions.openCreateZone())
  const handleCreateSlot = onCreateSlot ?? (() => actions.openCreateSlot())

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
      {/* 1. Primary: + Nhập bãi */}
      <button
        type="button"
        onClick={handleInbound}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-600/90 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
      >
        <Plus size={15} />
        + Nhập bãi
      </button>

      {/* 2. Secondary: Xuất bãi */}
      <button
        type="button"
        onClick={handleOutbound}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-4 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20 transition hover:border-white/25 hover:bg-slate-800"
      >
        <Download size={15} className="text-amber-400" />
        Xuất bãi
      </button>

      {/* 3. Dropdown: Khác ▼ */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Khác
          <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen ? (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-white/15 bg-[#08111f] p-1.5 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                handleCreateZone()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              <Layers size={14} className="text-cyan-400" />
              Quản lý Zone
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                handleCreateSlot()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              <MapPinned size={14} className="text-blue-400" />
              Quản lý Slot
            </button>
            <div className="my-1 border-t border-white/10" />
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                handleTransfer()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              <ArrowRightLeft size={14} className="text-purple-400" />
              Chuyển nội bộ
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
