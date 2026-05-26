import {
  useWorkspaceEvents,
} from '../events/useWorkspaceEvents'

import type {
  WorkspaceEventFilter,
} from '../events/domain-event.types'

export function useWorkspaceTelemetryEvents(
  workspaceId: string,
  filter: WorkspaceEventFilter,
) {
  return useWorkspaceEvents({
    workspaceId,
    ...filter,
    limit: 16,
  })
}
