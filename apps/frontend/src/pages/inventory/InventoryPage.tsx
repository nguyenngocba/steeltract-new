import { useState } from 'react'

import toast from 'react-hot-toast'

import { PageHeader } from '../../components/layout/PageHeader'

import {
  useCreateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useInventoryQuery,
  useUpdateInventoryItemMutation,
} from '../../hooks/query/useInventoryQueries'
import type {
  InventoryItem,
} from '../../services/api/types'

import {
  Card,
  StatusBadge,
  Modal,
  Drawer,
  Input,
  Select,
  Table,
} from '../../components/ui'

export function InventoryPage() {
  const [search, setSearch] =
    useState('')

  const [openModal, setOpenModal] =
    useState(false)

  const [openDrawer, setOpenDrawer] =
    useState(false)

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [name, setName] =
    useState('')

  const [code, setCode] =
    useState('')

  const [category, setCategory] =
    useState('')

  const [quantity, setQuantity] =
    useState<string>('')

  const {
    data: items = [],
    isLoading: loading,
  } = useInventoryQuery()

  const createInventoryItemMutation =
    useCreateInventoryItemMutation()

  const updateInventoryItemMutation =
    useUpdateInventoryItemMutation()

  const deleteInventoryItemMutation =
    useDeleteInventoryItemMutation()

  const filteredItems =
    items.filter((item) =>
      item.name
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  async function createItem() {
    try {
      if (editingId) {
        await updateInventoryItemMutation.mutateAsync({
          id: editingId,
          payload: {
            name,
            code,
            quantity,
            category,
          },
        })

        toast.success(
          'Item updated',
        )
      } else {
        await createInventoryItemMutation.mutateAsync(
          {
            name,
            code,
            quantity,
            category,
          },
        )

        toast.success(
          'Item created',
        )
      }

      setName('')
      setCode('')
      setQuantity('')
      setCategory('')

      setEditingId(null)

      setOpenModal(false)
    } catch {
      toast.error(
        'Failed to save item',
      )
    }
  }

  async function deleteItem(
    id: string,
  ) {
    const confirmed =
      window.confirm(
        'Delete this inventory item?',
      )

    if (!confirmed) return

    try {
      await deleteInventoryItemMutation.mutateAsync(
        id,
      )

      toast.success(
        'Item deleted',
      )

    } catch {
      toast.error(
        'Failed to delete item',
      )
    }
  }

  const columns = [
    {
      key: 'code',
      title: 'Code',
    },

    {
      key: 'name',
      title: 'Name',
    },

    {
      key: 'category',
      title: 'Category',

      render: (
        _: unknown,
        row: InventoryItem,
      ) =>
        row.category?.name,
    },

    {
      key: 'quantity',
      title: 'Quantity',
    },

    {
      key: 'status',
      title: 'Status',

      render: (value: unknown) => (
        <StatusBadge status={String(value)} />
      ),
    },

    {
      key: 'actions',
      title: '',

      render: (
        _: unknown,
        row: InventoryItem,
      ) => (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedItem(row)
              setOpenDrawer(true)
            }}
            className="text-cyan-400 hover:text-cyan-300"
          >
            View
          </button>

          <button
            onClick={() => {
              setEditingId(row.id)

              setName(row.name)

              setCode(row.code)

              setQuantity(
                String(row.quantity),
              )

              setCategory(
                row.category?.name ||
                  '',
              )

              setOpenModal(true)
            }}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Edit
          </button>

          <button
            onClick={() =>
              deleteItem(row.id)
            }
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Inventory"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                bg-zinc-900
                border border-zinc-800
                rounded-xl
                px-4 py-2
                text-white
                outline-none
              "
            />

            <button
              onClick={() => {
                setEditingId(null)

                setName('')
                setCode('')
                setQuantity('')
                setCategory('')

                setOpenModal(true)
              }}
              className="
                bg-cyan-500
                hover:bg-cyan-600
                px-4 py-2
                rounded-xl
              "
            >
              Add Item
            </button>
          </div>
        }
      />

      {/* Table */}
      <Card>
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            Loading inventory...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            No inventory items found
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredItems}
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        open={openModal}
        title={
          editingId
            ? 'Edit Inventory Item'
            : 'Create Inventory Item'
        }
        onClose={() =>
          setOpenModal(false)
        }
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="Steel Beam"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <Input
            label="Code"
            placeholder="ST-001"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
          />

          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            options={[
              {
                label: 'Steel',
                value: 'steel',
              },

              {
                label: 'Bolt',
                value: 'bolt',
              },
            ]}
          />

          <button
            onClick={createItem}
            className="
              w-full
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-3
            "
          >
            {editingId
              ? 'Update Item'
              : 'Save Item'}
          </button>
        </div>
      </Modal>

      {/* Drawer */}
      <Drawer
        open={openDrawer}
        title="Inventory Details"
        onClose={() =>
          setOpenDrawer(false)
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-zinc-400 text-sm">
              Item Name
            </p>

            <h3 className="text-xl font-semibold">
              {selectedItem?.name}
            </h3>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Code
            </p>

            <h3 className="text-lg">
              {selectedItem?.code}
            </h3>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Quantity
            </p>

            <h3 className="text-lg">
              {selectedItem?.quantity}
            </h3>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Status
            </p>

            <div className="mt-2">
              <StatusBadge
                status={
                  selectedItem?.status ||
                  ''
                }
              />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
