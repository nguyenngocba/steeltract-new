import { useQuery } from '@tanstack/react-query'

import {
  getSuppliers,
  getPurchaseOrders,
  getCosting,
  getExpenses,
} from '../api/erp.api'

import { SupplierCard } from '../components/SupplierCard'
import { PurchaseOrderCard } from '../components/PurchaseOrderCard'
import { CostingCard } from '../components/CostingCard'

export function ErpPage() {

  const {
    data: suppliers,
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const {
    data: orders,
  } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: getPurchaseOrders,
  })

  const {
    data: costing,
  } = useQuery({
    queryKey: ['costing'],
    queryFn: getCosting,
  })

  const {
    data: expenses,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  })

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            ERP Finance Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Costing + Purchase + Finance Runtime
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            Create PO
          </button>

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Finance Report
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Suppliers
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {suppliers?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Purchase Orders
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {orders?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Costing
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            {costing?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Expenses
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            {expenses?.length || 0}
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-3 gap-6">

        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Suppliers
          </h2>

          {suppliers?.map((supplier: any) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
            />
          ))}

        </div>

        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Purchase Orders
          </h2>

          {orders?.map((order: any) => (
            <PurchaseOrderCard
              key={order.id}
              order={order}
            />
          ))}

        </div>

        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-white">
            Costing
          </h2>

          {costing?.map((item: any) => (
            <CostingCard
              key={item.id}
              costing={item}
            />
          ))}

        </div>

      </div>

    </div>
  )
}
