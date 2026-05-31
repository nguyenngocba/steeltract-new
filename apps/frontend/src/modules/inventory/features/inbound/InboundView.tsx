import {
  InboundQueue,
} from './InboundQueue'

import {
  InboundWizard,
} from './InboundWizard'

import {
  InboundTelemetry,
} from './InboundTelemetry'

export function InboundView() {

  return (

    <div className="space-y-6">

      <div className="grid grid-cols-2 gap-6">

        <InboundWizard />

        <InboundTelemetry />

      </div>

      <InboundQueue />

    </div>
  )
}