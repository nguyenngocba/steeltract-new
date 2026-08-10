import {
  ComponentInstanceState,
  ProductionOrderStatus,
  ProjectComponentRequirementStatus,
  ProjectStatus,
} from '@prisma/client';

type ProjectSource = {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
};

type ComponentSource = {
  id: string;
  code: string;
  name: string;
  componentType?: string | null;
  profile?: string | null;
};

type ProductionOrderSource = {
  id: string;
  orderNo: string;
  status: ProductionOrderStatus;
  quantity: number | string;
};

type ComponentInstanceSource = {
  id: string;
  instanceNo: string;
  state: ComponentInstanceState;
  productionOrderId?: string | null;
  producedAt?: Date | string | null;
  qcPassedAt?: Date | string | null;
  yardPlacements?: Array<{
    id: string;
    slotId: string;
    placedAt?: Date | string | null;
    removedAt?: Date | string | null;
  }>;
};

export type ProjectExecutionRequirementSource = {
  id: string;
  requirementNo: string;
  status: ProjectComponentRequirementStatus;
  requiredQuantity: number | string;
  producedQuantity?: number | string | null;
  acceptedQuantity?: number | string | null;
  installedQuantity?: number | string | null;
  requiredBy?: Date | string | null;
  component: ComponentSource;
  productionOrders: ProductionOrderSource[];
  componentInstances: ComponentInstanceSource[];
};

export type ProjectExecutionSource = {
  project: ProjectSource;
  requirements: ProjectExecutionRequirementSource[];
};

export type FinishedGoodsSummaryByRequirement = Map<string, number>;

export type ProjectExecutionStatus =
  | 'NO_REQUIREMENTS'
  | 'NO_PRODUCTION'
  | 'PLANNED'
  | 'IN_PRODUCTION'
  | 'WAITING_QC'
  | 'QC_BLOCKED'
  | 'FINISHED_PARTIAL'
  | 'FINISHED'
  | 'OVER_PRODUCED';

export type ProjectExecutionRequirementRow = {
  id: string;
  requirementNo: string;
  status: ProjectComponentRequirementStatus;
  requiredBy: Date | string | null;
  component: ComponentSource;
  quantities: {
    requiredQty: number;
    orderedQty: number;
    plannedQty: number;
    instanceCount: number;
    inProductionQty: number;
    completedQty: number;
    qcPassedQty: number;
    qcFailedQty: number;
    finishedGoodsQty: number;
    yardStagedQty: number;
  };
  productionOrders: Array<{
    id: string;
    orderNo: string;
    status: ProductionOrderStatus;
    quantity: number;
  }>;
  physicalInstances: Array<{
    id: string;
    instanceNo: string;
    state: ComponentInstanceState;
    productionOrderId: string | null;
    producedAt: Date | string | null;
    qcPassedAt: Date | string | null;
    yardPlacementId: string | null;
    yardSlotId: string | null;
    yardPlacedAt: Date | string | null;
  }>;
  executionStatus: ProjectExecutionStatus;
  progress: {
    denominator: number;
    productionCompletionPercent: number;
    finishedGoodsPercent: number;
  };
};

export type ProjectExecutionReadModel = {
  project: ProjectSource;
  summary: {
    requirementCount: number;
    requiredQty: number;
    orderedQty: number;
    plannedQty: number;
    instanceCount: number;
    inProductionQty: number;
    completedQty: number;
    qcPassedQty: number;
    qcFailedQty: number;
    finishedGoodsQty: number;
    yardStagedQty: number;
    productionCompletionPercent: number;
    finishedGoodsPercent: number;
    sourceOfTruth: string;
    downstream: {
      yardCanonical: boolean;
      dispatchCanonical: boolean;
    };
  };
  requirements: ProjectExecutionRequirementRow[];
};

const completedStates = new Set<ComponentInstanceState>([
  ComponentInstanceState.PRODUCED_WAITING_QC,
  ComponentInstanceState.QC_PASSED,
  ComponentInstanceState.QC_FAILED,
  ComponentInstanceState.REWORK,
  ComponentInstanceState.SCRAPPED,
  ComponentInstanceState.USE_AS_IS,
  ComponentInstanceState.IN_YARD,
  ComponentInstanceState.IN_TRANSIT,
  ComponentInstanceState.DELIVERED,
  ComponentInstanceState.INSTALLED,
]);

const activeProductionStates = new Set<ComponentInstanceState>([
  ComponentInstanceState.IN_PRODUCTION,
]);

export function buildProjectExecutionReadModel(
  source: ProjectExecutionSource,
  finishedGoodsByRequirement: FinishedGoodsSummaryByRequirement = new Map(),
): ProjectExecutionReadModel {
  const requirements = source.requirements.map((requirement) => {
    const activeOrders = requirement.productionOrders.filter(
      (order) => order.status !== ProductionOrderStatus.CANCELLED,
    );
    const orderedQty = activeOrders.reduce(
      (sum, order) => sum + numeric(order.quantity),
      0,
    );
    const instanceCount = requirement.componentInstances.length;
    const inProductionQty = requirement.componentInstances.filter((instance) =>
      activeProductionStates.has(instance.state),
    ).length;
    const completedQty = requirement.componentInstances.filter((instance) =>
      completedStates.has(instance.state),
    ).length;
    const qcPassedQty = requirement.componentInstances.filter(
      (instance) => instance.state === ComponentInstanceState.QC_PASSED,
    ).length;
    const qcFailedQty = requirement.componentInstances.filter(
      (instance) => instance.state === ComponentInstanceState.QC_FAILED,
    ).length;
    const finishedGoodsQty =
      finishedGoodsByRequirement.get(requirement.id) ?? 0;
    const yardStagedQty = requirement.componentInstances.filter((instance) =>
      instance.yardPlacements?.some((placement) => !placement.removedAt),
    ).length;
    const requiredQty = numeric(requirement.requiredQuantity);
    const denominator = Math.max(requiredQty, 0);

    return {
      id: requirement.id,
      requirementNo: requirement.requirementNo,
      status: requirement.status,
      requiredBy: requirement.requiredBy ?? null,
      component: requirement.component,
      quantities: {
        requiredQty,
        orderedQty,
        plannedQty: orderedQty,
        instanceCount,
        inProductionQty,
        completedQty,
        qcPassedQty,
        qcFailedQty,
        finishedGoodsQty,
        yardStagedQty,
      },
      productionOrders: requirement.productionOrders.map((order) => ({
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        quantity: numeric(order.quantity),
      })),
      physicalInstances: requirement.componentInstances.map((instance) => ({
        yardPlacementId: instance.yardPlacements?.[0]?.id ?? null,
        yardSlotId: instance.yardPlacements?.[0]?.slotId ?? null,
        yardPlacedAt: instance.yardPlacements?.[0]?.placedAt ?? null,
        id: instance.id,
        instanceNo: instance.instanceNo,
        state: instance.state,
        productionOrderId: instance.productionOrderId ?? null,
        producedAt: instance.producedAt ?? null,
        qcPassedAt: instance.qcPassedAt ?? null,
      })),
      executionStatus: requirementStatus({
        requiredQty,
        orderedQty,
        instanceCount,
        inProductionQty,
        completedQty,
        qcFailedQty,
        finishedGoodsQty,
      }),
      progress: {
        denominator,
        productionCompletionPercent: percent(completedQty, denominator),
        finishedGoodsPercent: percent(finishedGoodsQty, denominator),
      },
    };
  });

  const totals = requirements.reduce(
    (acc, row) => {
      acc.requiredQty += row.quantities.requiredQty;
      acc.orderedQty += row.quantities.orderedQty;
      acc.plannedQty += row.quantities.plannedQty;
      acc.instanceCount += row.quantities.instanceCount;
      acc.inProductionQty += row.quantities.inProductionQty;
      acc.completedQty += row.quantities.completedQty;
      acc.qcPassedQty += row.quantities.qcPassedQty;
      acc.qcFailedQty += row.quantities.qcFailedQty;
      acc.finishedGoodsQty += row.quantities.finishedGoodsQty;
      acc.yardStagedQty += row.quantities.yardStagedQty;
      return acc;
    },
    {
      requiredQty: 0,
      orderedQty: 0,
      plannedQty: 0,
      instanceCount: 0,
      inProductionQty: 0,
      completedQty: 0,
      qcPassedQty: 0,
      qcFailedQty: 0,
      finishedGoodsQty: 0,
      yardStagedQty: 0,
    },
  );

  return {
    project: source.project,
    summary: {
      requirementCount: requirements.length,
      ...totals,
      productionCompletionPercent: percent(
        totals.completedQty,
        totals.requiredQty,
      ),
      finishedGoodsPercent: percent(
        totals.finishedGoodsQty,
        totals.requiredQty,
      ),
      sourceOfTruth:
        'Project -> ProjectComponentRequirement -> ProductionOrder -> ComponentInstance',
      downstream: {
        yardCanonical: true,
        dispatchCanonical: true,
      },
    },
    requirements,
  };
}

function requirementStatus(input: {
  requiredQty: number;
  orderedQty: number;
  instanceCount: number;
  inProductionQty: number;
  completedQty: number;
  qcFailedQty: number;
  finishedGoodsQty: number;
}): ProjectExecutionStatus {
  if (input.requiredQty <= 0) return 'NO_REQUIREMENTS';
  if (input.orderedQty <= 0 && input.instanceCount <= 0) return 'NO_PRODUCTION';
  if (input.finishedGoodsQty > input.requiredQty) return 'OVER_PRODUCED';
  if (input.finishedGoodsQty === input.requiredQty) return 'FINISHED';
  if (input.finishedGoodsQty > 0) return 'FINISHED_PARTIAL';
  if (input.qcFailedQty > 0) return 'QC_BLOCKED';
  if (input.completedQty > 0) return 'WAITING_QC';
  if (input.inProductionQty > 0) return 'IN_PRODUCTION';
  return 'PLANNED';
}

function percent(value: number, denominator: number) {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.round((value / denominator) * 1000) / 10;
}

function numeric(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
