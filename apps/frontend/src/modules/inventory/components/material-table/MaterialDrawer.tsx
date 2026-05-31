import {
  useEffect,
  useState,
} from 'react'

import {
  useCreateMaterial,
} from '../../hooks/useCreateMaterial'

import {
  useUpdateMaterial,
} from '../../hooks/useUpdateMaterial'

import {
  useZones,
} from '../../hooks/useZones'

import {
  useCategories,
} from '../../hooks/useCategories'

import {
  useUnits,
} from '../../hooks/useUnits'

import {
  useMaterialTypes,
} from '../../hooks/useMaterialTypes'

type Props = {
  open: boolean
  material?: any | null
  onClose: () => void
}

export function MaterialDrawer({
  open,
  material,
  onClose,
}: Props) {

  const [code, setCode] =
    useState('')

  const [name, setName] =
    useState('')

  const [unit, setUnit] =
    useState('PCS')

  const [quantity, setQuantity] =
    useState(0)

  const [minimumStock, setMinimumStock] =
    useState(0)

  const [description, setDescription] =
    useState('')

  const [zoneId, setZoneId] =
    useState('')

  const [categoryId, setCategoryId] =
    useState('')

  const [materialTypeId, setMaterialTypeId] =
    useState('')

  const {
    data: materialTypes = [],
  } = useMaterialTypes()  

  const createMaterialMutation =
    useCreateMaterial()

  const updateMaterialMutation =
    useUpdateMaterial()

  const {
    data: zones = [],
  } = useZones()

  const {
    data: categories = [],
  } = useCategories()

  const {
    data: units = [],
  } = useUnits()

  const isEditMode =
    Boolean(material)

  useEffect(() => {

  if (!material) {

    setCode('')
    setName('')
    setUnit('PCS')
    setQuantity(0)
    setMinimumStock(0)
    setDescription('')
    setZoneId('')
    setCategoryId('')
    setMaterialTypeId('')

    return
  }

  setCode(
    material.code ?? '',
  )

  setName(
    material.name ?? '',
  )

  setUnit(
    material.unit ?? 'PCS',
  )

  setQuantity(
    material.quantity ?? 0,
  )

  setMinimumStock(
    material.minimumStock ?? 0,
  )

  setDescription(
    material.description ?? '',
  )

  setZoneId(
    material.zoneId ?? '',
  )

  setCategoryId(
    material.categoryId ?? '',
  )

  setMaterialTypeId(
    material.materialTypeId ?? '',
  )

}, [material])

  if (!open) {
    return null
  }

  async function handleSave() {

    try {

      const payload = {

        code,

        name,

        categoryId,

        unit,

        minimumStock,

        description,

        zoneId,

        materialTypeId,
      }
      if (!code.trim()) {
        alert('Material code required')
        return
      }

      if (!name.trim()) {
        alert('Material name required')
        return
      }

      if (!categoryId) {
        alert('Category required')
        return
      }

      if (
        isEditMode &&
        material?.id
      ) {

        await updateMaterialMutation.mutateAsync({

          id: material.id,

          payload,
        })

      } else {

        await createMaterialMutation.mutateAsync(
          payload,
        )
      }

      onClose()

    } catch (error) {

      console.error(error)

      alert(
        'Save material failed',
      )
    }
  }

  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/70
      "
    >

      <div
        className="
          w-[700px]
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
          p-6
        "
      >

        <h2
          className="
            text-3xl
            font-black
            text-white
          "
        >
          {
            isEditMode
              ? 'Edit Material'
              : 'Create Material'
          }
        </h2>

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-4
          "
        >

          <input
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value,
              )
            }
            placeholder="Material Code"
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          />

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value,
              )
            }
            placeholder="Material Name"
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          />

          <select
            value={categoryId}
            onChange={(e) => {

              setCategoryId(
                e.target.value,
              )

              setMaterialTypeId('')
            }}
            
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          >
            <option value="">
              Select Category
            </option>

            {categories.map(
              (category: any) => (

                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>

          <select
            value={materialTypeId}
            onChange={(e) =>
              setMaterialTypeId(
                e.target.value,
              )
            }
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          >

            <option value="">
              Select Material Type
            </option>

            {materialTypes
              .filter(
                (item: any) =>
                  !categoryId ||
                  item.categoryId === categoryId,
              )
              .map(
                (item: any) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ),
              )}
          </select>

          <select
            value={unit}
            onChange={(e) =>
              setUnit(
                e.target.value,
              )
            }
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          >
            {units.map(
              (item: any) => (

                <option
                  key={item.id}
                  value={item.code}
                >
                  {item.name} ({item.code})
                </option>
              ),
            )}
          </select>

          <input
  type="number"
  value={quantity}
  disabled
  className="
    rounded-xl
    border
    border-zinc-700
    bg-zinc-800
    px-4
    py-3
    text-zinc-500
  "
/>

          <input
            type="number"
            value={minimumStock}
            onChange={(e) =>
              setMinimumStock(
                Number(
                  e.target.value,
                ),
              )
            }
            placeholder="Minimum Stock"
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          />

          <select
            value={zoneId}
            onChange={(e) =>
              setZoneId(
                e.target.value,
              )
            }
            className="
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
          >

            <option value="">
              Select Zone
            </option>

            {zones.map(
              (zone: any) => (

                <option
                  key={zone.id}
                  value={zone.id}
                >
                  {zone.code}
                </option>
              ),
            )}

          </select>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value,
              )
            }
            placeholder="Description"
            className="
              col-span-2
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
            "
            rows={4}
          />

        </div>

        <div
          className="
            mt-8
            flex
            justify-end
            gap-3
          "
        >
          <button
            onClick={onClose}
            className="
              rounded-xl
              border
              border-zinc-700
              px-4
              py-2
              text-zinc-300
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="
              rounded-xl
              bg-cyan-500
              px-4
              py-2
              text-black
            "
          >
            {
              isEditMode
                ? 'Save Changes'
                : 'Create Material'
            }
          </button>

        </div>

      </div>

    </div>
  )
}