import { useState } from 'react'

import {
  useCategories,
} from '../hooks/useCategories'

import {
  useCreateMaterialType,
} from '../hooks/useCreateMaterialType'

type Props = {
  open: boolean
  onClose: () => void
}

export function AddMaterialTypeModal({
  open,
  onClose,
}: Props) {

  const [code, setCode] =
    useState('')

  const [name, setName] =
    useState('')

  const [categoryId, setCategoryId] =
    useState('')

  const {
    data: categories = [],
  } = useCategories()

  const mutation =
    useCreateMaterialType()

  if (!open) {
    return null
  }

  async function handleSave() {

    if (
      !code ||
      !name ||
      !categoryId
    ) {
      alert(
        'Please fill all fields',
      )
      return
    }

    await mutation.mutateAsync({

      code,

      name,

      categoryId,
    })

    setCode('')
    setName('')
    setCategoryId('')

    onClose()
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
          w-[550px]
          rounded-2xl
          bg-zinc-900
          p-6
        "
      >

        <h2
          className="
            mb-4
            text-xl
            font-bold
            text-white
          "
        >
          Add Material Type
        </h2>

        <input
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value,
            )
          }
          placeholder="Code"
          className="
            mb-3
            w-full
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
          placeholder="Name"
          className="
            mb-3
            w-full
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
          onChange={(e) =>
            setCategoryId(
              e.target.value,
            )
          }
          className="
            w-full
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

        <div
          className="
            mt-6
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
            Save
          </button>

        </div>

      </div>

    </div>
  )
}
