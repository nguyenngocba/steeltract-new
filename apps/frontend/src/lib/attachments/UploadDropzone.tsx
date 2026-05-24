import {
  UploadCloud,
  X,
} from 'lucide-react'
import {
  useRef,
  useState,
} from 'react'

import type {
  DragEvent as ReactDragEvent,
} from 'react'

import { Button } from '../../components/ui/Button'

interface UploadDropzoneProps {
  accept?: string
  multiple?: boolean
  progress?: number
  disabled?: boolean
  onFiles: (files: File[]) => void
}

export function UploadDropzone({
  accept,
  multiple = false,
  progress,
  disabled = false,
  onFiles,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return

    onFiles(Array.from(files))
  }

  const handleDrop = (
    event: ReactDragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
        dragging
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-zinc-700 bg-zinc-900'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) =>
          handleFiles(event.target.files)
        }
      />

      <UploadCloud className="mx-auto mb-3 h-8 w-8 text-zinc-400" />

      <p className="text-sm font-medium text-white">
        Drop files here
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        Images, PDFs, drawings and QC documents
      </p>

      {typeof progress === 'number' ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Browse
        </Button>

        {dragging ? (
          <button
            type="button"
            onClick={() => setDragging(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
