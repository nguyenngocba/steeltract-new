import {
  DataTable,
  StatusBadge,
} from '../../components/ui-system'

import type {
  ProductionTask,
} from './production.types'

interface ProductionTaskTableProps {
  tasks: ProductionTask[]
}

export function ProductionTaskTable({
  tasks,
}: ProductionTaskTableProps) {
  return (
    <DataTable
      data={tasks}
      rowKey={(task) => task.id}
      columns={[
        {
          key: 'title',
          header: 'Task',
          render: (task) => task.title,
        },
        {
          key: 'status',
          header: 'Status',
          render: (task) => (
            <StatusBadge tone="info">
              {task.status}
            </StatusBadge>
          ),
        },
        {
          key: 'worker',
          header: 'Worker',
          render: (task) =>
            task.assignedWorkerId ?? '-',
        },
        {
          key: 'machine',
          header: 'Machine',
          render: (task) =>
            task.machine?.name ?? '-',
        },
      ]}
    />
  )
}
