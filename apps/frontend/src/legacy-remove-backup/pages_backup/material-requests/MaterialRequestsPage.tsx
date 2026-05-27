import {
  useEffect,
  useState,
} from 'react'

import { api } from '../../lib/api'
import {
  useActiveUomQuery,
} from '../../modules/master-data/uom'

export function MaterialRequestsPage() {
  const uomQuery = useActiveUomQuery()
  const [requests,
    setRequests] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      requestNumber: '',
      projectName: '',
      requestedBy: '',
      note: '',
      items: [
        {
          itemName: '',
          quantity: 0,
          unit: '',
        },
      ],
    })

  async function loadData() {
    const response =
      await api.get(
        '/material-requests',
      )

    setRequests(
      response.data,
    )
  }

  async function createRequest() {
    await api.post(
      '/material-requests',
      form,
    )

    setForm({
      requestNumber: '',
      projectName: '',
      requestedBy: '',
      note: '',
      items: [
        {
          itemName: '',
          quantity: 0,
          unit: '',
        },
      ],
    })

    loadData()
  }

  function updateItem(
    index: number,
    key: string,
    value: any,
  ) {
    const updated =
      [...form.items]

    updated[index] = {
      ...updated[index],
      [key]: value,
    }

    setForm({
      ...form,
      items: updated,
    })
  }

  function addItem() {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          itemName: '',
          quantity: 0,
          unit: '',
        },
      ],
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Material Requests
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Request
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.requestNumber
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  requestNumber:
                    e.target.value,
                })
              }
              placeholder="Request Number"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.projectName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  projectName:
                    e.target.value,
                })
              }
              placeholder="Project Name"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.requestedBy
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  requestedBy:
                    e.target.value,
                })
              }
              placeholder="Requested By"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <textarea
              value={
                form.note
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  note:
                    e.target.value,
                })
              }
              rows={4}
              placeholder="Notes"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <div className="space-y-4">
              {form.items.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={index}
                    className="bg-zinc-800 rounded-xl p-4 space-y-3"
                  >
                    <input
                      value={
                        item.itemName
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'itemName',
                          e.target.value,
                        )
                      }
                      placeholder="Item Name"
                      className="w-full bg-zinc-700 rounded-xl px-4 py-3"
                    />

                    <input
                      type="number"
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'quantity',
                          Number(
                            e.target.value,
                          ),
                        )
                      }
                      placeholder="Quantity"
                      className="w-full bg-zinc-700 rounded-xl px-4 py-3"
                    />

                    <select
                      value={
                        item.unit
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'unit',
                          e.target.value,
                        )
                      }
                      className="w-full bg-zinc-700 rounded-xl px-4 py-3"
                    >
                      <option value="">
                        Unit of measure
                      </option>
                      {(uomQuery.data ?? []).map((unit) => (
                        <option
                          key={unit.id}
                          value={unit.symbol}
                        >
                          {unit.code} - {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ),
              )}
            </div>

            <button
              onClick={addItem}
              className="
                w-full
                bg-purple-500
                hover:bg-purple-600
                rounded-xl
                py-3
                font-semibold
              "
            >
              Add Item
            </button>

            <button
              onClick={
                createRequest
              }
              className="
                w-full
                bg-cyan-500
                hover:bg-cyan-600
                rounded-xl
                py-3
                font-semibold
              "
            >
              Save Request
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {requests.map(
            (request) => (
              <div
                key={
                  request.id
                }
                className="
                  bg-zinc-900
                  border border-zinc-800
                  rounded-2xl
                  p-6
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-bold">
                      {
                        request.requestNumber
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        request.projectName
                      }
                    </p>
                  </div>

                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-4 py-2">
                    {
                      request.status
                    }
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {request.items.map(
                    (item: any) => (
                      <div
                        key={
                          item.id
                        }
                        className="bg-zinc-800 rounded-xl px-4 py-3 flex justify-between"
                      >
                        <p>
                          {
                            item.itemName
                          }
                        </p>

                        <p className="text-cyan-400 font-semibold">
                          {
                            item.quantity
                          }
                          {' '}
                          {
                            item.unit
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <p className="mt-6 text-zinc-500 text-sm">
                  Requested By:
                  {' '}
                  {
                    request.requestedBy
                  }
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
