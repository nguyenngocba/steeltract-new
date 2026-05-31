import { useState } from 'react'

import {
  useMaterials,
} from '../../hooks/useMaterials'

import {
  useCreateOutbound,
} from '../../hooks/mutations/useCreateOutbound'

export function OutboundWizard() {

  const [materialId, setMaterialId] =
    useState('')

  const [quantity, setQuantity] =
    useState(1)

  const {
    data: materials = [],
  } = useMaterials()

  const outboundMutation =
    useCreateOutbound()

  async function handleIssue() {

    if (!materialId) {

      alert(
        'Please select material',
      )

      return
    }

    try {

      await outboundMutation.mutateAsync({

        materialId,

        quantity,

      })

      alert(
        'Outbound created',
      )

      setMaterialId('')

      setQuantity(1)

    } catch (error) {

      console.error(error)

      alert(
        'Create outbound failed',
      )
    }
  }

  return (

    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-4 text-xl font-bold text-white">
        Issue Material
      </h2>

      <div className="space-y-4">

        <select
          value={materialId}
          onChange={(e) =>
            setMaterialId(
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

          <option value="">
            Select Material
          </option>

          {materials.map(
            (item: any) => (

              <option
                key={item.id}
                value={item.id}
              >
                {item.code}
                {' - '}
                {item.name}
              </option>

            ),
          )}

        </select>

        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              Number(
                e.target.value,
              ),
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
        />

      </div>

      <button
        onClick={handleIssue}
        disabled={
          outboundMutation.isPending
        }
        className="
          mt-4
          rounded-xl
          bg-red-500
          px-5
          py-3
          font-medium
          text-white
        "
      >
        {
          outboundMutation.isPending
            ? 'Processing...'
            : 'Issue'
        }
      </button>

    </div>
  )
}