import { create } from 'zustand'

type NotificationState = {
  alerts: any[]

  addAlert: (alert: any) => void
}

export const useNotificationStore =
  create<NotificationState>((set) => ({
    alerts: [],

    addAlert: (alert) =>
      set((state) => ({
        alerts: [
          alert,
          ...state.alerts,
        ].slice(0, 100),
      })),
  }))
