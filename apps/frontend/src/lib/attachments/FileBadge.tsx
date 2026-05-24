import {
  File,
  FileImage,
  FileText,
} from 'lucide-react'

import type {
  AttachmentCategory,
} from './attachment.types'

interface FileBadgeProps {
  category?: AttachmentCategory | string
  mimeType?: string
}

export function FileBadge({
  category,
  mimeType,
}: FileBadgeProps) {
  const Icon = mimeType?.startsWith('image/')
    ? FileImage
    : mimeType === 'application/pdf'
      ? FileText
      : File

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200">
      <Icon className="h-3.5 w-3.5" />
      {category ?? 'FILE'}
    </span>
  )
}
