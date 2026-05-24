import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  createAttachmentLinkSchema,
  listAttachmentsSchema,
  updateAttachmentSchema,
  uploadAttachmentSchema,
} from './dto/attachments.dto';
import { AttachmentsService } from './services/attachments.service';

import type {
  CreateAttachmentLinkDto,
  ListAttachmentsDto,
  UpdateAttachmentDto,
  UploadAttachmentDto,
} from './dto/attachments.dto';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

const signedUrlSchema = z.object({
  expiresInSeconds: z.coerce.number().int().positive().optional(),
});

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @RequirePermissions('attachments.read')
  @Get()
  findAll(
    @Query(new ZodValidationPipe(listAttachmentsSchema))
    query: ListAttachmentsDto,
  ) {
    return this.attachmentsService.findAll(query);
  }

  @RequirePermissions('attachments.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @RequirePermissions('attachments.read')
  @Get(':id/signed-url')
  signedUrl(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(signedUrlSchema))
    query: z.infer<typeof signedUrlSchema>,
  ) {
    return this.attachmentsService.getSignedUrl(id, query.expiresInSeconds);
  }

  @RequirePermissions('attachments.write')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(uploadAttachmentSchema))
    body: UploadAttachmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.upload(file, body, request.user?.id);
  }

  @RequirePermissions('attachments.write')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAttachmentSchema))
    body: UpdateAttachmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.update(id, body, request.user?.id);
  }

  @RequirePermissions('attachments.write')
  @Post(':id/links')
  link(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createAttachmentLinkSchema))
    body: CreateAttachmentLinkDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.link(id, body, request.user?.id);
  }

  @RequirePermissions('attachments.write')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.attachmentsService.softDelete(id, request.user?.id);
  }
}
