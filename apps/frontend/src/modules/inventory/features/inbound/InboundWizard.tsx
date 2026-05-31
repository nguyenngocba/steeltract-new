import { useState } from 'react'

import {
  useCreateInbound,
} from '../../hooks/mutations/useCreateInbound'

import {
  useMaterials,
} from '../../hooks/useMaterials'

export function InboundWizard() {

  const [materialId, setMaterialId] =
    useState('')

  const [quantity, setQuantity] =
    useState(1)

  const inboundMutation =
    useCreateInbound()

  const {
    data: materials = [],
  } = useMaterials()

  async function handleReceive() {

    if (!materialId) {

      alert(
        'Please select material',
      )

      return
    }

    try {

      const payload = {

        materialId,

        quantity,

      }

      console.log(
        'SENDING',
        payload,
      )

      const result =
        await inboundMutation.mutateAsync(
          payload,
        )

      console.log(
        'SUCCESS',
        result,
      )

      alert(
        'Inbound created',
      )

      setMaterialId('')

      setQuantity(1)

    } catch (error) {

      console.error(
        'ERROR',
        error,
      )

      alert(
        'Create inbound failed',
      )
    }
  }

  return (

    <div
      className="
        rounded-3xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >

      <h2
        className="
          mb-4
          text-xl
          font-bold
          text-white
        "
      >
        Receive Material
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
          placeholder="Quantity"
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
        onClick={handleReceive}
        disabled={
          inboundMutation.isPending
        }
        className="
          mt-4
          rounded-xl
          bg-cyan-500
          px-5
          py-3
          font-medium
          text-black
        "
      >
        {
          inboundMutation.isPending
            ? 'Processing...'
            : 'Receive'
        }
      </button>

    </div>
  )
}