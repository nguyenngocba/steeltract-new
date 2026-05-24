import { Injectable } from '@nestjs/common';

import {
  AnalyticsDomain,
  MachineStatus,
  ProductionOrderStatus,
  QcInspectionStatus,
  QcIssueSeverity,
  QcIssueStatus,
  QcResultStatus,
  NcrStatus,
  YardItemType,
} from '@prisma/client';

import { EventBusService } from '../../core/events/event-bus.service';
import { JobSchedulerService } from '../../core/jobs/job-scheduler.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AnalyticsEngineService } from '../analytics-engine/services/analytics-engine.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProductionService } from '../production/services/production.service';
import { QcService } from '../qc/services/qc.service';
import { YardService } from '../yard/services/yard.service';

import type {
  SimulationMode,
  SimulationScenarioId,
} from './dto/simulation.dto';

@Injectable()
export class SimulationScenarioRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly productionService: ProductionService,
    private readonly qcService: QcService,
    private readonly yardService: YardService,
    private readonly analyticsService: AnalyticsEngineService,
    private readonly jobScheduler: JobSchedulerService,
    private readonly eventBus: EventBusService,
  ) {}

  async run(
    scenarioId: SimulationScenarioId,
    tick: number,
    mode: SimulationMode,
  ) {
    const random = this.random(mode, tick);

    switch (scenarioId) {
      case 'congestion':
        return this.runCongestion(tick, random);
      case 'qc-failure-spike':
        return this.runQcFailureSpike(tick, random);
      case 'delayed-production':
        return this.runDelayedProduction(tick);
      case 'high-throughput-day':
        return this.runHighThroughput(tick, random);
      case 'machine-downtime':
        return this.runMachineDowntime();
      case 'normal-operations':
      default:
        return this.runNormalOperations(tick, random);
    }
  }

  private async runNormalOperations(tick: number, random: number) {
    await this.importInventory(tick, Math.round(8 + random * 10));
    await this.progressProduction();
    await this.progressQc(false);
    await this.moveYardItem('Normal simulation movement');
    await this.refreshAnalytics('normal-operations');

    return 'simulation.normal.tick';
  }

  private async runCongestion(tick: number, random: number) {
    await this.placeAdditionalYardItem(tick, random);
    await this.yardService.generateSnapshot({
      name: `DEMO congestion snapshot ${tick}`,
      metadata: { scenario: 'congestion' },
    });
    await this.eventBus.emit('analytics.threshold.exceeded', {
      id: `demo-yard-${tick}`,
      domain: 'yard',
      metric: 'occupancy',
    });

    return 'simulation.congestion.tick';
  }

  private async runQcFailureSpike(tick: number, random: number) {
    await this.progressQc(true);
    await this.prisma.analyticsAlert.create({
      data: {
        domain: AnalyticsDomain.QC,
        key: `demo.qc.failure.${tick}`,
        title: 'Demo QC failure spike',
        message: 'Simulated welding defects exceeded threshold.',
        severity: random > 0.5 ? 'CRITICAL' : 'WARNING',
        threshold: 5,
        actualValue: 8 + Math.round(random * 4),
      },
    });
    await this.eventBus.emit('analytics.alert.created', {
      id: `demo-qc-${tick}`,
      domain: 'qc',
      severity: 'warning',
    });

    return 'simulation.qc.failure.tick';
  }

  private async runDelayedProduction(tick: number) {
    const order = await this.prisma.productionOrder.findFirst({
      where: {
        orderNo: { startsWith: 'DEMO-' },
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      orderBy: { updatedAt: 'asc' },
    });

    if (order) {
      await this.prisma.productionOrder.update({
        where: { id: order.id },
        data: {
          status: ProductionOrderStatus.DELAYED,
          delayedAt: new Date(),
          delayReason: 'Demo material staging delay',
        },
      });
      await this.eventBus.emit('production.delayed', {
        id: order.id,
        orderNo: order.orderNo,
      });
    }

    await this.jobScheduler.schedule({
      name: 'DEMO-workflow-timeout-check',
      queue: 'workflow',
      payload: { scenario: 'delayed-production', tick },
      idempotencyKey: `demo-delay-job-${tick}`,
      delaySeconds: 30,
    });

    return 'simulation.production.delayed';
  }

  private async runHighThroughput(tick: number, random: number) {
    await this.importInventory(tick, Math.round(20 + random * 20));
    await this.progressProduction();
    await this.progressProduction();
    await this.refreshAnalytics('high-throughput-day');

    return 'simulation.high-throughput.tick';
  }

  private async runMachineDowntime() {
    const machine = await this.prisma.machine.findFirst({
      where: { code: { startsWith: 'DEMO-' } },
      orderBy: { updatedAt: 'asc' },
    });

    if (machine) {
      await this.prisma.machine.update({
        where: { id: machine.id },
        data: {
          status: MachineStatus.MAINTENANCE,
          utilization: 0,
        },
      });
      await this.eventBus.emit('production.delayed', {
        id: machine.id,
        machineCode: machine.code,
        reason: 'machine downtime',
      });
    }

    await this.refreshAnalytics('machine-downtime');

    return 'simulation.machine.downtime';
  }

  private async importInventory(tick: number, quantity: number) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { code: { startsWith: 'DEMO-MAT-' } },
      orderBy: { updatedAt: 'asc' },
    });

    if (!item) return;

    await this.inventoryService.importStock({
      code: `DEMO-IMP-${Date.now()}-${tick}`,
      note: 'Simulation PO to inventory import',
      performedBy: 'simulation',
      referenceModule: 'simulation',
      referenceId: `DEMO-TICK-${tick}`,
      items: [{ inventoryItemId: item.id, quantity }],
    });
  }

  private async progressProduction() {
    const order = await this.prisma.productionOrder.findFirst({
      where: {
        orderNo: { startsWith: 'DEMO-' },
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      include: { stages: { orderBy: { sequence: 'asc' } } },
      orderBy: { updatedAt: 'asc' },
    });

    if (!order) return;

    if (order.status === ProductionOrderStatus.PLANNED) {
      await this.productionService.start(order.id, {
        message: 'Simulation production start',
      });
      return;
    }

    const stage = order.stages.find((item) => item.status === 'IN_PROGRESS');

    if (stage) {
      await this.productionService.completeStage(stage.id, {
        message: 'Simulation stage completed',
        qualityStatus: 'READY_FOR_QC',
        attachmentIds: [],
      });
    }
  }

  private async progressQc(createFailure: boolean) {
    const inspection = await this.prisma.qcInspection.findFirst({
      where: {
        inspectionNo: { startsWith: 'DEMO-' },
        status: { in: ['READY', 'IN_PROGRESS'] },
      },
      include: { checklist: { include: { items: true } } },
      orderBy: { updatedAt: 'asc' },
    });

    if (!inspection) return;

    if (inspection.status === QcInspectionStatus.READY) {
      await this.qcService.startInspection(inspection.id, {
        metadata: { source: 'simulation' },
      });
    }

    const checklistItem = inspection.checklist?.items[0];
    const result = await this.qcService.recordResult(inspection.id, {
      checklistItemId: checklistItem?.id,
      category: inspection.checklist?.type ?? 'FINAL',
      status: createFailure ? QcResultStatus.FAIL : QcResultStatus.PASS,
      measuredValue: createFailure ? 'OUT_OF_TOLERANCE' : 'OK',
      expectedValue: 'PASS',
      notes: 'Simulation QC result',
      attachmentIds: [],
    });

    if (createFailure) {
      const issue = await this.qcService.createIssue(inspection.id, {
        resultId: result.id,
        code: `DEMO-QC-ISSUE-${Date.now()}`,
        title: 'Demo weld defect',
        description: 'Simulated porosity detected during weld inspection.',
        severity: QcIssueSeverity.HIGH,
        status: QcIssueStatus.OPEN,
        correctiveAction: 'Rework weld bead and reinspect.',
        dueAt: undefined,
        attachmentIds: [],
      });

      await this.qcService.createNcr(inspection.id, {
        issueId: issue.id,
        title: 'Demo NCR welding failure',
        description: 'Generated by QC failure spike scenario.',
        status: NcrStatus.OPEN,
        severity: QcIssueSeverity.HIGH,
        correctiveAction: 'Rework required before painting.',
        attachmentIds: [],
      });
    }

    await this.qcService.completeInspection(inspection.id, {
      status: createFailure
        ? QcInspectionStatus.REWORK_REQUIRED
        : QcInspectionStatus.PASSED,
      notes: 'Simulation inspection lifecycle completed',
    });
  }

  private async moveYardItem(reason: string) {
    const placement = await this.prisma.yardItemPlacement.findFirst({
      where: {
        itemCode: { startsWith: 'DEMO-' },
        removedAt: null,
      },
      include: { slot: true },
      orderBy: { updatedAt: 'asc' },
    });
    const target = await this.prisma.yardSlot.findFirst({
      where: {
        code: { startsWith: 'DEMO-' },
        status: 'AVAILABLE',
      },
      orderBy: { updatedAt: 'asc' },
    });

    if (!placement || !target || placement.slotId === target.id) return;

    await this.yardService.moveItem(placement.id, {
      toSlotId: target.id,
      reason,
    });
    await this.yardService.generateSnapshot({
      name: `DEMO yard movement ${new Date().toISOString()}`,
      metadata: { reason },
    });
  }

  private async placeAdditionalYardItem(tick: number, random: number) {
    const component = await this.prisma.component.findFirst({
      where: { code: { startsWith: 'DEMO-' } },
      orderBy: { updatedAt: 'asc' },
    });
    const slot = await this.prisma.yardSlot.findFirst({
      where: {
        code: { startsWith: 'DEMO-' },
        currentStackLevel: { lt: 4 },
      },
      orderBy: { currentStackLevel: 'asc' },
    });

    if (!component || !slot) return;

    await this.yardService.placeItem({
      slotId: slot.id,
      itemType: YardItemType.COMPONENT,
      itemId: component.id,
      itemCode: `${component.code}-C${tick}`,
      itemName: component.name,
      quantity: 1,
      stackLevel: Math.min(slot.currentStackLevel + 1, 4),
      weight: 2.4 + random,
      reason: 'Simulation congestion placement',
      attachmentIds: [],
    });
  }

  private async refreshAnalytics(scenario: string) {
    await this.analyticsService.generateSnapshot({
      domain: AnalyticsDomain.ERP,
      snapshotType: `demo.${scenario}`,
      periodStart: undefined,
      periodEnd: undefined,
      metadata: { scenario },
    });
  }

  private random(mode: SimulationMode, tick: number) {
    if (mode === 'randomized') {
      return Math.random();
    }

    const value = Math.sin(tick * 9301 + 49297) * 233280;
    return value - Math.floor(value);
  }
}
