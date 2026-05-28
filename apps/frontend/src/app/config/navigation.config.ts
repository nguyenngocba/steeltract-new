export const navigation = [

  {
    group: 'CORE',

    items: [

      {
        key: 'dashboard',
        label: 'Dashboard',
        vi: 'Tổng Quan',
        path: '/',
      },
    ],
  },

  {
    group: 'INVENTORY',

    items: [

      {
        key: 'inventory',
        label: 'Inventory',
        vi: 'Kho Vật Tư',
        path: '/inventory',
      },

      {
        key: 'materials',
        label: 'Materials',
        vi: 'Vật Tư',
        path: '/inventory/materials',
      },

      {
        key: 'transactions',
        label: 'Transactions',
        vi: 'Lịch Sử',
        path: '/inventory/transactions',
      },
    ],
  },

  {
    group: 'PROJECTS',

    items: [

      {
        key: 'projects',
        label: 'Projects',
        vi: 'Công Trình',
        path: '/projects',
      },
    ],
  },

  {
    group: 'SUPPLIERS',

    items: [

      {
        key: 'suppliers',
        label: 'Suppliers',
        vi: 'Nhà Cung Cấp',
        path: '/suppliers',
      },
    ],
  },

  {
    group: 'COMPONENTS',

    items: [

      {
        key: 'components',
        label: 'Components',
        vi: 'Cấu Kiện',
        path: '/components',
      },
    ],
  },

  {
    group: 'YARD',

    items: [

      {
        key: 'yard',
        label: 'Yard Runtime',
        vi: 'Bãi Tập Kết',
        path: '/yard',
      },
    ],
  },

  {
    group: 'MASTER DATA',

    items: [

      {
        key: 'master-data',
        label: 'Master Data',
        vi: 'Danh Mục',
        path: '/master-data',
      },

      {
        key: 'units',
        label: 'Units',
        vi: 'Đơn Vị',
        path: '/master-data/units',
      },
    ],
  },

  {
    group: 'SYSTEM',

    items: [

      {
        key: 'settings',
        label: 'Settings',
        vi: 'Cài Đặt',
        path: '/settings',
      },
    ],
  },
]
