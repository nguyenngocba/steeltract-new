import { ComponentsOverviewPage } from './tabs/ComponentsOverviewPage'
import { ComponentsActionProvider } from '../context/ComponentsActionContext'

export function ComponentsPage() {
  return (
    <ComponentsActionProvider>
      <ComponentsOverviewPage />
    </ComponentsActionProvider>
  )
}
