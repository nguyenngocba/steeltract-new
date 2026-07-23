import { fireEvent, render, screen } from '@testing-library/react'
import type { UseQueryResult } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoricalDashboardPage } from './HistoricalDashboardPage'
import type {
  HistoricalDashboardMonthlyRollup,
  HistoricalDashboardSnapshot,
  HistoricalInventoryMonthlyRollup,
  HistoricalInventorySnapshot,
  HistoricalPaginated,
  HistoricalSnapshotJob,
} from '../api/historical-dashboard.api'

const hooks = vi.hoisted(() => ({
  useHistoricalDashboardSnapshot: vi.fn(),
  useLatestHistoricalDashboardSnapshot: vi.fn(),
  useHistoricalDashboardMonthly: vi.fn(),
  useHistoricalInventory: vi.fn(),
  useHistoricalInventoryMonthly: vi.fn(),
  useHistoricalSnapshotJobs: vi.fn(),
}))

vi.mock('../hooks/useHistoricalDashboard', () => hooks)

function queryResult<T>(
  data: T,
  overrides: Partial<UseQueryResult<T, Error>> = {},
): UseQueryResult<T, Error> {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as UseQueryResult<T, Error>
}

const dashboardSnapshot: HistoricalDashboardSnapshot = {
  id: 'snapshot-1',
  snapshotDate: '2026-07-23',
  module: 'ERP',
  scopeKey: 'GLOBAL',
  authoritative: true,
  stale: false,
  kpis: {
    inventoryValue: 158_260_000_000,
    totalStock: 77_879,
    components: 245,
    projects: 12,
    suppliers: 30,
  },
  charts: {
    byStatus: [
      { label: 'Đúng tiến độ', value: 8 },
      { label: 'Cần chú ý', value: 2 },
    ],
  },
  tables: {},
  warnings: [],
  metadata: {},
  rowCount: 10,
  warningCount: 0,
  generatedAt: '2026-07-23T01:00:00.000Z',
}

const monthlyPage: HistoricalPaginated<HistoricalDashboardMonthlyRollup> = {
  data: [
    {
      id: 'monthly-1',
      monthStart: '2026-07-01',
      module: 'ERP',
      scopeKey: 'GLOBAL',
      kpiOpen: { inventoryValue: 100 },
      kpiClose: { inventoryValue: 120 },
      kpiMin: {},
      kpiMax: {},
      kpiAvg: {},
      charts: {},
      warnings: [],
      daysCovered: 23,
      authoritative: true,
      generatedAt: '2026-07-23T01:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
}

const inventoryPage: HistoricalPaginated<HistoricalInventorySnapshot> = {
  data: [
    {
      id: 'inventory-1',
      snapshotDate: '2026-07-23',
      materialId: 'mat-1',
      materialCode: 'H300',
      materialName: 'Thép H300',
      materialTypeName: 'Thép hình',
      warehouseId: 'warehouse-1',
      warehouseCode: 'KHO-HCM',
      unit: 'kg',
      quantityOnHand: '120',
      availableQuantity: '100',
      reservedQuantity: '20',
      minimumStock: '30',
      inventoryValue: '250000000',
      stockStatus: 'NORMAL',
      locationBucketKey: 'warehouse-1',
      metadata: {},
      generatedAt: '2026-07-23T01:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
}

const inventoryMonthlyPage: HistoricalPaginated<HistoricalInventoryMonthlyRollup> = {
  data: [
    {
      id: 'inventory-monthly-1',
      monthStart: '2026-07-01',
      materialId: 'mat-1',
      materialCode: 'H300',
      materialName: 'Thép H300',
      warehouseId: 'warehouse-1',
      warehouseCode: 'KHO-HCM',
      warehouseKey: 'warehouse-1',
      openingQuantity: '90',
      closingQuantity: '120',
      minQuantity: '80',
      maxQuantity: '130',
      avgQuantity: '105',
      openingValue: '200000000',
      closingValue: '250000000',
      minValue: '180000000',
      maxValue: '260000000',
      avgValue: '230000000',
      lowStockDays: 0,
      outStockDays: 0,
      negativeStockDays: 0,
      daysCovered: 23,
      generatedAt: '2026-07-23T01:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 24, total: 1, totalPages: 1 },
}

const jobsPage: HistoricalPaginated<HistoricalSnapshotJob> = {
  data: [
    {
      id: 'job-1',
      jobType: 'dashboard_daily',
      module: 'ERP',
      scopeKey: 'GLOBAL',
      snapshotDate: '2026-07-23',
      status: 'COMPLETED',
      priority: 1,
      attempt: 1,
      maxAttempts: 3,
      rowsRead: '10',
      rowsWritten: '1',
      createdAt: '2026-07-23T01:00:00.000Z',
      updatedAt: '2026-07-23T01:01:00.000Z',
      completedAt: '2026-07-23T01:01:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
}

describe('HistoricalDashboardPage', () => {
  beforeEach(() => {
    hooks.useHistoricalDashboardSnapshot.mockReturnValue(
      queryResult(dashboardSnapshot),
    )
    hooks.useLatestHistoricalDashboardSnapshot.mockReturnValue(
      queryResult(dashboardSnapshot),
    )
    hooks.useHistoricalDashboardMonthly.mockReturnValue(queryResult(monthlyPage))
    hooks.useHistoricalInventory.mockReturnValue(queryResult(inventoryPage))
    hooks.useHistoricalInventoryMonthly.mockReturnValue(
      queryResult(inventoryMonthlyPage),
    )
    hooks.useHistoricalSnapshotJobs.mockReturnValue(queryResult(jobsPage))
  })

  it('renders the historical overview cockpit from snapshot data', () => {
    renderHistoricalDashboard()

    expect(
      screen.getByRole('heading', { name: /Lịch sử điều hành doanh nghiệp/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByText('Daily Trend')).toBeInTheDocument()
    expect(screen.getByText('Top Inventory')).toBeInTheDocument()
    expect(screen.getAllByText('Thép H300').length).toBeGreaterThan(0)
  })

  it('renders Snapshot Jobs as a separate operational tab', () => {
    renderHistoricalDashboard()

    fireEvent.click(screen.getByRole('button', { name: 'Snapshot Jobs' }))

    expect(screen.getAllByText('Snapshot Jobs').length).toBeGreaterThan(0)
    expect(screen.getByText('dashboard_daily')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })
})

function renderHistoricalDashboard() {
  return render(
    <MemoryRouter>
      <HistoricalDashboardPage />
    </MemoryRouter>,
  )
}
