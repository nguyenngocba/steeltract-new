import { useState } from 'react'

import { loginApi } from '../login.api'
import { useAuthStore } from '../store/auth.store'

export function LoginPage() {
  const [username, setUsername] =
    useState('admin')

  const [password, setPassword] =
    useState('admin123')

  const setAuth =
    useAuthStore((s) => s.setAuth)

  async function login() {
    const data =
      await loginApi({
        username,
        password,
      })

    setAuth(
      data.token,
      data.user
    )

    localStorage.setItem(
      'token',
      data.token
    )

    location.reload()
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
            className="h-12 w-full rounded-xl bg-blue-600 font-medium text-white"
          >
            Login
          </button>

        </div>

      </div>

    </div>
  )
}
