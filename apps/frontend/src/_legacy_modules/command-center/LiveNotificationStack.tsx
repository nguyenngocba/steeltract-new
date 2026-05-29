import {
  SectionCard,
} from '../../components/ui-system'
import { useNotificationStore } from '../../store/notification.store'

export function LiveNotificationStack() {
  const notifications =
    useNotificationStore(
      (state) => state.notifications,
    )

  return (
    <SectionCard title="Live notifications">
      <div className="space-y-2">
        {notifications.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300"
          >
            {item.message}
          </div>
        ))}
        {notifications.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Notification stream is ready.
          </p>
        ) : null}
      </div>
    </SectionCard>
  )
}
