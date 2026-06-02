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
        path: '/dashboard/charts',
      },

      {
        title: 'Hoạt động gần đây',
        path: '/dashboard/activity',
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
          'Danh sách cấu kiện',

        path:
          '/components',
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
    title: 'BÃI TẬP KẾT',

    icon: Map,

    children: [
      {
        title:
          'Sơ đồ bãi',

        path:
          '/yard',
      },
    ],
  },

  {
    title: 'CÔNG TRÌNH',

    icon: Building2,

    children: [
      {
        title:
          'Danh sách công trình',

        path:
          '/projects',
      },
    ],
  },

  {
    title: 'NHÀ CUNG CẤP',

    icon: Users,

    children: [
      {
        title:
          'Danh sách NCC',

        path:
          '/suppliers',
      },
    ],
  },

  {
    title: 'QC',

    icon: ShieldCheck,

    children: [
      {
        title:
          'Kế hoạch kiểm tra',

        path:
          '/qc',
      },
    ],
  },

  {
    title: 'VẬN CHUYỂN',

    icon: Truck,

    children: [
      {
        title:
          'Danh sách xe',

        path:
          '/logistics',
      },
    ],
  },

  {
    title: 'CÀI ĐẶT',

    icon: Settings,

    children: [
      {
        title:
          'Thông tin công ty',

        path:
          '/settings',
      },
    ],
  },
]
