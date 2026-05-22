import {
  useEffect,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import { PageHeader } from '../../components/layout/PageHeader'

import { api } from '../../lib/api'

import {
  Card,
  Modal,
  Input,
  Select,
  Table,
} from '../../components/ui'

interface Transaction {
  id: string
  code: string
  type: string
  note?: string

  items: {
    quantity: number

    inventoryItem: {
      name: string
      code: string
    }
  }[]
}

interface InventoryItem {
  id: string
  name: string
  code: string
}

export function TransactionsPage() {
  const [transactions,
    setTransactions] =
    useState<Transaction[]>([])

  const [inventoryItems,
    setInventoryItems] =
    useState<InventoryItem[]>([])

  const [loading, setLoading] =
    useState(false)

  const [openModal, setOpenModal] =
    useState(false)

  const [code, setCode] =
    useState('')

  const [type, setType] =
    useState('IMPORT')

  const [note, setNote] =
    useState('')

  const [inventoryItemId,
    setInventoryItemId] =
    useState('')

  const [quantity,
    setQuantity] =
    useState('')

  async function loadData() {
    try {
      setLoading(true)

      const [
        transactionsResponse,
        inventoryResponse,
      ] = await Promise.all([
        api.get('/transactions'),
        api.get('/inventory'),
      ])

      setTransactions(
        transactionsResponse.data,
      )

      setInventoryItems(
        inventoryResponse.data,
      )
    } catch {
      toast.error(
        'Failed to load transactions',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function createTransaction() {
    try {
      await api.post(
        '/transactions',
        {
          code,
          type,
          note,

          items: [
            {
              inventoryItemId,
              quantity:
                Number(quantity),
            },
          ],
        },
      )

      toast.success(
        'Transaction created',
      )

      setCode('')
      setType('IMPORT')
      setNote('')
      setInventoryItemId('')
      setQuantity('')

      setOpenModal(false)

      loadData()
    } catch {
      toast.error(
        'Failed to create transaction',
      )
    }
  }

  const columns: any[] = [
    {
      key: 'code',
      title: 'Code',
    },

    {
      key: 'type',
      title: 'Type',
    },

    {
      key: 'item',
      title: 'Item',

      render: (_: any, row: any) =>
        row.items?.[0]
          ?.inventoryItem?.name,
    },

    {
      key: 'quantity',
      title: 'Quantity',

      render: (_: any, row: any) =>
        row.items?.[0]?.quantity,
    },

    {
      key: 'note',
      title: 'Note',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <button
            onClick={() =>
              setOpenModal(true)
            }
            className="
              bg-cyan-500
              hover:bg-cyan-600
              px-4 py-2
              rounded-xl
            "
          >
            Create Transaction
          </button>
        }
      />

      <Card>
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            No transactions found
          </div>
        ) : (
          <Table
            columns={columns}
            data={transactions}
          />
        )}
      </Card>

      <Modal
        open={openModal}
        title="Create Transaction"
        onClose={() =>
          setOpenModal(false)
        }
      >
        <div className="space-y-4">
          <Input
            label="Transaction Code"
            placeholder="TRX-001"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
          />

          <Select
            label="Type"
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            options={[
              {
                label: 'IMPORT',
                value: 'IMPORT',
              },

              {
                label: 'EXPORT',
                value: 'EXPORT',
              },

              {
                label: 'RETURN',
                value: 'RETURN',
              },
            ]}
          />

          <Select
            label="Inventory Item"
            value={inventoryItemId}
            onChange={(e) =>
              setInventoryItemId(
                e.target.value,
              )
            }
            options={inventoryItems.map(
              (item) => ({
                label: `${item.code} - ${item.name}`,
                value: item.id,
              }),
            )}
          />

          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value,
              )
            }
          />

          <Input
            label="Note"
            placeholder="Transaction note"
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />

          <button
            onClick={
              createTransaction
            }
            className="
              w-full
              bg-cyan-500
              hover:bg-cyan-600
              rounded-xl
              py-3
            "
          >
            Save Transaction
          </button>
        </div>
      </Modal>
    </div>
  )
}
