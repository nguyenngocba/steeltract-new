import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ApprovalStatus,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  ReturnFlowType,
} from '@prisma/client';

import { InventoryPostingService } from '../../inventory/inventory-posting.service';
import { ReturnWorkflowService } from '../../inventory/return-workflow.service';
import { ProcurementRepository } from '../repositories/procurement.repository';
import { ProcurementService } from './procurement.service';

describe('ProcurementService canonical workflow', () => {
  const tx = { transaction: true };

  function setup() {
    const request: {
      id: string;
      requestNumber: string;
      lifecycleStatus: PurchaseRequestStatus;
      status: ApprovalStatus;
      projectName: string;
      items: Array<{ materialId: string; quantity: number }>;
    } = {
      id: 'pr-1',
      requestNumber: 'PR-001',
      lifecycleStatus: PurchaseRequestStatus.DRAFT,
      status: ApprovalStatus.PENDING,
      projectName: 'Factory project',
      items: [{ materialId: 'material-1', quantity: 100 }],
    };
    const order = {
      id: 'po-1',
      poNumber: 'PO-001',
      status: PurchaseOrderStatus.APPROVED,
      supplierId: 'supplier-1',
      materialRequestId: 'pr-1',
      totalAmount: 1_000,
      items: [
        {
          id: 'po-line-1',
          materialId: 'material-1',
          uomId: 'uom-1',
          warehouseId: 'warehouse-1',
          quantity: 100,
          orderedQty: 100,
          receivedQty: 0,
          remainingQty: 100,
          unitPrice: 10,
        },
      ],
    };
    const receipts = new Map<string, Record<string, unknown>>();
    let receiptSequence = 0;
    const repository = {
      transaction: jest.fn((work) => work(tx)),
      lockRequest: jest.fn().mockResolvedValue([{ id: request.id }]),
      lockOrder: jest.fn().mockResolvedValue([{ id: order.id }]),
      findRequest: jest.fn().mockImplementation(() => Promise.resolve(request)),
      findOrder: jest.fn().mockImplementation(() => Promise.resolve(order)),
      findUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        username: 'buyer',
        fullName: 'Buyer',
      }),
      findSupplier: jest.fn().mockResolvedValue({
        id: 'supplier-1',
        name: 'Supplier One',
      }),
      findMaterials: jest.fn().mockResolvedValue([
        {
          id: 'material-1',
          name: 'Steel plate',
          unit: 'kg',
          unitMaster: { id: 'uom-1', code: 'KG', symbol: 'kg' },
        },
      ]),
      findUnits: jest.fn().mockResolvedValue([{ id: 'uom-1' }]),
      findWarehouses: jest.fn().mockResolvedValue([{ id: 'warehouse-1' }]),
      listCommittedOrderLines: jest.fn().mockResolvedValue([]),
      findZones: jest.fn().mockResolvedValue([
        { id: 'zone-1', warehouseId: 'warehouse-1' },
      ]),
      updateRequest: jest.fn().mockImplementation((_id, data) => {
        Object.assign(request, data);
        return Promise.resolve(request);
      }),
      createOrder: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          ...order,
          status: data.status,
          supplierId: data.supplier.connect.id,
          supplierName: data.supplierName,
          items: data.items.create,
        }),
      ),
      updateOrder: jest.fn().mockImplementation((_id, data) => {
        Object.assign(order, data);
        return Promise.resolve(order);
      }),
      updateOrderLine: jest.fn().mockImplementation((_id, data) => {
        Object.assign(order.items[0], data);
        return Promise.resolve(order.items[0]);
      }),
      findReceiptByKey: jest
        .fn()
        .mockImplementation((key) => Promise.resolve(receipts.get(key) ?? null)),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findReceipt: jest.fn(),
      findReturnRequest: jest.fn(),
    };
    const inventoryPosting = {
      receiveMaterial: jest.fn().mockImplementation((command) => {
        receiptSequence += 1;
        const receipt = {
          id: `receipt-${receiptSequence}`,
          commandHash: command.commandHash,
          items: command.lines,
        };
        receipts.set(command.idempotencyKey, receipt);
        return Promise.resolve(receipt);
      }),
    };
    const returnWorkflow = {
      create: jest.fn(),
      approve: jest.fn(),
      receive: jest.fn(),
      inspect: jest.fn(),
      dispose: jest.fn(),
    };
    return {
      request,
      order,
      repository,
      inventoryPosting,
      returnWorkflow,
      service: new ProcurementService(
        repository as unknown as ProcurementRepository,
        inventoryPosting as unknown as InventoryPostingService,
        returnWorkflow as unknown as ReturnWorkflowService,
      ),
    };
  }

  it('does not approve a Draft Purchase Request', async () => {
    const { repository, service } = setup();

    await expect(service.approveRequest('pr-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.updateRequest).not.toHaveBeenCalled();
  });

  it('moves a submitted Purchase Request to approved with actor audit', async () => {
    const { request, repository, service } = setup();
    request.lifecycleStatus = PurchaseRequestStatus.SUBMITTED;

    await service.approveRequest('pr-1', 'user-1');

    expect(request.lifecycleStatus).toBe(PurchaseRequestStatus.APPROVED);
    expect(request.status).toBe(ApprovalStatus.APPROVED);
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PURCHASE_REQUEST_APPROVED' }),
      tx,
    );
  });

  it('creates a PO from canonical identities and keeps text fields as snapshots', async () => {
    const { request, repository, service } = setup();
    request.lifecycleStatus = PurchaseRequestStatus.APPROVED;

    await service.createOrder(
      {
        materialRequestId: 'pr-1',
        supplierId: 'supplier-1',
        items: [
          {
            materialId: 'material-1',
            uomId: 'uom-1',
            warehouseId: 'warehouse-1',
            orderedQty: 100,
            unitPrice: 10,
          },
        ],
      },
      'user-1',
    );

    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier: { connect: { id: 'supplier-1' } },
        supplierName: 'Supplier One',
        items: {
          create: [
            expect.objectContaining({
              material: { connect: { id: 'material-1' } },
              uom: { connect: { id: 'uom-1' } },
              warehouse: { connect: { id: 'warehouse-1' } },
              itemName: 'Steel plate',
            }),
          ],
        },
      }),
      tx,
    );
  });

  it('receives 40, 40 and 20 through Inventory and completes the PO', async () => {
    const { order, inventoryPosting, service } = setup();
    const receipt = (quantity: number, key: string) =>
      service.receiveOrder(
        order.id,
        {
          items: [
            {
              purchaseOrderItemId: 'po-line-1',
              quantity,
              zoneId: 'zone-1',
              slotId: 'A01',
              level: 'L1',
            },
          ],
        },
        'user-1',
        key,
      );

    await receipt(40, 'receipt-40-a');
    expect(order.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
    expect(order.items[0].receivedQty).toBe(40);
    await receipt(40, 'receipt-40-b');
    expect(order.items[0].receivedQty).toBe(80);
    await receipt(20, 'receipt-20');

    expect(order.status).toBe(PurchaseOrderStatus.COMPLETED);
    expect(order.items[0].receivedQty).toBe(100);
    expect(order.items[0].remainingQty).toBe(0);
    expect(inventoryPosting.receiveMaterial).toHaveBeenCalledTimes(3);
    expect(inventoryPosting.receiveMaterial).toHaveBeenLastCalledWith(
      expect.objectContaining({
        referenceModule: 'PURCHASE_ORDER',
        referenceId: 'po-1',
        lines: [expect.objectContaining({ quantity: 20 })],
      }),
      tx,
    );
  });

  it('rejects ordering beyond quantity already committed by another PO', async () => {
    const { request, repository, service } = setup();
    request.lifecycleStatus = PurchaseRequestStatus.APPROVED;
    repository.listCommittedOrderLines.mockResolvedValue([
      { materialId: 'material-1', orderedQty: 80, quantity: 80 },
    ]);

    await expect(
      service.createOrder(
        {
          materialRequestId: 'pr-1',
          supplierId: 'supplier-1',
          items: [
            {
              materialId: 'material-1',
              uomId: 'uom-1',
              warehouseId: 'warehouse-1',
              orderedQty: 40,
              unitPrice: 10,
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it('returns an idempotent replay and rejects key reuse with another payload', async () => {
    const { inventoryPosting, service } = setup();
    const body = {
      items: [
        {
          purchaseOrderItemId: 'po-line-1',
          quantity: 40,
          zoneId: 'zone-1',
          slotId: 'A01',
          level: 'L1',
        },
      ],
    };

    await service.receiveOrder('po-1', body, 'user-1', 'same-key');
    await service.receiveOrder('po-1', body, 'user-1', 'same-key');
    expect(inventoryPosting.receiveMaterial).toHaveBeenCalledTimes(1);

    await expect(
      service.receiveOrder(
        'po-1',
        { items: [{ ...body.items[0], quantity: 20 }] },
        'user-1',
        'same-key',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates Supplier Return only from a receipt belonging to the PO', async () => {
    const { repository, returnWorkflow, service } = setup();
    repository.findReceipt.mockResolvedValue({
      id: 'receipt-1',
      type: 'IMPORT',
      referenceModule: 'PURCHASE_ORDER',
      referenceId: 'po-1',
      supplierId: 'supplier-1',
      items: [
        {
          id: 'receipt-line-1',
          inventoryItemId: 'material-1',
          quantity: 40,
          unitId: 'uom-1',
          warehouseId: 'warehouse-1',
          zoneId: 'zone-1',
        },
      ],
    });
    returnWorkflow.create.mockResolvedValue({ id: 'return-1' });

    await service.createSupplierReturn(
      'po-1',
      {
        receiptTransactionId: 'receipt-1',
        items: [{ receiptItemId: 'receipt-line-1', quantity: 10 }],
      },
      'user-1',
    );

    expect(returnWorkflow.create).toHaveBeenCalledWith(
      expect.objectContaining({
        flowType: ReturnFlowType.SUPPLIER_RETURN,
        supplierId: 'supplier-1',
        purchaseOrderId: 'po-1',
        receiptTransactionId: 'receipt-1',
        items: [
          expect.objectContaining({
            inventoryItemId: 'material-1',
            requestedQuantity: 10,
          }),
        ],
      }),
    );
  });
});
