import { ProductionCockpitPage } from './ProductionCockpitPage'
import { ProductionActionProvider } from '../context/ProductionActionContext'

export function ProductionPage() {
  return (
    <ProductionActionProvider>
      <ProductionCockpitPage />
    </ProductionActionProvider>
  )
}
