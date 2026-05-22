import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth.store'

export function LoginPage() {
  const navigate = useNavigate()

  const setAuth =
    useAuthStore(
      (state) => state.setAuth,
    )

  const [username, setUsername] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleLogin() {
    try {
      setLoading(true)

      const response =
        await api.post(
          '/auth/login',
          {
            username,
            password,
          },
        )

      setAuth(
        response.data.access_token,
        response.data.user,
      )

      navigate('/')
    } catch (error) {
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          SteelTrack ERP
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-xl py-3 text-white font-medium"
          >
            {loading
              ? 'Signing in...'
              : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
