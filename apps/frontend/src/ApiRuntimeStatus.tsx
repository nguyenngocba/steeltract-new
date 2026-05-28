import {
  useEffect,
  useState,
} from 'react'

export function ApiRuntimeStatus() {

  const [
    online,
    setOnline,
  ] = useState(true)

  useEffect(() => {

    const timer = setInterval(() => {

      setOnline(true)

    }, 5000)

    return () => {

      clearInterval(timer)
    }

  }, [])

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">

      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm font-semibold text-white">
            Backend Runtime API
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise API Gateway
          </div>

        </div>

        <div className="flex items-center gap-2">

          <div className={`h-2 w-2 rounded-full ${
            online

              ? 'bg-emerald-400'

              : 'bg-red-400'
          }`} />

          <div className={`text-xs ${
            online

              ? 'text-emerald-400'

              : 'text-red-400'
          }`}>

            {online
              ? 'ONLINE'
              : 'OFFLINE'}

          </div>

        </div>

      </div>

    </div>
  )
}
