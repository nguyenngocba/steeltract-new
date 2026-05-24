import {
  CheckSquare,
} from 'lucide-react'

import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  QcChecklist,
} from './qc.types'

interface ChecklistViewerProps {
  checklist?: QcChecklist | null
}

export function ChecklistViewer({
  checklist,
}: ChecklistViewerProps) {
  if (!checklist) {
    return (
      <SectionCard title="Checklist">
        <EmptyState
          title="No checklist selected"
          description="Reusable QC templates appear here when assigned."
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title={checklist.name}
      actions={
        <StatusBadge tone="info">
          {checklist.type}
        </StatusBadge>
      }
    >
      <div className="space-y-3">
        {(checklist.items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
          >
            <CheckSquare className="mt-0.5 h-4 w-4 text-cyan-300" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {item.sequence}. {item.title}
                </p>
                {item.required ? (
                  <StatusBadge tone="warning">
                    required
                  </StatusBadge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {item.expectedValue ??
                  item.description ??
                  'Inspection point'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
