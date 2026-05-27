import {
  OperationalCockpitPage,
} from '../../modules/operational-cockpit/OperationalCockpitPage'
import {
  productionCockpitConfig,
} from '../../modules/operational-cockpit/cockpit-configs'

export function ProductionOperationsPage() {
  return (
    <OperationalCockpitPage
      config={productionCockpitConfig}
    />
  )
}
