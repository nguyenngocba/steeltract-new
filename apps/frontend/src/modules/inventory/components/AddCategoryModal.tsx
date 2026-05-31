import { useState } from 'react'

import {
  useCreateCategory,
} from '../hooks/useCreateCategory'

type Props = {
  open: boolean
  onClose: () => void
}

export function AddCategoryModal({
  open,
  onClose,
}: Props) {

  const [code, setCode] =
    useState('')

  const [name, setName] =
    useState('')

  const mutation =
    useCreateCategory()

  if (!open) {
    return null
  }

  async function handleSave() {

    await mutation.mutateAsync({

      code,
      name,
    })

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
          w-[500px]
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
          Add Category
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
