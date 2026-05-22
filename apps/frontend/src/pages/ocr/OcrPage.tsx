import {
  useState,
} from 'react'

import Tesseract from 'tesseract.js'

export function OcrPage() {
  const [image,
    setImage] =
    useState<File | null>(
      null,
    )

  const [loading,
    setLoading] =
    useState(false)

  const [text,
    setText] =
    useState('')

  async function handleRead() {
    if (!image) {
      return
    }

    setLoading(true)

    const result =
      await Tesseract.recognize(
        image,
        'eng',
      )

    setText(
      result.data.text,
    )

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        OCR Drawing Reader
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setImage(
              e.target
                .files?.[0] ||
                null,
            )
          }
        />

        <button
          onClick={handleRead}
          disabled={
            loading
          }
          className="
            mt-6
            bg-cyan-500
            hover:bg-cyan-600
            px-6 py-3
            rounded-xl
            font-semibold
          "
        >
          {loading
            ? 'Reading...'
            : 'Read Drawing'}
        </button>

        {text && (
          <div className="mt-8 bg-zinc-800 rounded-xl p-6 whitespace-pre-wrap">
            {text}
          </div>
        )}
      </div>
    </div>
  )
}
