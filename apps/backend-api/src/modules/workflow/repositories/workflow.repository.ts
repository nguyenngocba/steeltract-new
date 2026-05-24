import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type WorkflowTx = Prisma.TransactionClient;

@Injectable()
export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: WorkflowTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  createDefinition(data: Prisma.WorkflowDefinitionCreateInput) {
    return this.prisma.workflowDefinition.create({
      data,
      include: this.definitionInclude(),
    });
  }

  findDefinitions(params: {
    search?: string;
    module?: string;
    status?: Prisma.EnumWorkflowDefinitionStatusFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.workflowDefinition.findMany({
      where: this.definitionWhere(params),
      include: {
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  countDefinitions(params: {
    search?: string;
    module?: string;
    status?: Prisma.EnumWorkflowDefinitionStatusFilter['equals'];
  }) {
    return this.prisma.workflowDefinition.count({
      where: this.definitionWhere(params),
    });
  }

  findDefinitionById(id: string) {
    return this.prisma.workflowDefinition.findUnique({
      where: {
        id,
      },
      include: this.definitionInclude(),
    });
  }

  findActiveDefinitionByKey(key: string, tx: WorkflowTx = this.prisma) {
    return tx.workflowDefinition.findFirst({
      where: {
        key,
        status: 'ACTIVE',
      },
      include: this.definitionInclude(),
    });
  }

  findInstanceById(id: string, tx: WorkflowTx = this.prisma) {
    return tx.workflowInstance.findUnique({
      where: {
        id,
      },
      include: this.instanceInclude(),
    });
  }

  findInstances(params: {
    search?: string;
    module?: string;
    referenceModule?: string;
    referenceId?: string;
    status?: Prisma.EnumWorkflowInstanceStatusFilter['equals'];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.workflowInstance.findMany({
      where: this.instanceWhere(params),
      include: this.instanceInclude(),
      orderBy: {
        updatedAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  countInstances(params: {
    search?: string;
    module?: string;
    referenceModule?: string;
    referenceId?: string;
    status?: Prisma.EnumWorkflowInstanceStatusFilter['equals'];
  }) {
    return this.prisma.workflowInstance.count({
      where: this.instanceWhere(params),
    });
  }

  createInstance(data: Prisma.WorkflowInstanceCreateInput, tx: WorkflowTx) {
    return tx.workflowInstance.create({
      data,
      include: this.instanceInclude(),
    });
  }

  updateInstance(
    id: string,
    data: Prisma.WorkflowInstanceUpdateInput,
    tx: WorkflowTx,
  ) {
    return tx.workflowInstance.update({
      where: {
        id,
      },
      data,
      include: this.instanceInclude(),
    });
  }

  createAction(data: Prisma.WorkflowActionCreateInput, tx: WorkflowTx) {
    return tx.workflowAction.create({
      data,
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    tx: WorkflowTx = this.prisma,
  ) {
    return tx.activityLog.create({
      data,
    });
  }

  createNotification(
    data: Prisma.NotificationCreateInput,
    tx: WorkflowTx = this.prisma,
  ) {
    return tx.notification.create({
      data,
    });
  }

  private definitionInclude() {
    return {
      steps: {
        orderBy: {
          order: 'asc' as const,
        },
      },
    };
  }

  private instanceInclude() {
    return {
      definition: {
        include: {
          steps: {
            orderBy: {
              order: 'asc' as const,
            },
          },
        },
      },
      currentStep: true,
      actions: {
        include: {
          step: true,
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      },
    };
  }

  private definitionWhere(params: {
    search?: string;
    module?: string;
    status?: Prisma.EnumWorkflowDefinitionStatusFilter['equals'];
  }): Prisma.WorkflowDefinitionWhereInput {
    return {
      module: params.module,
      status: params.status,
      OR: params.search
        ? [
            {
              key: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }

  private instanceWhere(params: {
    search?: string;
    module?: string;
    referenceModule?: string;
    referenceId?: string;
    status?: Prisma.EnumWorkflowInstanceStatusFilter['equals'];
  }): Prisma.WorkflowInstanceWhereInput {
    return {
      status: params.status,
      referenceModule: params.referenceModule ?? params.module,
      referenceId: params.referenceId,
      OR: params.search
        ? [
            {
              referenceModule: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              referenceId: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              definition: {
                name: {
                  contains: params.search,
                  mode: 'insensitive',
                },
              },
            },
          ]
        : undefined,
    };
  }
}
