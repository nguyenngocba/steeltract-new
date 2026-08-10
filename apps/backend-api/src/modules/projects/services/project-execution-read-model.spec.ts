import {
  ComponentInstanceState,
  ProductionOrderStatus,
  ProjectComponentRequirementStatus,
  ProjectStatus,
} from '@prisma/client';

import {
  buildProjectExecutionReadModel,
  type ProjectExecutionRequirementSource,
} from './project-execution-read-model';

const project = {
  id: 'project-a',
  code: 'P-A',
  name: 'Project A',
  status: ProjectStatus.ACTIVE,
};

const component = {
  id: 'component-a',
  code: 'C-A',
  name: 'Beam A',
  componentType: 'BEAM',
  profile: 'H300',
};

describe('Project execution read model', () => {
  it('reports one requirement with no production orders and no instances', () => {
    const model = buildProjectExecutionReadModel({
      project,
      requirements: [requirement({ requiredQuantity: 10 })],
    });

    expect(model.summary).toEqual(
      expect.objectContaining({
        requiredQty: 10,
        orderedQty: 0,
        instanceCount: 0,
        finishedGoodsQty: 0,
        productionCompletionPercent: 0,
      }),
    );
    expect(model.requirements[0].executionStatus).toBe('NO_PRODUCTION');
  });

  it('aggregates multiple production orders and partial component instances', () => {
    const model = buildProjectExecutionReadModel({
      project,
      requirements: [
        requirement({
          requiredQuantity: 10,
          productionOrders: [
            order({ id: 'po-1', orderNo: 'PO-1', quantity: 4 }),
            order({ id: 'po-2', orderNo: 'PO-2', quantity: 6 }),
            order({
              id: 'po-cancelled',
              orderNo: 'PO-X',
              quantity: 50,
              status: ProductionOrderStatus.CANCELLED,
            }),
          ],
          componentInstances: [
            instance({
              id: 'i-1',
              state: ComponentInstanceState.IN_PRODUCTION,
            }),
            instance({
              id: 'i-2',
              state: ComponentInstanceState.PRODUCED_WAITING_QC,
              producedAt: new Date('2026-07-01T00:00:00.000Z'),
            }),
            instance({
              id: 'i-3',
              state: ComponentInstanceState.QC_FAILED,
              producedAt: new Date('2026-07-01T00:00:00.000Z'),
            }),
          ],
        }),
      ],
    });

    expect(model.requirements[0].quantities).toEqual(
      expect.objectContaining({
        requiredQty: 10,
        orderedQty: 10,
        plannedQty: 10,
        instanceCount: 3,
        inProductionQty: 1,
        completedQty: 2,
        qcFailedQty: 1,
      }),
    );
    expect(model.requirements[0].executionStatus).toBe('QC_BLOCKED');
  });

  it('keeps multiple requirements isolated during aggregation', () => {
    const model = buildProjectExecutionReadModel(
      {
        project,
        requirements: [
          requirement({
            id: 'req-1',
            requirementNo: 'REQ-1',
            requiredQuantity: 2,
            componentInstances: [
              instance({ id: 'a-1', state: ComponentInstanceState.QC_PASSED }),
            ],
          }),
          requirement({
            id: 'req-2',
            requirementNo: 'REQ-2',
            requiredQuantity: 3,
            componentInstances: [
              instance({
                id: 'b-1',
                state: ComponentInstanceState.IN_PRODUCTION,
              }),
              instance({ id: 'b-2', state: ComponentInstanceState.PLANNED }),
            ],
          }),
        ],
      },
      new Map([['req-1', 1]]),
    );

    expect(model.summary.requiredQty).toBe(5);
    expect(model.summary.instanceCount).toBe(3);
    expect(model.summary.finishedGoodsQty).toBe(1);
    expect(
      model.requirements.find((row) => row.id === 'req-1')?.quantities
        .finishedGoodsQty,
    ).toBe(1);
    expect(
      model.requirements.find((row) => row.id === 'req-2')?.quantities
        .finishedGoodsQty,
    ).toBe(0);
  });

  it('counts finished goods using the external eligibility summary', () => {
    const model = buildProjectExecutionReadModel(
      {
        project,
        requirements: [
          requirement({
            id: 'req-fg',
            requiredQuantity: 2,
            componentInstances: [
              instance({ id: 'fg-1', state: ComponentInstanceState.QC_PASSED }),
              instance({ id: 'fg-2', state: ComponentInstanceState.USE_AS_IS }),
            ],
          }),
        ],
      },
      new Map([['req-fg', 2]]),
    );

    expect(model.summary.finishedGoodsQty).toBe(2);
    expect(model.summary.finishedGoodsPercent).toBe(100);
    expect(model.requirements[0].executionStatus).toBe('FINISHED');
  });

  it('reports Yard staged quantity without changing production or finished-goods progress', () => {
    const model = buildProjectExecutionReadModel(
      {
        project,
        requirements: [
          requirement({
            id: 'req-yard',
            requiredQuantity: 2,
            componentInstances: [
              instance({
                id: 'yard-1',
                state: ComponentInstanceState.QC_PASSED,
                yardPlacements: [
                  {
                    id: 'placement-1',
                    slotId: 'slot-a',
                    placedAt: new Date('2026-07-29T00:00:00.000Z'),
                    removedAt: null,
                  },
                ],
              }),
              instance({
                id: 'fg-only',
                state: ComponentInstanceState.QC_PASSED,
              }),
            ],
          }),
        ],
      },
      new Map([['req-yard', 2]]),
    );

    expect(model.summary.finishedGoodsQty).toBe(2);
    expect(model.summary.yardStagedQty).toBe(1);
    expect(model.summary.downstream.yardCanonical).toBe(true);
    expect(model.requirements[0].progress.finishedGoodsPercent).toBe(100);
    expect(model.requirements[0].physicalInstances[0]).toEqual(
      expect.objectContaining({
        yardPlacementId: 'placement-1',
        yardSlotId: 'slot-a',
      }),
    );
  });

  it('keeps downstream physical instances counted as production-complete', () => {
    const model = buildProjectExecutionReadModel({
      project,
      requirements: [
        requirement({
          requiredQuantity: 1,
          componentInstances: [
            instance({
              id: 'installed-1',
              state: ComponentInstanceState.INSTALLED,
            }),
          ],
        }),
      ],
    });

    expect(model.summary.completedQty).toBe(1);
    expect(model.summary.productionCompletionPercent).toBe(100);
    expect(model.summary.downstream.dispatchCanonical).toBe(true);
  });

  it('does not let Project A instances affect Project B when the source is scoped', () => {
    const projectB = { ...project, id: 'project-b', code: 'P-B' };
    const model = buildProjectExecutionReadModel(
      {
        project: projectB,
        requirements: [
          requirement({
            id: 'req-b',
            requiredQuantity: 1,
            componentInstances: [
              instance({ id: 'b-1', state: ComponentInstanceState.QC_PASSED }),
            ],
          }),
        ],
      },
      new Map([
        ['req-a', 9],
        ['req-b', 1],
      ]),
    );

    expect(model.project.id).toBe('project-b');
    expect(model.summary.finishedGoodsQty).toBe(1);
  });

  it('handles zero and empty datasets without divide-by-zero progress', () => {
    const noRequirements = buildProjectExecutionReadModel({
      project,
      requirements: [],
    });
    const zeroRequired = buildProjectExecutionReadModel({
      project,
      requirements: [requirement({ requiredQuantity: 0 })],
    });

    expect(noRequirements.summary.productionCompletionPercent).toBe(0);
    expect(noRequirements.summary.finishedGoodsPercent).toBe(0);
    expect(zeroRequired.requirements[0].executionStatus).toBe(
      'NO_REQUIREMENTS',
    );
    expect(
      zeroRequired.requirements[0].progress.productionCompletionPercent,
    ).toBe(0);
  });

  it('ignores legacy Component.status because it is absent from canonical inputs', () => {
    const legacyStatusComponent = {
      ...component,
      status: 'INSTALLED',
    } as typeof component & { status: string };
    const model = buildProjectExecutionReadModel({
      project,
      requirements: [
        requirement({
          component: legacyStatusComponent,
          requiredQuantity: 5,
          componentInstances: [],
        }),
      ],
    });

    expect(model.summary.completedQty).toBe(0);
    expect(model.summary.finishedGoodsQty).toBe(0);
    expect(model.requirements[0].executionStatus).toBe('NO_PRODUCTION');
  });
});

function requirement(
  overrides: Partial<ProjectExecutionRequirementSource> = {},
): ProjectExecutionRequirementSource {
  return {
    id: 'req-1',
    requirementNo: 'REQ-1',
    status: ProjectComponentRequirementStatus.DRAFT,
    requiredQuantity: 1,
    producedQuantity: 0,
    acceptedQuantity: 0,
    installedQuantity: 0,
    requiredBy: null,
    component,
    productionOrders: [],
    componentInstances: [],
    ...overrides,
  };
}

function order(
  overrides: Partial<
    ProjectExecutionRequirementSource['productionOrders'][number]
  > = {},
) {
  return {
    id: 'po-1',
    orderNo: 'PO-1',
    status: ProductionOrderStatus.RELEASED,
    quantity: 1,
    ...overrides,
  };
}

function instance(
  overrides: Partial<
    ProjectExecutionRequirementSource['componentInstances'][number]
  > = {},
) {
  return {
    id: 'instance-1',
    instanceNo: overrides.id ?? 'CI-1',
    state: ComponentInstanceState.PLANNED,
    productionOrderId: null,
    producedAt: null,
    qcPassedAt: null,
    ...overrides,
  };
}
