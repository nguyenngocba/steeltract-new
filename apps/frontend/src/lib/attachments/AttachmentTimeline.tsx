import {
  Link,
  Upload,
} from 'lucide-react'

import type {
  Attachment,
} from './attachment.types'

interface AttachmentTimelineProps {
  attachment: Attachment
}

export function AttachmentTimeline({
  attachment,
}: AttachmentTimelineProps) {
  const events = [
    ...attachment.versions.map((version) => ({
      id: `version-${version.id}`,
      title: `Version ${version.version}`,
      description: version.originalName,
      date: version.createdAt,
      type: 'version' as const,
    })),
    ...attachment.links.map((link) => ({
      id: `link-${link.id}`,
      title: `${link.module}:${link.entityId}`,
      description: link.purpose ?? 'Linked',
      date: link.createdAt,
      type: 'link' as const,
    })),
  ].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime(),
  )

  return (
    <ol className="space-y-3">
      {events.map((event) => {
        const Icon =
          event.type === 'version' ? Upload : Link

        return (
          <li
            key={event.id}
            className="flex gap-3 border-b border-zinc-800 pb-3 last:border-b-0"
          >
            <Icon className="mt-0.5 h-4 w-4 text-zinc-400" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">
                  {event.title}
                </p>

                <span className="text-xs text-zinc-500">
                  {new Date(
                    event.date,
                  ).toLocaleString()}
                </span>
              </div>

              <p className="mt-1 truncate text-sm text-zinc-400">
                {event.description}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
