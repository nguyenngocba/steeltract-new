import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Brain,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileSearch,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Map,
  NotebookPen,
  QrCode,
  ScanText,
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
      label: 'Dashboard',
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
      group: 'Projects',
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
      id: 'schedule',
      label: 'Schedule',
      path: '/schedule',
      group: 'Planning',
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
      group: 'Execution',
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
      group: 'Execution',
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
      group: 'Resources',
      workspaceIds: ['production'],
      icon: Users,
      description:
        'Worker records and team allocation',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      path: '/attendance',
      group: 'Resources',
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
      group: 'Resources',
      workspaceIds: ['production'],
      icon: HardHat,
      description:
        'Equipment availability and usage',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/inventory',
      group: 'Warehouse',
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
      group: 'Warehouse',
      workspaceIds: ['warehouse'],
      icon: ArrowLeftRight,
      description:
        'Inventory movements and adjustments',
    },
    {
      id: 'zones',
      label: 'Zones',
      path: '/zones',
      group: 'Warehouse',
      workspaceIds: ['warehouse'],
      icon: Warehouse,
      description:
        'Storage zones and warehouse structure',
    },
    {
      id: 'yard-map',
      label: 'Yard Map',
      path: '/yard-map',
      group: 'Warehouse',
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
      group: 'Warehouse',
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
      group: 'Quality',
      workspaceIds: ['qc'],
      icon: ShieldCheck,
      description:
        'Safety inspections and incidents',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      path: '/approvals',
      group: 'Quality',
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
      id: 'ocr',
      label: 'OCR',
      path: '/ocr',
      group: 'Quality',
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
      group: 'Quality',
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
      group: 'Quality',
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
      group: 'Fleet',
      workspaceIds: ['logistics'],
      icon: Truck,
      description:
        'Vehicle availability and assignment',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      path: '/suppliers',
      group: 'Supply',
      workspaceIds: ['logistics'],
      icon: Truck,
      description:
        'Supplier master records',
    },
    {
      id: 'procurement',
      label: 'Procurement',
      path: '/procurement',
      group: 'Supply',
      workspaceIds: [
        'management',
        'logistics',
      ],
      icon: ShoppingCart,
      description:
        'Procurement planning',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      path: '/purchase-orders',
      group: 'Supply',
      workspaceIds: ['logistics'],
      icon: ShoppingCart,
      description:
        'Purchase order tracking',
    },
    {
      id: 'material-requests',
      label: 'Material Requests',
      path: '/material-requests',
      group: 'Supply',
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
      group: 'Operations',
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
      label: 'AI Analytics',
      path: '/analytics',
      group: 'Intelligence',
      workspaceIds: ['management'],
      icon: Brain,
      description:
        'Analytics and intelligence layer',
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
