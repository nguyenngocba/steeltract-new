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
  Bell,
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
        path: '/dashboard/charts',
      },

      {
        title: 'Hoạt động gần đây',
        path: '/dashboard/activity',
      },
      {
        title: 'Thông báo',
        path: '/notifications',
      },
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
        title: 'Điều chuyển',
        path: '/inventory/transfer',
      },
      {
        title: 'Kiểm kê',
        path: '/inventory/stock-take',
      },
      {
        title: 'Lịch sử giao dịch',
        path: '/inventory/transactions',
      },
      {
        title: 'Cảnh báo tồn kho',
        path: '/inventory/alerts',
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
          'Kho vật tư SX',
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
    ],
  },

  {
    title: 'SẢN XUẤT',

    icon: Factory,

    children: [
      { title: 'Tổng quan sản xuất', path: '/production' },
      { title: 'Production BOM', path: '/production/boms' },
      { title: 'Lệnh sản xuất (MO)', path: '/production/orders' },
      { title: 'Cấp phát vật tư', path: '/production/material-issues' },
      { title: 'Tiêu hao vật tư', path: '/production/consumptions' },
      { title: 'Nhật ký sản xuất', path: '/production/logs' },
    ],
  },

  {
    title: 'BÃI TẬP KẾT',

    icon: Map,

    children: [
      { title: 'Tổng quan bãi', path: '/yard#overview' },
      { title: 'Sơ đồ 2D', path: '/yard#map-2d' },
      { title: 'Sơ đồ 3D', path: '/yard#map-3d' },
      { title: 'Nhập bãi', path: '/yard#inbound' },
      { title: 'Xuất bãi', path: '/yard#outbound' },
      { title: 'Chuyển nội bộ', path: '/yard#transfer' },
      { title: 'QC nội bộ', path: '/yard#qc' },
      { title: 'Lịch sử bãi', path: '/yard#history' },
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
        title: 'Tiến độ công trình',
        path: '/projects/progress',
      },
      {
        title: 'Vật tư theo công trình',
        path: '/projects/materials',
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
        title: 'Danh sách NCC',
        path: '/suppliers',
      },
      {
        title: 'Đánh giá NCC',
        path: '/suppliers/ratings',
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
        title: 'Phiếu kiểm tra',
        path: '/qc/inspections',
      },
      {
        title: 'Kế hoạch QC',
        path: '/qc/plan',
      },
      {
        title: 'Tiêu chuẩn',
        path: '/qc/standards',
      },
      {
        title: 'NCR',
        path: '/qc/ncr',
      },
      {
        title: 'Hiệu chuẩn',
        path: '/qc/calibration',
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
        title: 'Tuyến giao hàng',
        path: '/logistics/routes',
      },
      {
        title: 'GPS / Phương tiện',
        path: '/logistics/gps',
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
        title:
          'Cài đặt',

        path:
          '/settings',
      },
      {
        title:
          'Sao lưu dữ liệu',

        path:
          '/settings',
      },
    ],
  },
]
