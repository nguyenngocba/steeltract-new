import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../store/auth.store'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({
  children,
}: Props) {
  const token =
    useAuthStore(
      (state) => state.token,
    )

  if (!token) {
    return (
      <Navigate to="/login" />
    )
  }

  return children
}
