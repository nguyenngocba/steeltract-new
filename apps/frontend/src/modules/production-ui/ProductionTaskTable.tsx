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

function taskTone(status: ProductionTask['status']) {
  if (status === 'BLOCKED') {
    return 'danger'
  }

  if (status === 'IN_PROGRESS') {
    return 'info'
  }

  if (status === 'DONE') {
    return 'success'
  }

  if (status === 'ASSIGNED') {
    return 'warning'
  }

  return 'neutral'
}

export function ProductionTaskTable({
  tasks,
}: ProductionTaskTableProps) {
  return (
    <DataTable
      data={tasks}
      rowKey={(task) => task.id}
      density="compact"
      selectable
      savedViewName="Task dispatch"
      statusTone={(task) => taskTone(task.status)}
      highlightedRowIds={tasks
        .filter((task) => task.status === 'BLOCKED')
        .map((task) => task.id)}
      bulkActions={
        <>
          <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            Assign
          </button>
          <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            Release
          </button>
        </>
      }
      rowActions={(task) => (
        <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
          {task.status === 'TODO' ? 'Assign' : 'Open'}
        </button>
      )}
      contextMenu={(task) => (
        <div className="grid gap-1 text-left text-xs text-zinc-300">
          <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
            Dispatch to work center
          </button>
          <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
            View operator load
          </button>
          <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
            Trace task {task.id.slice(0, 6)}
          </button>
        </div>
      )}
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
