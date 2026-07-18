import { NotFoundException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';

import { EnterpriseQueryController } from './enterprise-query.controller';
import { EnterpriseQueryService } from './enterprise-query.service';
import { ProjectionRegistryService } from './projection-registry.service';

describe('EnterpriseQueryService', () => {
  function setup() {
    const projections = {
      list: jest.fn().mockResolvedValue({
        items: [{ entityKey: 'entity-1', data: { state: 'ACTIVE' } }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
      find: jest
        .fn()
        .mockResolvedValue({
          entityKey: 'entity-1',
          data: { state: 'ACTIVE' },
        }),
    };
    return {
      projections,
      service: new EnterpriseQueryService(projections as never),
    };
  }

  it('publishes projection-backed views for every business module', async () => {
    const { service, projections } = setup();
    const expected = [
      ['inventory', 'materials', 'MaterialAvailability'],
      ['components', 'components', 'ComponentSummary'],
      ['production', 'orders', 'ProductionOrderSummary'],
      ['qc', 'inspections', 'QcInspectionSummary'],
      ['yard', 'items', 'YardItemSummary'],
      ['logistics', 'shipments', 'ShipmentSummary'],
      ['projects', 'materialAllocations', 'ProjectMaterialAllocation'],
    ] as const;

    expect(service.catalog().map((item) => item.module)).toEqual(
      expected.map(([module]) => module),
    );
    for (const [module, view, projection] of expected) {
      const result = await service.list(module, view, {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(
        expect.objectContaining({
          module,
          view,
          projectionName: projection,
        }),
      );
      expect(projections.list).toHaveBeenLastCalledWith(projection, {
        page: 1,
        limit: 20,
      });
    }
  });

  it('supports entity lookup and rejects unknown module/view aliases', async () => {
    const { service, projections } = setup();
    const result = await service.find('logistics', 'shipments', 'shipment-1');
    expect(projections.find).toHaveBeenCalledWith(
      'ShipmentSummary',
      'shipment-1',
    );
    expect(result.item).toEqual(
      expect.objectContaining({ entityKey: 'entity-1' }),
    );
    expect(() => service.module('unknown')).toThrow(NotFoundException);
    await expect(
      service.list('inventory', 'unknown', { page: 1, limit: 20 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('registers canonical projections for QC, Yard, Logistics and Projects', () => {
    const registry = new ProjectionRegistryService();
    expect(
      registry.matching('qc.inspection.completed').map((item) => item.name),
    ).toEqual(expect.arrayContaining(['QcInspectionSummary', 'QcTimeline']));
    expect(
      registry.matching('yard.item.moved').map((item) => item.name),
    ).toEqual(
      expect.arrayContaining(['YardItemSummary', 'YardMovementTimeline']),
    );
    expect(
      registry
        .matching('logistics.shipment.dispatched')
        .map((item) => item.name),
    ).toEqual(expect.arrayContaining(['ShipmentSummary', 'ShipmentTimeline']));
    expect(
      registry
        .matching('project.acceptance.completed')
        .map((item) => item.name),
    ).toEqual(
      expect.arrayContaining(['ProjectAcceptanceSummary', 'ProjectTimeline']),
    );
  });

  it('exposes a GET-only module query API', () => {
    const methods = [
      EnterpriseQueryController.prototype.catalog,
      EnterpriseQueryController.prototype.module,
      EnterpriseQueryController.prototype.list,
      EnterpriseQueryController.prototype.find,
    ].map((handler) => Reflect.getMetadata(METHOD_METADATA, handler));
    expect(methods).toEqual([
      RequestMethod.GET,
      RequestMethod.GET,
      RequestMethod.GET,
      RequestMethod.GET,
    ]);
  });
});
