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
        title: 'Danh mục vật tư',
        path: '/inventory/materials',
      },

      {
        title: 'Lịch sử giao dịch',
        path: '/inventory/transactions',
      },

      {
        title: 'Material Movements',
        path: '/material-movements',
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