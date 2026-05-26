import type {
  MasterDataDomainConfig,
} from '../types/master-data.types'

export const masterDataDomains: MasterDataDomainConfig[] =
  [
    {
      id: 'material-categories',
      label: 'Material Categories',
      description:
        'Primary material grouping for inventory, procurement and analytics.',
    },
    {
      id: 'material-types',
      label: 'Material Types',
      description:
        'Operational material type dictionary linked to material categories.',
      relation: {
        field: 'categoryId',
        domain: 'material-categories',
        label: 'Material category',
      },
    },
    {
      id: 'transaction-types',
      label: 'Transaction Types',
      description:
        'Inventory movement semantics for stock engine, approval and telemetry.',
      transactionType: true,
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      description:
        'Physical warehouse and yard operating locations.',
    },
    {
      id: 'yard-zones',
      label: 'Warehouse / Yard Zones',
      description:
        'Storage zones, racks, slots and yard operating areas.',
      relation: {
        field: 'warehouseId',
        domain: 'warehouses',
        label: 'Warehouse',
      },
    },
    {
      id: 'qc-statuses',
      label: 'QC Statuses',
      description:
        'Quality control state dictionary for inspections, holds and rework.',
      sortable: true,
    },
    {
      id: 'priorities',
      label: 'Priorities',
      description:
        'Operational priority ladder for work, requests and alerts.',
      sortable: true,
    },
    {
      id: 'material-statuses',
      label: 'Material Statuses',
      description:
        'Warehouse material availability and exception states.',
      sortable: true,
    },
    {
      id: 'supplier-categories',
      label: 'Supplier Categories',
      description:
        'Supplier segmentation for procurement, scorecards and sourcing.',
    },
    {
      id: 'project-categories',
      label: 'Project Categories',
      description:
        'Project/business segment dictionary for reporting and execution.',
    },
    {
      id: 'workflow-statuses',
      label: 'Workflow Statuses',
      description:
        'Workflow lifecycle states used by approvals and operations.',
      sortable: true,
    },
  ]
