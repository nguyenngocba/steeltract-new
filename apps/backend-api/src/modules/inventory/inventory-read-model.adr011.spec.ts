import { InventoryReadModelService } from './inventory-read-model.service';

describe('InventoryReadModelService ADR011 boundary', () => {
  const metrics = { recordReadModelHit: jest.fn() };
  const snapshots = {
    inventoryMaterial: jest.fn(),
    inventoryLocations: jest.fn(),
    inventoryOverviewHistory: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('reads Materials from the live repository model', async () => {
    const repository = {
      listMaterialLivePage: jest.fn().mockResolvedValue({
        items: [{
          id: 'material-1',
          code: 'M-001',
          name: 'Material 1',
          locationStocks: [],
          liveMetrics: { averageCost: 10, lastMovementDate: null },
        }],
        total: 1,
        page: 1,
        pageSize: 16,
      }),
      materialLiveSummary: jest.fn().mockResolvedValue({ totalItems: 1 }),
      materialLiveFacets: jest.fn().mockResolvedValue([[], []]),
    };
    const service = new InventoryReadModelService(
      repository as never,
      metrics as never,
      snapshots as never,
    );

    const result = await service.materialList({} as never);

    expect(repository.listMaterialLivePage).toHaveBeenCalledTimes(1);
    expect(result.items[0].readSource).toBe('repository-live');
    expect(snapshots.inventoryMaterial).not.toHaveBeenCalled();
  });

  it('reads Material Detail and Locations directly from repositories', async () => {
    const repository = {
      findItemById: jest.fn().mockResolvedValue({
        id: 'material-1',
        code: 'M-001',
        name: 'Material 1',
      }),
      findPositiveLocationStocksByItem: jest.fn().mockResolvedValue([
        { quantity: 5, zone: null },
      ]),
      findTransactionsByItem: jest.fn().mockResolvedValue([]),
      listZones: jest.fn().mockResolvedValue([]),
    };
    const service = new InventoryReadModelService(
      repository as never,
      metrics as never,
      snapshots as never,
    );

    const detail = await service.materialDetail('material-1');
    const locations = await service.locations();

    expect(detail.currentStock).toBe(5);
    expect(locations).toEqual([]);
    expect(snapshots.inventoryMaterial).not.toHaveBeenCalled();
    expect(snapshots.inventoryLocations).not.toHaveBeenCalled();
  });
});
