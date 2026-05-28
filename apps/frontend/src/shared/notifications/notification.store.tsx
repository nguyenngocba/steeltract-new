import {
  createContext,
  useContext,
  useState,
} from 'react'

const NotificationContext =
  createContext<any>(null)

export function NotificationProvider({
  children,
}: any) {

  const [
    notifications,
    setNotifications,
  ] = useState<any[]>([])

  function pushNotification(
    notification: any,
  ) {

    const item = {

      id:
        Date.now(),

      ...notification,
    }

    setNotifications((prev) => [

      item,
      ...prev,
    ])

    setTimeout(() => {

      setNotifications((prev) =>

        prev.filter(
          (x) => x.id !== item.id,
        ),
      )

    }, 6000)
  }

  return (

    <NotificationContext.Provider

      value={{

        notifications,
        pushNotification,
      }}
    >

      {children}

    </NotificationContext.Provider>
  )
}

export function useNotifications() {

  return useContext(
    NotificationContext,
  )
}
