interface InputProps {
  label?: string
  placeholder?: string
  type?: string
  value?: string | number
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
}

export function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-zinc-400">
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
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
      />
    </div>
  )
}
