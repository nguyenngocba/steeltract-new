import { useState } from 'react'

import { useRuntimeEvents }
  from '../store/useRuntimeEvents'

import { useCreateTransaction }
  from '../hooks/useCreateTransaction'

import { useInventoryStore }
  from '../store/useInventoryStore'

type Props = {
  open: boolean

  onClose: () => void
}

export function NewTransactionModal({
  open,
  onClose,
}: Props) {
  const addTransaction =
    useInventoryStore(
      (state) =>
        state.addTransaction,
    )

  const mutation =
    useCreateTransaction()

  const pushEvent =
    useRuntimeEvents(
      (state) =>
        state.pushEvent,
    )

  const [material, setMaterial] =
    useState('')

  const [type, setType] =
    useState('INBOUND')

  if (!open) return null

  async function handleCreate() {
    const payload = {
      type,

      material,
    }

    await mutation.mutateAsync(
      payload,
    )

    pushEvent({
      id:
        crypto.randomUUID(),

      type,

      message:
        `${type} transaction created for ${material}`,

      timestamp:
        new Date().toLocaleTimeString(),
    })

    addTransaction({
      id:
        crypto.randomUUID(),

      type,

      material,

      timestamp:
        'Just now',
    })

    setMaterial('')

    onClose()
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/70
      "
    >
      <div
        className="
          w-[520px]
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
          p-6
        "
      >
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Inventory Runtime
        </div>

        <h2 className="mt-2 text-3xl font-black text-white">
          New Transaction
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-2 text-sm text-zinc-400">
              Transaction Type
            </div>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value,
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-zinc-700
                bg-zinc-950
                px-4
                py-3
                text-white
              "
            >
              <option>
                INBOUND
              </option>

              <option>
                OUTBOUND
              </option>

              <option>
                TRANSFER
              </option>

              <option>
                RETURN
              </option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-sm text-zinc-400">
              Material
            </div>

            <input
              value={material}
              onChange={(e) =>
                setMaterial(
                  e.target.value,
                )
              }
              placeholder="Steel Beam H400"
              className="
                w-full
                rounded-xl
                border
                border-zinc-700
                bg-zinc-950
                px-4
                py-3
                text-white
                outline-none
              "
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="
              rounded-xl
              border
              border-zinc-700
              px-4
              py-2
              text-sm
              text-zinc-300
            "
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={
              mutation.isPending
            }
            className="
              rounded-xl
              bg-cyan-500
              px-4
              py-2
              text-sm
              font-medium
              text-black
            "
          >
            {mutation.isPending
              ? 'Creating...'
              : 'Create Transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}