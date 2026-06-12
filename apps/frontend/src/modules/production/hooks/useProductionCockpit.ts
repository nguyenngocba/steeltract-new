import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productionApi, type ProductionBomInput, type ProductionConsumptionParams, type ProductionMaterialLedgerParams } from '../api/production.api'

export const useProductionOrders = () =>
  useQuery({ queryKey: ['production', 'orders'], queryFn: productionApi.orders, refetchInterval: 5000 })

export const useProductionOrder = (id?: string) =>
  useQuery({ queryKey: ['production', 'order', id], queryFn: () => productionApi.order(id!), enabled: Boolean(id) })

export const useProductionBoms = () =>
  useQuery({ queryKey: ['production', 'boms'], queryFn: productionApi.boms })

export const useProductionIssues = () =>
  useQuery({ queryKey: ['production', 'issues'], queryFn: productionApi.issues })

export const useProductionConsumptions = (params?: ProductionConsumptionParams) =>
  useQuery({
    queryKey: ['production', 'consumptions', params],
    queryFn: () => productionApi.consumptions(params),
  })

export const useProductionOrderConsumptions = (id?: string) =>
  useQuery({
    queryKey: ['production', 'order-consumptions', id],
    queryFn: () => productionApi.consumptionsByOrder(id!),
    enabled: Boolean(id),
  })

export const useProductionReservations = (productionOrderId?: string) =>
  useQuery({
    queryKey: ['production', 'reservations', productionOrderId],
    queryFn: () => productionApi.reservations(productionOrderId),
  })

export const useProductionMaterialLedger = (params?: ProductionMaterialLedgerParams) =>
  useQuery({
    queryKey: ['production', 'material-ledger', params],
    queryFn: () => productionApi.materialLedger(params),
  })

export const useReservationPreview = (id?: string) =>
  useQuery({
    queryKey: ['production', 'reservation-preview', id],
    queryFn: () => productionApi.reservationPreview(id!),
    enabled: Boolean(id),
  })

export const useProductionLogs = () =>
  useQuery({ queryKey: ['production', 'logs'], queryFn: productionApi.logs })

export const useProductionMachines = () =>
  useQuery({ queryKey: ['production', 'machines'], queryFn: productionApi.machines, refetchInterval: 5000 })

export const useMaterialRequirements = (id?: string) =>
  useQuery({
    queryKey: ['production', 'requirements', id],
    queryFn: () => productionApi.requirements(id!),
    enabled: Boolean(id),
  })

export const useProductionComponents = () =>
  useQuery({ queryKey: ['production', 'components'], queryFn: productionApi.components })

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

export const useReturnProductionMaterialIssue = () =>
  useProductionMutation(({ id, payload = {} }: { id: string; payload?: Record<string, unknown> }) =>
    productionApi.returnMaterialIssue(id, payload))

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
