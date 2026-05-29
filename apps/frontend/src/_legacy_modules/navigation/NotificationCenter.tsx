import {
  Bell,
} from 'lucide-react'

import { useNotificationStore } from '../../store/notification.store'

export function NotificationCenter() {
  const notifications =
    useNotificationStore(
      (state) => state.notifications,
    )

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
        ) : null}
      </button>
    </div>
  )
}
