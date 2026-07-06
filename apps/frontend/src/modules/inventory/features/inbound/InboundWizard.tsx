import { useState } from 'react'

import {
  useCreateInbound,
} from '../../hooks/mutations/useCreateInbound'

import {
  useMaterials,
} from '../../hooks/useMaterials'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyInput, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

const INBOUND_CELLS = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((row) =>
  ['01', '02', '03', '04', '05', '06'].map((column) => `${row}${column}`),
)

const INBOUND_LEVELS = ['L1', 'L2', 'L3', 'L4']

export function InboundWizard() {

  const [inventoryItemId, setInventoryItemId] =
    useState('')

  const [quantity, setQuantity] =
    useState('1')

  const [unitPrice, setUnitPrice] =
    useState('0')

  const [supplierId, setSupplierId] =
    useState('')

  const [invoiceNo, setInvoiceNo] =
    useState('')

  const [zoneId, setZoneId] =
    useState('')

  const [slotId, setSlotId] =
    useState('')

  const [level, setLevel] =
    useState('')

  const inboundMutation =
    useCreateInbound()

  const {
    data: materials = [],
  } = useMaterials()

  const {
    data: suppliers = [],
  } = useSuppliers()

  const {
    data: zones = [],
  } = useZones()

  const mainZones = zones.filter(
    (zone: any) =>
      zone?.active !== false &&
      zone?.warehouse?.code === 'MAIN' &&
      !String(zone?.code ?? '').startsWith('ST-WH-'),
  )
  const selectedZone = mainZones.find(
    (zone: any) => String(zone.id) === String(zoneId),
  )
  const missingLocation =
    parseLocaleNumber(quantity) > 0 &&
    (!zoneId || !slotId || !level)

  async function handleReceive() {

    if (!inventoryItemId) {

      alert(
        'Please select material',
      )

      return
    }

    const parsedQuantity = parseLocaleNumber(quantity)
    const parsedUnitPrice = parseLocaleNumber(unitPrice)

    if (parsedQuantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    if (!zoneId || !slotId || !level) {
      alert('Vui lòng chọn vị trí lưu kho.')
      return
    }

    try {

      const payload = {
        inventoryItemId,
        quantity: parsedQuantity,
        unitPrice:
          parsedUnitPrice > 0
            ? parsedUnitPrice
            : undefined,
        supplierId:
          supplierId || undefined,
        invoiceNo:
          invoiceNo.trim() || undefined,
        warehouseId:
          selectedZone?.warehouseId,
        zoneId,
        slotId,
        level,
      }

      await inboundMutation.mutateAsync(
        payload,
      )

      alert(
        'Inbound created',
      )

      setInventoryItemId('')
      setQuantity('1')
      setUnitPrice('0')
      setSupplierId('')
      setInvoiceNo('')
      setZoneId('')
      setSlotId('')
      setLevel('')

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
          value={quantity}
          onFocus={(e) =>
            setQuantity(
              formatQuantityInput(e.target.value),
            )
          }
          onBlur={(e) =>
            setQuantity(
              formatQuantity(e.target.value),
            )
          }
          onChange={(e) =>
            setQuantity(
              formatQuantityInput(e.target.value),
            )
          }
          inputMode="decimal"
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
          value={unitPrice}
          onChange={(e) =>
            setUnitPrice(
              formatCurrencyInput(e.target.value),
            )
          }
          inputMode="numeric"
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

        <select
          value={zoneId}
          onChange={(e) =>
            setZoneId(e.target.value)
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
            Vị trí nhận thuộc Kho chính
          </option>
          {mainZones.map((zone: any) => (
            <option key={zone.id} value={zone.id}>
              {zone.code}
              {' - '}
              {zone.name}
            </option>
          ))}
        </select>

        <select
          value={slotId}
          onChange={(e) =>
            setSlotId(e.target.value)
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
            Chọn ô trong vị trí
          </option>
          {INBOUND_CELLS.map((cell) => (
            <option key={cell} value={cell}>
              Ô {cell}
            </option>
          ))}
        </select>

        <select
          value={level}
          onChange={(e) =>
            setLevel(e.target.value)
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
            Chọn tầng nhận
          </option>
          {INBOUND_LEVELS.map((item) => (
            <option key={item} value={item}>
              Tầng {item}
            </option>
          ))}
        </select>

        {missingLocation ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Vui lòng chọn vị trí lưu kho.
          </div>
        ) : null}

      </div>

      <button
        onClick={handleReceive}
        disabled={
          inboundMutation.isPending || missingLocation
        }
        className="
          mt-4
          rounded-xl
          bg-cyan-500
          px-5
          py-3
          font-medium
          text-black
          disabled:cursor-not-allowed
          disabled:bg-zinc-700
          disabled:text-zinc-400
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
