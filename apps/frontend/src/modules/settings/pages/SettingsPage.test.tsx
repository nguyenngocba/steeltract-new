import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsPage } from './SettingsPage'

const apiMocks = vi.hoisted(() => ({
  systemApi: {
    overview: vi.fn(),
    workflow: vi.fn(),
    settingsCatalog: vi.fn(),
  },
  getMasterDataRecords: vi.fn(),
  createMasterDataRecord: vi.fn(),
  updateMasterDataRecord: vi.fn(),
  deactivateMasterDataRecord: vi.fn(),
  getUnitsOfMeasure: vi.fn(),
  createUnitOfMeasure: vi.fn(),
  updateUnitOfMeasure: vi.fn(),
  deactivateUnitOfMeasure: vi.fn(),
  createInventoryItem: vi.fn(),
  updateInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  useInventoryItems: vi.fn(),
}))

vi.mock('@/modules/system/api/system.api', () => ({
  systemApi: apiMocks.systemApi,
}))

vi.mock('@/modules/master-data/api/master-data.api', () => ({
  getMasterDataRecords: apiMocks.getMasterDataRecords,
  createMasterDataRecord: apiMocks.createMasterDataRecord,
  updateMasterDataRecord: apiMocks.updateMasterDataRecord,
  deactivateMasterDataRecord: apiMocks.deactivateMasterDataRecord,
}))

vi.mock('@/modules/master-data/uom/api/uom.api', () => ({
  getUnitsOfMeasure: apiMocks.getUnitsOfMeasure,
  createUnitOfMeasure: apiMocks.createUnitOfMeasure,
  updateUnitOfMeasure: apiMocks.updateUnitOfMeasure,
  deactivateUnitOfMeasure: apiMocks.deactivateUnitOfMeasure,
}))

vi.mock('@/modules/inventory/api/inventory.api', () => ({
  createInventoryItem: apiMocks.createInventoryItem,
  updateInventoryItem: apiMocks.updateInventoryItem,
  deleteInventoryItem: apiMocks.deleteInventoryItem,
}))

vi.mock('@/modules/inventory/hooks/useInventoryItems', () => ({
  useInventoryItems: apiMocks.useInventoryItems,
}))

const category = {
  id: 'cat-1',
  code: 'CAT-1',
  name: 'Thép tấm',
  description: 'Danh mục thật',
  active: true,
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
  _count: { items: 1, materialTypes: 1 },
}

const materialType = {
  id: 'type-1',
  code: 'PLATE',
  name: 'Thép tấm',
  description: 'Nhóm kỹ thuật thật',
  active: true,
  categoryId: 'cat-1',
  category,
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
  _count: { inventoryItems: 1 },
}

const materialUsageType = {
  id: 'usage-primary',
  code: 'PRIMARY',
  name: 'Vật tư chính',
  description: 'Loại vật tư thật',
  active: true,
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
  _count: { inventoryItems: 1 },
}

const unit = {
  id: 'unit-1',
  code: 'KG',
  name: 'Kilogram',
  symbol: 'kg',
  category: 'weight',
  precision: 2,
  active: true,
  baseUnitId: null,
  conversionFactor: null,
  createdAt: '2026-07-29T00:00:00.000Z',
  updatedAt: '2026-07-29T00:00:00.000Z',
}

const material = {
  materialId: 'mat-1',
  id: 'mat-1',
  materialCode: 'MAT-1',
  materialName: 'Thép tấm 10mm',
  categoryId: 'cat-1',
  category: 'Thép tấm',
  materialTypeId: 'type-1',
  materialType: 'Thép tấm',
  materialUsageTypeId: 'usage-primary',
  materialUsageTypeName: 'Vật tư chính',
  materialUsageType: 'PRIMARY',
  unitId: 'unit-1',
  unit: 'KG',
  currentStock: 0,
  bomUsageCount: 0,
  updatedAt: '2026-07-29T00:00:00.000Z',
}

function mockBaseApis() {
  apiMocks.systemApi.overview.mockResolvedValue({
    company: {},
    system: {},
    stats: { roles: 1, permissions: 2, activityTotal: 3 },
  })
  apiMocks.systemApi.workflow.mockResolvedValue({ steps: [] })
  apiMocks.systemApi.settingsCatalog.mockResolvedValue({
    safeRuntime: {},
    categories: [
      {
        key: 'material-categories',
        label: 'Danh mục vật tư',
        status: 'REAL_EDITABLE',
        source: '/master-data/material-categories',
        editable: true,
        count: 1,
      },
      {
        key: 'material-usage-types',
        label: 'Loại vật tư',
        status: 'REAL_EDITABLE',
        source: '/master-data/material-usage-types',
        editable: true,
        count: 1,
      },
      {
        key: 'materials',
        label: 'Material Master',
        status: 'REAL_EDITABLE',
        source: '/inventory/items',
        editable: true,
        count: 1,
      },
      {
        key: 'material-types',
        label: 'Quy cách / Nhóm kỹ thuật',
        status: 'REAL_EDITABLE',
        source: '/master-data/material-types',
        editable: true,
        count: 1,
      },
      {
        key: 'uom',
        label: 'Đơn vị & Quy đổi',
        status: 'REAL_EDITABLE',
        source: '/master-data/uom',
        editable: true,
        count: 1,
      },
    ],
  })
  apiMocks.getMasterDataRecords.mockImplementation(async (domain: string) =>
    domain === 'material-categories'
      ? [category]
      : domain === 'material-usage-types'
        ? [materialUsageType]
        : [materialType],
  )
  apiMocks.getUnitsOfMeasure.mockResolvedValue([unit])
  apiMocks.useInventoryItems.mockReturnValue({ data: [material], isLoading: false })
}

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Settings master data CRUD workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBaseApis()
  })

  it('opens the interactive CRUD workspace from the master-data capability row', async () => {
    apiMocks.createMasterDataRecord.mockResolvedValue({
      ...category,
      id: 'cat-2',
      code: 'CAT-2',
      name: 'Thép hộp',
    })

    renderSettings()

    fireEvent.click(await screen.findByText('Danh mục vật tư'))

    expect(await screen.findByText('Master Data · Danh mục vật tư')).toBeInTheDocument()
    expect(await screen.findByText('CAT-1')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Thêm danh mục'))
    fireEvent.change(screen.getByLabelText('Mã *'), {
      target: { value: 'CAT-2' },
    })
    fireEvent.change(screen.getByLabelText('Tên *'), {
      target: { value: 'Thép hộp' },
    })
    fireEvent.click(screen.getByText('Tạo'))

    await waitFor(() => {
      expect(apiMocks.createMasterDataRecord).toHaveBeenCalledWith({
        domain: 'material-categories',
        payload: expect.objectContaining({
          code: 'CAT-2',
          name: 'Thép hộp',
        }),
      })
    })
  })

  it('opens all four master-data workspaces with their canonical real-data rows', async () => {
    renderSettings()

    fireEvent.click(await screen.findByText('Danh mục vật tư'))
    expect(await screen.findByText('CAT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Đóng modal'))

    fireEvent.click(await screen.findByText('Loại vật tư'))
    expect(await screen.findByText('PRIMARY')).toBeInTheDocument()
    expect(screen.getByText('Vật tư chính')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Đóng modal'))

    fireEvent.click(await screen.findByText('Material Master'))
    expect(await screen.findByText('MAT-1')).toBeInTheDocument()
    expect(screen.getByText('Vật tư chính')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Đóng modal'))

    fireEvent.click(await screen.findByText('Quy cách / Nhóm kỹ thuật'))
    expect(await screen.findByText('PLATE')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Đóng modal'))

    fireEvent.click(await screen.findByText('Đơn vị & Quy đổi'))
    expect(await screen.findByText('KG')).toBeInTheDocument()
    expect(screen.getByText('Kilogram')).toBeInTheDocument()
  })
})
