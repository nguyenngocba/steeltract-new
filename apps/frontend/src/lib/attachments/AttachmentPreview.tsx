import {
  File,
  FileText,
} from 'lucide-react'

import type {
  Attachment,
} from './attachment.types'

interface AttachmentPreviewProps {
  attachment: Attachment
}

function currentUrl(attachment: Attachment) {
  const currentVersion =
    attachment.versions.find(
      (version) =>
        version.id === attachment.currentVersionId,
    ) ?? attachment.versions[0]

  return currentVersion?.publicUrl ?? undefined
}

export function AttachmentPreview({
  attachment,
}: AttachmentPreviewProps) {
  const url =
    attachment.thumbnailUrl ?? currentUrl(attachment)

  if (
    attachment.mimeType.startsWith('image/') &&
    url
  ) {
    return (
      <img
        src={url}
        alt={attachment.title}
        className="aspect-video w-full rounded-lg border border-zinc-800 object-cover"
      />
    )
  }

  if (attachment.mimeType === 'application/pdf') {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300">
        <FileText className="mb-2 h-8 w-8" />
        <span className="text-sm">PDF preview</span>
      </div>
    )
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300">
      <File className="mb-2 h-8 w-8" />
      <span className="text-sm">
        {attachment.mimeType}
      </span>
    </div>
  )
}
