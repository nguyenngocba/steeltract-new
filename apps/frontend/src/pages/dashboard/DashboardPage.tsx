import { KpiCard, Card } from '../../components/ui'

export function DashboardPage() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-6">
        <KpiCard
          title="Projects"
          value="12"
        />

        <KpiCard
          title="Inventory"
          value="4,521"
        />

        <KpiCard
          title="Suppliers"
          value="43"
        />

        <KpiCard
          title="Components"
          value="892"
        />
      </div>

      <div className="mt-6">
        <Card>
          ERP Dashboard Workspace
        </Card>
      </div>
    </div>
  )
}

