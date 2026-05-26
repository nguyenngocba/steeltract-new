import {
  useEffect,
  useState,
} from 'react'
import type {
  FormEvent,
} from 'react'

import {
  DrawerShell,
} from '../../../components/ui-system'

import type {
  MasterDataDomainConfig,
  MasterDataPayload,
  MasterDataRecord,
} from '../types/master-data.types'

interface MasterDataRecordDrawerProps {
  open: boolean
  config: MasterDataDomainConfig
  editingRecord?: MasterDataRecord | null
  relationRecords?: MasterDataRecord[]
  saving?: boolean
  onClose: () => void
  onSubmit: (payload: MasterDataPayload) => void
}

export function MasterDataRecordDrawer({
  open,
  config,
  editingRecord,
  relationRecords = [],
  saving,
  onClose,
  onSubmit,
}: MasterDataRecordDrawerProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [color, setColor] = useState('#06b6d4')
  const [relationId, setRelationId] = useState('')
  const [direction, setDirection] =
    useState<'inbound' | 'outbound' | 'internal'>(
      'internal',
    )
  const [affectsStock, setAffectsStock] = useState(true)
  const [requiresApproval, setRequiresApproval] =
    useState(false)
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    setCode(editingRecord?.code ?? '')
    setName(editingRecord?.name ?? '')
    setDescription(editingRecord?.description ?? '')
    setActive(editingRecord?.active ?? true)
    setColor(editingRecord?.color ?? '#06b6d4')
    setRelationId(
      config.relation
        ? String(editingRecord?.[config.relation.field] ?? '')
        : '',
    )
    setDirection(editingRecord?.direction ?? 'internal')
    setAffectsStock(editingRecord?.affectsStock ?? true)
    setRequiresApproval(
      editingRecord?.requiresApproval ?? false,
    )
    setSortOrder(editingRecord?.sortOrder ?? 0)
  }, [config.relation, editingRecord, open])

  function submit(event: FormEvent) {
    event.preventDefault()

    onSubmit({
      code,
      name,
      description,
      active,
      color,
      ...(config.relation
        ? {
            [config.relation.field]: relationId,
          }
        : {}),
      ...(config.transactionType
        ? {
            direction,
            affectsStock,
            requiresApproval,
          }
        : {}),
      ...(config.sortable
        ? {
            sortOrder,
          }
        : {}),
      updatedBy: 'master-data-center',
    })
  }

  const inputClass =
    'w-full rounded-lg border border-cyan-500/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400'

  return (
    <DrawerShell
      open={open}
      title={
        editingRecord
          ? `Edit ${config.label}`
          : `Create ${config.label}`
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
            />
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            Color
            <input
              value={color}
              type="color"
              onChange={(event) =>
                setColor(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-cyan-500/10 bg-zinc-950 px-2"
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
          />
        </label>

        <label className="space-y-2 text-xs text-zinc-400">
          Description
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={3}
            className={inputClass}
          />
        </label>

        {config.relation ? (
          <label className="space-y-2 text-xs text-zinc-400">
            {config.relation.label}
            <select
              required
              value={relationId}
              onChange={(event) =>
                setRelationId(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Select</option>
              {relationRecords.map((record) => (
                <option
                  key={record.id}
                  value={record.id}
                >
                  {record.code} - {record.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {config.transactionType ? (
          <div className="grid gap-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3">
            <label className="space-y-2 text-xs text-zinc-400">
              Direction
              <select
                value={direction}
                onChange={(event) =>
                  setDirection(
                    event.target.value as typeof direction,
                  )
                }
                className={inputClass}
              >
                <option value="inbound">inbound</option>
                <option value="outbound">outbound</option>
                <option value="internal">internal</option>
              </select>
            </label>
            <label className="flex items-center justify-between text-sm text-zinc-200">
              Affects stock
              <input
                type="checkbox"
                checked={affectsStock}
                onChange={(event) =>
                  setAffectsStock(event.target.checked)
                }
              />
            </label>
            <label className="flex items-center justify-between text-sm text-zinc-200">
              Requires approval
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(event) =>
                  setRequiresApproval(event.target.checked)
                }
              />
            </label>
          </div>
        ) : null}

        {config.sortable ? (
          <label className="space-y-2 text-xs text-zinc-400">
            Sort order
            <input
              type="number"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(Number(event.target.value))
              }
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="flex items-center justify-between rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-sm text-zinc-200">
          Active for operations
          <input
            type="checkbox"
            checked={active}
            onChange={(event) =>
              setActive(event.target.checked)
            }
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving' : 'Commit master data'}
        </button>
      </form>
    </DrawerShell>
  )
}
