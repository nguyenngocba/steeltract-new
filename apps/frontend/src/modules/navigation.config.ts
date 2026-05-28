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
        label: 'Inventory Runtime',
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
        label: 'Components Runtime',
        vi: 'Runtime Cấu Kiện',
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
        label: 'Production Runtime',
        vi: 'Runtime Sản Xuất',
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
        label: 'Yard Runtime',
        vi: 'Runtime Bãi',
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
        label: 'QC Runtime',
        vi: 'Runtime QC',
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
        label: 'Logistics Runtime',
        vi: 'Runtime Logistics',
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
        label: 'Digital Twin Runtime',
        vi: 'Digital Twin Runtime',
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
