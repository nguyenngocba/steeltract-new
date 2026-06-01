import { useEffect, useState } from 'react'

import type {
  Supplier,
  SupplierPayload,
} from '../api/suppliers.api'

type SupplierFormModalProps = {
  open: boolean
  editing?: Supplier | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: SupplierPayload) => void
}

const initialState: SupplierPayload = {
  code: '',
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
}

export function SupplierFormModal({
  open,
  editing,
  loading = false,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [form, setForm] =
    useState<SupplierPayload>(initialState)

  useEffect(() => {
    if (!open) {
      return
    }

    if (editing) {
      setForm({
        code: editing.code ?? '',
        name: editing.name ?? '',
        contact: editing.contact ?? '',
        phone: editing.phone ?? '',
        email: editing.email ?? '',
        address: editing.address ?? '',
      })
      return
    }

    setForm(initialState)
  }, [open, editing])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {editing
                ? 'Cập nhật nhà cung cấp'
                : 'Tạo nhà cung cấp'}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Supplier master data
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
          >
            Đóng
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            placeholder="Mã NCC"
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                code: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
          <input
            placeholder="Tên NCC"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
          <input
            placeholder="Người liên hệ"
            value={form.contact}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                contact: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
          <input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                phone: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                email: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
          <input
            placeholder="Địa chỉ"
            value={form.address}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                address: event.target.value,
              }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Hủy
          </button>
          <button
            disabled={
              loading ||
              !form.code.trim() ||
              !form.name.trim()
            }
            onClick={() => onSubmit(form)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
