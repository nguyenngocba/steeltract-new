import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Brain,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
  Cpu,
  FileBarChart,
  FileSearch,
  FolderKanban,
  Factory,
  GitBranch,
  HardHat,
  LayoutDashboard,
  Map,
  NotebookPen,
  PackageCheck,
  Paperclip,
  PlayCircle,
  QrCode,
  ScanText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'

import type {
  NavigationItem,
} from './navigation.types'

export const navigationRegistry: NavigationItem[] =
  [
    {
      id: 'dashboard',
      label: 'Command Center',
      path: '/',
      group: 'Overview',
      workspaceIds: [
        'management',
        'production',
        'warehouse',
        'qc',
        'logistics',
      ],
      icon: LayoutDashboard,
      description:
        'Realtime ERP command overview',
    },
    {
      id: 'operations-production',
      label: 'Production Operations',
      path: '/operations/production',
      group: 'FABRICATION OPS',
      workspaceIds: ['management', 'production'],
      icon: Factory,
      permissions: ['production.read'],
      description:
        'Fabrication lanes, stages, machines, and throughput',
    },
    {
      id: 'operations-qc',
      label: 'QC Operations',
      path: '/operations/qc',
      group: 'QUALITY CONTROL',
      workspaceIds: ['management', 'qc', 'production'],
      icon: ClipboardCheck,
      permissions: ['qc.read'],
      description:
        'Inspections, NCR, defects, and rework control',
    },
    {
      id: 'operations-yard',
      label: 'Yard Operations',
      path: '/operations/yard',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse', 'logistics', 'production'],
      icon: Map,
      permissions: ['yard.read'],
      description:
        'Visual logistics, crane state, snapshots, and movements',
    },
    {
      id: 'operations-warehouse',
      label: 'Warehouse Operations',
      path: '/operations/warehouse',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse', 'logistics'],
      icon: Warehouse,
      permissions: ['inventory.read'],
      description:
        'Receiving, stock readiness, staging, and yard handoff',
    },
    {
      id: 'executive',
      label: 'Executive',
      path: '/executive',
      group: 'Overview',
      workspaceIds: ['management'],
      icon: BarChart3,
      description:
        'Management KPIs and executive signals',
    },
    {
      id: 'projects',
      label: 'Projects',
      path: '/projects',
      group: 'PROJECT OPS',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: FolderKanban,
      permissions: ['projects.read'],
      description:
        'Project portfolio and progress',
    },
    {
      id: 'operations-projects',
      label: 'Project Operations',
      path: '/operations/projects',
      group: 'PROJECT OPS',
      workspaceIds: ['management', 'production'],
      icon: FolderKanban,
      permissions: ['projects.read'],
      description:
        'Delivery control, components, and execution pressure',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      path: '/schedule',
      group: 'FABRICATION OPS',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: CalendarDays,
      description:
        'Fabrication and site schedule',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      path: '/tasks',
      group: 'PROJECT OPS',
      workspaceIds: [
        'management',
        'production',
        'qc',
      ],
      icon: ClipboardList,
      permissions: ['tasks.read'],
      description:
        'Work packages and assignments',
    },
    {
      id: 'components',
      label: 'Components',
      path: '/components',
      group: 'FABRICATION OPS',
      workspaceIds: [
        'production',
        'qc',
      ],
      icon: Boxes,
      permissions: ['components.read'],
      description:
        'Fabrication component registry',
    },
    {
      id: 'workers',
      label: 'Workers',
      path: '/workers',
      group: 'FABRICATION OPS',
      workspaceIds: ['production'],
      icon: Users,
      description:
        'Worker records and team allocation',
    },
    {
      id: 'work-centers',
      label: 'Work Centers',
      path: '/operations/production',
      group: 'FABRICATION OPS',
      workspaceIds: ['production'],
      icon: Factory,
      permissions: ['production.read'],
      description:
        'Work-center load and routing telemetry',
    },
    {
      id: 'machines',
      label: 'Machines',
      path: '/operations/production',
      group: 'FABRICATION OPS',
      workspaceIds: ['production'],
      icon: Cpu,
      permissions: ['production.read'],
      description:
        'Machine utilization and downtime visibility',
    },
    {
      id: 'operators',
      label: 'Operators',
      path: '/operations/production',
      group: 'FABRICATION OPS',
      workspaceIds: ['production'],
      icon: Users,
      permissions: ['production.read'],
      description:
        'Operator workload and assignment control',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      path: '/attendance',
      group: 'FABRICATION OPS',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: Users,
      description:
        'Worker attendance summary',
    },
    {
      id: 'equipment',
      label: 'Equipment',
      path: '/equipment',
      group: 'FABRICATION OPS',
      workspaceIds: ['production'],
      icon: HardHat,
      description:
        'Equipment availability and usage',
    },
    {
      id: 'inventory',
      label: 'Inventory Operations',
      path: '/operations/inventory',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse'],
      icon: Boxes,
      permissions: ['inventory.read'],
      description:
        'Stock position and thresholds',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      path: '/transactions',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse'],
      icon: ArrowLeftRight,
      description:
        'Inventory movements and adjustments',
    },
    {
      id: 'receiving',
      label: 'Receiving',
      path: '/operations/warehouse',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse'],
      icon: PackageCheck,
      permissions: ['inventory.read'],
      description:
        'Inbound receiving queue and material intake',
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      path: '/operations/warehouse',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse', 'logistics'],
      icon: Truck,
      permissions: ['inventory.read'],
      description:
        'Outbound dispatch and yard handoff',
    },
    {
      id: 'reservations',
      label: 'Reservations',
      path: '/operations/inventory',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse', 'production'],
      icon: ClipboardList,
      permissions: ['inventory.read'],
      description:
        'Reservation and allocation workflow',
    },
    {
      id: 'zones',
      label: 'Zones',
      path: '/zones',
      group: 'WAREHOUSE OPS',
      workspaceIds: ['warehouse'],
      icon: Warehouse,
      description:
        'Storage zones and warehouse structure',
    },
    {
      id: 'yard-map',
      label: 'Yard Map Legacy',
      path: '/yard-map',
      group: 'WAREHOUSE OPS',
      workspaceIds: [
        'warehouse',
        'logistics',
      ],
      icon: Map,
      permissions: ['yard.read'],
      description:
        'Visual steel yard placement',
    },
    {
      id: 'qr-scan',
      label: 'QR Scan',
      path: '/qr-scan',
      group: 'WAREHOUSE OPS',
      workspaceIds: [
        'warehouse',
        'production',
      ],
      icon: QrCode,
      description:
        'Scan components and material movements',
    },
    {
      id: 'safety',
      label: 'Safety',
      path: '/safety',
      group: 'QUALITY CONTROL',
      workspaceIds: ['qc'],
      icon: ShieldCheck,
      description:
        'Safety inspections and incidents',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      path: '/approvals',
      group: 'QUALITY CONTROL',
      workspaceIds: [
        'management',
        'qc',
      ],
      icon: BadgeCheck,
      permissions: ['workflow.read'],
      description:
        'Pending workflow approvals',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      path: '/operations/qc',
      group: 'QUALITY CONTROL',
      workspaceIds: ['qc', 'production'],
      icon: ClipboardCheck,
      permissions: ['qc.read'],
      description:
        'Inspection queue and review board',
    },
    {
      id: 'ncr',
      label: 'NCR',
      path: '/operations/qc',
      group: 'QUALITY CONTROL',
      workspaceIds: ['qc'],
      icon: ShieldAlert,
      permissions: ['qc.read'],
      description:
        'Non-conformance escalation lane',
    },
    {
      id: 'rework',
      label: 'Rework',
      path: '/operations/qc',
      group: 'QUALITY CONTROL',
      workspaceIds: ['qc', 'production'],
      icon: AlertTriangle,
      permissions: ['qc.read'],
      description:
        'Rework visibility and corrective action pressure',
    },
    {
      id: 'workflow-operations',
      label: 'Workflow Operations',
      path: '/operations/workflow',
      group: 'PROJECT OPS',
      workspaceIds: ['management', 'qc', 'production'],
      icon: GitBranch,
      permissions: ['workflow.read'],
      description:
        'Reusable approvals, SLA, escalation, and audit',
    },
    {
      id: 'ocr',
      label: 'OCR',
      path: '/ocr',
      group: 'QUALITY CONTROL',
      workspaceIds: ['qc'],
      icon: ScanText,
      permissions: ['attachments.read'],
      description:
        'Document and drawing extraction',
    },
    {
      id: 'anomalies',
      label: 'AI Alerts',
      path: '/anomalies',
      group: 'QUALITY CONTROL',
      workspaceIds: [
        'management',
        'qc',
      ],
      icon: ShieldAlert,
      description:
        'AI anomaly signals',
    },
    {
      id: 'boq',
      label: 'BOQ AI',
      path: '/boq',
      group: 'QUALITY CONTROL',
      workspaceIds: [
        'management',
        'qc',
      ],
      icon: FileSearch,
      description:
        'AI BOQ extraction and review',
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      path: '/vehicles',
      group: 'SUPPLY CHAIN',
      workspaceIds: ['logistics'],
      icon: Truck,
      description:
        'Vehicle availability and assignment',
    },
    {
      id: 'suppliers',
      label: 'Supplier Management',
      path: '/operations/suppliers',
      group: 'SUPPLY CHAIN',
      workspaceIds: ['logistics'],
      icon: Truck,
      description:
        'Supplier scorecards and supply performance',
    },
    {
      id: 'procurement',
      label: 'Procurement Operations',
      path: '/operations/procurement',
      group: 'SUPPLY CHAIN',
      workspaceIds: [
        'management',
        'logistics',
      ],
      icon: ShoppingCart,
      description:
        'POs, material requests, and supply readiness',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      path: '/purchase-orders',
      group: 'SUPPLY CHAIN',
      workspaceIds: ['logistics'],
      icon: ShoppingCart,
      description:
        'Purchase order tracking',
    },
    {
      id: 'material-requests',
      label: 'Material Requests',
      path: '/material-requests',
      group: 'SUPPLY CHAIN',
      workspaceIds: [
        'production',
        'logistics',
      ],
      icon: ClipboardList,
      description:
        'Material request workflow',
    },
    {
      id: 'site-logs',
      label: 'Site Logs',
      path: '/site-logs',
      group: 'PROJECT OPS',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: NotebookPen,
      description:
        'Daily operational records',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      group: 'Intelligence',
      workspaceIds: ['management'],
      icon: Brain,
      description:
        'Analytics and intelligence layer',
    },
    {
      id: 'jobs',
      label: 'Jobs',
      path: '/operations/administration',
      group: 'Administration',
      workspaceIds: ['management'],
      icon: Cpu,
      permissions: ['jobs.read'],
      description:
        'Background job status and retry visibility',
    },
    {
      id: 'attachments',
      label: 'Attachments',
      path: '/operations/administration',
      group: 'Administration',
      workspaceIds: ['management', 'qc', 'production'],
      icon: Paperclip,
      permissions: ['attachments.read'],
      description:
        'Document, drawing, evidence, and file registry',
    },
    {
      id: 'simulation',
      label: 'Simulation',
      path: '/operations/administration',
      group: 'Administration',
      workspaceIds: ['management', 'production', 'warehouse', 'qc', 'logistics'],
      icon: PlayCircle,
      description:
        'Factory demo scenarios and realtime ecosystem driver',
    },
    {
      id: 'administration',
      label: 'Administration',
      path: '/operations/administration',
      group: 'Administration',
      workspaceIds: ['management'],
      icon: Settings,
      description:
        'Platform controls, jobs, attachments, and simulation',
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      group: 'Intelligence',
      workspaceIds: [
        'management',
        'qc',
      ],
      icon: FileBarChart,
      description:
        'Operational reporting',
    },
    {
      id: 'alerts',
      label: 'Operational Alerts',
      path: '/anomalies',
      group: 'Intelligence',
      workspaceIds: ['logistics'],
      icon: AlertTriangle,
      description:
        'Logistics and process alerts',
    },
  ]
