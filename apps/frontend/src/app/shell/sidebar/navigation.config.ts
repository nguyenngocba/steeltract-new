import {
  LayoutDashboard,
  Package,
  Boxes,
  Map,
  Building2,
  Truck,
  ShieldCheck,
  Users,
  Settings,
  Factory,
  CalendarClock,
  Bell,
  MonitorCog,
} from 'lucide-react'

export const navigation = [
  {
    title: 'TỔNG QUAN',

    icon: LayoutDashboard,

    children: [
      {
        title: 'Bảng KPI chính',
        path: '/',
      },

      {
        title: 'Biểu đồ xu hướng',
        path: '/?tab=trends',
      },

      {
        title: 'Hoạt động gần đây',
        path: '/?tab=activities',
      },
      {
        title: 'Thông báo',
        path: '/?tab=notifications',
      },
    ],
  },

  {
    title: 'OPERATIONS CENTER',

    icon: MonitorCog,

    children: [
      { title: 'Tổng quan', path: '/operations-center' },
      { title: 'Runtime', path: '/operations-center?tab=runtime' },
      { title: 'Database', path: '/operations-center?tab=database' },
      { title: 'Background Jobs', path: '/operations-center?tab=jobs' },
      { title: 'Snapshot', path: '/operations-center?tab=snapshot' },
      { title: 'Cache', path: '/operations-center?tab=cache' },
      { title: 'Storage', path: '/operations-center?tab=storage' },
      { title: 'API', path: '/operations-center?tab=api' },
      { title: 'Events', path: '/operations-center?tab=events' },
      { title: 'Performance', path: '/operations-center?tab=performance' },
      { title: 'Alerts', path: '/operations-center?tab=alerts' },
    ],
  },

  {
    title: 'VẬT TƯ KHO',

    icon: Package,

    children: [
      {
        title: 'Tổng quan kho',
        path: '/inventory',
      },
      {
        title: 'Giao dịch',
        path: '/inventory/transactions',
      },
      {
        title: 'Phiếu trả vật tư',
        path: '/inventory/returns',
      },
      {
        title: 'Vật tư & Tồn kho',
        path: '/inventory/materials',
      },
      {
        title: 'Vị trí kho',
        path: '/inventory/locations',
      },
      {
        id: 'inventory-advanced-operations',
        title: 'Nghiệp vụ nâng cao',
        children: [
          { id: 'inventory-inbound', title: 'Nhập kho', path: '/inventory/inbound' },
          { id: 'inventory-outbound', title: 'Xuất kho', path: '/inventory/outbound' },
          { id: 'inventory-transfer', title: 'Điều chuyển', path: '/inventory/transfer' },
          { id: 'inventory-stock-take', title: 'Kiểm kê', path: '/inventory/stock-take' },
          { id: 'inventory-adjustments', title: 'Điều chỉnh', path: '/inventory/adjustments' },
          { id: 'inventory-alerts', title: 'Cảnh báo', path: '/inventory/alerts' },
          { id: 'inventory-audit', title: 'Audit', path: '/inventory/audit', adminOnly: true },
        ],
      },
    ],
  },

  {
    title: 'CẤU KIỆN',

    icon: Boxes,

    children: [
      {
        title:
          'Tổng quan',

        path:
          '/components',
      },
      {
        title:
          'Danh sách cấu kiện',

        path:
          '/components/list',
      },
      {
        title:
          'Sản xuất (Lệnh SX)',
        path:
          '/components/production',
      },
      {
        title:
          'Tồn kho cấu kiện',
        path:
          '/components/stock',
      },
      {
        title:
          'Vật tư sử dụng',
        path:
          '/components/material-stock',
      },
      {
        title:
          'Chuyển cấu kiện',
        path:
          '/components/transfers',
      },
      {
        title:
          'QC nội bộ',
        path:
          '/components/qc',
      },
      {
        title:
          'Lịch sử gia công',
        path:
          '/components/history',
      },
      {
        title:
          'Báo cáo',
        path:
          '/components/reports',
      },
    ],
  },

  {
    title: 'SẢN XUẤT',

    icon: Factory,

    children: [
      { title: 'Tổng quan sản xuất', path: '/production' },
      { title: 'Lệnh sản xuất (MO)', path: '/production/orders' },
      { title: 'Kế hoạch', path: '/production/planning' },
      { title: 'Production BOM', path: '/production/boms' },
      { title: 'Kho sản xuất', path: '/production/warehouse' },
      { title: 'Theo dõi thực hiện', path: '/production/execution' },
      { title: 'Giữ chỗ vật tư', path: '/production/reservations' },
      { title: 'Sổ vật tư SX', path: '/production/material-ledger' },
      { title: 'Cấp phát vật tư', path: '/production/material-issues' },
      { title: 'Tiêu hao vật tư', path: '/production/consumptions' },
      { title: 'Sự cố', path: '/production/incidents' },
      { title: 'Nhật ký sản xuất', path: '/production/logs' },
      { title: 'Báo cáo', path: '/production/reports' },
    ],
  },

  {
    title: 'KẾ HOẠCH',
    icon: CalendarClock,
    children: [
      { title: 'Tổng quan kế hoạch', path: '/planning' },
      { title: 'Kế hoạch tổng thể', path: '/planning/master' },
      { title: 'Kế hoạch sản xuất', path: '/planning/production' },
      { title: 'Nhu cầu vật tư (MRP)', path: '/planning/material' },
      { title: 'Năng lực xưởng', path: '/planning/capacity' },
      { title: 'Lịch chạy hàng ngày', path: '/planning/schedule' },
      { title: 'Điểm nghẽn', path: '/planning/constraints' },
      { title: 'Báo cáo kế hoạch', path: '/planning/reports' },
    ],
  },

  {
    title: 'BÃI TẬP KẾT',

    icon: Map,

    children: [
      { title: 'Tổng quan', path: '/yard' },
      { title: 'Bản đồ 2D', path: '/yard/map-2d' },
      { title: 'Bản đồ 3D', path: '/yard/map-3d' },
      { title: 'Vị trí bãi', path: '/yard/locations' },
      { title: 'Cấu kiện', path: '/yard/components' },
      { title: 'Điều phối', path: '/yard/dispatch' },
      { title: 'Live Tracking', path: '/yard/tracking' },
      { title: 'Heatmap', path: '/yard/heatmap' },
      { title: 'Timeline', path: '/yard/timeline' },
      { title: 'Lịch sử', path: '/yard/history' },
    ],
  },

  {
    title: 'CÔNG TRÌNH',

    icon: Building2,

    children: [
      {
        title: 'Tổng quan',
        path: '/projects',
      },
      {
        title: 'Danh sách công trình',
        path: '/projects/list',
      },
      {
        title: 'Templates',
        path: '/projects/templates',
      },
      {
        title: 'Tiến độ công trình',
        path: '/projects/progress',
      },
      {
        title: 'Cấu kiện công trình',
        path: '/projects/components',
      },
      {
        title: 'Vật tư theo công trình',
        path: '/projects/materials',
      },
      {
        title: 'Chi phí',
        path: '/projects/costs',
      },
      {
        title: 'Tài liệu',
        path: '/projects/documents',
      },
      {
        title: 'Nhật ký',
        path: '/projects/logs',
      },
      {
        title: 'Báo cáo công trình',
        path: '/projects/reports',
      },
    ],
  },

  {
    title: 'NHÀ CUNG CẤP',

    icon: Users,

    children: [
      {
        title: 'Tổng quan',
        path: '/suppliers',
      },
      {
        title: 'Danh sách NCC',
        path: '/suppliers/list',
      },
      {
        title: 'Báo giá',
        path: '/suppliers/quotes',
      },
      {
        title: 'Đơn mua',
        path: '/suppliers/purchase-orders',
      },
      {
        title: 'Giao hàng',
        path: '/suppliers/deliveries',
      },
      {
        title: 'Chất lượng',
        path: '/suppliers/quality',
      },
      {
        title: 'Công nợ',
        path: '/suppliers/payables',
      },
      {
        title: 'Nhật ký',
        path: '/suppliers/logs',
      },
      {
        title: 'Báo cáo',
        path: '/suppliers/reports',
      },
    ],
  },

  {
    title: 'QC',

    icon: ShieldCheck,

    children: [
      {
        title: 'Tổng quan QC',
        path: '/qc',
      },
      {
        title: 'Kiểm tra đầu vào',
        path: '/qc/inbound',
      },
      {
        title: 'Kiểm tra sản xuất',
        path: '/qc/production',
      },
      {
        title: 'Kiểm tra xuất xưởng',
        path: '/qc/final',
      },
      {
        title: 'NCR',
        path: '/qc/ncr',
      },
      {
        title: 'CAPA',
        path: '/qc/capa',
      },
      {
        title: 'Nhật ký',
        path: '/qc/logs',
      },
      {
        title: 'Dashboard',
        path: '/qc/dashboard',
      },
      {
        title: 'Báo cáo QC',
        path: '/qc/reports',
      },
    ],
  },

  {
    title: 'VẬN CHUYỂN',

    icon: Truck,

    children: [
      {
        title: 'Tổng quan',
        path: '/logistics',
      },
      {
        title: 'Điều xe',
        path: '/logistics/dispatch',
      },
      {
        title: 'Đang vận chuyển',
        path: '/logistics/tracking',
      },
      {
        title: 'Lịch sử',
        path: '/logistics/history',
      },
    ],
  },

  {
    title: 'HỆ THỐNG',

    icon: Settings,

    children: [
      {
        title:
          'Người dùng',

        path:
          '/users',
      },
      {
        title:
          'Vai trò & Phân quyền',

        path:
          '/roles',
      },
      {
        title:
          'Nhật ký hệ thống',

        path:
          '/system-logs',
      },
      {
        id: 'settings-general',
        title:
          'Cài đặt',

        path:
          '/settings',
      },
      {
        id: 'settings-backup',
        title:
          'Sao lưu dữ liệu',

        path:
          '/settings',
      },
    ],
  },
]
