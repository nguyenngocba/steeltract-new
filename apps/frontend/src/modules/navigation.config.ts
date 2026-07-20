export const navigation = [

  {
    group: 'DASHBOARD',
    vi: 'Tổng quan',

    items: [

      {
        key: 'dashboard',
        label: 'Executive Dashboard',
        vi: 'Dashboard Điều Hành',
        path: '/',
      },

      {
        key: 'command-center',
        label: 'Command Center',
        vi: 'Trung Tâm Điều Hành',
        path: '/command-center',
      },
    ],
  },

  {
    group: 'INVENTORY',
    vi: 'Kho Vật Tư',

    items: [
      {
        key: 'inventory',
        label: 'Inventory',
        vi: 'Quản Lý Kho',
        path: '/inventory',
      },
    ],
  },

  {
    group: 'COMPONENTS',
    vi: 'Cấu Kiện',

    items: [
      {
        key: 'components',
        label: 'Components',
        vi: 'Quản lý cấu kiện',
        path: '/components',
      },
    ],
  },

  {
    group: 'PRODUCTION',
    vi: 'Sản Xuất',

    items: [
      {
        key: 'production',
        label: 'Production',
        vi: 'Quản lý sản xuất',
        path: '/production/orders',
      },
    ],
  },

  {
    group: 'YARD',
    vi: 'Bãi',

    items: [
      {
        key: 'yard',
        label: 'Yard',
        vi: 'Quản lý bãi',
        path: '/yard',
      },
    ],
  },

  {
    group: 'QC',
    vi: 'Chất Lượng',

    items: [
      {
        key: 'qc',
        label: 'QC',
        vi: 'Quản lý chất lượng',
        path: '/qc/incoming',
      },
    ],
  },

  {
    group: 'LOGISTICS',
    vi: 'Logistics',

    items: [
      {
        key: 'logistics',
        label: 'Logistics',
        vi: 'Điều phối vận tải',
        path: '/logistics',
      },
    ],
  },


  {
    group: 'DIGITAL TWIN',
    vi: 'Digital Twin',

    items: [
      {
        key: 'digital-twin',
        label: 'Digital Twin',
        vi: 'Bản sao vận hành',
        path: '/digital-twin',
      },
    ],
  },

  {
    group: 'ADMIN',
    vi: 'Quản Trị',

    items: [
      {
        key: 'admin',
        label: 'Administration',
        vi: 'Quản Trị Hệ Thống',
        path: '/admin/users',
      },
    ],
  },
]
