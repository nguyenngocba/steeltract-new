import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type QcTx = Prisma.TransactionClient;

@Injectable()
export class QcRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: QcTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
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

  findInspections(params: {
    search?: string;
    status?: Prisma.EnumQcInspectionStatusFilter['equals'];
    productionOrderId?: string;
    productionStageId?: string;
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

  findNcrs(params: {
    search?: string;
    status?: Prisma.EnumNcrStatusFilter['equals'];
    severity?: Prisma.EnumQcIssueSeverityFilter['equals'];
    productionOrderId?: string;
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
    componentId?: string;
  }) {
    return this.prisma.nonConformanceReport.count({
      where: this.ncrWhere(params),
    });
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
    componentId?: string;
    projectId?: string;
    inspectorId?: string;
  }): Prisma.QcInspectionWhereInput {
    return {
      status: params.status,
      productionOrderId: params.productionOrderId,
      productionStageId: params.productionStageId,
      componentId: params.componentId,
      projectId: params.projectId,
      inspectorId: params.inspectorId,
      OR: params.search
        ? [
            { inspectionNo: { contains: params.search, mode: 'insensitive' } },
            { componentId: { contains: params.search, mode: 'insensitive' } },
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
    componentId?: string;
  }): Prisma.NonConformanceReportWhereInput {
    return {
      status: params.status,
      severity: params.severity,
      productionOrderId: params.productionOrderId,
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
