import { BOMService } from './bom.service';

describe('BOMService production material boundary', () => {
  it('creates Engineering BOM lines without requiring current production stock', async () => {
    const repository = {
      nextBomNo: jest.fn().mockResolvedValue('BOM-OPS3-001'),
      create: jest.fn().mockResolvedValue({ id: 'bom-1', bomNo: 'BOM-OPS3-001' }),
    };
    const service = new BOMService(repository as never);

    await service.create({
      productCode: 'CPL-OPS3',
      productName: 'OPS3 Component',
      estimatedWeight: 0,
      version: 'V1',
      status: 'DRAFT',
      items: [
        {
          materialId: 'material-master-zero-production-stock',
          quantity: 12,
          wastePercent: 5,
          category: 'MAIN_MATERIAL',
        },
      ],
      routingSteps: [
        {
          stepNo: 1,
          stepName: 'Cutting',
          expectedHours: 1,
          qcRequired: true,
        },
      ],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: {
          create: [
            expect.objectContaining({
              materialId: 'material-master-zero-production-stock',
              quantity: 12,
              wastePercent: 5,
            }),
          ],
        },
      }),
    );
  });
});
