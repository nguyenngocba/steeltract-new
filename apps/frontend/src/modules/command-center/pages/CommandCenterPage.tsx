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
              Trung tâm điều hành
            </div>

            <h1 className="mt-2 text-4xl font-black text-white">
              Điều phối vận hành toàn hệ thống
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Theo dõi sức khỏe nền tảng, luồng sự kiện và cảnh báo vận hành trong một không gian làm việc.
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
