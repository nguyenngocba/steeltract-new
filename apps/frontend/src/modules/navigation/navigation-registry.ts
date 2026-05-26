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
  UserCog,
  History,
  DatabaseBackup,
} from 'lucide-react'

import type {
  NavigationItem,
} from './navigation.types'

export const navigationRegistry: NavigationItem[] =
  [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      path: '/',
      group: 'COMMAND CENTER',
      workspaceIds: [
        'management',
        'production',
        'warehouse',
        'qc',
        'logistics',
      ],
      icon: LayoutDashboard,
      description:
        'Tổng quan vận hành realtime',
    },
    {
      id: 'operations-production',
      label: 'Sản xuất',
      path: '/operations/production',
      group: 'MODULES',
      workspaceIds: ['management', 'production'],
      icon: Factory,
      description:
        'Điều phối sản xuất, công đoạn, máy và sản lượng',
    },
    {
      id: 'operations-qc',
      label: 'Chất lượng (QC)',
      path: '/operations/qc',
      group: 'MODULES',
      workspaceIds: ['management', 'qc', 'production'],
      icon: ClipboardCheck,
      description:
        'Kiểm tra chất lượng, NCR, lỗi và rework',
    },
    {
      id: 'operations-yard',
      label: 'Bãi tập kết',
      path: '/operations/yard',
      group: 'MODULES',
      workspaceIds: ['warehouse', 'logistics', 'production'],
      icon: Map,
      description:
        'Sơ đồ bãi, vị trí, cẩu, snapshot và điều chuyển',
    },
    {
      id: 'operations-warehouse',
      label: 'Kho vận hành',
      path: '/operations/warehouse',
      group: 'MODULES',
      workspaceIds: ['warehouse', 'logistics'],
      icon: Warehouse,
      description:
        'Nhập xuất kho, staging, sẵn sàng vật tư và bàn giao bãi',
    },
    {
      id: 'executive',
      label: 'Điều hành',
      path: '/executive',
      group: 'COMMAND CENTER',
      workspaceIds: ['management'],
      icon: BarChart3,
      description:
        'Management KPIs and executive signals',
    },
    {
      id: 'projects',
      label: 'Công trình',
      path: '/operations/projects',
      group: 'MODULES',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: FolderKanban,
      description:
        'Danh mục công trình, tiến độ và áp lực triển khai',
    },
    {
      id: 'operations-projects',
      label: 'Điều hành công trình',
      path: '/operations/projects',
      group: 'MODULES',
      workspaceIds: ['management', 'production'],
      icon: FolderKanban,
      description:
        'Điều phối giao hàng, cấu kiện và workflow công trình',
    },
    {
      id: 'schedule',
      label: 'Kế hoạch',
      path: '/schedule',
      group: 'MODULES',
      workspaceIds: [
        'management',
        'production',
      ],
      icon: CalendarDays,
      description:
        'Kế hoạch sản xuất và giao hàng',
    },
    {
      id: 'tasks',
      label: 'Công việc',
      path: '/tasks',
      group: 'MODULES',
      workspaceIds: [
        'management',
        'production',
        'qc',
      ],
      icon: ClipboardList,
      description:
        'Gói việc và phân công',
    },
    {
      id: 'components',
      label: 'Cấu kiện',
      path: '/components',
      group: 'MODULES',
      workspaceIds: [
        'management',
        'production',
        'qc',
      ],
      icon: Boxes,
      description:
        'Quản lý cấu kiện, QR, sản xuất và QC',
    },
    {
      id: 'workers',
      label: 'Công nhân',
      path: '/workers',
      group: 'MODULES',
      workspaceIds: ['production'],
      icon: Users,
      description:
        'Worker records and team allocation',
    },
    {
      id: 'work-centers',
      label: 'Trạm sản xuất',
      path: '/operations/production',
      group: 'MODULES',
      workspaceIds: ['production'],
      icon: Factory,
      description:
        'Work-center load and routing telemetry',
    },
    {
      id: 'machines',
      label: 'Máy móc',
      path: '/operations/production',
      group: 'MODULES',
      workspaceIds: ['production'],
      icon: Cpu,
      description:
        'Machine utilization and downtime visibility',
    },
    {
      id: 'operators',
      label: 'Tổ vận hành',
      path: '/operations/production',
      group: 'MODULES',
      workspaceIds: ['production'],
      icon: Users,
      description:
        'Operator workload and assignment control',
    },
    {
      id: 'attendance',
      label: 'Chấm công',
      path: '/attendance',
      group: 'MODULES',
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
      label: 'Thiết bị',
      path: '/equipment',
      group: 'MODULES',
      workspaceIds: ['production'],
      icon: HardHat,
      description:
        'Equipment availability and usage',
    },
    {
      id: 'inventory',
      label: 'Kho vật tư',
      path: '/operations/inventory',
      group: 'MODULES',
      workspaceIds: ['management', 'warehouse'],
      icon: Boxes,
      description:
        'Tồn kho, cảnh báo, đặt giữ và luồng vật tư',
    },
    {
      id: 'master-data-uom',
      label: 'Đơn vị tính',
      path: '/master-data/uom',
      group: 'MASTER DATA',
      workspaceIds: [
        'management',
        'warehouse',
        'production',
        'qc',
      ],
      icon: DatabaseBackup,
      description:
        'Unit of measure master data and conversion foundation',
    },
    {
      id: 'master-data-center',
      label: 'Master Data Center',
      path: '/master-data',
      group: 'MASTER DATA',
      workspaceIds: [
        'management',
        'warehouse',
        'production',
        'qc',
        'logistics',
      ],
      icon: DatabaseBackup,
      description:
        'ERP operational business dictionary foundation',
    },
    {
      id: 'transactions',
      label: 'Giao dịch kho',
      path: '/transactions',
      group: 'MODULES',
      workspaceIds: ['warehouse'],
      icon: ArrowLeftRight,
      description:
        'Inventory movements and adjustments',
    },
    {
      id: 'receiving',
      label: 'Nhập kho',
      path: '/operations/warehouse',
      group: 'MODULES',
      workspaceIds: ['warehouse'],
      icon: PackageCheck,
      description:
        'Inbound receiving queue and material intake',
    },
    {
      id: 'dispatch',
      label: 'Xuất kho',
      path: '/operations/warehouse',
      group: 'MODULES',
      workspaceIds: ['warehouse', 'logistics'],
      icon: Truck,
      description:
        'Outbound dispatch and yard handoff',
    },
    {
      id: 'return-workflow',
      label: 'Trả vật tư',
      path: '/operations/returns',
      group: 'MODULES',
      workspaceIds: ['warehouse', 'logistics', 'production'],
      icon: ArrowLeftRight,
      description:
        'Return request, receive, QC inspection and disposition workflow',
    },
    {
      id: 'reservations',
      label: 'Đặt giữ',
      path: '/operations/inventory',
      group: 'MODULES',
      workspaceIds: ['warehouse', 'production'],
      icon: ClipboardList,
      description:
        'Reservation and allocation workflow',
    },
    {
      id: 'zones',
      label: 'Khu vực kho',
      path: '/zones',
      group: 'MODULES',
      workspaceIds: ['warehouse'],
      icon: Warehouse,
      description:
        'Storage zones and warehouse structure',
    },
    {
      id: 'yard-map',
      label: 'Sơ đồ bãi',
      path: '/yard-map',
      group: 'MODULES',
      workspaceIds: [
        'warehouse',
        'logistics',
      ],
      icon: Map,
      description:
        'Visual steel yard placement',
    },
    {
      id: 'qr-scan',
      label: 'Quét QR',
      path: '/qr-scan',
      group: 'MODULES',
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
      label: 'An toàn',
      path: '/safety',
      group: 'MODULES',
      workspaceIds: ['qc'],
      icon: ShieldCheck,
      description:
        'Safety inspections and incidents',
    },
    {
      id: 'approvals',
      label: 'Phê duyệt',
      path: '/approvals',
      group: 'MODULES',
      workspaceIds: [
        'management',
        'qc',
      ],
      icon: BadgeCheck,
      description:
        'Pending workflow approvals',
    },
    {
      id: 'inspections',
      label: 'Phiếu kiểm tra',
      path: '/operations/qc',
      group: 'MODULES',
      workspaceIds: ['qc', 'production'],
      icon: ClipboardCheck,
      description:
        'Inspection queue and review board',
    },
    {
      id: 'ncr',
      label: 'Không phù hợp (NCR)',
      path: '/operations/qc',
      group: 'MODULES',
      workspaceIds: ['qc'],
      icon: ShieldAlert,
      description:
        'Non-conformance escalation lane',
    },
    {
      id: 'rework',
      label: 'Rework',
      path: '/operations/qc',
      group: 'MODULES',
      workspaceIds: ['qc', 'production'],
      icon: AlertTriangle,
      description:
        'Rework visibility and corrective action pressure',
    },
    {
      id: 'workflow-operations',
      label: 'Workflow',
      path: '/operations/workflow',
      group: 'MODULES',
      workspaceIds: ['management', 'qc', 'production'],
      icon: GitBranch,
      description:
        'Reusable approvals, SLA, escalation, and audit',
    },
    {
      id: 'ocr',
      label: 'OCR',
      path: '/ocr',
      group: 'MODULES',
      workspaceIds: ['qc'],
      icon: ScanText,
      description:
        'Document and drawing extraction',
    },
    {
      id: 'anomalies',
      label: 'AI Alerts',
      path: '/anomalies',
      group: 'INTELLIGENCE',
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
      group: 'INTELLIGENCE',
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
      label: 'Vận chuyển',
      path: '/vehicles',
      group: 'MODULES',
      workspaceIds: ['management', 'logistics'],
      icon: Truck,
      description:
        'Vehicle availability and assignment',
    },
    {
      id: 'suppliers',
      label: 'Nhà cung cấp',
      path: '/operations/suppliers',
      group: 'MODULES',
      workspaceIds: ['management', 'logistics'],
      icon: Truck,
      description:
        'Hồ sơ, năng lực và hiệu suất nhà cung cấp',
    },
    {
      id: 'procurement',
      label: 'Mua hàng',
      path: '/operations/procurement',
      group: 'MODULES',
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
      label: 'Đơn mua hàng',
      path: '/purchase-orders',
      group: 'MODULES',
      workspaceIds: ['logistics'],
      icon: ShoppingCart,
      description:
        'Purchase order tracking',
    },
    {
      id: 'material-requests',
      label: 'Yêu cầu vật tư',
      path: '/material-requests',
      group: 'MODULES',
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
      label: 'Nhật ký công trường',
      path: '/site-logs',
      group: 'MODULES',
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
      label: 'Phân tích BI',
      path: '/analytics',
      group: 'INTELLIGENCE',
      workspaceIds: ['management'],
      icon: Brain,
      description:
        'Analytics and intelligence layer',
    },
    {
      id: 'jobs',
      label: 'Tác vụ nền',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: Cpu,
      description:
        'Background job status and retry visibility',
    },
    {
      id: 'attachments',
      label: 'Tài liệu',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management', 'qc', 'production'],
      icon: Paperclip,
      description:
        'Document, drawing, evidence, and file registry',
    },
    {
      id: 'simulation',
      label: 'Mô phỏng',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management', 'production', 'warehouse', 'qc', 'logistics'],
      icon: PlayCircle,
      description:
        'Factory demo scenarios and realtime ecosystem driver',
    },
    {
      id: 'administration',
      label: 'Cài đặt',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: Settings,
      description:
        'Cấu hình hệ thống, dữ liệu, tác vụ và mô phỏng',
    },
    {
      id: 'users',
      label: 'Người dùng',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: Users,
      description:
        'Quản lý người dùng và trạng thái truy cập',
    },
    {
      id: 'roles',
      label: 'Vai trò & Phân quyền',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: UserCog,
      description:
        'Vai trò, quyền hạn và ma trận truy cập',
    },
    {
      id: 'system-logs',
      label: 'Nhật ký hệ thống',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: History,
      description:
        'Audit log và lịch sử thao tác hệ thống',
    },
    {
      id: 'backup',
      label: 'Sao lưu dữ liệu',
      path: '/operations/administration',
      group: 'SYSTEM',
      workspaceIds: ['management'],
      icon: DatabaseBackup,
      description:
        'Sao lưu, khôi phục và trạng thái lưu trữ',
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      group: 'INTELLIGENCE',
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
      group: 'INTELLIGENCE',
      workspaceIds: ['logistics'],
      icon: AlertTriangle,
      description:
        'Logistics and process alerts',
    },
  ]
