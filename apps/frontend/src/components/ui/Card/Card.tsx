import type { ReactNode } from 'react'

import { SectionCard } from '../../ui-system'

interface CardProps {
  children: ReactNode
}

export function Card({ children }: CardProps) {
  return <SectionCard>{children}</SectionCard>
}
