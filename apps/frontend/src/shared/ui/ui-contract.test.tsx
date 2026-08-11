import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CockpitKpiCard, DataTablePagination } from '@/shared/ui/cockpit'
import { ModuleDetailDrawer } from '@/shared/ui/modules'

describe('SteelTrack shared UI contract', () => {
  it('uses the canonical compact KPI height', () => {
    const { container } = render(<CockpitKpiCard title="Tổng kho" value="12" />)

    expect(container.firstElementChild).toHaveClass('h-[92px]', 'rounded-lg')
  })

  it('renders right-side detail drawers at the canonical desktop width', () => {
    render(
      <ModuleDetailDrawer open title="Chi tiết" onClose={vi.fn()}>
        Nội dung
      </ModuleDetailDrawer>,
    )

    expect(screen.getByRole('dialog', { name: 'Chi tiết' })).toHaveClass('md:w-[64vw]')
  })

  it('keeps contextual drawer tabs in the fixed drawer chrome', () => {
    const onTabChange = vi.fn()
    render(
      <ModuleDetailDrawer
        open
        title="Chi tiết kiểm định"
        tabs={[{ id: 'overview', label: 'Tổng quan' }, { id: 'history', label: 'Lịch sử' }]}
        activeTab="overview"
        onTabChange={onTabChange}
        onClose={vi.fn()}
      >
        Nội dung
      </ModuleDetailDrawer>,
    )

    expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Lịch sử' }))
    expect(onTabChange).toHaveBeenCalledWith('history')
  })

  it('provides accessible first and last page navigation', () => {
    const onPageChange = vi.fn()
    render(
      <DataTablePagination
        page={2}
        pageSize={20}
        total={328}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trang đầu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trang cuối' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 17)
  })
})
