import {
  SectionHeader,
} from '../../../shared/ui/enterprise/SectionHeader'

import {
  KpiCard,
} from '../../../shared/ui/enterprise/KpiCard'

import {
  RuntimePanel,
} from '../../../shared/ui/enterprise/RuntimePanel'

export function ComponentOverviewPage() {

  return (

    <div className="space-y-8 p-8">

      <SectionHeader
        title="Components Runtime"
        description="Fabrication tracking, welding telemetry, production pipeline and component lifecycle."
      />

      <div className="grid gap-6 xl:grid-cols-4">

        <KpiCard
          title="Components"
          value="4,820"
          trend="+8%"
        />

        <KpiCard
          title="Fabrication"
          value="92%"
          trend="+5%"
        />

        <KpiCard
          title="QC Pass"
          value="97%"
          trend="+1%"
        />

        <KpiCard
          title="Shipping Ready"
          value="684"
          trend="+14%"
        />

      </div>

      <RuntimePanel title="Production Pipeline">

        <div className="h-[500px] rounded-2xl bg-black" />

      </RuntimePanel>

    </div>
  )
}
