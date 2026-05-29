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
        title: 'Tồn kho vật tư',
        path: '/inventory',
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
        path: '/inventory/transfers',
      },

      {
        title: 'Kiểm kê',
        path: '/inventory/audit',
      },

      {
        title: 'Cảnh báo tồn kho',
        path: '/inventory/alerts',
      },

      {
        title: 'Lịch sử giao dịch',
        path: '/inventory/history',
      },

      {
        title: 'Danh mục vật tư',
        path: '/inventory/catalog',
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
        title: 'Danh sách cấu kiện',
        path: '/components',
      },

      {
        title: 'Sản xuất cấu kiện',
        path: '/components/production',
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
    ],
  },

  {
    title: 'BÃI TẬP KẾT',

    icon: Map,

    children: [

      {
        title: 'Sơ đồ bãi 2D/3D',
        path: '/yard',
      },

      {
        title: 'Danh sách cấu kiện',
        path: '/yard/components',
      },

      {
        title: 'Nhập bãi',
        path: '/yard/inbound',
      },

      {
        title: 'Di chuyển nội bộ',
        path: '/yard/movements',
      },

      {
        title: 'Xuất bãi',
        path: '/yard/outbound',
      },

      {
        title: 'Lịch sử xuất nhập',
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
        path: '/projects',
      },

      {
        title: 'Kế hoạch lắp dựng',
        path: '/projects/gantt',
      },

      {
        title: 'Nhu cầu vật tư',
        path: '/projects/materials',
      },

      {
        title: 'QC hiện trường',
        path: '/projects/qc',
      },

      {
        title: 'Chi phí công trình',
        path: '/projects/costs',
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
        title: 'Hợp đồng & báo giá',
        path: '/suppliers/contracts',
      },

      {
        title: 'Đánh giá NCC',
        path: '/suppliers/reviews',
      },

      {
        title: 'Lịch sử mua hàng',
        path: '/suppliers/history',
      },
    ],
  },

  {
    title: 'QC',

    icon: ShieldCheck,

    children: [

      {
        title: 'Kế hoạch kiểm tra',
        path: '/qc',
      },

      {
        title: 'NCR',
        path: '/qc/ncr',
      },

      {
        title: 'CO/CQ',
        path: '/qc/certificates',
      },
    ],
  },

  {
    title: 'VẬN CHUYỂN',

    icon: Truck,

    children: [

      {
        title: 'Danh sách xe',
        path: '/logistics',
      },

      {
        title: 'Lộ trình giao hàng',
        path: '/logistics/routes',
      },

      {
        title: 'GPS',
        path: '/logistics/gps',
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
