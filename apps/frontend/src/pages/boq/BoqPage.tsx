import {
  useState,
} from 'react'

export function BoqPage() {
  const [text,
    setText] =
    useState('')

  const [items,
    setItems] =
    useState<any[]>([])

  function parseBoq() {
    const lines =
      text.split('\n')

    const parsed =
      lines
        .filter(
          (line) =>
            line.trim(),
        )
        .map(
          (
            line,
            index,
          ) => ({
            id: index,

            name:
              line,

            quantity:
              Math.floor(
                Math.random() *
                  100,
              ),
          }),
        )

    setItems(parsed)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        AI BOQ Parser
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <textarea
          value={text}
          onChange={(e) =>
            setText(
              e.target.value,
            )
          }
          rows={10}
          placeholder="Paste BOQ text..."
          className="
            w-full
            bg-zinc-800
            border border-zinc-700
            rounded-xl
            p-4
          "
        />

        <button
          onClick={parseBoq}
          className="
            mt-6
            bg-cyan-500
            hover:bg-cyan-600
            px-6 py-3
            rounded-xl
            font-semibold
          "
        >
          Parse BOQ
        </button>

        <div className="mt-8 space-y-4">
          {items.map(
            (item) => (
              <div
                key={
                  item.id
                }
                className="
                  bg-zinc-800
                  rounded-xl
                  p-4
                  flex
                  justify-between
                "
              >
                <p>
                  {
                    item.name
                  }
                </p>

                <p className="text-cyan-400 font-bold">
                  {
                    item.quantity
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