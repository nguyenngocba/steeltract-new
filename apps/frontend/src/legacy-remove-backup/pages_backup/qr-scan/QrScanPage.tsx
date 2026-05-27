import {
  useEffect,
  useState,
} from 'react'

import QrReader from 'react-qr-scanner'

import toast from 'react-hot-toast'

export function QrScanPage() {
  const [error,
    setError] =
    useState('')

  const [count,
    setCount] =
    useState(0)

  const [offlineCount,
    setOfflineCount] =
    useState(0)

  useEffect(() => {
    setCount(
      Number(
        localStorage.getItem(
          'install_count',
        ) || 0,
      ),
    )

    setOfflineCount(
      JSON.parse(
        localStorage.getItem(
          'offline_queue',
        ) || '[]',
      ).length,
    )
  }, [])

  useEffect(() => {
    async function syncOffline() {
      if (
        !navigator.onLine
      ) {
        return
      }

      const queue =
        JSON.parse(
          localStorage.getItem(
            'offline_queue',
          ) || '[]',
        )

      if (!queue.length) {
        return
      }

      for (const item of queue) {
        try {
          await fetch(
            item.url +
              '?mobile=1',
          )
        } catch {}
      }

      localStorage.removeItem(
        'offline_queue',
      )

      setOfflineCount(0)

      toast.success(
        'Offline queue synced',
      )
    }

    window.addEventListener(
      'online',
      syncOffline,
    )

    return () => {
      window.removeEventListener(
        'online',
        syncOffline,
      )
    }
  }, [])

  function handleScan(
    result: any,
  ) {
    if (result?.text) {
      localStorage.setItem(
        'install_count',
        String(
          Number(
            localStorage.getItem(
              'install_count',
            ) || 0,
          ) + 1,
        ),
      )

      setCount((prev) => prev + 1)

      if (
        navigator.onLine
      ) {
        window.location.href =
          result.text +
          '?mobile=1'
      } else {
        const queue =
          JSON.parse(
            localStorage.getItem(
              'offline_queue',
            ) || '[]',
          )

        queue.push({
          url:
            result.text,
          createdAt:
            new Date(),
        })

        localStorage.setItem(
          'offline_queue',
          JSON.stringify(
            queue,
          ),
        )

        setOfflineCount(
          queue.length,
        )

        toast.success(
          'Saved offline',
        )
      }
    }
  }

  function handleError(
    err: any,
  ) {
    console.error(err)

    setError(
      'Camera error',
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        QR Scanner
      </h1>

      {/* Installed Today */}
      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4 mb-6">
        <p className="text-cyan-400 text-sm">
          Installed Today
        </p>

        <p className="text-4xl font-bold mt-2">
          {count}
        </p>
      </div>

      {/* Offline Queue */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <p className="text-yellow-400 text-sm">
          Offline Queue
        </p>

        <p className="text-4xl font-bold mt-2">
          {offlineCount}
        </p>
      </div>

      {/* Scanner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <QrReader
          delay={300}
          onError={
            handleError
          }
          onScan={
            handleScan
          }
          style={{
            width: '100%',
          }}
        />

        {error && (
          <p className="text-red-400 mt-4">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}