type Props = {
  warehouse: string
  onWarehouseChange: (value: string) => void
}

export function InventoryToolbar({
  warehouse,
  onWarehouseChange,
}: Props) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-4
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Runtime Controls
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Inventory operational filters
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={warehouse}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="
            rounded-xl
            border
            border-zinc-700
            bg-zinc-950
            px-4
            py-2
            text-sm
            text-white
            outline-none
          "
        >
          <option value="ALL">All Warehouses</option>
          <option value="WH-A">WH-A</option>
          <option value="WH-B">WH-B</option>
          <option value="WH-C">WH-C</option>
        </select>

        <button
          className="
            rounded-xl
            bg-cyan-500
            px-4
            py-2
            text-sm
            font-medium
            text-black
            transition
            hover:bg-cyan-400
          "
        >
          New Transaction
        </button>
      </div>
    </div>
  )
}
