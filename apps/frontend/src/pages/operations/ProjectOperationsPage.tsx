import {
  FolderKanban,
  Landmark,
} from 'lucide-react'

import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../../components/ui-system'
import { useComponentsQuery } from '../../hooks/query/useComponentQueries'
import { useProjectsQuery } from '../../hooks/query/useProjectQueries'
import { useTasksQuery } from '../../hooks/query/useTaskQueries'
import {
  OperationalWorkspaceHero,
  OperationalActivityPanel,
  StickyOpsToolbar,
} from './operations-utils'

export function ProjectOperationsPage() {
  const projectsQuery = useProjectsQuery()
  const componentsQuery = useComponentsQuery()
  const tasksQuery = useTasksQuery()
  const projects = projectsQuery.data ?? []
  const components = componentsQuery.data ?? []
  const tasks = tasksQuery.data ?? []

  return (
    <PageLayout
      title="Project Operations"
      description="Project delivery control with component readiness and execution task pressure."
    >
      <OperationalWorkspaceHero
        eyebrow="project ops / construction control"
        title="Project Operations Center"
        description="Project portfolio, construction progress, task pressure, component readiness and workflow health for delivery control."
        metrics={[
          {
            label: 'Projects',
            value: projects.length,
            tone: 'info',
          },
          {
            label: 'Components',
            value: components.length,
            tone: 'success',
          },
          {
            label: 'Tasks',
            value: tasks.length,
            tone: 'warning',
          },
          {
            label: 'High priority',
            value: tasks.filter((task) => ['URGENT', 'HIGH'].includes(task.priority)).length,
            tone: 'danger',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              construction lanes
            </StatusBadge>
            <StatusBadge tone="success">
              component readiness
            </StatusBadge>
            <StatusBadge tone="warning">
              workflow health
            </StatusBadge>
          </>
        }
      />
      <StickyOpsToolbar
        domain="projects"
        quickFilters={
          <>
            <StatusBadge tone="info">
              projects {projects.length}
            </StatusBadge>
            <StatusBadge tone="warning">
              tasks {tasks.length}
            </StatusBadge>
          </>
        }
        counters={
          <StatusBadge tone="neutral">
            components {components.length}
          </StatusBadge>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projects"
          value={projects.length}
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          label="Components"
          value={components.length}
          icon={<Landmark className="h-5 w-5" />}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Project portfolio">
          <DataTable
            data={projects}
            loading={projectsQuery.isLoading}
            rowKey={(row) => row.id}
            density="compact"
            selectable
            savedViewName="Project control"
            statusTone={() => 'info'}
            rowActions={() => (
              <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                Open
              </button>
            )}
            columns={[
              {
                key: 'project',
                header: 'Project',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-zinc-500">{row.code}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <StatusBadge tone="info">
                    {row.status ?? 'ACTIVE'}
                  </StatusBadge>
                ),
              },
            ]}
          />
        </SectionCard>
        <OperationalActivityPanel
          title="Execution pressure"
          items={tasks.slice(0, 12).map((task) => ({
            id: task.id,
            label: task.title,
            detail: `${task.status} / ${task.priority}`,
            tone:
              task.priority === 'URGENT' || task.priority === 'HIGH'
                ? 'warning'
                : 'info',
          }))}
        />
      </div>
    </PageLayout>
  )
}
