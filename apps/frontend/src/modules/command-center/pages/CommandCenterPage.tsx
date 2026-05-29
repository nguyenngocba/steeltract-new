import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { GlobalAlertPanel } from '../components/GlobalAlertPanel'
import { RuntimeHealthGrid } from '../components/RuntimeHealthGrid'
import { TelemetryOverview } from '../components/TelemetryOverview'
import { LiveEventFeed } from '@/shared/workspace/widgets/LiveEventFeed'
import { RealtimeStatusWidget } from '@/shared/workspace/widgets/RealtimeStatusWidget'
import { GlobalRuntimeEventFeed } from '@/shared/workspace/widgets/GlobalRuntimeEventFeed'
import { EventStoreHistory } from '@/shared/workspace/widgets/EventStoreHistory'
import { RealtimeTelemetryPanel } from '@/shared/workspace/widgets/RealtimeTelemetryPanel'
export function CommandCenterPage() {
  return (
    <OperationalShell>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              Command Center
            </div>

            <h1 className="mt-2 text-4xl font-black text-white">
              Global Industrial Runtime
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Unified operational telemetry & realtime event intelligence
            </div>
          </div>

          <RealtimeStatusWidget />
        </div>

        <TelemetryOverview />

        <RuntimeHealthGrid />

        <GlobalRuntimeEventFeed />

        <EventStoreHistory />

        <RealtimeTelemetryPanel />

        <div className="grid grid-cols-2 gap-6">
          <LiveEventFeed />

          <GlobalAlertPanel />
        </div>
      </div>
    </OperationalShell>
  )
}