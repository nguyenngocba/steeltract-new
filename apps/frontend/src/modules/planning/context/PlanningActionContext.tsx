import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PlanningActionContextType {
  openCreatePlan: () => void
  closeAll: () => void
}

const PlanningActionContext = createContext<PlanningActionContextType | null>(null)

export function usePlanningActions(): PlanningActionContextType {
  const ctx = useContext(PlanningActionContext)
  if (!ctx) {
    return {
      openCreatePlan: () => {},
      closeAll: () => {},
    }
  }
  return ctx
}

export function PlanningActionProvider({ children }: { children: ReactNode }) {
  const [createPlanOpen, setCreatePlanOpen] = useState(false)

  function openCreatePlan() {
    setCreatePlanOpen(true)
  }

  function closeAll() {
    setCreatePlanOpen(false)
  }

  return (
    <PlanningActionContext.Provider
      value={{
        openCreatePlan,
        closeAll,
      }}
    >
      {children}

      {createPlanOpen ? (
        <CreatePlanModal onClose={() => setCreatePlanOpen(false)} />
      ) : null}
    </PlanningActionContext.Provider>
  )
}

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#08111f] p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Lập kế hoạch mới (Create New Plan)</h2>
            <p className="text-xs text-slate-400">Tạo kế hoạch điều phối sản xuất, vật tư hoặc giao vận</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1 text-xs text-slate-300">
            <span>Mã kế hoạch</span>
            <input
              className="h-9 w-full rounded-lg border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="VD: PLN-2026-001"
            />
          </label>
          <label className="block space-y-1 text-xs text-slate-300">
            <span>Tên hạng mục kế hoạch</span>
            <input
              className="h-9 w-full rounded-lg border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="Tên kế hoạch điều phối..."
            />
          </label>
          <label className="block space-y-1 text-xs text-slate-300">
            <span>Phân loại kế hoạch</span>
            <select className="h-9 w-full rounded-lg border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none focus:border-cyan-400">
              <option value="PRODUCTION">Sản xuất (PRODUCTION)</option>
              <option value="MATERIAL">Vật tư / MRP (MATERIAL)</option>
              <option value="LOGISTICS">Giao vận (LOGISTICS)</option>
              <option value="CAPACITY">Năng lực xưởng (CAPACITY)</option>
            </select>
          </label>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs text-cyan-200">
            Nghiệp vụ lập kế hoạch mới sẽ được đồng bộ tự động với hệ thống lệnh sản xuất và lịch điều xe công trình.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition"
          >
            Xác nhận tạo kế hoạch
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
