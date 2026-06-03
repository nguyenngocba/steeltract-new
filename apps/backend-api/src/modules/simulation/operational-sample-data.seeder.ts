import { Injectable } from '@nestjs/common';

import {
  AnalyticsAlertSeverity,
  AnalyticsDomain,
  BackgroundJobStatus,
  ComponentStatus,
  MachineStatus,
  ProductionOrderStatus,
  PurchaseOrderStatus,
  QcChecklistType,
  TaskPriority,
  TransactionType,
  WorkflowDefinitionStatus,
  WorkflowStepType,
  WorkerStatus,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

import type { OperationalSeedResult } from './simulation.types';

const legacyDemoPrefix = 'DEMO';
const operationalPrefix = 'ST';

@Injectable()
export class OperationalSampleDataSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(reset = false): Promise<OperationalSeedResult> {
    if (reset) {
      await this.reset();
    }

    const zones = await this.seedWarehouseZones();
    const suppliers = await this.seedSuppliers();
    const category = await this.seedInventoryCategory();
    const inventoryItems = await this.seedInventory(category.id, zones[0]?.id);
    const workers = await this.seedWorkers();
    const projects = await this.seedProjects();
    await this.seedInventoryTransactions(
      inventoryItems,
      suppliers,
      projects,
      zones[0]?.id,
    );
    const components = await this.seedComponents(projects);
    await this.seedPurchaseOrders(projects);
    await this.seedSupplierScores();
    await this.seedWorkflowDefinitions();
    const workCenters = await this.seedWorkCenters();
    const machines = await this.seedMachines(workCenters);
    const productionOrders = await this.seedProductionOrders(
      projects,
      components,
      workCenters,
      machines,
      workers,
    );
    const qcChecklists = await this.seedQcChecklists();
    await this.seedQcInspections(qcChecklists, productionOrders, components);
    const yardSlots = await this.seedYard(components);
    await this.seedJobsAndNotifications();
    await this.seedAnalytics();

    return {
      projects: projects.length,
      components: components.length,
      inventoryItems: inventoryItems.length,
      yardSlots,
      productionOrders: productionOrders.length,
      qcChecklists: qcChecklists.length,
      workers: workers.length,
    };
  }

  async reset() {
    await this.prisma.$transaction(async (tx) => {
      for (const prefix of [operationalPrefix, legacyDemoPrefix]) {
        const keyPrefix = prefix === legacyDemoPrefix ? 'demo.' : 'steeltrack.';
        const eventPrefix =
          prefix === legacyDemoPrefix ? 'demo' : 'steeltrack';

        await tx.activityLog.deleteMany({
          where: { module: { startsWith: prefix } },
        });
        await tx.analyticsAlert.deleteMany({
          where: { key: { startsWith: keyPrefix } },
        });
        await tx.analyticsMetric.deleteMany({
          where: { key: { startsWith: keyPrefix } },
        });
        await tx.analyticsSnapshot.deleteMany({
          where: { snapshotType: { startsWith: eventPrefix } },
        });
        await tx.notification.deleteMany({
          where: { type: { startsWith: eventPrefix } },
        });
        await tx.jobExecution.deleteMany({
          where: { job: { name: { startsWith: prefix } } },
        });
        await tx.backgroundJob.deleteMany({
          where: { name: { startsWith: prefix } },
        });
        await tx.nonConformanceReport.deleteMany({
          where: { ncrNo: { startsWith: prefix } },
        });
        await tx.qcIssue.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.qcResult.deleteMany({
          where: { inspection: { inspectionNo: { startsWith: prefix } } },
        });
        await tx.qcInspection.deleteMany({
          where: { inspectionNo: { startsWith: prefix } },
        });
        await tx.qcChecklist.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.yardSnapshot.deleteMany({
          where: { name: { startsWith: prefix } },
        });
        await tx.yardMovement.deleteMany({
          where: { itemCode: { startsWith: prefix } },
        });
        await tx.yardItemPlacement.deleteMany({
          where: { itemCode: { startsWith: prefix } },
        });
        await tx.yardSlot.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.yardRow.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.yardZone.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.crane.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.productionLog.deleteMany({
          where: { productionOrder: { orderNo: { startsWith: prefix } } },
        });
        await tx.productionTask.deleteMany({
          where: { productionOrder: { orderNo: { startsWith: prefix } } },
        });
        await tx.productionStage.deleteMany({
          where: { productionOrder: { orderNo: { startsWith: prefix } } },
        });
        await tx.productionSchedule.deleteMany({
          where: { productionOrder: { orderNo: { startsWith: prefix } } },
        });
        await tx.productionOrder.deleteMany({
          where: { orderNo: { startsWith: prefix } },
        });
        await tx.machine.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.workCenter.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.workflowAction.deleteMany({
          where: { instance: { referenceId: { startsWith: prefix } } },
        });
        await tx.workflowInstance.deleteMany({
          where: { referenceId: { startsWith: prefix } },
        });
        await tx.workflowDefinition.deleteMany({
          where: { key: { startsWith: keyPrefix } },
        });
        await tx.inventoryTransactionItem.deleteMany({
          where: {
            transaction: { code: { startsWith: prefix } },
          },
        });
        await tx.inventoryTransaction.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        // Inventory items can be referenced by production issues, BOMs and
        // historical transactions, so keep the master records and refresh them
        // through upsert during bootstrap.
        // Keep warehouse zones and categories because downstream material
        // types and inventory records may still reference them.
        await tx.task.deleteMany({
          where: { title: { startsWith: prefix } },
        });
        await tx.component.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.project.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrder: { poNumber: { startsWith: prefix } } },
        });
        await tx.purchaseOrder.deleteMany({
          where: { poNumber: { startsWith: prefix } },
        });
        await tx.supplierScore.deleteMany({
          where: {
            OR: [
              { supplierName: { startsWith: prefix } },
              { id: { startsWith: eventPrefix } },
            ],
          },
        });
        await tx.supplier.deleteMany({
          where: { code: { startsWith: prefix } },
        });
        await tx.worker.deleteMany({
          where: { employeeCode: { startsWith: prefix } },
        });
      }
    });
  }

  private seedWarehouseZones() {
    return Promise.all(
      [
        ['ST-WH-RAW', 'Raw Material Warehouse'],
        ['ST-WH-FAB', 'Fabrication Buffer'],
      ].map(([code, name]) =>
        this.prisma.warehouseZone.upsert({
          where: { code },
          create: { code, name, color: '#06b6d4' },
          update: {},
        }),
      ),
    );
  }

  private seedInventoryCategory() {
    return this.prisma.inventoryCategory.upsert({
      where: { code: 'ST-STEEL' },
      create: {
        code: 'ST-STEEL',
        name: 'SteelTrack Structural Steel',
        description: 'Operational structural steel material category',
      },
      update: {},
    });
  }

  private seedInventory(categoryId: string, zoneId?: string) {
    const items = [
      ['ST-MAT-HB200', 'H-Beam 200x200 SS400', 'ton', 18],
      ['ST-MAT-HB250', 'H-Beam 250x250 SS400', 'ton', 22],
      ['ST-MAT-I200', 'I-Beam 200 SS400', 'ton', 15],
      ['ST-MAT-PL12', 'Steel Plate 12mm SS400', 'sheet', 60],
      ['ST-MAT-PL20', 'Steel Plate 20mm SS400', 'sheet', 45],
    ] as const;

    return Promise.all(
      items.map(([code, name, unit, minimumStock]) =>
        this.prisma.inventoryItem.upsert({
          where: { code },
          create: {
            code,
            name,
            unit,
            quantity: 0,
            minimumStock,
            categoryId,
            zoneId,
          },
          update: { minimumStock, zoneId },
        }),
      ),
    );
  }

  private seedSuppliers() {
    const suppliers = [
        ['ST-SUP-STEEL-01', 'Hoa Phat Steel'],
        ['ST-SUP-STEEL-02', 'Pomina Steel'],
        ['ST-SUP-STEEL-03', 'Vina Kyoei Steel'],
    ] as const;

    return Promise.all(
      suppliers.map(([code, name], index) =>
        this.prisma.supplier.upsert({
          where: { code },
          create: {
            code,
            name,
            contact: ['Nguyen Minh Quan', 'Tran Anh Duy', 'Le Hoang Phuc'][
              index
            ],
            phone: `09000000${index + 1}`,
            email: `supplier-${index + 1}@steeltrack.local`,
            address: [
              'Hoa Phat Dung Quat Industrial Zone',
              'Song Than Industrial Zone, Binh Duong',
              'Phu My Industrial Zone, Ba Ria Vung Tau',
            ][index],
          },
          update: {},
        }),
      ),
    );
  }

  private async seedInventoryTransactions(
    inventoryItems: Array<{ id: string; code: string }>,
    suppliers: Array<{ id: string }>,
    projects: Array<{ id: string }>,
    zoneId?: string,
  ) {
    const itemByCode = new Map(
      inventoryItems.map((item) => [item.code, item]),
    );

    const inboundSeeds = [
      ['ST-MAT-HB200', 40, 15200000, 608000000, 0],
      ['ST-MAT-HB250', 35, 15800000, 553000000, 1],
      ['ST-MAT-I200', 30, 14900000, 447000000, 2],
      ['ST-MAT-PL12', 120, 4200000, 504000000, 0],
      ['ST-MAT-PL20', 90, 5300000, 477000000, 1],
    ] as const;

    const outboundSeeds = [
      ['ST-MAT-HB200', 12, 15200000, 182400000, 0],
      ['ST-MAT-HB250', 10, 15800000, 158000000, 1],
      ['ST-MAT-I200', 8, 14900000, 119200000, 0],
      ['ST-MAT-PL12', 30, 4200000, 126000000, 1],
      ['ST-MAT-PL20', 20, 5300000, 106000000, 0],
    ] as const;

    for (const [index, seed] of inboundSeeds.entries()) {
      const [code, quantity, unitPrice, totalAmount, supplierIndex] = seed;
      const item = itemByCode.get(code);
      if (!item) continue;

      await this.prisma.inventoryTransaction.upsert({
        where: {
          code: `ST-TXN-IN-${index + 1}`,
        },
        create: {
          code: `ST-TXN-IN-${index + 1}`,
          transactionNo: `ST-IN-${String(index + 1).padStart(3, '0')}`,
          type: TransactionType.IMPORT,
          direction: 'INBOUND',
          supplierId: suppliers[supplierIndex % suppliers.length]?.id,
          zoneId,
          remarks: `Inbound steel receipt ${code}`,
          items: {
            create: [
              {
                inventoryItemId: item.id,
                quantity,
                unitPrice,
                totalAmount,
                zoneId,
              },
            ],
          },
        },
        update: {
          transactionNo: `ST-IN-${String(index + 1).padStart(3, '0')}`,
          type: TransactionType.IMPORT,
          direction: 'INBOUND',
          supplierId: suppliers[supplierIndex % suppliers.length]?.id,
          zoneId,
          remarks: `Inbound steel receipt ${code}`,
          items: {
            deleteMany: {},
            create: [
              {
                inventoryItemId: item.id,
                quantity,
                unitPrice,
                totalAmount,
                zoneId,
              },
            ],
          },
        },
      });
    }

    for (const [index, seed] of outboundSeeds.entries()) {
      const [code, quantity, unitPrice, totalAmount, projectIndex] = seed;
      const item = itemByCode.get(code);
      if (!item) continue;

      await this.prisma.inventoryTransaction.upsert({
        where: {
          code: `ST-TXN-OUT-${index + 1}`,
        },
        create: {
          code: `ST-TXN-OUT-${index + 1}`,
          transactionNo: `ST-OUT-${String(index + 1).padStart(3, '0')}`,
          type: TransactionType.EXPORT,
          direction: 'OUTBOUND',
          projectId: projects[projectIndex % projects.length]?.id,
          zoneId,
          remarks: `Outbound project issue ${code}`,
          items: {
            create: [
              {
                inventoryItemId: item.id,
                quantity: -Math.abs(quantity),
                unitPrice,
                totalAmount: -Math.abs(totalAmount),
                zoneId,
              },
            ],
          },
        },
        update: {
          transactionNo: `ST-OUT-${String(index + 1).padStart(3, '0')}`,
          type: TransactionType.EXPORT,
          direction: 'OUTBOUND',
          projectId: projects[projectIndex % projects.length]?.id,
          zoneId,
          remarks: `Outbound project issue ${code}`,
          items: {
            deleteMany: {},
            create: [
              {
                inventoryItemId: item.id,
                quantity: -Math.abs(quantity),
                unitPrice,
                totalAmount: -Math.abs(totalAmount),
                zoneId,
              },
            ],
          },
        },
      });
    }

    // Keep legacy quantity snapshot in sync for existing modules.
    for (const item of inventoryItems) {
      const aggregate =
        await this.prisma.inventoryTransactionItem.aggregate({
          where: {
            inventoryItemId: item.id,
            transaction: {
              code: {
                startsWith: 'ST-TXN-',
              },
            },
          },
          _sum: {
            quantity: true,
          },
        });

      await this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: Number(aggregate._sum.quantity ?? 0),
        },
      });
    }
  }

  private seedWorkers() {
    return Promise.all(
      [
        ['ST-WKR-001', 'Nguyen Van An', 'Cutting Operator', 'Cutting'],
        ['ST-WKR-002', 'Tran Minh Khoa', 'Welder', 'Welding'],
        ['ST-WKR-003', 'Le Thu Ha', 'QC Inspector', 'QC'],
        ['ST-WKR-004', 'Pham Duc Long', 'Yard Coordinator', 'Logistics'],
      ].map(([employeeCode, fullName, position, team]) =>
        this.prisma.worker.upsert({
          where: { employeeCode },
          create: {
            employeeCode,
            fullName,
            position,
            team,
            skill: position,
            status: WorkerStatus.ACTIVE,
          },
          update: { status: WorkerStatus.ACTIVE },
        }),
      ),
    );
  }

  private seedProjects() {
    return Promise.all(
      [
        ['ST-PRJ-TOWER-A', 'Saigon Tower A'],
        ['ST-PRJ-PLANT-B', 'Industrial Plant B'],
      ].map(([code, name]) =>
        this.prisma.project.upsert({
          where: { code },
          create: {
            code,
            name,
            description: 'SteelTrack steel fabrication project',
            status: 'ACTIVE',
          },
          update: { status: 'ACTIVE' },
        }),
      ),
    );
  }

  private seedComponents(projects: Array<{ id: string; code: string }>) {
    const components = Array.from({ length: 12 }, (_, index) => {
      const project = projects[index % projects.length];

      return {
        code: `ST-CMP-${String(index + 1).padStart(3, '0')}`,
        name: `Column Assembly ${index + 1}`,
        projectId: project.id,
        floor: `L${(index % 5) + 1}`,
        zone: `Z${(index % 3) + 1}`,
        position: `GRID-${index + 1}`,
        status:
          index % 4 === 0
            ? ComponentStatus.WELDING
            : index % 4 === 1
              ? ComponentStatus.PAINTING
              : ComponentStatus.STOCK,
        estimatedCost: 1200 + index * 180,
      };
    });

    return Promise.all(
      components.map((component) =>
        this.prisma.component.upsert({
          where: { code: component.code },
          create: component,
          update: {
            status: component.status,
            projectId: component.projectId,
          },
        }),
      ),
    );
  }

  private seedPurchaseOrders(projects: Array<{ name: string }>) {
    return Promise.all(
      [1, 2, 3].map((index) =>
        this.prisma.purchaseOrder.upsert({
          where: { poNumber: `ST-PO-${index}` },
          create: {
            poNumber: `ST-PO-${index}`,
            supplierName: [
              'Hoa Phat Steel',
              'Pomina Steel',
              'Vina Kyoei Steel',
            ][index - 1],
            projectName: projects[index % projects.length]?.name,
            requestedBy: 'Production Planning',
            status:
              index === 1
                ? PurchaseOrderStatus.APPROVED
                : PurchaseOrderStatus.PENDING,
            totalAmount: 75_000 + index * 15_000,
            items: {
              create: [
                {
                  itemName: 'Structural steel package',
                  quantity: 24 + index * 4,
                  unitPrice: 950,
                  totalPrice: (24 + index * 4) * 950,
                },
              ],
            },
          },
          update: {},
        }),
      ),
    );
  }

  private seedSupplierScores() {
    return Promise.all(
      [1, 2, 3].map((index) =>
        this.prisma.supplierScore.upsert({
          where: { id: `steeltrack-supplier-score-${index}` },
          create: {
            id: `steeltrack-supplier-score-${index}`,
            supplierName: [
              'Hoa Phat Steel',
              'Pomina Steel',
              'Vina Kyoei Steel',
            ][index - 1],
            quality: 82 + index * 3,
            delivery: 76 + index * 4,
            pricing: 80 + index * 2,
            overall: 80 + index * 3,
          },
          update: {},
        }),
      ),
    );
  }

  private async seedWorkflowDefinitions() {
    const definition = await this.prisma.workflowDefinition.upsert({
      where: { key: 'steeltrack.production.approval' },
      create: {
        key: 'steeltrack.production.approval',
        name: 'SteelTrack Production Approval',
        module: 'simulation',
        status: WorkflowDefinitionStatus.ACTIVE,
      },
      update: {},
    });

    await this.prisma.workflowStep.upsert({
      where: {
        definitionId_key: {
          definitionId: definition.id,
          key: 'supervisor-review',
        },
      },
      create: {
        definitionId: definition.id,
        key: 'supervisor-review',
        name: 'Supervisor Review',
        type: WorkflowStepType.APPROVAL,
        order: 1,
        requiredPermission: 'production.approve',
        slaHours: 4,
      },
      update: {},
    });
  }

  private seedWorkCenters() {
    return Promise.all(
      [
        ['ST-WC-CUT', 'Cutting Bay', 80],
        ['ST-WC-WELD', 'Welding Line', 52],
        ['ST-WC-PAINT', 'Paint Booth', 35],
      ].map(([code, name, capacityPerDay]) =>
        this.prisma.workCenter.upsert({
          where: { code: String(code) },
          create: {
            code: String(code),
            name: String(name),
            capacityPerDay: Number(capacityPerDay),
          },
          update: {},
        }),
      ),
    );
  }

  private seedMachines(workCenters: Array<{ id: string; code: string }>) {
    const machineInputs = [
      ['ST-MCH-CNC-1', 'CNC Plasma Cutter', 0],
      ['ST-MCH-SAW-1', 'Band Saw', 0],
      ['ST-MCH-WELD-1', 'Robotic Welding Cell', 1],
      ['ST-MCH-PAINT-1', 'Paint Line', 2],
    ] as const;

    return Promise.all(
      machineInputs.map(([code, name, centerIndex]) =>
        this.prisma.machine.upsert({
          where: { code },
          create: {
            code,
            name,
            status: MachineStatus.AVAILABLE,
            utilization: 45 + centerIndex * 12,
            workCenterId: workCenters[centerIndex]?.id,
          },
          update: {
            status: MachineStatus.AVAILABLE,
            workCenterId: workCenters[centerIndex]?.id,
          },
        }),
      ),
    );
  }

  private seedProductionOrders(
    projects: Array<{ id: string }>,
    components: Array<{ id: string; code: string }>,
    workCenters: Array<{ id: string }>,
    machines: Array<{ id: string }>,
    workers: Array<{ id: string }>,
  ) {
    return Promise.all(
      components.slice(0, 6).map((component, index) =>
        this.prisma.productionOrder.upsert({
          where: { orderNo: `ST-POW-${index + 1}` },
          create: {
            orderNo: `ST-POW-${index + 1}`,
            title: `Fabricate ${component.code}`,
            projectId: projects[index % projects.length]?.id,
            componentId: component.id,
            quantity: 1,
            priority: index % 3 === 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
            status:
              index < 3
                ? ProductionOrderStatus.IN_PROGRESS
                : ProductionOrderStatus.PLANNED,
            currentStageCode: index < 3 ? 'CUTTING' : undefined,
            startedAt: index < 3 ? new Date() : undefined,
            stages: {
              create: [
                'CUTTING',
                'ASSEMBLY',
                'WELDING',
                'DRILLING',
                'PAINTING',
                'GALVANIZING',
                'PACKING',
              ].map((code, stageIndex) => ({
                code: code as never,
                name: code,
                sequence: stageIndex + 1,
                status:
                  index < 3 && stageIndex === 0
                    ? 'IN_PROGRESS'
                    : stageIndex === 0
                      ? 'READY'
                      : 'PENDING',
                workCenterId: workCenters[stageIndex % workCenters.length]?.id,
                machineId: machines[stageIndex % machines.length]?.id,
                assignedWorkerId: workers[stageIndex % workers.length]?.id,
              })),
            },
          },
          update: {},
          include: { stages: true },
        }),
      ),
    );
  }

  private seedQcChecklists() {
    return Promise.all(
      [
        ['ST-QC-WELD', 'Welding Inspection', QcChecklistType.WELDING],
        ['ST-QC-DIM', 'Dimensional Check', QcChecklistType.DIMENSIONAL],
      ].map(([code, name, type]) =>
        this.prisma.qcChecklist.upsert({
          where: { code: String(code) },
          create: {
            code: String(code),
            name: String(name),
            type: type as QcChecklistType,
            revision: 'A',
            items: {
              create: [
                {
                  sequence: 1,
                  title: 'Visual condition accepted',
                  expectedValue: 'PASS',
                },
                {
                  sequence: 2,
                  title: 'Tolerance within specification',
                  tolerance: '+/- 2mm',
                },
              ],
            },
          },
          update: {},
        }),
      ),
    );
  }

  private async seedQcInspections(
    checklists: Array<{ id: string }>,
    orders: Array<{ id: string; componentId: string | null }>,
    components: Array<{ id: string }>,
  ) {
    await Promise.all(
      orders.slice(0, 4).map((order, index) =>
        this.prisma.qcInspection.upsert({
          where: { inspectionNo: `ST-QCI-${index + 1}` },
          create: {
            inspectionNo: `ST-QCI-${index + 1}`,
            checklistId: checklists[index % checklists.length]?.id,
            productionOrderId: order.id,
            componentId: order.componentId ?? components[index]?.id,
            status: index === 0 ? 'IN_PROGRESS' : 'READY',
            startedAt: index === 0 ? new Date() : undefined,
          },
          update: {},
        }),
      ),
    );
  }

  private async seedYard(
    components: Array<{ id: string; code: string; name: string }>,
  ) {
    const zoneSeeds = [
      ['A', 'Zone A · Dầm chính', '#22c55e'],
      ['B', 'Zone B · Cột', '#06b6d4'],
      ['C', 'Zone C · Giằng', '#8b5cf6'],
      ['D', 'Zone D · Bản mã', '#f59e0b'],
      ['E', 'Zone E · Chờ giao', '#3b82f6'],
      ['F', 'Zone F · Hàng lỗi', '#ef4444'],
    ];
    const zones = await Promise.all(zoneSeeds.map(([suffix, name, color], index) =>
      this.prisma.yardZone.upsert({
        where: { code: `ST-YARD-${suffix}` },
        create: { code: `ST-YARD-${suffix}`, name, originX: (index % 3) * 240, originY: Math.floor(index / 3) * 180, width: 220, height: 160, color },
        update: { name, originX: (index % 3) * 240, originY: Math.floor(index / 3) * 180, width: 220, height: 160, color },
      })));
    const cranes = await Promise.all([
      ['ST-CRANE-1', 'Gantry Crane A', 180, 90, 68],
      ['ST-CRANE-2', 'Gantry Crane E', 480, 250, 52],
    ].map(([code, name, currentX, currentY, utilization]) =>
      this.prisma.crane.upsert({
        where: { code: String(code) },
        create: { code: String(code), name: String(name), currentX: Number(currentX), currentY: Number(currentY), utilization: Number(utilization) },
        update: { name: String(name), currentX: Number(currentX), currentY: Number(currentY), utilization: Number(utilization) },
      })));
    const slots = (await Promise.all(zones.flatMap((zone, zoneIndex) =>
      Array.from({ length: 12 }, (_, index) => this.prisma.yardSlot.upsert({
        where: { zoneId_code: { zoneId: zone.id, code: `${zone.code.replace('YARD-', '')}-${String(index + 1).padStart(2, '0')}` } },
        create: { zoneId: zone.id, code: `${zone.code.replace('YARD-', '')}-${String(index + 1).padStart(2, '0')}`, x: zoneIndex * 100 + (index % 4) * 20, y: Math.floor(index / 4) * 20, maxStackLevel: 4 },
        update: { currentStackLevel: 0, status: 'AVAILABLE' },
      }))))).flat();

    await this.prisma.yardMovement.deleteMany({ where: { itemCode: { startsWith: operationalPrefix } } });
    await this.prisma.yardItemPlacement.deleteMany({ where: { itemCode: { startsWith: operationalPrefix } } });
    await this.prisma.yardSlot.deleteMany({ where: { code: { startsWith: 'ST-SLOT-' } } });
    const placementSlots = [0, 0, 1, 12, 13, 24, 25, 36, 48, 49, 49, 60];
    const placementCounts = new Map<string, number>();
    const placements = await Promise.all(components.slice(0, 12).map((component, index) => {
      const slot = slots[placementSlots[index]];
      const stackLevel = (placementCounts.get(slot.id) ?? 0) + 1;
      placementCounts.set(slot.id, stackLevel);
      return this.prisma.yardItemPlacement.create({
        data: { id: `steeltrack-placement-${index + 1}`, slotId: slot.id, itemType: 'COMPONENT', itemId: component.id, itemCode: component.code, itemName: component.name, quantity: 1, stackLevel, weight: 1.85 + index * 0.42 },
      });
    }));
    await Promise.all(slots.map((slot) => this.prisma.yardSlot.update({
      where: { id: slot.id },
      data: { currentStackLevel: placementCounts.get(slot.id) ?? 0, status: placementCounts.has(slot.id) ? 'OCCUPIED' : 'AVAILABLE' },
    })));
    await Promise.all(placements.map((placement, index) => this.prisma.yardMovement.create({
      data: { placementId: placement.id, type: 'PLACE', itemType: 'COMPONENT', itemId: placement.itemId, itemCode: placement.itemCode, toSlotId: placement.slotId, craneId: cranes[index % cranes.length].id, reason: index % 3 === 0 ? 'QC passed · staged for delivery' : 'Finished structure received from workshop' },
    })));

    return slots.length;
  }

  private async seedJobsAndNotifications() {
    await this.prisma.backgroundJob.upsert({
      where: { idempotencyKey: 'steeltrack-analytics-job' },
      create: {
        name: 'ST-analytics-refresh',
        queue: 'analytics',
        payload: { source: 'simulation' },
        status: BackgroundJobStatus.QUEUED,
        idempotencyKey: 'steeltrack-analytics-job',
      },
      update: {},
    });

    await this.prisma.notification.create({
      data: {
        title: 'SteelTrack operational data ready',
        message: 'Inventory, production, QC, and yard operational data is available.',
        type: 'steeltrack.simulation',
        severity: 'info',
      },
    });
  }

  private async seedAnalytics() {
    await this.prisma.analyticsAlert.create({
      data: {
        domain: AnalyticsDomain.YARD,
        key: 'steeltrack.yard.congestion',
        title: 'SteelTrack yard utilization watch',
        message: 'Yard occupancy is trending upward in zone A.',
        severity: AnalyticsAlertSeverity.WARNING,
        actualValue: 72,
        threshold: 85,
      },
    });
  }
}
