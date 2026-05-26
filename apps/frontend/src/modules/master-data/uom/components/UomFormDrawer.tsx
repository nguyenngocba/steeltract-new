import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  FormEvent,
} from 'react'

import {
  DrawerShell,
} from '../../../../components/ui-system'

import type {
  MasterUnit,
  SaveUomPayload,
  UomCategory,
} from '../types/uom.types'

const categoryOptions: UomCategory[] = [
  'weight',
  'length',
  'quantity',
  'area',
  'volume',
]

interface UomFormDrawerProps {
  open: boolean
  units: MasterUnit[]
  editingUnit?: MasterUnit | null
  saving?: boolean
  onClose: () => void
  onSubmit: (payload: SaveUomPayload) => void
}

export function UomFormDrawer({
  open,
  units,
  editingUnit,
  saving,
  onClose,
  onSubmit,
}: UomFormDrawerProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [category, setCategory] =
    useState<UomCategory>('quantity')
  const [precision, setPrecision] = useState(0)
  const [active, setActive] = useState(true)
  const [baseUnitId, setBaseUnitId] = useState('')
  const [conversionFactor, setConversionFactor] =
    useState('')

  useEffect(() => {
    setCode(editingUnit?.code ?? '')
    setName(editingUnit?.name ?? '')
    setSymbol(editingUnit?.symbol ?? '')
    setCategory(editingUnit?.category ?? 'quantity')
    setPrecision(editingUnit?.precision ?? 0)
    setActive(editingUnit?.active ?? true)
    setBaseUnitId(editingUnit?.baseUnitId ?? '')
    setConversionFactor(
      editingUnit?.conversionFactor?.toString() ?? '',
    )
  }, [editingUnit, open])

  const baseUnitOptions = useMemo(
    () =>
      units.filter(
        (unit) =>
          unit.active &&
          unit.category === category &&
          unit.id !== editingUnit?.id,
      ),
    [category, editingUnit?.id, units],
  )

  function submit(event: FormEvent) {
    event.preventDefault()

    onSubmit({
      code,
      name,
      symbol,
      category,
      precision,
      active,
      baseUnitId: baseUnitId || undefined,
      conversionFactor: conversionFactor
        ? Number(conversionFactor)
        : undefined,
      updatedBy: 'warehouse-ops',
    })
  }

  const inputClass =
    'w-full rounded-lg border border-cyan-500/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400'

  return (
    <DrawerShell
      open={open}
      title={
        editingUnit
          ? 'Edit unit master data'
          : 'Create unit master data'
      }
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={submit}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2 text-xs text-zinc-400">
            Code
            <input
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.toUpperCase())
              }
              className={inputClass}
              placeholder="KG"
            />
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            Symbol
            <input
              required
              value={symbol}
              onChange={(event) =>
                setSymbol(event.target.value)
              }
              className={inputClass}
              placeholder="kg"
            />
          </label>
        </div>

        <label className="space-y-2 text-xs text-zinc-400">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder="Kilogram"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2 text-xs text-zinc-400">
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as UomCategory,
                )
              }
              className={inputClass}
            >
              {categoryOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            Precision
            <input
              min={0}
              max={6}
              type="number"
              value={precision}
              onChange={(event) =>
                setPrecision(Number(event.target.value))
              }
              className={inputClass}
            />
          </label>
        </div>

        <label className="space-y-2 text-xs text-zinc-400">
          Base unit
          <select
            value={baseUnitId}
            onChange={(event) =>
              setBaseUnitId(event.target.value)
            }
            className={inputClass}
          >
            <option value="">Base unit for category</option>
            {baseUnitOptions.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.code} - {unit.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-xs text-zinc-400">
          Conversion factor
          <input
            type="number"
            step="any"
            min="0"
            value={conversionFactor}
            onChange={(event) =>
              setConversionFactor(event.target.value)
            }
            className={inputClass}
            placeholder="1000"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-sm text-zinc-200">
          Active for operations
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(event.target.checked)
            }
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving' : 'Commit UOM master data'}
        </button>
      </form>
    </DrawerShell>
  )
}
