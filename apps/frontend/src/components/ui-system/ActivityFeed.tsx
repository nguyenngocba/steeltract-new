import type {
  TimelineItem,
} from './types'
import { Timeline } from './Timeline'

interface ActivityFeedProps {
  items: TimelineItem[]
}

export function ActivityFeed({
  items,
}: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <Timeline items={items} />
    </div>
  )
}
