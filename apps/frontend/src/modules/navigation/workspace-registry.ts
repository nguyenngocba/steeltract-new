import type {
  WorkspaceDefinition,
} from './navigation.types'

export const workspaceRegistry: WorkspaceDefinition[] =
  [
    {
      id: 'management',
      label: 'Management',
      description:
        'Executive visibility, projects, planning, and approvals.',
      defaultPath: '/',
    },
    {
      id: 'production',
      label: 'Production',
      description:
        'Fabrication execution, work planning, and labor coordination.',
      defaultPath: '/operations/production',
      permissions: [
        'components.read',
        'tasks.read',
        'production.read',
      ],
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      description:
        'Inventory, material movements, zones, and yard operations.',
      defaultPath: '/operations/inventory',
      permissions: [
        'inventory.read',
        'yard.read',
      ],
    },
    {
      id: 'qc',
      label: 'Quality',
      description:
        'Inspections, NCR, safety, and evidence workflows.',
      defaultPath: '/operations/qc',
      permissions: [
        'qc.read',
        'workflow.read',
      ],
    },
    {
      id: 'logistics',
      label: 'Logistics',
      description:
        'Vehicles, suppliers, procurement, and material requests.',
      defaultPath: '/operations/yard',
    },
  ]
