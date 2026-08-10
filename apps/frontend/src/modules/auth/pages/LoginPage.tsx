import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { loginApi } from '../login.api'
import { useAuthStore } from '../../../store/auth.store'
import loginFactoryBg from '../../../../../../images/login-factory-bg.jpg'
import loginLogo from '../../../../../../images/logo-bg.jpg'

export function LoginPage() {
  const [username, setUsername] =
    useState('')

  const [password, setPassword] =
    useState('')

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
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-slate-950">
      <img
        src={loginFactoryBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12),transparent_34%),linear-gradient(90deg,rgba(2,6,23,0.78),rgba(2,6,23,0.55),rgba(2,6,23,0.8))]" />
      <div className="absolute inset-0 bg-slate-950/42 backdrop-blur-[2px]" />

      <style>
        {`
          @property --trvLoginAngle {
            syntax: '<angle>';
            inherits: false;
            initial-value: 0deg;
          }

          @keyframes trvLoginGlow {
            to { --trvLoginAngle: 360deg; }
          }

          .trv-login-frame::before {
            content: '';
            position: absolute;
            inset: -0.5px;
            border-radius: 22.5px;
            padding: 0.6px;
            background:
              conic-gradient(
                from var(--trvLoginAngle),
                rgba(34, 211, 238, 0.34),
                rgba(59, 130, 246, 0.70) 18%,
                rgba(34, 211, 238, 0.30) 38%,
                rgba(20, 184, 166, 0.68) 58%,
                rgba(37, 99, 235, 0.44) 78%,
                rgba(34, 211, 238, 0.34)
              );
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            opacity: 0.95;
          }

          .trv-login-frame::after {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 25px;
            background:
              conic-gradient(
                from var(--trvLoginAngle),
                rgba(34, 211, 238, 0.03),
                rgba(34, 211, 238, 0.04) 42%,
                rgba(125, 211, 252, 0.32) 55%,
                rgba(20, 184, 166, 0.18) 63%,
                rgba(34, 211, 238, 0.04) 76%,
                rgba(34, 211, 238, 0.03)
              );
            filter: blur(4px);
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            padding: 2.5px;
            pointer-events: none;
            opacity: 0.52;
            animation: trvLoginGlow 8s linear infinite;
          }
        `}
      </style>

      <section className="trv-login-frame relative w-[400px] rounded-[22px] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        <div className="relative rounded-[21px] border border-cyan-300/18 bg-[#071827]/94 px-8 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
          <div className="text-center">
            <img
              src={loginLogo}
              alt="TRIVIETSTEEL"
              className="mx-auto h-16 w-auto max-w-[230px] object-contain"
            />
            <p className="mt-4 text-xs font-medium text-slate-400">
              Quản lý kho & Công trình & Nhà cung cấp
            </p>
          </div>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Tài khoản
              </span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Nhập tài khoản..."
                className="mt-2 h-9 w-full rounded-lg border border-cyan-300/22 bg-slate-950/45 px-3 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/55 focus:bg-slate-950/65"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Mật khẩu
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Nhập mật khẩu..."
                className="mt-2 h-9 w-full rounded-lg border border-cyan-300/22 bg-slate-950/45 px-3 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/55 focus:bg-slate-950/65"
              />
            </label>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                Giao diện
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/60 bg-blue-500/18 text-sm font-semibold text-white shadow-[0_0_24px_rgba(37,99,235,0.18)]"
                >
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-blue-300">
                    <span className="h-2 w-2 rounded-full bg-blue-300" />
                  </span>
                  Desktop
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/18 bg-slate-950/35 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/35"
                >
                  <span className="h-4 w-4 rounded-full border border-slate-400" />
                  Mobile
                </button>
              </div>
            </div>

            <button
              onClick={login}
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {error ? (
              <p className="rounded-xl border border-red-500/35 bg-red-950/45 px-3 py-2 text-sm font-medium text-red-200">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
