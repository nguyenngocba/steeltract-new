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
            AI Copilot Runtime
          </div>

          <h1 className="mt-2 text-4xl font-black text-white">
            Industrial Operational Copilot
          </h1>

          <div className="mt-2 text-sm text-zinc-500">
            AI-powered operational intelligence & runtime assistance
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
