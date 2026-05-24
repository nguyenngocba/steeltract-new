import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'crypto';

import { AttachmentCategory, Prisma } from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import { StorageService } from '../../../core/storage/storage.types';
import {
  CreateAttachmentLinkDto,
  ListAttachmentsDto,
  UpdateAttachmentDto,
  UploadAttachmentDto,
} from '../dto/attachments.dto';
import {
  AttachmentsRepository,
  AttachmentsTx,
} from '../repositories/attachments.repository';

type AttachmentWithDetails = Prisma.AttachmentGetPayload<{
  include: {
    versions: {
      orderBy: {
        version: 'desc';
      };
    };
    links: {
      orderBy: {
        createdAt: 'desc';
      };
    };
  };
}>;

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly repository: AttachmentsRepository,
    private readonly storage: StorageService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(query: ListAttachmentsDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findMany({
        search,
        category: query.category,
        mimeType: query.mimeType,
        module: query.module,
        entityId: query.entityId,
        tag: query.tag,
        includeDeleted: query.includeDeleted,
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findMany({
        search,
        category: query.category,
        mimeType: query.mimeType,
        module: query.module,
        entityId: query.entityId,
        tag: query.tag,
        includeDeleted: query.includeDeleted,
        skip,
        take: limit,
      }),
      this.repository.count({
        search,
        category: query.category,
        mimeType: query.mimeType,
        module: query.module,
        entityId: query.entityId,
        tag: query.tag,
        includeDeleted: query.includeDeleted,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const attachment = await this.repository.findById(id);

    if (!attachment || attachment.deletedAt) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadAttachmentDto,
    uploaderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const stored = await this.storage.store({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: 'attachments',
    });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const attachment = await this.repository.transaction(async (tx) => {
      if (dto.attachmentId) {
        return this.createVersion(
          dto.attachmentId,
          stored,
          checksum,
          dto,
          tx,
          uploaderId,
        );
      }

      const created = await this.repository.createAttachment(
        {
          title: dto.title ?? file.originalname,
          description: dto.description,
          category: dto.category ?? this.detectCategory(file.mimetype),
          mimeType: file.mimetype,
          fileSize: file.size,
          uploaderId,
          tags: dto.tags ?? [],
          metadata: this.toJson(dto.metadata),
          ocrStatus: this.shouldPrepareOcr(file.mimetype)
            ? 'PENDING'
            : undefined,
        },
        tx,
      );

      const version = await this.repository.createVersion(
        {
          attachment: {
            connect: {
              id: created.id,
            },
          },
          version: 1,
          originalName: stored.originalName,
          storageKey: stored.storageKey,
          publicUrl: stored.publicUrl,
          mimeType: stored.mimeType,
          fileSize: stored.fileSize,
          checksum,
          uploadedById: uploaderId,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      let withCurrentVersion = await this.repository.updateAttachment(
        created.id,
        {
          currentVersionId: version.id,
        },
        tx,
      );

      if (dto.module && dto.entityId) {
        await this.repository.createLink(
          created.id,
          {
            module: dto.module,
            entityId: dto.entityId,
            purpose: dto.purpose ?? '',
            metadata: this.toJson(dto.metadata),
          },
          tx,
        );

        const linkedAttachment = await this.repository.findById(created.id, tx);

        if (!linkedAttachment) {
          throw new NotFoundException('Attachment not found');
        }

        withCurrentVersion = linkedAttachment;
      }

      await this.logActivity(
        tx,
        'ATTACHMENT_UPLOADED',
        withCurrentVersion,
        uploaderId,
      );

      return withCurrentVersion;
    });

    await this.emitAttachmentEvent('attachment.uploaded', attachment);
    await this.emitOcrHook(attachment);

    return attachment;
  }

  async update(id: string, dto: UpdateAttachmentDto, actorId?: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);

      if (!existing || existing.deletedAt) {
        throw new NotFoundException('Attachment not found');
      }

      const updated = await this.repository.updateAttachment(
        id,
        {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          tags: dto.tags,
          thumbnailUrl: dto.thumbnailUrl,
          ocrStatus: dto.ocrStatus,
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      await this.logActivity(tx, 'ATTACHMENT_UPDATED', updated, actorId);

      return updated;
    });

    await this.emitAttachmentEvent('attachment.updated', attachment);

    return attachment;
  }

  async softDelete(id: string, actorId?: string) {
    const attachment = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);

      if (!existing || existing.deletedAt) {
        throw new NotFoundException('Attachment not found');
      }

      const deleted = await this.repository.updateAttachment(
        id,
        {
          deletedAt: new Date(),
        },
        tx,
      );

      await this.logActivity(tx, 'ATTACHMENT_DELETED', deleted, actorId);

      return deleted;
    });

    await this.emitAttachmentEvent('attachment.deleted', attachment);

    return attachment;
  }

  async link(
    attachmentId: string,
    dto: CreateAttachmentLinkDto,
    actorId?: string,
  ) {
    const attachment = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(attachmentId, tx);

      if (!existing || existing.deletedAt) {
        throw new NotFoundException('Attachment not found');
      }

      await this.repository.createLink(
        attachmentId,
        {
          module: dto.module,
          entityId: dto.entityId,
          purpose: dto.purpose ?? '',
          metadata: this.toJson(dto.metadata),
        },
        tx,
      );

      const updated = await this.repository.findById(attachmentId, tx);

      if (!updated) {
        throw new NotFoundException('Attachment not found');
      }

      await this.logActivity(tx, 'ATTACHMENT_LINKED', updated, actorId);

      return updated;
    });

    await this.emitAttachmentEvent('attachment.updated', attachment);

    return attachment;
  }

  async getSignedUrl(id: string, expiresInSeconds?: number) {
    const attachment = await this.findOne(id);
    const currentVersion = attachment.versions.find(
      (version) => version.id === attachment.currentVersionId,
    );

    if (!currentVersion) {
      throw new NotFoundException('Attachment version not found');
    }

    return this.storage.getSignedUrl(currentVersion.storageKey, {
      expiresInSeconds,
    });
  }

  private async createVersion(
    attachmentId: string,
    stored: {
      storageKey: string;
      publicUrl: string;
      fileSize: number;
      mimeType: string;
      originalName: string;
    },
    checksum: string,
    dto: UploadAttachmentDto,
    tx: AttachmentsTx,
    uploaderId?: string,
  ) {
    const existing = await this.repository.findById(attachmentId, tx);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Attachment not found');
    }

    const versionNumber =
      (await this.repository.getNextVersion(attachmentId, tx)) + 1;

    const version = await this.repository.createVersion(
      {
        attachment: {
          connect: {
            id: attachmentId,
          },
        },
        version: versionNumber,
        originalName: stored.originalName,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        checksum,
        uploadedById: uploaderId,
        metadata: this.toJson(dto.metadata),
      },
      tx,
    );

    const updated = await this.repository.updateAttachment(
      attachmentId,
      {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        tags: dto.tags,
        currentVersionId: version.id,
        metadata: this.toJson(dto.metadata),
      },
      tx,
    );

    await this.logActivity(tx, 'ATTACHMENT_VERSION_UPLOADED', updated);

    return updated;
  }

  private logActivity(
    tx: AttachmentsTx,
    action: string,
    attachment: AttachmentWithDetails,
    userId?: string,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'Attachment',
        entityId: attachment.id,
        module: 'attachments',
        userId,
        metadata: {
          title: attachment.title,
          category: attachment.category,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          links: attachment.links.map((link) => ({
            module: link.module,
            entityId: link.entityId,
            purpose: link.purpose,
          })),
        },
      },
      tx,
    );
  }

  private emitAttachmentEvent(
    eventName:
      | 'attachment.uploaded'
      | 'attachment.deleted'
      | 'attachment.updated',
    attachment: AttachmentWithDetails,
  ) {
    return this.eventBus.emit(
      eventName,
      {
        id: attachment.id,
        title: attachment.title,
        category: attachment.category,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        tags: attachment.tags,
        links: attachment.links.map((link) => ({
          module: link.module,
          entityId: link.entityId,
          purpose: link.purpose,
        })),
      },
      {
        module: 'attachments',
        persistToOutbox: true,
        idempotencyKey: `${eventName}:${attachment.id}:${attachment.updatedAt.toISOString()}`,
      },
    );
  }

  private emitOcrHook(attachment: AttachmentWithDetails) {
    if (!this.shouldPrepareOcr(attachment.mimeType)) {
      return Promise.resolve();
    }

    return this.eventBus.emit(
      'attachment.ocr.requested',
      {
        attachmentId: attachment.id,
        mimeType: attachment.mimeType,
      },
      {
        module: 'attachments',
        persistToOutbox: true,
        idempotencyKey: `attachment.ocr:${attachment.id}`,
      },
    );
  }

  private detectCategory(mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return AttachmentCategory.PHOTO;
    }

    if (mimeType === 'application/pdf') {
      return AttachmentCategory.DOCUMENT;
    }

    return AttachmentCategory.OTHER;
  }

  private shouldPrepareOcr(mimeType: string) {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  private toJson(value: Record<string, unknown> | undefined) {
    return value as Prisma.InputJsonValue | undefined;
  }
}
