export const navigation = [

  {
    group:
      'DASHBOARD',

    vi:
      'Tổng quan',

    items: [

      {
        key:
          'dashboard',

        label:
          'Executive Dashboard',

        vi:
          'Dashboard Điều Hành',

        path:
          '/',
      },

      {
        key:
          'command-center',

        label:
          'Command Center',

        vi:
          'Trung Tâm Điều Hành',

        path:
          '/command-center',
      },

      {
        key:
          'analytics',

        label:
          'Analytics',

        vi:
          'Phân Tích',

        path:
          '/analytics',
      },
    ],
  },

  {
    group:
      'INVENTORY',

    vi:
      'Kho Vật Tư',

    items: [

      {
        key:
          'materials',

        label:
          'Materials',

        vi:
          'Danh Sách Vật Tư',

        path:
          '/inventory',
      },

      {
        key:
          'inbound',

        label:
          'Inbound',

        vi:
          'Nhập Kho',

        path:
          '/inventory/inbound',
      },

      {
        key:
          'outbound',

        label:
          'Outbound',

        vi:
          'Xuất Kho',

        path:
          '/inventory/outbound',
      },

      {
        key:
          'transfer',

        label:
          'Transfer',

        vi:
          'Chuyển Kho',

        path:
          '/inventory/transfer',
      },

      {
        key:
          'warehouse-map',

        label:
          'Warehouse Map',

        vi:
          'Sơ Đồ Kho',

        path:
          '/inventory/warehouse-map',
      },

      {
        key:
          'transactions',

        label:
          'Transactions',

        vi:
          'Lịch Sử Giao Dịch',

        path:
          '/inventory/transactions',
      },

      {
        key:
          'forecast',

        label:
          'Forecast',

        vi:
          'Dự Báo',

        path:
          '/inventory/forecast',
      },

      {
        key:
          'categories',

        label:
          'Categories',

        vi:
          'Danh Mục',

        path:
          '/inventory/categories',
      },

      {
        key:
          'units',

        label:
          'Units',

        vi:
          'Đơn Vị Tính',

        path:
          '/inventory/units',
      },
    ],
  },

  {
    group:
      'COMPONENTS',

    vi:
      'Cấu Kiện',

    items: [

      {
        key:
          'components',

        label:
          'Components',

        vi:
          'Danh Sách Cấu Kiện',

        path:
          '/components',
      },

      {
        key:
          'fabrication',

        label:
          'Fabrication',

        vi:
          'Gia Công',

        path:
          '/components/fabrication',
      },

      {
        key:
          'welding',

        label:
          'Welding',

        vi:
          'Hàn',

        path:
          '/components/welding',
      },

      {
        key:
          'painting',

        label:
          'Painting',

        vi:
          'Sơn',

        path:
          '/components/painting',
      },

      {
        key:
          'assembly',

        label:
          'Assembly',

        vi:
          'Lắp Ráp',

        path:
          '/components/assembly',
      },

      {
        key:
          'shipping',

        label:
          'Shipping',

        vi:
          'Xuất Hàng',

        path:
          '/components/shipping',
      },

      {
        key:
          'component-qc',

        label:
          'Component QC',

        vi:
          'QC Cấu Kiện',

        path:
          '/components/qc',
      },
    ],
  },

  {
    group:
      'PRODUCTION',

    vi:
      'Sản Xuất',

    items: [

      {
        key:
          'production-orders',

        label:
          'Production Orders',

        vi:
          'Lệnh Sản Xuất',

        path:
          '/production/orders',
      },

      {
        key:
          'work-orders',

        label:
          'Work Orders',

        vi:
          'Work Orders',

        path:
          '/production/work-orders',
      },

      {
        key:
          'machines',

        label:
          'Machine Runtime',

        vi:
          'Máy Móc',

        path:
          '/production/machines',
      },

      {
        key:
          'operators',

        label:
          'Operators',

        vi:
          'Công Nhân',

        path:
          '/production/operators',
      },

      {
        key:
          'schedules',

        label:
          'Schedules',

        vi:
          'Kế Hoạch',

        path:
          '/production/schedules',
      },
    ],
  },

  {
    group:
      'YARD',

    vi:
      'Bãi',

    items: [

      {
        key:
          'yard-map',

        label:
          'Yard Map',

        vi:
          'Sơ Đồ Bãi',

        path:
          '/yard',
      },

      {
        key:
          'truck-queue',

        label:
          'Truck Queue',

        vi:
          'Hàng Đợi Xe',

        path:
          '/yard/trucks',
      },

      {
        key:
          'crane-queue',

        label:
          'Crane Queue',

        vi:
          'Hàng Đợi Cẩu',

        path:
          '/yard/cranes',
      },

      {
        key:
          'gps-runtime',

        label:
          'GPS Runtime',

        vi:
          'GPS Runtime',

        path:
          '/yard/gps',
      },
    ],
  },

  {
    group:
      'QC',

    vi:
      'Chất Lượng',

    items: [

      {
        key:
          'incoming-qc',

        label:
          'Incoming QC',

        vi:
          'QC Đầu Vào',

        path:
          '/qc/incoming',
      },

      {
        key:
          'welding-qc',

        label:
          'Welding QC',

        vi:
          'QC Hàn',

        path:
          '/qc/welding',
      },

      {
        key:
          'painting-qc',

        label:
          'Painting QC',

        vi:
          'QC Sơn',

        path:
          '/qc/painting',
      },

      {
        key:
          'ncr',

        label:
          'NCR',

        vi:
          'NCR',

        path:
          '/qc/ncr',
      },
    ],
  },

  {
    group:
      'ADMIN',

    vi:
      'Quản Trị',

    items: [

      {
        key:
          'users',

        label:
          'Users',

        vi:
          'Người Dùng',

        path:
          '/admin/users',
      },

      {
        key:
          'roles',

        label:
          'Roles & Permissions',

        vi:
          'Phân Quyền',

        path:
          '/admin/roles',
      },

      {
        key:
          'audit',

        label:
          'Audit Logs',

        vi:
          'Nhật Ký Hệ Thống',

        path:
          '/admin/audit',
      },

      {
        key:
          'settings',

        label:
          'System Settings',

        vi:
          'Cấu Hình Hệ Thống',

        path:
          '/admin/settings',
      },
    ],
  },
]

navigation.push({

  group: 'ENTERPRISE',

  vi: 'Doanh Nghiệp',

  items: [

    {
      key: 'projects',
      label: 'Projects',
      vi: 'Công Trình',
      path: '/projects',
    },

    {
      key: 'suppliers',
      label: 'Suppliers',
      vi: 'Nhà Cung Cấp',
      path: '/suppliers',
    },

    {
      key: 'purchasing',
      label: 'Purchasing',
      vi: 'Mua Hàng',
      path: '/purchasing',
    },

    {
      key: 'maintenance',
      label: 'Maintenance',
      vi: 'Bảo Trì',
      path: '/maintenance',
    },

    {
      key: 'equipment',
      label: 'Equipment',
      vi: 'Thiết Bị',
      path: '/equipment',
    },

    {
      key: 'documents',
      label: 'Documents',
      vi: 'Tài Liệu',
      path: '/documents',
    },

    {
      key: 'iot',
      label: 'IoT Runtime',
      vi: 'IoT Runtime',
      path: '/iot',
    },

    {
      key: 'digital-twin',
      label: 'Digital Twin',
      vi: 'Digital Twin',
      path: '/digital-twin',
    },
  ],
})
