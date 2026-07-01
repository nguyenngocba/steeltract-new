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
    title: 'VẬT TƯ KHO',

    icon: Package,

    children: [

      {
        title: 'Tổng quan',
        path: '/inventory',
      },

      {
        title: 'Vật tư',
        path: '/inventory/master-data',
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
        title: 'Tồn kho',
        path: '/inventory/materials',
      },

      {
        title: 'Vị trí kho',
        path: '/inventory/locations',
      },

      {
        title: 'Nhập kho',
        path: '/inventory/inbound',
      },

      {
        title: 'Xuất kho',
        path: '/inventory/outbound',
      },

      {
        title: 'Điều chuyển nội bộ',
        path: '/inventory/transfer',
      },

      {
        title: 'Kiểm kê',
        path: '/inventory/stock-take',
      },

      {
        title: 'Cảnh báo tồn kho',
        path: '/inventory/alerts',
      },

      {
        label:
          'Material Movements',

        path:
          '/material-movements',
      },
    ],
  },

  {
    title: 'CẤU KIỆN',

    icon: Boxes,

    children: [

      {
        title: 'Tổng quan',
        path: '/components',
      },

      {
        title: 'Danh sách cấu kiện',
        path: '/components/list',
      },

      {
        title: 'Sản xuất',
        path: '/components/production',
      },

      {
        title: 'Vật tư sử dụng',
        path: '/components/material-stock',
      },

      {
        title: 'Tồn kho cấu kiện',
        path: '/components/stock',
      },

      {
        title: 'Chuyển cấu kiện',
        path: '/components/transfers',
      },

      {
        title: 'QC nội bộ',
        path: '/components/qc',
      },

      {
        title: 'Lịch sử gia công',
        path: '/components/history',
      },

      {
        title: 'Báo cáo',
        path: '/components/reports',
      },
    ],
  },

  {
    title: 'BÃI TẬP KẾT',

    icon: Map,

    children: [

      {
        title: 'Tổng quan',
        path: '/yard',
      },

      {
        title: 'Bản đồ 2D',
        path: '/yard/map-2d',
      },

      {
        title: 'Bản đồ 3D',
        path: '/yard/map-3d',
      },

      {
        title: 'Vị trí bãi',
        path: '/yard/locations',
      },

      {
        title: 'Cấu kiện',
        path: '/yard/components',
      },

      {
        title: 'Điều phối',
        path: '/yard/dispatch',
      },

      {
        title: 'Live Tracking',
        path: '/yard/tracking',
      },

      {
        title: 'Heatmap',
        path: '/yard/heatmap',
      },

      {
        title: 'Timeline',
        path: '/yard/timeline',
      },

      {
        title: 'Lịch sử',
        path: '/yard/history',
      },
    ],
  },

  {
    title: 'CÔNG TRÌNH',

    icon: Building2,

    children: [

      {
        title: 'Danh sách công trình',
        path: '/projects/list',
      },
      {
        title: 'Templates',
        path: '/projects/templates',
      },

      {
        title: 'Tiến độ',
        path: '/projects/progress',
      },

      {
        title: 'Cấu kiện',
        path: '/projects/components',
      },

      {
        title: 'Vật tư',
        path: '/projects/materials',
      },

      {
        title: 'Tài liệu',
        path: '/projects/documents',
      },

      {
        title: 'Chi phí công trình',
        path: '/projects/costs',
      },

      {
        title: 'Nhật ký',
        path: '/projects/logs',
      },

      {
        title: 'Báo cáo',
        path: '/projects/reports',
      },
    ],
  },

  {
    title: 'NHÀ CUNG CẤP',

    icon: Users,

    children: [

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
        title: 'Tổng quan',
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
        title: 'Báo cáo',
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
    title: 'CÀI ĐẶT',

    icon: Settings,

    children: [

      {
        title: 'Thông tin công ty',
        path: '/settings',
      },

      {
        title: 'RBAC',
        path: '/settings/rbac',
      },

      {
        title: 'Danh mục',
        path: '/settings/master-data',
      },

      {
        title: 'Backup & Logs',
        path: '/settings/logs',
      },
    ],
  },
]
