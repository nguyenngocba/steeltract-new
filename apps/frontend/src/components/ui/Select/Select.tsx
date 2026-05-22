interface Option {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  value?: string

  options: Option[]

  onChange?: (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => void
}

export function Select({
  label,
  value,
  options,
  onChange,
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-zinc-400">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        className="
          w-full
          bg-zinc-800
          border border-zinc-700
          rounded-xl
          px-4 py-3
          text-white
          outline-none
          focus:border-cyan-500
        "
      >
        <option value="">
          Select option
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
