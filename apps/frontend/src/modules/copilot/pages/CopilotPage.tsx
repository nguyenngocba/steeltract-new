import { OperationalShell } from '@/shared/layouts/OperationalShell'

import { AiCommandPalette } from '../components/AiCommandPalette'
import { AiRecommendations } from '../components/AiRecommendations'
import { CopilotConversation } from '../components/CopilotConversation'
import { RuntimeAssistantStatus } from '../components/RuntimeAssistantStatus'

export function CopilotPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-400">
            Trợ lý vận hành
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Trợ lý điều hành SteelTrack
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            Gợi ý hành động, tóm tắt tình hình và hỗ trợ người vận hành từ dữ liệu hệ thống.
          </div>
        </div>

        <RuntimeAssistantStatus />

        <div className="grid grid-cols-2 gap-6">
          <CopilotConversation />

          <AiRecommendations />
        </div>

        <AiCommandPalette />
      </div>
    </OperationalShell>
  )
}
