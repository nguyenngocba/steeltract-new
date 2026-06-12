import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { loginApi } from '../login.api'
import { useAuthStore } from '../../../store/auth.store'

export function LoginPage() {
  const [username, setUsername] =
    useState('admin')

  const [password, setPassword] =
    useState('123')

  const setSession =
    useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function login() {
    setError('')
    setSubmitting(true)

    try {
      const data =
        await loginApi({
          username,
          password,
        })
      const accessToken =
        data.accessToken ||
        data.access_token
      const refreshToken =
        data.refreshToken ||
        data.refresh_token

      if (!accessToken || !refreshToken) {
        throw new Error('Login response did not include tokens')
      }

      setSession({
        accessToken,
        refreshToken,
        user: data.user,
      })

      const from =
        (location.state as { from?: string } | null)
          ?.from || '/'

      navigate(from, {
        replace: true,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đăng nhập',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">

      <div className="w-[420px] rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

        <h1 className="text-3xl font-bold text-white">
          SteelTrack
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Smart Factory Platform
        </p>

        <div className="mt-8 space-y-4">

          <input
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder="Username"
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
          />

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-white outline-none"
          />

          <button
            onClick={login}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-blue-600 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Đang đăng nhập...' : 'Login'}
          </button>

          {error ? (
            <p className="rounded-xl border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

        </div>

      </div>

    </div>
  )
}
