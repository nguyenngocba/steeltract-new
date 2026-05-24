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
  WorkflowDefinitionStatus,
  WorkflowStepType,
  WorkerStatus,
} from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

import type { DemoSeedResult } from './simulation.types';

const demoPrefix = 'DEMO';

@Injectable()
export class DemoDataSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(reset = false): Promise<DemoSeedResult> {
    if (reset) {
      await this.reset();
    }

    const zones = await this.seedWarehouseZones();
    const category = await this.seedInventoryCategory();
    const inventoryItems = await this.seedInventory(category.id, zones[0]?.id);
    const workers = await this.seedWorkers();
    const projects = await this.seedProjects();
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
      await tx.activityLog.deleteMany({
        where: { module: { startsWith: demoPrefix } },
      });
      await tx.analyticsAlert.deleteMany({
        where: { key: { startsWith: 'demo.' } },
      });
      await tx.analyticsMetric.deleteMany({
        where: { key: { startsWith: 'demo.' } },
      });
      await tx.analyticsSnapshot.deleteMany({
        where: { snapshotType: { startsWith: 'demo' } },
      });
      await tx.notification.deleteMany({
        where: { type: { startsWith: 'demo' } },
      });
      await tx.jobExecution.deleteMany({
        where: { job: { name: { startsWith: demoPrefix } } },
      });
      await tx.backgroundJob.deleteMany({
        where: { name: { startsWith: demoPrefix } },
      });
      await tx.nonConformanceReport.deleteMany({
        where: { ncrNo: { startsWith: demoPrefix } },
      });
      await tx.qcIssue.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.qcResult.deleteMany({
        where: { inspection: { inspectionNo: { startsWith: demoPrefix } } },
      });
      await tx.qcInspection.deleteMany({
        where: { inspectionNo: { startsWith: demoPrefix } },
      });
      await tx.qcChecklist.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.yardSnapshot.deleteMany({
        where: { name: { startsWith: demoPrefix } },
      });
      await tx.yardMovement.deleteMany({
        where: { itemCode: { startsWith: demoPrefix } },
      });
      await tx.yardItemPlacement.deleteMany({
        where: { itemCode: { startsWith: demoPrefix } },
      });
      await tx.yardSlot.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.yardRow.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.yardZone.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.crane.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.productionLog.deleteMany({
        where: { productionOrder: { orderNo: { startsWith: demoPrefix } } },
      });
      await tx.productionTask.deleteMany({
        where: { productionOrder: { orderNo: { startsWith: demoPrefix } } },
      });
      await tx.productionStage.deleteMany({
        where: { productionOrder: { orderNo: { startsWith: demoPrefix } } },
      });
      await tx.productionSchedule.deleteMany({
        where: { productionOrder: { orderNo: { startsWith: demoPrefix } } },
      });
      await tx.productionOrder.deleteMany({
        where: { orderNo: { startsWith: demoPrefix } },
      });
      await tx.machine.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.workCenter.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.workflowAction.deleteMany({
        where: { instance: { referenceId: { startsWith: demoPrefix } } },
      });
      await tx.workflowInstance.deleteMany({
        where: { referenceId: { startsWith: demoPrefix } },
      });
      await tx.workflowDefinition.deleteMany({
        where: { key: { startsWith: 'demo.' } },
      });
      await tx.inventoryTransactionItem.deleteMany({
        where: {
          transaction: { code: { startsWith: demoPrefix } },
        },
      });
      await tx.inventoryTransaction.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.inventoryItem.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.inventoryCategory.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.warehouseZone.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.task.deleteMany({
        where: { title: { startsWith: demoPrefix } },
      });
      await tx.component.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.project.deleteMany({
        where: { code: { startsWith: demoPrefix } },
      });
      await tx.purchaseOrder.deleteMany({
        where: { poNumber: { startsWith: demoPrefix } },
      });
      await tx.supplierScore.deleteMany({
        where: { supplierName: { startsWith: demoPrefix } },
      });
      await tx.worker.deleteMany({
        where: { employeeCode: { startsWith: demoPrefix } },
      });
    });
  }

  private seedWarehouseZones() {
    return Promise.all(
      [
        ['DEMO-WH-RAW', 'Raw Material Warehouse'],
        ['DEMO-WH-FAB', 'Fabrication Buffer'],
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
      where: { code: 'DEMO-STEEL' },
      create: {
        code: 'DEMO-STEEL',
        name: 'Demo Structural Steel',
        description: 'Simulation steel material category',
      },
      update: {},
    });
  }

  private seedInventory(categoryId: string, zoneId?: string) {
    const items = [
      ['DEMO-MAT-HB300', 'H-Beam 300x300', 'ton', 120, 25],
      ['DEMO-MAT-PL12', 'Plate 12mm', 'sheet', 340, 60],
      ['DEMO-MAT-BOLT-M20', 'Bolt M20 Grade 8.8', 'box', 95, 40],
      ['DEMO-MAT-PAINT-ZN', 'Zinc Primer', 'drum', 28, 12],
    ] as const;

    return Promise.all(
      items.map(([code, name, unit, quantity, minimumStock]) =>
        this.prisma.inventoryItem.upsert({
          where: { code },
          create: {
            code,
            name,
            unit,
            quantity,
            minimumStock,
            categoryId,
            zoneId,
          },
          update: { quantity, minimumStock, zoneId },
        }),
      ),
    );
  }

  private seedWorkers() {
    return Promise.all(
      [
        ['DEMO-WKR-001', 'Nguyen Van An', 'Cutting Operator', 'Cutting'],
        ['DEMO-WKR-002', 'Tran Minh Khoa', 'Welder', 'Welding'],
        ['DEMO-WKR-003', 'Le Thu Ha', 'QC Inspector', 'QC'],
        ['DEMO-WKR-004', 'Pham Duc Long', 'Yard Coordinator', 'Logistics'],
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
        ['DEMO-PRJ-TOWER-A', 'Saigon Tower A'],
        ['DEMO-PRJ-PLANT-B', 'Industrial Plant B'],
      ].map(([code, name]) =>
        this.prisma.project.upsert({
          where: { code },
          create: {
            code,
            name,
            description: 'Demo steel fabrication project',
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
        code: `DEMO-CMP-${String(index + 1).padStart(3, '0')}`,
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
          where: { poNumber: `DEMO-PO-${index}` },
          create: {
            poNumber: `DEMO-PO-${index}`,
            supplierName: `DEMO Supplier ${index}`,
            projectName: projects[index % projects.length]?.name,
            requestedBy: 'Simulation',
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
          where: { id: `demo-supplier-score-${index}` },
          create: {
            id: `demo-supplier-score-${index}`,
            supplierName: `DEMO Supplier ${index}`,
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
      where: { key: 'demo.production.approval' },
      create: {
        key: 'demo.production.approval',
        name: 'Demo Production Approval',
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
        ['DEMO-WC-CUT', 'Cutting Bay', 80],
        ['DEMO-WC-WELD', 'Welding Line', 52],
        ['DEMO-WC-PAINT', 'Paint Booth', 35],
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
      ['DEMO-MCH-CNC-1', 'CNC Plasma Cutter', 0],
      ['DEMO-MCH-SAW-1', 'Band Saw', 0],
      ['DEMO-MCH-WELD-1', 'Robotic Welding Cell', 1],
      ['DEMO-MCH-PAINT-1', 'Paint Line', 2],
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
          where: { orderNo: `DEMO-POW-${index + 1}` },
          create: {
            orderNo: `DEMO-POW-${index + 1}`,
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
        ['DEMO-QC-WELD', 'Welding Inspection', QcChecklistType.WELDING],
        ['DEMO-QC-DIM', 'Dimensional Check', QcChecklistType.DIMENSIONAL],
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
          where: { inspectionNo: `DEMO-QCI-${index + 1}` },
          create: {
            inspectionNo: `DEMO-QCI-${index + 1}`,
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
    const zone = await this.prisma.yardZone.upsert({
      where: { code: 'DEMO-YARD-A' },
      create: {
        code: 'DEMO-YARD-A',
        name: 'Demo Yard Zone A',
        originX: 0,
        originY: 0,
        width: 720,
        height: 420,
        color: '#06b6d4',
      },
      update: {},
    });
    const crane = await this.prisma.crane.upsert({
      where: { code: 'DEMO-CRANE-1' },
      create: {
        code: 'DEMO-CRANE-1',
        name: 'Gantry Crane 1',
        currentX: 180,
        currentY: 90,
        utilization: 55,
      },
      update: {},
    });

    const slots = await Promise.all(
      Array.from({ length: 72 }, (_, index) => {
        const x = (index % 12) * 52;
        const y = Math.floor(index / 12) * 52;

        return this.prisma.yardSlot.upsert({
          where: {
            zoneId_code: {
              zoneId: zone.id,
              code: `DEMO-SLOT-${String(index + 1).padStart(3, '0')}`,
            },
          },
          create: {
            zoneId: zone.id,
            code: `DEMO-SLOT-${String(index + 1).padStart(3, '0')}`,
            x,
            y,
            width: 1,
            height: 1,
            maxStackLevel: 4,
            currentStackLevel: index < 22 ? 1 : 0,
            status: index < 22 ? 'OCCUPIED' : 'AVAILABLE',
          },
          update: {},
        });
      }),
    );

    await Promise.all(
      components.slice(0, 14).map((component, index) =>
        this.prisma.yardItemPlacement.upsert({
          where: { id: `demo-placement-${index + 1}` },
          create: {
            id: `demo-placement-${index + 1}`,
            slotId: slots[index].id,
            itemType: 'COMPONENT',
            itemId: component.id,
            itemCode: component.code,
            itemName: component.name,
            quantity: 1,
            stackLevel: 1,
          },
          update: {},
        }),
      ),
    );

    await this.prisma.yardMovement.create({
      data: {
        type: 'PLACE',
        itemType: 'COMPONENT',
        itemId: components[0]?.id ?? 'demo',
        itemCode: components[0]?.code ?? 'DEMO-CMP-001',
        toSlotId: slots[0]?.id,
        craneId: crane.id,
        reason: 'Demo bootstrap placement',
      },
    });

    return slots.length;
  }

  private async seedJobsAndNotifications() {
    await this.prisma.backgroundJob.upsert({
      where: { idempotencyKey: 'demo-analytics-job' },
      create: {
        name: 'DEMO-analytics-refresh',
        queue: 'analytics',
        payload: { source: 'simulation' },
        status: BackgroundJobStatus.QUEUED,
        idempotencyKey: 'demo-analytics-job',
      },
      update: {},
    });

    await this.prisma.notification.create({
      data: {
        title: 'DEMO factory simulation ready',
        message: 'Operational demo ecosystem is available.',
        type: 'demo.simulation',
        severity: 'info',
      },
    });
  }

  private async seedAnalytics() {
    await this.prisma.analyticsAlert.create({
      data: {
        domain: AnalyticsDomain.YARD,
        key: 'demo.yard.congestion',
        title: 'Demo yard utilization watch',
        message: 'Yard occupancy is trending upward in zone A.',
        severity: AnalyticsAlertSeverity.WARNING,
        actualValue: 72,
        threshold: 85,
      },
    });
  }
}
