import {
  useState,
} from 'react'
import toast from 'react-hot-toast'

import {
  Input,
  Modal,
  Select,
} from '../../components/ui'
import {
  InventoryCommandWorkspace,
  useInventoryWorkspace,
} from '../../modules/inventory'
import {
  useActiveUomQuery,
} from '../../modules/master-data/uom'
import {
  useMasterDataRecordsQuery,
} from '../../modules/master-data'

export function InventoryPage() {
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('')
  const [unitId, setUnitId] = useState('')
  const [quantity, setQuantity] = useState('')
  const workspace = useInventoryWorkspace()
  const uomQuery = useActiveUomQuery()
  const materialCategoriesQuery =
    useMasterDataRecordsQuery('material-categories', {
      active: true,
    })
  const {
    createInventoryItemMutation,
    updateInventoryItemMutation,
    deleteInventoryItemMutation,
  } = workspace

  function resetForm() {
    setName('')
    setCode('')
    setQuantity('')
    setCategory('')
    setUnitId('')
    setEditingId(null)
  }

  async function saveItem() {
    try {
      if (editingId) {
        await updateInventoryItemMutation.mutateAsync({
          id: editingId,
          payload: {
            name,
            code,
            quantity,
            category,
            unitId,
          },
        })
        toast.success('Item updated')
      } else {
        await createInventoryItemMutation.mutateAsync({
          name,
          code,
          quantity,
          category,
          unitId,
        })
        toast.success('Item created')
      }

      resetForm()
      setOpenModal(false)
    } catch {
      toast.error('Failed to save item')
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm(
      'Delete this inventory item?',
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteInventoryItemMutation.mutateAsync(id)
      toast.success('Item deleted')
    } catch {
      toast.error('Failed to delete item')
    }
  }

  return (
    <>
      <InventoryCommandWorkspace
        workspace={workspace}
        onCreateItem={() => {
          resetForm()
          setOpenModal(true)
        }}
        onDeleteItem={deleteItem}
      />

      <Modal
        open={openModal}
        title={editingId ? 'Edit Inventory Item' : 'Receive Inventory Item'}
        onClose={() => setOpenModal(false)}
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="Steel Beam"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Code"
            placeholder="ST-001"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Select
            label="Unit of Measure"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            options={(uomQuery.data ?? []).map((unit) => ({
              label: `${unit.code} - ${unit.name}`,
              value: unit.id,
            }))}
          />
          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={(materialCategoriesQuery.data ?? []).map(
              (record) => ({
                label: `${record.code} - ${record.name}`,
                value: record.code,
              }),
            )}
          />
          <button
            type="button"
            onClick={saveItem}
            className="w-full rounded-xl bg-cyan-500 py-3 text-white hover:bg-cyan-600"
          >
            {editingId ? 'Update Item' : 'Receive Item'}
          </button>
        </div>
      </Modal>
    </>
  )
}
