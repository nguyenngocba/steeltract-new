import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { ProcurementCockpit } from '../components/ProcurementCockpit'
import { PurchaseOrdersPanel } from '../components/PurchaseOrdersPanel'
import { SupplierRuntimePanel } from '../components/SupplierRuntimePanel'

export function ProcurementPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Procurement Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Supplier & Purchasing Operations
          </h1>
        </div>

        <ProcurementCockpit />

        <div className="grid grid-cols-2 gap-6">
          <SupplierRuntimePanel />

          <PurchaseOrdersPanel />
        </div>
      </div>
    </OperationalShell>
  )
}
