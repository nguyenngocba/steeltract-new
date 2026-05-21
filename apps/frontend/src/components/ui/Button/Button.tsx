import clsx from 'clsx'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-xl font-medium transition-all',
        {
          'bg-cyan-500 hover:bg-cyan-600 text-white':
            variant === 'primary',

          'bg-zinc-800 hover:bg-zinc-700 text-white':
            variant === 'secondary',

          'bg-red-500 hover:bg-red-600 text-white':
            variant === 'danger',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
