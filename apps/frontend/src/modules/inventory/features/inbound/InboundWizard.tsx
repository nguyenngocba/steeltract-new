import { useState } from 'react'

import {
  useCreateInbound,
} from '../../hooks/mutations/useCreateInbound'

import {
  useMaterials,
} from '../../hooks/useMaterials'
import { useSuppliers } from '../../hooks/useSuppliers'

export function InboundWizard() {

  const [inventoryItemId, setInventoryItemId] =
    useState('')

  const [quantity, setQuantity] =
    useState(1)

  const [unitPrice, setUnitPrice] =
    useState(0)

  const [supplierId, setSupplierId] =
    useState('')

  const [invoiceNo, setInvoiceNo] =
    useState('')

  const inboundMutation =
    useCreateInbound()

  const {
    data: materials = [],
  } = useMaterials()

  const {
    data: suppliers = [],
  } = useSuppliers()

  async function handleReceive() {

    if (!inventoryItemId) {

      alert(
        'Please select material',
      )

      return
    }

    if (quantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    try {

      const payload = {
        inventoryItemId,
        quantity,
        unitPrice:
          unitPrice > 0
            ? unitPrice
            : undefined,
        supplierId:
          supplierId || undefined,
        invoiceNo:
          invoiceNo.trim() || undefined,
      }

      await inboundMutation.mutateAsync(
        payload,
      )

      alert(
        'Inbound created',
      )

      setInventoryItemId('')
      setQuantity(1)
      setUnitPrice(0)
      setSupplierId('')
      setInvoiceNo('')

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
          value={inventoryItemId}
          onChange={(e) =>
            setInventoryItemId(
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

        <select
          value={supplierId}
          onChange={(e) =>
            setSupplierId(
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
            Select Supplier
          </option>

          {suppliers.map(
            (supplier: any) => (
              <option
                key={supplier.id}
                value={supplier.id}
              >
                {supplier.code}
                {' - '}
                {supplier.name}
              </option>
            ),
          )}

        </select>

        <input
          value={invoiceNo}
          onChange={(e) =>
            setInvoiceNo(
              e.target.value,
            )
          }
          placeholder="Invoice No"
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

        <input
          type="number"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={(e) =>
            setUnitPrice(
              Number(
                e.target.value,
              ),
            )
          }
          placeholder="Unit Price"
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
