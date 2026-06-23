import {
  ComponentStatus,
  PrismaClient,
  ProductionMaterialLedgerEventType,
  ProductionMaterialReservationLineStatus,
  ProductionMaterialReservationStatus,
  ProductionOrderStatus,
  ProductionStageCode,
  ProductionStageStatus,
  TaskPriority,
  TransactionType,
} from '@prisma/client';

const prisma = new PrismaClient();
const PREFIX = 'DEMO20A5';

type MaterialSeed = {
  item: Awaited<ReturnType<typeof prisma.inventoryItem.upsert>>;
  unitPrice: number;
  importQty: number;
  mainStock: number;
  productionStock: number;
  issuedQty: number;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function purgeTransactionalData() {
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "qc_attachments",
        "non_conformance_reports",
        "qc_issues",
        "qc_results",
        "qc_inspections",
        "yard_movements",
        "yard_item_placements",
        "yard_snapshots",
        "tasks",
        "component_timelines",
        "ComponentCosting",
        "components",
        "ProductionMaterialConsumption",
        "ProductionMaterialLedger",
        "ProductionMaterialIssue",
        "ProductionMaterialReservationLine",
        "ProductionMaterialReservation",
        "production_logs",
        "production_schedules",
        "production_tasks",
        "production_stages",
        "production_orders",
        "BOMRoutingStep",
        "BOMItem",
        "BOM",
        "return_request_items",
        "return_requests",
        "inventory_transaction_items",
        "inventory_transactions",
        "inventory_location_stocks",
        "activity_logs",
        "outbox_events",
        "background_jobs",
        "job_executions",
        "workflow_actions",
        "workflow_instances"
      RESTART IDENTITY CASCADE
    `),
    prisma.$executeRawUnsafe(`
      UPDATE "yard_slots"
      SET
        "status" = 'AVAILABLE',
        "currentStackLevel" = 0,
        "updatedAt" = NOW()
    `),
    prisma.$executeRawUnsafe(`
      UPDATE "inventory_items"
      SET
        "quantity" = 0,
        "updatedAt" = NOW()
    `),
  ]);
}

async function ensureMasters() {
  const unit = await prisma.masterUnit.upsert({
    where: { code: 'T' },
    create: {
      code: 'T',
      name: 'Tấn',
      symbol: 't',
      category: 'WEIGHT',
      precision: 3,
    },
    update: {
      name: 'Tấn',
      symbol: 't',
      category: 'WEIGHT',
      precision: 3,
      active: true,
    },
  });

  const category = await prisma.inventoryCategory.upsert({
    where: { code: `${PREFIX}-STEEL` },
    create: {
      code: `${PREFIX}-STEEL`,
      name: 'Demo Structural Steel',
      description: 'Sprint 20A.5 demo steel materials',
      active: true,
    },
    update: {
      name: 'Demo Structural Steel',
      active: true,
    },
  });

  const materialType = await prisma.materialType.upsert({
    where: { code: `${PREFIX}-STRUCTURAL` },
    create: {
      code: `${PREFIX}-STRUCTURAL`,
      name: 'Demo Structural Material',
      categoryId: category.id,
      active: true,
    },
    update: {
      categoryId: category.id,
      active: true,
    },
  });

  const mainWarehouse = await prisma.masterWarehouse.upsert({
    where: { code: 'MAIN' },
    create: {
      code: 'MAIN',
      name: 'Kho chính',
      active: true,
      color: '#2563eb',
    },
    update: {
      name: 'Kho chính',
      active: true,
    },
  });

  const productionWarehouse = await prisma.masterWarehouse.upsert({
    where: { code: 'PRODUCTION' },
    create: {
      code: 'PRODUCTION',
      name: 'Kho sản xuất',
      active: true,
      color: '#06b6d4',
    },
    update: {
      name: 'Kho sản xuất',
      active: true,
    },
  });

  const mainZones = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      prisma.warehouseZone.upsert({
        where: { code: `${PREFIX}-MAIN-${pad(index + 1)}` },
        create: {
          code: `${PREFIX}-MAIN-${pad(index + 1)}`,
          name: `Demo Kho chính ${pad(index + 1)}`,
          warehouseId: mainWarehouse.id,
          row: String.fromCharCode(65 + index),
          column: pad(index + 1),
          level: 'L1',
          capacity: 1000,
          active: true,
        },
        update: {
          warehouseId: mainWarehouse.id,
          active: true,
        },
      }),
    ),
  );

  const productionZones = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      prisma.warehouseZone.upsert({
        where: { code: `${PREFIX}-PROD-${pad(index + 1)}` },
        create: {
          code: `${PREFIX}-PROD-${pad(index + 1)}`,
          name: `Demo Kho sản xuất ${pad(index + 1)}`,
          warehouseId: productionWarehouse.id,
          row: String.fromCharCode(65 + index),
          column: pad(index + 5),
          level: 'L1',
          capacity: 800,
          active: true,
        },
        update: {
          warehouseId: productionWarehouse.id,
          active: true,
        },
      }),
    ),
  );

  return {
    unit,
    category,
    materialType,
    mainWarehouse,
    productionWarehouse,
    mainZones,
    productionZones,
  };
}

async function seedSuppliers() {
  return Promise.all(
    Array.from({ length: 20 }, (_, index) => {
      const no = pad(index + 1);
      return prisma.supplier.upsert({
        where: { code: `${PREFIX}-SUP-${no}` },
        create: {
          code: `${PREFIX}-SUP-${no}`,
          name: `Demo Steel Supplier ${no}`,
          contact: `Nguyen Supplier ${no}`,
          phone: `09${String(70000000 + index).padStart(8, '0')}`,
          email: `supplier-${no}@demo20a5.steeltrack.local`,
          address: `Khu cong nghiep Demo ${no}`,
        },
        update: {
          name: `Demo Steel Supplier ${no}`,
        },
      });
    }),
  );
}

async function seedProjects() {
  return Promise.all(
    Array.from({ length: 20 }, (_, index) => {
      const no = pad(index + 1);
      return prisma.project.upsert({
        where: { code: `${PREFIX}-PRJ-${no}` },
        create: {
          code: `${PREFIX}-PRJ-${no}`,
          name: `Demo Project ${no}`,
          description: 'Loại: Demo validation project for Costing/Production dashboard',
          status: index % 5 === 0 ? 'DELAYED' : 'ACTIVE',
        },
        update: {
          name: `Demo Project ${no}`,
          status: index % 5 === 0 ? 'DELAYED' : 'ACTIVE',
        },
      });
    }),
  );
}

async function seedInventoryItems(
  categoryId: string,
  materialTypeId: string,
  unitId: string,
  defaultZoneId: string,
) {
  return Promise.all(
    Array.from({ length: 20 }, (_, index) => {
      const no = pad(index + 1);
      const profiles = [
        'Thép H',
        'Thép I',
        'Thép tấm',
        'Thép hộp',
        'Thép góc',
      ];
      return prisma.inventoryItem.upsert({
        where: { code: `${PREFIX}-MAT-${no}` },
        create: {
          code: `${PREFIX}-MAT-${no}`,
          name: `${profiles[index % profiles.length]} demo ${no}`,
          description: 'Sprint 20A.5 demo material',
          quantity: 0,
          minimumStock: 120 + index * 5,
          unit: 't',
          unitId,
          categoryId,
          materialTypeId,
          materialUsageType: index % 4 === 0 ? 'SECONDARY' : 'PRIMARY',
          zoneId: defaultZoneId,
          slotId: `A${pad((index % 6) + 1)}`,
          level: `L${(index % 4) + 1}`,
        },
        update: {
          quantity: 0,
          unit: 't',
          unitId,
          categoryId,
          materialTypeId,
          zoneId: defaultZoneId,
          slotId: `A${pad((index % 6) + 1)}`,
          level: `L${(index % 4) + 1}`,
        },
      });
    }),
  );
}

async function seedComponents(projects: Array<{ id: string }>) {
  return Promise.all(
    Array.from({ length: 20 }, (_, index) => {
      const no = pad(index + 1);
      const project = projects[index % projects.length];
      return prisma.component.create({
        data: {
          code: `${PREFIX}-CMP-${no}`,
          name: `Demo Component ${no}`,
          description: 'Sprint 20A.5 demo component with production costing',
          projectId: project.id,
          floor: `L${(index % 5) + 1}`,
          zone: `Z${(index % 4) + 1}`,
          position: `GRID-${String(index + 1).padStart(3, '0')}`,
          status:
            index % 4 === 0
              ? ComponentStatus.READY
              : index % 4 === 1
                ? ComponentStatus.SHIPPED
                : index % 4 === 2
                  ? ComponentStatus.DELIVERED
                  : ComponentStatus.INSTALLED,
          plannedDate: daysFromNow(index - 5),
          installedDate: index % 4 === 3 ? daysFromNow(-index) : null,
          installZone: index % 4 === 3 ? `Zone ${index % 4}` : null,
          installAxis: index % 4 === 3 ? `Axis ${index + 1}` : null,
          installLevel: index % 4 === 3 ? `L${(index % 5) + 1}` : null,
          installPosition: index % 4 === 3 ? `P-${no}` : null,
        },
      });
    }),
  );
}

async function seedBomsAndOrders(
  components: Array<{ id: string; code: string; name: string; projectId: string | null }>,
  materials: MaterialSeed[],
) {
  const results: Array<{
    componentId: string;
    orderId: string;
    actualCost: number;
    estimatedCost: number;
  }> = [];

  for (const [index, component] of components.entries()) {
    const no = pad(index + 1);
    const orderQty = 6 + (index % 5) * 2;
    const materialA = materials[index % materials.length];
    const materialB = materials[(index + 1) % materials.length];
    const bom = await prisma.bOM.create({
      data: {
        bomNo: `${PREFIX}-BOM-${no}`,
        productCode: component.code,
        productName: component.name,
        structureType: ['COLUMN', 'BEAM', 'BRACE', 'PLATE'][index % 4],
        projectId: component.projectId,
        unit: 'cau kien',
        estimatedWeight: 8 + index * 0.65,
        version: 'A',
        status: 'ACTIVE',
        items: {
          create: [
            {
              materialId: materialA.item.id,
              quantity: 1.5 + (index % 4) * 0.25,
              wastePercent: 3,
              category: 'MAIN_MATERIAL',
            },
            {
              materialId: materialB.item.id,
              quantity: 0.45 + (index % 3) * 0.15,
              wastePercent: 5,
              category: 'SECONDARY_MATERIAL',
            },
          ],
        },
        routingSteps: {
          create: [
            { stepNo: 1, stepName: 'Cutting', workshop: 'Cutting', expectedHours: 3, qcRequired: false },
            { stepNo: 2, stepName: 'Assembly', workshop: 'Assembly', expectedHours: 4, qcRequired: false },
            { stepNo: 3, stepName: 'Welding', workshop: 'Welding', expectedHours: 5, qcRequired: true },
            { stepNo: 4, stepName: 'Painting', workshop: 'Painting', expectedHours: 2, qcRequired: true },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    const status =
      index % 5 === 0
        ? ProductionOrderStatus.COMPLETED
        : index % 5 === 1
          ? ProductionOrderStatus.IN_PROGRESS
          : index % 5 === 2
            ? ProductionOrderStatus.RELEASED
            : index % 5 === 3
              ? ProductionOrderStatus.PLANNED
              : ProductionOrderStatus.DELAYED;
    const order = await prisma.productionOrder.create({
      data: {
        orderNo: `${PREFIX}-MO-${no}`,
        title: `Demo Work Order ${no}`,
        description: 'Sprint 20A.5 demo production order',
        projectId: component.projectId,
        componentId: component.id,
        bomId: bom.id,
        quantity: orderQty,
        priority: index % 6 === 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
        status,
        currentStageCode:
          status === ProductionOrderStatus.COMPLETED
            ? ProductionStageCode.PACKING
            : status === ProductionOrderStatus.IN_PROGRESS
              ? ProductionStageCode.WELDING
              : ProductionStageCode.CUTTING,
        plannedStartAt: daysFromNow(-10 + index),
        plannedEndAt: daysFromNow(index % 5 === 4 ? -1 : 8 + index),
        startedAt:
          status === ProductionOrderStatus.IN_PROGRESS ||
          status === ProductionOrderStatus.COMPLETED
            ? daysFromNow(-5)
            : null,
        completedAt:
          status === ProductionOrderStatus.COMPLETED ? daysFromNow(-1) : null,
        delayedAt: status === ProductionOrderStatus.DELAYED ? daysFromNow(-2) : null,
        delayReason:
          status === ProductionOrderStatus.DELAYED
            ? 'Demo delayed by upstream drawing revision'
            : null,
        metadata: {
          source: PREFIX,
          readinessTarget: 100,
        },
      },
    });

    await prisma.productionStage.createMany({
      data: [
        {
          productionOrderId: order.id,
          code: ProductionStageCode.CUTTING,
          name: 'Cutting',
          sequence: 1,
          status:
            status === ProductionOrderStatus.PLANNED
              ? ProductionStageStatus.READY
              : ProductionStageStatus.COMPLETED,
          plannedStartAt: daysFromNow(-8 + index),
          plannedEndAt: daysFromNow(-7 + index),
        },
        {
          productionOrderId: order.id,
          code: ProductionStageCode.ASSEMBLY,
          name: 'Assembly',
          sequence: 2,
          status:
            status === ProductionOrderStatus.COMPLETED
              ? ProductionStageStatus.COMPLETED
              : status === ProductionOrderStatus.IN_PROGRESS
                ? ProductionStageStatus.COMPLETED
                : ProductionStageStatus.PENDING,
          plannedStartAt: daysFromNow(-6 + index),
          plannedEndAt: daysFromNow(-5 + index),
        },
        {
          productionOrderId: order.id,
          code: ProductionStageCode.WELDING,
          name: 'Welding',
          sequence: 3,
          status:
            status === ProductionOrderStatus.COMPLETED
              ? ProductionStageStatus.COMPLETED
              : status === ProductionOrderStatus.IN_PROGRESS
                ? ProductionStageStatus.IN_PROGRESS
                : ProductionStageStatus.PENDING,
          plannedStartAt: daysFromNow(-4 + index),
          plannedEndAt: daysFromNow(-3 + index),
        },
        {
          productionOrderId: order.id,
          code: ProductionStageCode.PAINTING,
          name: 'Painting',
          sequence: 4,
          status:
            status === ProductionOrderStatus.COMPLETED
              ? ProductionStageStatus.COMPLETED
              : ProductionStageStatus.PENDING,
          plannedStartAt: daysFromNow(-2 + index),
          plannedEndAt: daysFromNow(index),
        },
      ],
    });

    const reservation = await prisma.productionMaterialReservation.create({
      data: {
        reservationNo: `${PREFIX}-RSV-${no}`,
        productionOrderId: order.id,
        bomId: bom.id,
        status: ProductionMaterialReservationStatus.ISSUED,
        reservedAt: daysFromNow(-6),
        note: 'Sprint 20A.5 full readiness demo reservation',
      },
    });

    let estimatedMaterialCost = 0;
    let actualMaterialCost = 0;

    for (const bomItem of bom.items) {
      const material = materials.find((row) => row.item.id === bomItem.materialId);
      if (!material) continue;

      const requiredQty =
        bomItem.quantity * (1 + bomItem.wastePercent / 100) * orderQty;
      const returnedQty = requiredQty * 0.05;
      const consumedQty = requiredQty * 0.9;
      const scrapQty = requiredQty * 0.05;
      const prodZoneIndex = index % 4;
      const slotId = `P${pad((index % 6) + 1)}`;
      const level = `L${(index % 4) + 1}`;
      const productionZone = await prisma.warehouseZone.findUniqueOrThrow({
        where: { code: `${PREFIX}-PROD-${pad(prodZoneIndex + 1)}` },
      });
      const productionWarehouseId = productionZone.warehouseId ?? undefined;
      const line = await prisma.productionMaterialReservationLine.create({
        data: {
          reservationId: reservation.id,
          inventoryItemId: bomItem.materialId,
          bomItemId: bomItem.id,
          warehouseId: productionWarehouseId,
          zoneId: productionZone.id,
          slotId,
          level,
          requiredQty,
          reservedQty: requiredQty,
          issuedQty: requiredQty,
          returnedQty,
          status: ProductionMaterialReservationLineStatus.FULFILLED,
        },
      });
      const issue = await prisma.productionMaterialIssue.create({
        data: {
          issueNo: `${PREFIX}-ISS-${no}-${material.item.code.slice(-2)}`,
          productionOrderId: order.id,
          reservationId: reservation.id,
          reservationLineId: line.id,
          inventoryItemId: bomItem.materialId,
          warehouseId: productionWarehouseId,
          zoneId: productionZone.id,
          slotId,
          level,
          issuedQty: requiredQty,
          returnedQty,
          issuedDate: daysFromNow(-4),
          status: 'ISSUED',
          remarks: 'Sprint 20A.5 demo material issue',
        },
      });
      await prisma.productionMaterialConsumption.create({
        data: {
          productionOrderId: order.id,
          inventoryItemId: bomItem.materialId,
          issuedQty: requiredQty,
          consumedQty,
          scrapQty,
          returnedQty,
          remark: 'Sprint 20A.5 reconciled consumption',
        },
      });
      await prisma.productionMaterialLedger.createMany({
        data: [
          {
            productionOrderId: order.id,
            reservationId: reservation.id,
            inventoryItemId: bomItem.materialId,
            warehouseId: productionWarehouseId,
            zoneId: productionZone.id,
            slotId,
            level,
            quantity: requiredQty,
            eventType: ProductionMaterialLedgerEventType.RESERVE,
            remark: 'Sprint 20A.5 reserve',
          },
          {
            productionOrderId: order.id,
            reservationId: reservation.id,
            inventoryItemId: bomItem.materialId,
            warehouseId: productionWarehouseId,
            zoneId: productionZone.id,
            slotId,
            level,
            quantity: requiredQty,
            eventType: ProductionMaterialLedgerEventType.ISSUE,
            remark: 'Sprint 20A.5 issue',
          },
          {
            productionOrderId: order.id,
            reservationId: reservation.id,
            inventoryItemId: bomItem.materialId,
            warehouseId: productionWarehouseId,
            zoneId: productionZone.id,
            slotId,
            level,
            quantity: consumedQty + scrapQty,
            eventType: ProductionMaterialLedgerEventType.CONSUME,
            remark: 'Sprint 20A.5 consume',
          },
        ],
      });

      const lineCost = requiredQty * material.unitPrice;
      estimatedMaterialCost += lineCost;
      actualMaterialCost += lineCost;
      material.issuedQty += requiredQty;

      await prisma.inventoryTransaction.create({
        data: {
          code: `${PREFIX}-XK-${issue.issueNo}`,
          transactionNo: `${PREFIX}-XK-${issue.issueNo}`,
          type: TransactionType.EXPORT,
          direction: 'OUTBOUND',
          referenceModule: 'production_material_issue',
          referenceId: issue.id,
          warehouseId: productionWarehouseId,
          zoneId: productionZone.id,
          remarks: `Demo issue for ${order.orderNo}`,
          transactionDate: daysFromNow(-4),
          items: {
            create: [
              {
                inventoryItemId: bomItem.materialId,
                quantity: -requiredQty,
                unitPrice: material.unitPrice,
                totalAmount: requiredQty * material.unitPrice,
                unitId: material.item.unitId,
                warehouseId: productionWarehouseId,
                zoneId: productionZone.id,
                slotId,
                level,
              },
            ],
          },
        },
      });
    }

    const laborCost = actualMaterialCost * 0.08;
    const machineCost = actualMaterialCost * 0.06;
    const overheadCost = actualMaterialCost * 0.04;
    const estimatedCost = estimatedMaterialCost;
    const actualCost = actualMaterialCost + laborCost + machineCost + overheadCost;

    await prisma.componentCosting.create({
      data: {
        componentId: component.id,
        productionOrderId: order.id,
        estimatedMaterialCost,
        actualMaterialCost,
        laborCost,
        machineCost,
        overheadCost,
        estimatedCost,
        actualCost,
        varianceCost: actualCost - estimatedCost,
      },
    });
    await prisma.component.update({
      where: { id: component.id },
      data: {
        estimatedCost,
        actualCost,
      },
    });
    await prisma.componentTimeline.create({
      data: {
        componentId: component.id,
        action: ComponentStatus.READY,
        note: `${order.orderNo} demo costing and readiness seeded`,
      },
    });
    await prisma.productionLog.create({
      data: {
        productionOrderId: order.id,
        type: 'NOTE',
        message: 'Sprint 20A.5 demo order seeded with full material readiness',
        quantity: orderQty,
      },
    });

    results.push({
      componentId: component.id,
      orderId: order.id,
      actualCost,
      estimatedCost,
    });
  }

  return results;
}

async function seedInventoryMovementsAndBalances(
  materials: MaterialSeed[],
  suppliers: Array<{ id: string }>,
  mainWarehouseId: string,
  productionWarehouseId: string,
  mainZoneId: string,
  productionZoneId: string,
) {
  for (const [index, material] of materials.entries()) {
    const no = pad(index + 1);
    material.productionStock = 260 + index * 6;
    material.mainStock = 720 + index * 12;
    material.importQty =
      material.mainStock + material.productionStock + material.issuedQty;

    await prisma.inventoryTransaction.create({
      data: {
        code: `${PREFIX}-NK-${no}`,
        transactionNo: `${PREFIX}-NK-${no}`,
        type: TransactionType.IMPORT,
        direction: 'INBOUND',
        supplierId: suppliers[index % suppliers.length].id,
        warehouseId: mainWarehouseId,
        zoneId: mainZoneId,
        remarks: `Sprint 20A.5 import ${material.item.code}`,
        transactionDate: daysFromNow(-18 + (index % 10)),
        items: {
          create: [
            {
              inventoryItemId: material.item.id,
              quantity: material.importQty,
              unitPrice: material.unitPrice,
              totalAmount: material.importQty * material.unitPrice,
              unitId: material.item.unitId,
              warehouseId: mainWarehouseId,
              zoneId: mainZoneId,
              slotId: `A${pad((index % 6) + 1)}`,
              level: `L${(index % 4) + 1}`,
            },
          ],
        },
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        code: `${PREFIX}-DC-${no}`,
        transactionNo: `${PREFIX}-DC-${no}`,
        type: TransactionType.TRANSFER,
        direction: 'TRANSFER',
        remarks: `Sprint 20A.5 transfer to production ${material.item.code}`,
        transactionDate: daysFromNow(-12 + (index % 6)),
        items: {
          create: [
            {
              inventoryItemId: material.item.id,
              quantity: -(material.productionStock + material.issuedQty),
              unitPrice: material.unitPrice,
              totalAmount: (material.productionStock + material.issuedQty) * material.unitPrice,
              unitId: material.item.unitId,
              warehouseId: mainWarehouseId,
              zoneId: mainZoneId,
              slotId: `A${pad((index % 6) + 1)}`,
              level: `L${(index % 4) + 1}`,
            },
            {
              inventoryItemId: material.item.id,
              quantity: material.productionStock + material.issuedQty,
              unitPrice: material.unitPrice,
              totalAmount: (material.productionStock + material.issuedQty) * material.unitPrice,
              unitId: material.item.unitId,
              warehouseId: productionWarehouseId,
              zoneId: productionZoneId,
              slotId: `P${pad((index % 6) + 1)}`,
              level: `L${(index % 4) + 1}`,
            },
          ],
        },
      },
    });

    await prisma.inventoryLocationStock.createMany({
      data: [
        {
          inventoryItemId: material.item.id,
          warehouseId: mainWarehouseId,
          zoneId: mainZoneId,
          slotId: `A${pad((index % 6) + 1)}`,
          level: `L${(index % 4) + 1}`,
          quantity: material.mainStock,
        },
        {
          inventoryItemId: material.item.id,
          warehouseId: productionWarehouseId,
          zoneId: productionZoneId,
          slotId: `P${pad((index % 6) + 1)}`,
          level: `L${(index % 4) + 1}`,
          quantity: material.productionStock,
        },
      ],
    });

    await prisma.inventoryItem.update({
      where: { id: material.item.id },
      data: {
        quantity: material.mainStock + material.productionStock,
      },
    });
  }
}

async function verifyDataset() {
  const [
    suppliers,
    projects,
    inventoryItems,
    components,
    boms,
    productionOrders,
    costings,
    reservations,
    issues,
    consumptions,
    locationStocks,
  ] = await Promise.all([
    prisma.supplier.count({ where: { code: { startsWith: `${PREFIX}-` } } }),
    prisma.project.count({ where: { code: { startsWith: `${PREFIX}-` } } }),
    prisma.inventoryItem.count({ where: { code: { startsWith: `${PREFIX}-` } } }),
    prisma.component.count({ where: { code: { startsWith: `${PREFIX}-` } } }),
    prisma.bOM.count({ where: { bomNo: { startsWith: `${PREFIX}-` } } }),
    prisma.productionOrder.count({ where: { orderNo: { startsWith: `${PREFIX}-` } } }),
    prisma.componentCosting.count({
      where: { component: { code: { startsWith: `${PREFIX}-` } } },
    }),
    prisma.productionMaterialReservation.count({
      where: { reservationNo: { startsWith: `${PREFIX}-` } },
    }),
    prisma.productionMaterialIssue.count({
      where: { issueNo: { startsWith: `${PREFIX}-` } },
    }),
    prisma.productionMaterialConsumption.count({
      where: { productionOrder: { orderNo: { startsWith: `${PREFIX}-` } } },
    }),
    prisma.inventoryLocationStock.count({
      where: { inventoryItem: { code: { startsWith: `${PREFIX}-` } } },
    }),
  ]);

  const readinessRows = await prisma.$queryRaw<Array<{ ready_count: bigint }>>`
    SELECT COUNT(*)::bigint AS ready_count
    FROM production_orders po
    WHERE po."orderNo" LIKE ${`${PREFIX}-%`}
      AND COALESCE((
        SELECT SUM(bi.quantity * (1 + bi."wastePercent" / 100.0) * po.quantity)
        FROM "BOMItem" bi
        WHERE bi."bomId" = po."bomId"
      ), 0) <= COALESCE((
        SELECT SUM(pmi."issuedQty")
        FROM "ProductionMaterialIssue" pmi
        WHERE pmi."productionOrderId" = po.id
      ), 0)
  `;

  return {
    suppliers,
    projects,
    inventoryItems,
    components,
    boms,
    productionOrders,
    reservations,
    issues,
    consumptions,
    locationStocks,
    componentsWithCosting: costings,
    workOrdersWithFullReadiness: Number(readinessRows[0]?.ready_count ?? 0),
  };
}

async function main() {
  console.log('[Sprint 20A.5] Purging transactional data...');
  await purgeTransactionalData();

  console.log('[Sprint 20A.5] Seeding masters and demo dataset...');
  const masters = await ensureMasters();
  const suppliers = await seedSuppliers();
  const projects = await seedProjects();
  const items = await seedInventoryItems(
    masters.category.id,
    masters.materialType.id,
    masters.unit.id,
    masters.mainZones[0].id,
  );
  const materials: MaterialSeed[] = items.map((item, index) => ({
    item,
    unitPrice: 13_500_000 + index * 275_000,
    importQty: 0,
    mainStock: 0,
    productionStock: 0,
    issuedQty: 0,
  }));
  const components = await seedComponents(projects);
  await seedBomsAndOrders(components, materials);
  await seedInventoryMovementsAndBalances(
    materials,
    suppliers,
    masters.mainWarehouse.id,
    masters.productionWarehouse.id,
    masters.mainZones[0].id,
    masters.productionZones[0].id,
  );

  const verification = await verifyDataset();
  console.log('[Sprint 20A.5] Verification:', verification);

  if (
    verification.suppliers !== 20 ||
    verification.projects !== 20 ||
    verification.inventoryItems !== 20 ||
    verification.components !== 20 ||
    verification.boms !== 20 ||
    verification.productionOrders !== 20 ||
    verification.componentsWithCosting !== 20 ||
    verification.workOrdersWithFullReadiness !== 20
  ) {
    throw new Error('Sprint 20A.5 demo dataset verification failed');
  }
}

main()
  .catch((error) => {
    console.error('[Sprint 20A.5] Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
