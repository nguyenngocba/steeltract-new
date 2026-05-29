import {
  ChevronDown,
} from 'lucide-react'

import type {
  WorkspaceDefinition,
  WorkspaceId,
} from './navigation.types'

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceDefinition[]
  activeWorkspaceId: WorkspaceId
  onChange: (workspaceId: WorkspaceId) => void
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onChange,
}: WorkspaceSwitcherProps) {
  const activeWorkspace =
    workspaces.find(
      (workspace) =>
        workspace.id === activeWorkspaceId,
    ) ?? workspaces[0]

  return (
    <label className="relative block">
      <span className="sr-only">
        Workspace
      </span>
      <select
        value={activeWorkspace?.id}
        onChange={(event) =>
          onChange(
            event.target.value as WorkspaceId,
          )
        }
        className="h-10 w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 pr-9 text-sm font-medium text-white outline-none focus:border-cyan-500"
      >
        {workspaces.map((workspace) => (
          <option
            key={workspace.id}
            value={workspace.id}
          >
            {workspace.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </label>
  )
}
