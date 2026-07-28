import { Injectable } from '@nestjs/common';

import { ComponentInstanceState, Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { nextOperationalCode } from '../../../common/utils/code-generator';

export type QcTx = Prisma.TransactionClient;

@Injectable()
export class QcRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: QcTx) => Promise<T>) {
    return this.prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  createChecklist(data: Prisma.QcChecklistCreateInput, tx: QcTx = this.prisma) {
    return tx.qcChecklist.create({
      data,
      include: this.checklistInclude(),
    });
  }

  updateChecklist(
    id: string,
    data: Prisma.QcChecklistUpdateInput,
    tx: QcTx = this.prisma,
  ) {
    return tx.qcChecklist.update({
      where: { id },
      data,
      include: this.checklistInclude(),
    });
  }

  findChecklistById(id: string, tx: QcTx = this.prisma) {
    return tx.qcChecklist.findUnique({
      where: { id },
      include: this.checklistInclude(),
    });
  }

  findChecklists(params: {
    search?: string;
    type?: Prisma.EnumQcChecklistTypeFilter['equals'];
    isActive?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.qcChecklist.findMany({
      where: this.checklistWhere(params),
      include: this.checklistInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countChecklists(params: {
    search?: string;
    type?: Prisma.EnumQcChecklistTypeFilter['equals'];
    isActive?: boolean;
  }) {
    return this.prisma.qcChecklist.count({
      where: this.checklistWhere(params),
    });
  }

  createInspection(data: Prisma.QcInspectionCreateInput, tx: QcTx) {
    return tx.qcInspection.create({
      data,
      include: this.inspectionInclude(),
    });
  }

  updateInspection(
    id: string,
    data: Prisma.QcInspectionUpdateInput,
    tx: QcTx = this.prisma,
  ) {
    return tx.qcInspection.update({
      where: { id },
      data,
      include: this.inspectionInclude(),
    });
  }

  findInspectionById(id: string, tx: QcTx = this.prisma) {
    return tx.qcInspection.findUnique({
      where: { id },
      include: this.inspectionInclude(),
    });
  }

  async updateInspectionVersioned(
    id: string,
    expectedUpdatedAt: Date,
    data: Prisma.QcInspectionUpdateManyMutationInput,
    tx: QcTx,
  ) {
    const result = await tx.qcInspection.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1 ? this.findInspectionById(id, tx) : null;
  }

  findInspections(params: {
    search?: string;
    status?: Prisma.EnumQcInspectionStatusFilter['equals'];
    productionOrderId?: string;
    productionStageId?: string;
    componentInstanceId?: string;
    componentId?: string;
    projectId?: string;
    inspectorId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.qcInspection.findMany({
      where: this.inspectionWhere(params),
      include: this.inspectionInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countInspections(params: {
    search?: string;
    status?: Prisma.EnumQcInspectionStatusFilter['equals'];
    productionOrderId?: string;
    productionStageId?: string;
    componentInstanceId?: string;
    componentId?: string;
    projectId?: string;
    inspectorId?: string;
  }) {
    return this.prisma.qcInspection.count({
      where: this.inspectionWhere(params),
    });
  }

  createResult(data: Prisma.QcResultCreateInput, tx: QcTx) {
    return tx.qcResult.create({
      data,
      include: {
        checklistItem: true,
        issues: true,
      },
    });
  }

  createIssue(data: Prisma.QcIssueCreateInput, tx: QcTx) {
    return tx.qcIssue.create({
      data,
      include: this.issueInclude(),
    });
  }

  updateIssue(id: string, data: Prisma.QcIssueUpdateInput, tx: QcTx) {
    return tx.qcIssue.update({
      where: { id },
      data,
      include: this.issueInclude(),
    });
  }

  createQcAttachment(data: Prisma.QcAttachmentCreateInput, tx: QcTx) {
    return tx.qcAttachment.create({ data });
  }

  createNcr(data: Prisma.NonConformanceReportCreateInput, tx: QcTx) {
    return tx.nonConformanceReport.create({
      data,
      include: this.ncrInclude(),
    });
  }

  findNcrById(id: string, tx: QcTx = this.prisma) {
    return tx.nonConformanceReport.findUnique({
      where: { id },
      include: this.ncrInclude(),
    });
  }

  async updateNcrVersioned(
    id: string,
    expectedUpdatedAt: Date,
    data: Prisma.NonConformanceReportUpdateManyMutationInput,
    tx: QcTx,
  ) {
    const result = await tx.nonConformanceReport.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data,
    });
    return result.count === 1 ? this.findNcrById(id, tx) : null;
  }

  findNcrs(params: {
    search?: string;
    status?: Prisma.EnumNcrStatusFilter['equals'];
    severity?: Prisma.EnumQcIssueSeverityFilter['equals'];
    productionOrderId?: string;
    componentInstanceId?: string;
    componentId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.nonConformanceReport.findMany({
      where: this.ncrWhere(params),
      include: this.ncrInclude(),
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countNcrs(params: {
    search?: string;
    status?: Prisma.EnumNcrStatusFilter['equals'];
    severity?: Prisma.EnumQcIssueSeverityFilter['equals'];
    productionOrderId?: string;
    componentInstanceId?: string;
    componentId?: string;
  }) {
    return this.prisma.nonConformanceReport.count({
      where: this.ncrWhere(params),
    });
  }

  findComponentInstanceById(id: string, tx: QcTx = this.prisma) {
    return tx.componentInstance.findUnique({
      where: { id },
      select: {
        id: true,
        state: true,
        componentId: true,
        productionOrderId: true,
        requirementId: true,
        projectId: true,
        producedAt: true,
        qcPassedAt: true,
        scrappedAt: true,
      },
    });
  }

  async updateComponentInstanceState(
    id: string,
    data: Prisma.ComponentInstanceUpdateManyMutationInput,
    tx: QcTx,
    allowedStates?: ComponentInstanceState[],
  ) {
    const result = await tx.componentInstance.updateMany({
      where: {
        id,
        state: allowedStates?.length ? { in: allowedStates } : undefined,
      },
      data,
    });
    return result.count === 1 ? this.findComponentInstanceById(id, tx) : null;
  }

  async createComponentInstanceTimelineIfMissing(
    data: Prisma.ComponentInstanceTimelineCreateManyInput,
    tx: QcTx,
  ) {
    const existing = await tx.componentInstanceTimeline.findFirst({
      where: {
        componentInstanceId: data.componentInstanceId,
        eventType: data.eventType,
        sourceModule: data.sourceModule,
        sourceId: data.sourceId,
      },
      select: { id: true },
    });
    if (existing) return existing;
    return tx.componentInstanceTimeline.create({ data });
  }

  metrics() {
    return this.prisma.$transaction(async (tx) => {
      const [total, inProgress, passed, failed, rework, issues, ncrs, defects] =
        await Promise.all([
          tx.qcInspection.count(),
          tx.qcInspection.count({ where: { status: 'IN_PROGRESS' } }),
          tx.qcInspection.count({ where: { status: 'PASSED' } }),
          tx.qcInspection.count({ where: { status: 'FAILED' } }),
          tx.qcInspection.count({ where: { status: 'REWORK_REQUIRED' } }),
          tx.qcIssue.count({ where: { status: { not: 'CLOSED' } } }),
          tx.nonConformanceReport.count({
            where: { status: { not: 'CLOSED' } },
          }),
          tx.qcIssue.groupBy({
            by: ['severity', 'status'],
            _count: true,
          }),
        ]);

      return {
        total,
        inProgress,
        passed,
        failed,
        rework,
        openIssues: issues,
        openNcrs: ncrs,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        defects,
      };
    });
  }

  createActivityLog(data: Prisma.ActivityLogCreateInput, tx: QcTx) {
    return tx.activityLog.create({ data });
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
      maxRetries?: number;
    },
    tx: QcTx,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: data,
      update: {},
    });
  }

  findOutboxEvent(idempotencyKey: string, tx: QcTx) {
    return tx.outboxEvent.findUnique({ where: { idempotencyKey } });
  }

  nextInspectionNo(tx: QcTx = this.prisma) {
    return nextOperationalCode(tx, 'qcInspection', 'inspectionNo', 'QC');
  }

  nextNcrNo(tx: QcTx = this.prisma) {
    return nextOperationalCode(tx, 'nonConformanceReport', 'ncrNo', 'NCR');
  }

  checklistInclude() {
    return {
      items: {
        orderBy: {
          sequence: 'asc' as const,
        },
      },
    };
  }

  inspectionInclude() {
    return {
      checklist: {
        include: this.checklistInclude(),
      },
      componentInstance: true,
      results: {
        include: {
          checklistItem: true,
          issues: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      issues: {
        include: this.issueInclude(),
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      attachments: {
        include: {
          attachment: true,
        },
      },
      ncrs: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    };
  }

  issueInclude() {
    return {
      result: true,
      attachments: {
        include: {
          attachment: true,
        },
      },
    };
  }

  ncrInclude() {
    return {
      inspection: true,
      issue: true,
      componentInstance: true,
      attachments: {
        include: {
          attachment: true,
        },
      },
    };
  }

  private checklistWhere(params: {
    search?: string;
    type?: Prisma.EnumQcChecklistTypeFilter['equals'];
    isActive?: boolean;
  }): Prisma.QcChecklistWhereInput {
    return {
      type: params.type,
      isActive: params.isActive,
      OR: params.search
        ? [
            { code: { contains: params.search, mode: 'insensitive' } },
            { name: { contains: params.search, mode: 'insensitive' } },
            { revision: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }

  private inspectionWhere(params: {
    search?: string;
    status?: Prisma.EnumQcInspectionStatusFilter['equals'];
    productionOrderId?: string;
    productionStageId?: string;
    componentInstanceId?: string;
    componentId?: string;
    projectId?: string;
    inspectorId?: string;
  }): Prisma.QcInspectionWhereInput {
    return {
      status: params.status,
      productionOrderId: params.productionOrderId,
      productionStageId: params.productionStageId,
      componentInstanceId: params.componentInstanceId,
      componentId: params.componentId,
      projectId: params.projectId,
      inspectorId: params.inspectorId,
      OR: params.search
        ? [
            { inspectionNo: { contains: params.search, mode: 'insensitive' } },
            { componentId: { contains: params.search, mode: 'insensitive' } },
            {
              componentInstanceId: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              productionOrderId: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }

  private ncrWhere(params: {
    search?: string;
    status?: Prisma.EnumNcrStatusFilter['equals'];
    severity?: Prisma.EnumQcIssueSeverityFilter['equals'];
    productionOrderId?: string;
    componentInstanceId?: string;
    componentId?: string;
  }): Prisma.NonConformanceReportWhereInput {
    return {
      status: params.status,
      severity: params.severity,
      productionOrderId: params.productionOrderId,
      componentInstanceId: params.componentInstanceId,
      componentId: params.componentId,
      OR: params.search
        ? [
            { ncrNo: { contains: params.search, mode: 'insensitive' } },
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }
}
