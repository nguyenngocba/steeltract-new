import type {
  ReactNode,
} from 'react'

export function SplitWorkspaceLayout({
  main,
  side,
  ratio = 'balanced',
}: {
  main: ReactNode
  side: ReactNode
  ratio?: 'balanced' | 'main-heavy' | 'side-heavy'
}) {
  const columns = {
    balanced: 'xl:grid-cols-[1fr_0.82fr]',
    'main-heavy': 'xl:grid-cols-[1.45fr_0.55fr]',
    'side-heavy': 'xl:grid-cols-[0.8fr_1.2fr]',
  }[ratio]

  return (
    <div className={`grid gap-4 ${columns}`}>
      <div className="min-w-0 space-y-4">
        {main}
      </div>
      <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
        {side}
      </aside>
    </div>
  )
}
