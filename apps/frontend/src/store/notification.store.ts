import { create } from 'zustand'

interface Notification {
  id: number
  message: string
}

interface NotificationStore {
  notifications:
    Notification[]

  addNotification: (
    message: string,
  ) => void
}

export const useNotificationStore =
  create<NotificationStore>(
    (set) => ({
      notifications:
        [],

      addNotification:
        (
          message,
        ) => {
          set(
            (state) => ({
              notifications:
                [
                  {
                    id:
                      Date.now(),
                    message,
                  },

                  ...state.notifications,
                ],
            }),
          )
        },
    }),
  )
