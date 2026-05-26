export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () =>
      [...queryKeys.auth.all, 'current-user'] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    overview: () =>
      [...queryKeys.dashboard.all, 'overview'] as const,
  },

  analyticsEngine: {
    all: ['analytics-engine'] as const,
    overview: () =>
      [...queryKeys.analyticsEngine.all, 'overview'] as const,
    snapshots: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.analyticsEngine.all,
        'snapshots',
        filters ?? {},
      ] as const,
    metrics: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.analyticsEngine.all,
        'metrics',
        filters ?? {},
      ] as const,
    alerts: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.analyticsEngine.all,
        'alerts',
        filters ?? {},
      ] as const,
    predictions: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.analyticsEngine.all,
        'predictions',
        filters ?? {},
      ] as const,
  },

  inventory: {
    all: ['inventory'] as const,
    lists: () =>
      [...queryKeys.inventory.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.inventory.lists(),
        filters ?? {},
      ] as const,
    transactions: () =>
      [...queryKeys.inventory.all, 'transactions'] as const,
    returns: () =>
      [...queryKeys.inventory.all, 'returns'] as const,
  },

  masterData: {
    all: ['master-data'] as const,
    uom: () =>
      [...queryKeys.masterData.all, 'uom'] as const,
    uomList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.masterData.uom(),
        'list',
        filters ?? {},
      ] as const,
    dictionary: (domain: string) =>
      [...queryKeys.masterData.all, domain] as const,
    dictionaryList: (
      domain: string,
      filters?: Record<string, unknown>,
    ) =>
      [
        ...queryKeys.masterData.dictionary(domain),
        'list',
        filters ?? {},
      ] as const,
  },

  projects: {
    all: ['projects'] as const,
    lists: () =>
      [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.projects.lists(),
        filters ?? {},
      ] as const,
  },

  components: {
    all: ['components'] as const,
    lists: () =>
      [...queryKeys.components.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.components.lists(),
        filters ?? {},
      ] as const,
    detail: (id: string) =>
      [...queryKeys.components.all, 'detail', id] as const,
    timeline: (id: string) =>
      [...queryKeys.components.all, 'timeline', id] as const,
  },

  tasks: {
    all: ['tasks'] as const,
    lists: () =>
      [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.tasks.lists(),
        filters ?? {},
      ] as const,
  },

  workflow: {
    all: ['workflow'] as const,
    definitions: () =>
      [...queryKeys.workflow.all, 'definitions'] as const,
    definitionList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.workflow.definitions(),
        filters ?? {},
      ] as const,
    instances: () =>
      [...queryKeys.workflow.all, 'instances'] as const,
    instanceList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.workflow.instances(),
        filters ?? {},
      ] as const,
    instance: (id: string) =>
      [...queryKeys.workflow.instances(), id] as const,
  },

  attachments: {
    all: ['attachments'] as const,
    lists: () =>
      [...queryKeys.attachments.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.attachments.lists(),
        filters ?? {},
      ] as const,
    detail: (id: string) =>
      [...queryKeys.attachments.all, 'detail', id] as const,
  },

  jobs: {
    all: ['jobs'] as const,
    lists: () =>
      [...queryKeys.jobs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.jobs.lists(),
        filters ?? {},
      ] as const,
    detail: (id: string) =>
      [...queryKeys.jobs.all, 'detail', id] as const,
  },

  production: {
    all: ['production'] as const,
    orders: () =>
      [...queryKeys.production.all, 'orders'] as const,
    orderList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.production.orders(),
        filters ?? {},
      ] as const,
    order: (id: string) =>
      [...queryKeys.production.orders(), id] as const,
    metrics: () =>
      [...queryKeys.production.all, 'metrics'] as const,
    workCenters: () =>
      [...queryKeys.production.all, 'work-centers'] as const,
    machines: () =>
      [...queryKeys.production.all, 'machines'] as const,
    schedules: () =>
      [...queryKeys.production.all, 'schedules'] as const,
  },

  qc: {
    all: ['qc'] as const,
    checklists: () =>
      [...queryKeys.qc.all, 'checklists'] as const,
    checklistList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.qc.checklists(),
        filters ?? {},
      ] as const,
    inspections: () =>
      [...queryKeys.qc.all, 'inspections'] as const,
    inspectionList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.qc.inspections(),
        filters ?? {},
      ] as const,
    inspection: (id: string) =>
      [...queryKeys.qc.inspections(), id] as const,
    ncrs: () =>
      [...queryKeys.qc.all, 'ncr'] as const,
    ncrList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.qc.ncrs(),
        filters ?? {},
      ] as const,
    metrics: () =>
      [...queryKeys.qc.all, 'metrics'] as const,
  },

  yard: {
    all: ['yard'] as const,
    zones: () =>
      [...queryKeys.yard.all, 'zones'] as const,
    zoneList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.yard.zones(),
        filters ?? {},
      ] as const,
    zone: (id: string) =>
      [...queryKeys.yard.zones(), id] as const,
    slots: () =>
      [...queryKeys.yard.all, 'slots'] as const,
    slotList: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.yard.slots(),
        filters ?? {},
      ] as const,
    search: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.yard.all,
        'search',
        filters ?? {},
      ] as const,
    movements: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.yard.all,
        'movements',
        filters ?? {},
      ] as const,
    metrics: () =>
      [...queryKeys.yard.all, 'metrics'] as const,
    cranes: () =>
      [...queryKeys.yard.all, 'cranes'] as const,
    snapshots: (filters?: Record<string, unknown>) =>
      [
        ...queryKeys.yard.all,
        'snapshots',
        filters ?? {},
      ] as const,
  },
}
