import { ComponentCostingRepository } from '../repositories/component-costing.repository';
import { ComponentCostingService } from './component-costing.service';

describe('ComponentCostingService', () => {
  const tx = { transaction: 'component-costing' };
  const repository = {
    findComponentWithProduction: jest.fn(),
    findConsumptions: jest.fn(),
    findInboundCostLines: jest.fn(),
    transaction: jest.fn(),
    upsertCosting: jest.fn(),
    updateComponentCosts: jest.fn(),
    createActivityLog: jest.fn(),
  };

  let service: ComponentCostingService;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.transaction.mockImplementation(
      (callback: (client: unknown) => Promise<unknown>) => callback(tx),
    );
    repository.findComponentWithProduction.mockResolvedValue({
      id: 'component-1',
      code: 'CK-001',
      estimatedCost: 0,
      actualCost: 0,
      project: null,
      productionOrders: [
        {
          id: 'order-1',
          orderNo: 'LSX-001',
          quantity: 2,
          updatedAt: new Date('2026-07-12T00:00:00.000Z'),
          bom: {
            items: [
              {
                materialId: 'material-1',
                quantity: 4,
                wastePercent: 0,
                material: { code: 'VT-001', name: 'Steel' },
              },
            ],
          },
        },
      ],
    });
    repository.findConsumptions.mockResolvedValue([
      {
        inventoryItemId: 'material-1',
        consumedQty: 7,
        scrapQty: 1,
        inventoryItem: { code: 'VT-001', name: 'Steel' },
      },
    ]);
    repository.findInboundCostLines.mockResolvedValue([
      {
        inventoryItemId: 'material-1',
        quantity: 10,
        unitPrice: 5,
        totalAmount: 50,
      },
    ]);
    repository.upsertCosting.mockResolvedValue({ id: 'costing-1' });
    repository.updateComponentCosts.mockResolvedValue({ id: 'component-1' });
    repository.createActivityLog.mockResolvedValue({ id: 'activity-1' });

    service = new ComponentCostingService(
      repository as unknown as ComponentCostingRepository,
    );
  });

  it('persists costing, component summary and activity in one repository transaction', async () => {
    await service.recalculate('component-1');

    expect(repository.transaction).toHaveBeenCalledTimes(1);
    expect(repository.upsertCosting).toHaveBeenCalledWith(
      expect.objectContaining({
        componentId: 'component-1',
        productionOrderId: 'order-1',
        estimatedMaterialCost: 40,
        actualMaterialCost: 40,
        estimatedCost: 40,
        actualCost: 40,
        varianceCost: 0,
      }),
      tx,
    );
    expect(repository.updateComponentCosts).toHaveBeenCalledWith(
      'component-1',
      40,
      40,
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RECALCULATE_COSTING',
        entity: 'Component',
        entityId: 'component-1',
        module: 'components',
      }),
      tx,
    );
  });
});
