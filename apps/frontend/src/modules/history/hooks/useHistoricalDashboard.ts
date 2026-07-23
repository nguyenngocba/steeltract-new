import { useQuery } from '@tanstack/react-query'

import {
  getHistoricalDashboardMonthly,
  getHistoricalDashboardSnapshot,
  getHistoricalInventory,
  getHistoricalInventoryMonthly,
  getHistoricalSnapshotJobs,
  getLatestHistoricalDashboardSnapshot,
} from '../api/historical-dashboard.api'

import type {
  DashboardSnapshotParams,
  InventoryMonthlyParams,
  InventoryParams,
  JobsParams,
  LatestDashboardSnapshotParams,
  MonthlyParams,
} from '../api/historical-dashboard.api'

type HistoricalQueryOptions = {
  enabled?: boolean
}

export const historicalDashboardKeys = {
  all: ['historical-dashboard'] as const,
  dashboard: (params: DashboardSnapshotParams) =>
    [...historicalDashboardKeys.all, 'dashboard', params] as const,
  latest: (params: LatestDashboardSnapshotParams) =>
    [...historicalDashboardKeys.all, 'latest', params] as const,
  monthly: (params: MonthlyParams) =>
    [...historicalDashboardKeys.all, 'monthly', params] as const,
  inventory: (params: InventoryParams) =>
    [...historicalDashboardKeys.all, 'inventory', params] as const,
  inventoryMonthly: (params: InventoryMonthlyParams) =>
    [...historicalDashboardKeys.all, 'inventory-monthly', params] as const,
  jobs: (params: JobsParams) =>
    [...historicalDashboardKeys.all, 'jobs', params] as const,
}

export function useHistoricalDashboardSnapshot(
  params: DashboardSnapshotParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.dashboard(params),
    queryFn: () => getHistoricalDashboardSnapshot(params),
    enabled: Boolean(params.date) && (options.enabled ?? true),
    retry: false,
    staleTime: 60_000,
  })
}

export function useLatestHistoricalDashboardSnapshot(
  params: LatestDashboardSnapshotParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.latest(params),
    queryFn: () => getLatestHistoricalDashboardSnapshot(params),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 60_000,
  })
}

export function useHistoricalDashboardMonthly(
  params: MonthlyParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.monthly(params),
    queryFn: () => getHistoricalDashboardMonthly(params),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
    retry: false,
    staleTime: 60_000,
  })
}

export function useHistoricalInventory(
  params: InventoryParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.inventory(params),
    queryFn: () => getHistoricalInventory(params),
    enabled: Boolean(params.date) && (options.enabled ?? true),
    placeholderData: (previous) => previous,
    retry: false,
    staleTime: 60_000,
  })
}

export function useHistoricalInventoryMonthly(
  params: InventoryMonthlyParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.inventoryMonthly(params),
    queryFn: () => getHistoricalInventoryMonthly(params),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
    retry: false,
    staleTime: 60_000,
  })
}

export function useHistoricalSnapshotJobs(
  params: JobsParams,
  options: HistoricalQueryOptions = {},
) {
  return useQuery({
    queryKey: historicalDashboardKeys.jobs(params),
    queryFn: () => getHistoricalSnapshotJobs(params),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
    retry: false,
    staleTime: 30_000,
  })
}
