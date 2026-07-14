import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productionApi, type ProductionBomInput, type ProductionCockpitParams, type ProductionConsumptionParams, type ProductionMaterialIssue, type ProductionMaterialLedgerParams } from '../api/production.api'

export const useProductionOrders = (enabled = true) =>
  useQuery({ queryKey: ['production', 'orders'], queryFn: productionApi.orders, refetchInterval: 5000, enabled })

export const useProductionCockpitReadModel = (params: ProductionCockpitParams, enabled = true) =>
  useQuery({
    queryKey: ['production', 'read-model', 'cockpit', params],
    queryFn: () => productionApi.cockpit(params),
    placeholderData: (previous) => previous,
    enabled,
  })

export const useProductionOrder = (id?: string) =>
  useQuery({ queryKey: ['production', 'order', id], queryFn: () => productionApi.order(id!), enabled: Boolean(id) })

export const useProductionBoms = (enabled = true) =>
  useQuery({ queryKey: ['production', 'boms'], queryFn: productionApi.boms, enabled })

export const useProductionIssues = (enabled = true) =>
  useQuery({ queryKey: ['production', 'issues'], queryFn: productionApi.issues, enabled })

export const useProductionConsumptions = (params?: ProductionConsumptionParams, enabled = true) =>
  useQuery({
    queryKey: ['production', 'consumptions', params],
    queryFn: () => productionApi.consumptions(params),
    enabled,
  })

export const useProductionOrderConsumptions = (id?: string) =>
  useQuery({
    queryKey: ['production', 'order-consumptions', id],
    queryFn: () => productionApi.consumptionsByOrder(id!),
    enabled: Boolean(id),
  })

export const useProductionReservations = (productionOrderId?: string, enabled = true) =>
  useQuery({
    queryKey: ['production', 'reservations', productionOrderId],
    queryFn: () => productionApi.reservations(productionOrderId),
    enabled,
  })

export const useProductionMaterialLedger = (params?: ProductionMaterialLedgerParams, enabled = true) =>
  useQuery({
    queryKey: ['production', 'material-ledger', params],
    queryFn: () => productionApi.materialLedger(params),
    enabled,
  })

export const useReservationPreview = (id?: string) =>
  useQuery({
    queryKey: ['production', 'reservation-preview', id],
    queryFn: () => productionApi.reservationPreview(id!),
    enabled: Boolean(id),
  })

export const useProductionLogs = (enabled = true) =>
  useQuery({ queryKey: ['production', 'logs'], queryFn: productionApi.logs, enabled })

export const useProductionMachines = () =>
  useQuery({ queryKey: ['production', 'machines'], queryFn: productionApi.machines, refetchInterval: 5000 })

export const useMaterialRequirements = (id?: string) =>
  useQuery({
    queryKey: ['production', 'requirements', id],
    queryFn: () => productionApi.requirements(id!),
    enabled: Boolean(id),
  })

export const useProductionComponents = (enabled = true) =>
  useQuery({ queryKey: ['production', 'components'], queryFn: productionApi.components, enabled })

export const useYardSlots = () =>
  useQuery({ queryKey: ['yard', 'slots'], queryFn: productionApi.yardSlots, refetchInterval: 5000 })

function useProductionMutation<TArgs>(mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] })
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['yard'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export const useCreateProductionOrder = () =>
  useProductionMutation((payload: Record<string, unknown>) => productionApi.createOrder(payload))

export const useCreateProductionBom = () =>
  useProductionMutation((payload: ProductionBomInput) => productionApi.createBom(payload))

export const useCloneProductionBom = () =>
  useProductionMutation((id: string) => productionApi.cloneBom(id))

export const useArchiveProductionBom = () =>
  useProductionMutation((id: string) => productionApi.archiveBom(id))

export const useStartProductionOrder = () =>
  useProductionMutation((id: string) => productionApi.startOrder(id))

export const useCreateProductionReservation = () =>
  useProductionMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    productionApi.createReservation(id, payload))

export const useReserveProductionReservation = () =>
  useProductionMutation(({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
    productionApi.reserveReservation(id, payload))

export const useIssueProductionReservation = () =>
  useProductionMutation(({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
    productionApi.issueReservation(id, payload))

export const useReleaseProductionReservation = () =>
  useProductionMutation(({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
    productionApi.releaseReservation(id, payload))

export const useExpireProductionReservation = () =>
  useProductionMutation(({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
    productionApi.expireReservation(id, payload))

export const useReturnProductionMaterialIssue = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
      productionApi.returnMaterialIssue(id, payload),
    onSuccess: (updatedIssue) => {
      queryClient.setQueryData<ProductionMaterialIssue[]>(['production', 'issues'], (current) =>
        current?.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue)) ?? current,
      )
      queryClient.invalidateQueries({ queryKey: ['production'] })
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['yard'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export const useConsumeProductionMaterial = () =>
  useProductionMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    productionApi.consumeMaterial(id, payload))

export const useCompleteProductionStage = () =>
  useProductionMutation((id: string) => productionApi.completeStage(id))

export const useStageProductionToYard = () =>
  useProductionMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    productionApi.stageToYard(id, payload))

export const useCreateComponentFromProductionOrder = () =>
  useProductionMutation((id: string) => productionApi.createComponentFromOrder(id))
