import {
  Cpu,
  File,
} from 'lucide-react'

import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
} from '../../components/ui-system'
import {
  FileBadge,
  useAttachmentsQuery,
} from '../../lib/attachments'
import {
  BackgroundTaskStatus,
  useJobsQuery,
} from '../../lib/jobs'
import { SimulationControlPanel } from '../../modules/simulation-ui'
import { StickyOpsToolbar } from './operations-utils'
import { asList as asPaginatedList } from './operations-data'

export function AdministrationOperationsPage() {
  const jobsQuery = useJobsQuery({
    page: 1,
    limit: 12,
  })
  const attachmentsQuery = useAttachmentsQuery({
    page: 1,
    limit: 20,
  })
  const jobs = asPaginatedList(jobsQuery.data)
  const attachments = asPaginatedList(attachmentsQuery.data)

  return (
    <PageLayout
      title="Administration"
      description="Simulation controls, background jobs, attachment system, and platform operational health."
    >
      <StickyOpsToolbar domain="administration" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Jobs"
          value={jobs.length}
          icon={<Cpu className="h-5 w-5" />}
        />
        <StatCard
          label="Attachments"
          value={attachments.length}
          icon={<File className="h-5 w-5" />}
        />
      </div>
      <SimulationControlPanel />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Background jobs">
          <div className="space-y-3">
            {jobs.map((job) => (
              <BackgroundTaskStatus
                key={job.id}
                job={job}
              />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Attachment registry">
          <DataTable
            data={attachments}
            loading={attachmentsQuery.isLoading}
            rowKey={(row) => row.id}
            empty="No attachments"
            columns={[
              {
                key: 'file',
                header: 'File',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-zinc-500">
                      {row.mimeType}
                    </p>
                  </div>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (row) => (
                  <FileBadge
                    category={row.category}
                    mimeType={row.mimeType}
                  />
                ),
              },
              {
                key: 'size',
                header: 'Size',
                align: 'right',
                render: (row) => row.fileSize,
              },
            ]}
          />
        </SectionCard>
      </div>
    </PageLayout>
  )
}
