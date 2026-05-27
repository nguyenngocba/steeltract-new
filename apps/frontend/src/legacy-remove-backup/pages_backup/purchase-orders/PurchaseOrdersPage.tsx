import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import { api } from '../../lib/api'

export function PurchaseOrdersPage() {
  const [orders,
    setOrders] =
    useState<any[]>([])

  const [form,
    setForm] =
    useState({
      poNumber: '',
      supplierName: '',
      projectName: '',
      requestedBy: '',
      note: '',
      items: [
        {
          itemName: '',
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    })

  async function loadData() {
    const response =
      await api.get(
        '/purchase-orders',
      )

    setOrders(
      response.data,
    )
  }

  async function createOrder() {
    await api.post(
      '/purchase-orders',
      form,
    )

    toast.success(
      'Purchase Order Created',
    )

    loadData()
  }

  async function updateStatus(
    id: string,
    status: string,
  ) {
    await api.patch(
      `/purchase-orders/${id}/status`,
      {
        status,
      },
    )

    toast.success(
      'Status Updated',
    )

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

    updated[index].totalPrice =
      Number(
        updated[index].quantity,
      ) *
      Number(
        updated[index].unitPrice,
      )

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
          unitPrice: 0,
          totalPrice: 0,
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
        Purchase Orders
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* FORM */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Create Purchase Order
          </h2>

          <div className="space-y-4">
            <input
              value={
                form.poNumber
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  poNumber:
                    e.target.value,
                })
              }
              placeholder="PO Number"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3"
            />

            <input
              value={
                form.supplierName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  supplierName:
                    e.target.value,
                })
              }
              placeholder="Supplier"
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
              placeholder="Project"
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

                    <input
                      type="number"
                      value={
                        item.unitPrice
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          'unitPrice',
                          Number(
                            e.target.value,
                          ),
                        )
                      }
                      placeholder="Unit Price"
                      className="w-full bg-zinc-700 rounded-xl px-4 py-3"
                    />

                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl px-4 py-3">
                      Total:
                      {' '}
                      {
                        item.totalPrice
                      }
                    </div>
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
                createOrder
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
              Save Purchase Order
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {orders.map(
            (order) => (
              <div
                key={
                  order.id
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
                        order.poNumber
                      }
                    </p>

                    <p className="text-zinc-400 mt-2">
                      {
                        order.supplierName
                      }
                    </p>
                  </div>

                  <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl px-4 py-2">
                    {
                      order.status
                    }
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {order.items.map(
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
                          $
                          {
                            item.totalPrice
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xl font-bold text-cyan-400">
                    $
                    {
                      order.totalAmount
                    }
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          'APPROVED',
                        )
                      }
                      className="
                        bg-green-500
                        hover:bg-green-600
                        px-4 py-2
                        rounded-xl
                      "
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          order.id,
                          'ORDERED',
                        )
                      }
                      className="
                        bg-purple-500
                        hover:bg-purple-600
                        px-4 py-2
                        rounded-xl
                      "
                    >
                      Ordered
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
