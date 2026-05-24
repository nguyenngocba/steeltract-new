import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

export type AttachmentsTx = Prisma.TransactionClient;

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: AttachmentsTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  createAttachment(data: Prisma.AttachmentCreateInput, tx: AttachmentsTx) {
    return tx.attachment.create({
      data,
      include: this.includeDetails(),
    });
  }

  updateAttachment(
    id: string,
    data: Prisma.AttachmentUpdateInput,
    tx: AttachmentsTx = this.prisma,
  ) {
    return tx.attachment.update({
      where: {
        id,
      },
      data,
      include: this.includeDetails(),
    });
  }

  findById(id: string, tx: AttachmentsTx = this.prisma) {
    return tx.attachment.findUnique({
      where: {
        id,
      },
      include: this.includeDetails(),
    });
  }

  findMany(params: {
    search?: string;
    category?: Prisma.EnumAttachmentCategoryFilter['equals'];
    mimeType?: string;
    module?: string;
    entityId?: string;
    tag?: string;
    includeDeleted?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.attachment.findMany({
      where: this.where(params),
      include: this.includeDetails(),
      orderBy: {
        updatedAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  count(params: {
    search?: string;
    category?: Prisma.EnumAttachmentCategoryFilter['equals'];
    mimeType?: string;
    module?: string;
    entityId?: string;
    tag?: string;
    includeDeleted?: boolean;
  }) {
    return this.prisma.attachment.count({
      where: this.where(params),
    });
  }

  getNextVersion(attachmentId: string, tx: AttachmentsTx) {
    return tx.attachmentVersion.count({
      where: {
        attachmentId,
      },
    });
  }

  createVersion(data: Prisma.AttachmentVersionCreateInput, tx: AttachmentsTx) {
    return tx.attachmentVersion.create({
      data,
    });
  }

  createLink(
    attachmentId: string,
    data: Omit<Prisma.AttachmentLinkUncheckedCreateInput, 'attachmentId'>,
    tx: AttachmentsTx,
  ) {
    return tx.attachmentLink.upsert({
      where: {
        attachmentId_module_entityId_purpose: {
          attachmentId,
          module: String(data.module),
          entityId: String(data.entityId),
          purpose: data.purpose ? String(data.purpose) : '',
        },
      },
      create: {
        ...data,
        purpose: data.purpose ?? '',
        attachmentId,
      },
      update: {
        metadata: data.metadata,
      },
    });
  }

  listLinks(attachmentId: string) {
    return this.prisma.attachmentLink.findMany({
      where: {
        attachmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    tx: AttachmentsTx = this.prisma,
  ) {
    return tx.activityLog.create({
      data,
    });
  }

  private includeDetails() {
    return {
      versions: {
        orderBy: {
          version: 'desc' as const,
        },
      },
      links: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    };
  }

  private where(params: {
    search?: string;
    category?: Prisma.EnumAttachmentCategoryFilter['equals'];
    mimeType?: string;
    module?: string;
    entityId?: string;
    tag?: string;
    includeDeleted?: boolean;
  }): Prisma.AttachmentWhereInput {
    return {
      deletedAt: params.includeDeleted ? undefined : null,
      category: params.category,
      mimeType: params.mimeType
        ? {
            contains: params.mimeType,
            mode: 'insensitive',
          }
        : undefined,
      tags: params.tag
        ? {
            has: params.tag,
          }
        : undefined,
      links:
        params.module || params.entityId
          ? {
              some: {
                module: params.module,
                entityId: params.entityId,
              },
            }
          : undefined,
      OR: params.search
        ? [
            {
              title: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
