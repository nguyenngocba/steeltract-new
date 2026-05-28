import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

const AuthContext =
  createContext<any>(null)

const mockUser = {

  username:
    'admin',

  role:
    'SUPER_ADMIN',

  permissions: [

    'inventory.read',
    'inventory.write',

    'production.read',
    'production.write',

    'qc.read',
    'qc.write',

    'yard.read',

    'analytics.read',

    'admin.read',
    'admin.write',

    'digital-twin.read',
  ],
}

export function AuthProvider({
  children,
}: any) {

  const [
    user,
  ] = useState(mockUser)

  const value =
    useMemo(() => ({

      user,

      hasPermission(
        permission: string,
      ) {

        return user.permissions.includes(
          permission,
        )
      },
    }),

    [user])

  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>
  )
}

export function useAuth() {

  return useContext(
    AuthContext,
  )
}
