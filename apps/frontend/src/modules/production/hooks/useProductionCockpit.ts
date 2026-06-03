import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productionApi, type ProductionBomInput } from '../api/production.api'

export const useProductionOrders = () =>
  useQuery({ queryKey: ['production', 'orders'], queryFn: productionApi.orders, refetchInterval: 5000 })

export const useProductionOrder = (id?: string) =>
  useQuery({ queryKey: ['production', 'order', id], queryFn: () => productionApi.order(id!), enabled: Boolean(id) })

export const useProductionBoms = () =>
  useQuery({ queryKey: ['production', 'boms'], queryFn: productionApi.boms })

export const useProductionIssues = () =>
  useQuery({ queryKey: ['production', 'issues'], queryFn: productionApi.issues })

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

export const useCompleteProductionStage = () =>
  useProductionMutation((id: string) => productionApi.completeStage(id))

export const useStageProductionToYard = () =>
  useProductionMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    productionApi.stageToYard(id, payload))
