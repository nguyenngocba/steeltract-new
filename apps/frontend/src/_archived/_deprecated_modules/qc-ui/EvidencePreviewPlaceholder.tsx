import {
  Camera,
  FileImage,
} from 'lucide-react'

import {
  SectionCard,
} from '../../components/ui-system'

interface EvidencePreviewPlaceholderProps {
  count?: number
}

export function EvidencePreviewPlaceholder({
  count = 0,
}: EvidencePreviewPlaceholderProps) {
  return (
    <SectionCard title="Evidence">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-4">
          <Camera className="h-5 w-5 text-cyan-300" />
          <p className="mt-3 text-sm font-medium text-white">
            Photo inspection
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Tablet and mobile capture slot.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <FileImage className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-sm font-medium text-white">
            {count} evidence files
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Attachment-first QC evidence.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
