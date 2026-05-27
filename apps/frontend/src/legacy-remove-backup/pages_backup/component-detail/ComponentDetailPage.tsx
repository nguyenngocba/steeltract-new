import {
  useEffect,
  useState,
} from 'react'

import {
  useParams,
} from 'react-router-dom'

import QRCode from 'react-qr-code'

import toast from 'react-hot-toast'

import {
  ComponentStatusBadge,
} from '../../components/ui'

import { api } from '../../lib/api'

export function ComponentDetailPage() {
  const { id } = useParams()

  const [component,
    setComponent] =
    useState<any>(null)

  const [timeline,
    setTimeline] =
    useState<any[]>([])

  const [loading,
    setLoading] =
    useState(false)

  const [photo,
    setPhoto] =
    useState<File | null>(
      null,
    )

  async function loadData() {
    const [
      componentResponse,
      timelineResponse,
    ] = await Promise.all([
      api.get(
        `/components/${id}`,
      ),

      api.get(
        `/components/${id}/timeline`,
      ),
    ])

    setComponent(
      componentResponse.data,
    )

    setTimeline(
      timelineResponse.data,
    )
  }

  async function updateStatus(
    status: string,
  ) {
    try {
      setLoading(true)

      let photoUrl:
        | string
        | undefined

      if (photo) {
        const formData =
          new FormData()

        formData.append(
          'file',
          photo,
        )

        const uploadResponse =
          await api.post(
            '/components/timeline-upload',
            formData,
            {
              headers: {
                'Content-Type':
                  'multipart/form-data',
              },
            },
          )

        photoUrl =
          uploadResponse.data.photoUrl
      }

      await api.patch(
        `/components/${id}`,
        {
          status,
          photoUrl,
        },
      )

      toast.success(
        'Status updated',
      )

      const params =
        new URLSearchParams(
          window.location.search,
        )

      if (
        params.get(
          'mobile',
        ) === '1'
      ) {
        setTimeout(() => {
          window.location.href =
            '/qr-scan'
        }, 1000)
      }

      await loadData()
    } catch {
      toast.error(
        'Update failed',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!component) {
    return (
      <div className="text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              {component.code}
            </h1>

            <p className="text-zinc-400 mt-2">
              {component.name}
            </p>
          </div>

          <ComponentStatusBadge
            status={
              component.status
            }
          />
        </div>

        {/* QR */}
        <div className="bg-zinc-800 rounded-2xl p-6 mb-8 flex flex-col items-center">
          <QRCode
            value={
              window.location.href
            }
            size={180}
            bgColor="transparent"
            fgColor="#ffffff"
          />

          <p className="text-zinc-400 text-sm mt-4">
            Scan to open component
          </p>
        </div>

        {/* Installation Photo */}
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-2">
            Installation Photo
          </p>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) =>
              setPhoto(
                e.target.files?.[0] ||
                  null,
              )
            }
            className="
              block
              w-full
              text-sm
              text-zinc-400
            "
          />
        </div>

        {/* Image */}
        {component.imageUrl && (
          <img
            src={
              'http://172.168.53.116:3000' +
              component.imageUrl
            }
            alt=""
            className="
              w-full
              h-96
              object-cover
              rounded-xl
              mb-8
            "
          />
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Quick Actions
            </h2>

            <button
              disabled={loading}
              onClick={() =>
                updateStatus(
                  'INSTALLED',
                )
              }
              className="
                bg-cyan-500
                hover:bg-cyan-600
                px-4 py-2
                rounded-xl
                font-semibold
              "
            >
              Quick Install
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              disabled={loading}
              onClick={() =>
                updateStatus(
                  'INSTALLED',
                )
              }
              className="
                bg-green-500
                hover:bg-green-600
                rounded-xl
                py-4
                font-semibold
              "
            >
              Mark Installed
            </button>

            <button
              disabled={loading}
              onClick={() =>
                updateStatus(
                  'DELIVERED',
                )
              }
              className="
                bg-purple-500
                hover:bg-purple-600
                rounded-xl
                py-4
                font-semibold
              "
            >
              Mark Delivered
            </button>

            <button
              disabled={loading}
              onClick={() =>
                updateStatus(
                  'STOCK',
                )
              }
              className="
                bg-yellow-500
                hover:bg-yellow-600
                rounded-xl
                py-4
                font-semibold
              "
            >
              Back To Stock
            </button>
          </div>
        </div>

        {/* Information */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Project
            </p>

            <p className="text-xl font-semibold mt-1">
              {
                component.project
                  ?.name
              }
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Floor
            </p>

            <p className="text-xl font-semibold mt-1">
              {
                component.floor
              }
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Zone
            </p>

            <p className="text-xl font-semibold mt-1">
              {
                component.zone
              }
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Position
            </p>

            <p className="text-xl font-semibold mt-1">
              {
                component.position
              }
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">
            Timeline
          </h2>

          <div className="space-y-4">
            {timeline.map((item) => (
              <div
                key={item.id}
                className="
                  flex
                  items-start
                  justify-between
                  border-b border-zinc-800
                  pb-4
                  gap-4
                "
              >
                <div>
                  <p className="font-semibold text-cyan-400">
                    {item.action}
                  </p>

                  <div className="text-sm text-zinc-400 mt-1">
                    <p>
                      {item.note}
                    </p>

                    {item.photoUrl && (
                      <img
                        src={
                          'http://172.168.53.116:3000' +
                          item.photoUrl
                        }
                        alt=""
                        className="
                          w-40
                          rounded-xl
                          mt-3
                          border border-zinc-700
                        "
                      />
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500 whitespace-nowrap">
                  {new Date(
                    item.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}