import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import {
  createComponentDefinitionRequirement,
  createProductionOrder,
  deleteComponent,
  getComponentCostingBreakdown,
  getComponentCosting,
  getComponents,
  getComponentsHistory,
  getComponentsOverview,
  getComponentsDashboard,
  getComponentsWorkspace,
  getFinishedGoodsInstances,
  recalculateComponentCosting,
} from "../../services/api/components.api";
import type {
  ComponentsReadModelParams,
  FinishedGoodsParams,
} from "../../api/contracts/components.contract";
import { productionApi } from "../../../production/api/production.api";

export function useComponents(enabled = true) {
  return useQuery({
    queryKey: ["components"],
    queryFn: getComponents,
    refetchInterval: 5000,
    enabled,
  });
}

export function useComponentsWorkspace(params: ComponentsReadModelParams) {
  return useQuery({
    queryKey: ["components", "workspace", params],
    queryFn: () => getComponentsWorkspace(params),
    placeholderData: keepPreviousData,
  });
}

export function useComponentsOverview(params: ComponentsReadModelParams) {
  return useQuery({
    queryKey: ["components", "overview", params],
    queryFn: () => getComponentsOverview(params),
    placeholderData: keepPreviousData,
  });
}

export function useComponentsDashboard() {
  return useQuery({
    queryKey: ["components", "dashboard"],
    queryFn: getComponentsDashboard,
  });
}

export function useFinishedGoodsInstances(params: FinishedGoodsParams) {
  return useQuery({
    queryKey: ["components", "finished-goods", params],
    queryFn: () => getFinishedGoodsInstances(params),
    placeholderData: keepPreviousData,
  });
}

export function useComponentsHistory(params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}) {
  return useQuery({
    queryKey: ["components", "history", params],
    queryFn: () => getComponentsHistory(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComponentDefinitionRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["components", "workspace"],
      });
      queryClient.invalidateQueries({
        queryKey: ["components", "overview"],
      });
    },
  });
}

export function useDeleteComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["production", "components"],
      });
    },
  });
}

export function useComponentCosting(componentId?: string) {
  return useQuery({
    queryKey: ["components", "costing", componentId],
    queryFn: () => getComponentCosting(componentId!),
    enabled: Boolean(componentId),
  });
}

export function useComponentCostingBreakdown(componentId?: string) {
  return useQuery({
    queryKey: ["components", "costing-breakdown", componentId],
    queryFn: () => getComponentCostingBreakdown(componentId!),
    enabled: Boolean(componentId),
  });
}

export function useRecalculateComponentCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalculateComponentCosting,
    onSuccess: (_data, componentId) => {
      queryClient.invalidateQueries({
        queryKey: ["components"],
      });
      queryClient.invalidateQueries({
        queryKey: ["components", "costing", componentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["components", "costing-breakdown", componentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
}

export function useProductionOrders(enabled = true) {
  return useQuery({
    queryKey: ["component-production-orders"],
    queryFn: () => productionApi.orders(),
    refetchInterval: 5000,
    enabled,
  });
}

export function useComponentsProductionWorkspace(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["components", "production-workspace", params],
    queryFn: () =>
      productionApi.cockpit({
        scope: "all",
        sortBy: "updatedAt",
        sortOrder: "desc",
        ...params,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  });
}

export function useComponentProductionBoms(enabled = true) {
  return useQuery({
    queryKey: ["production", "boms"],
    queryFn: productionApi.boms,
    enabled,
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductionOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["component-production-orders"],
      });
    },
  });
}
