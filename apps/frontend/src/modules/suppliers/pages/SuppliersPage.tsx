import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { SectionHeader } from '@/shared/ui/enterprise'
import { SuppliersKpiStrip } from '../components/SuppliersKpiStrip'
import { SupplierFormModal } from '../components/SupplierFormModal'
import {
  useCreateSupplierMutation,
  useSuppliersQuery,
  useUpdateSupplierMutation,
} from '../hooks/useSuppliersQuery'
import type {
  Supplier,
  SupplierPayload,
} from '../api/suppliers.api'

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] =
    useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } =
    useSuppliersQuery(search)
  const createMutation =
    useCreateSupplierMutation()
  const updateMutation =
    useUpdateSupplierMutation()

  const metrics = useMemo(() => {
    const now = Date.now()
    const thirtyDaysMs =
      30 * 24 * 60 * 60 * 1000

    return {
      total: suppliers.length,
      withEmail: suppliers.filter(
        (supplier) => Boolean(supplier.email),
      ).length,
      withPhone: suppliers.filter(
        (supplier) => Boolean(supplier.phone),
      ).length,
      newlyAdded: suppliers.filter((supplier) => {
        return (
          now -
            new Date(
              supplier.createdAt,
            ).getTime() <=
          thirtyDaysMs
        )
      }).length,
    }
  }, [suppliers])

  function openCreateModal() {
    setEditing(null)
    setOpenModal(true)
  }

  function openEditModal(supplier: Supplier) {
    setEditing(supplier)
    setOpenModal(true)
  }

  async function handleSubmit(
    payload: SupplierPayload,
  ) {
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload,
      })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setOpenModal(false)
    setEditing(null)
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Nhà Cung Cấp"
        description="Supplier master center for inbound and inventory transactions."
      />

      <SuppliersKpiStrip
        total={metrics.total}
        withEmail={metrics.withEmail}
        withPhone={metrics.withPhone}
        newlyAdded={metrics.newlyAdded}
      />

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã, tên, liên hệ, email..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white md:max-w-md"
          />
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black"
          >
            + Tạo nhà cung cấp
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Mã NCC
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Tên NCC
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Liên hệ
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Điện thoại
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-zinc-400"
                  >
                    Loading suppliers...
                  </td>
                </tr>
              )}

              {!isLoading &&
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-t border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 text-cyan-400">
                      {supplier.code}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {supplier.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {supplier.contact || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {supplier.email || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          openEditModal(
                            supplier,
                          )
                        }
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierFormModal
        open={openModal}
        editing={editing}
        loading={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
      />
    </EnterpriseModulePage>
  )
}
