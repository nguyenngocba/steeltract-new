import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  archiveComponentCommandSchema,
  ArchiveComponentCommandDto,
  createComponentCommandSchema,
  CreateComponentCommandDto,
  createComponentRevisionCommandSchema,
  CreateComponentRevisionCommandDto,
  deprecateComponentCommandSchema,
  DeprecateComponentCommandDto,
  releaseComponentRevisionCommandSchema,
  ReleaseComponentRevisionCommandDto,
  replaceEngineeringBomCommandSchema,
  ReplaceEngineeringBomCommandDto,
  validateEngineeringBomCommandSchema,
  ValidateEngineeringBomCommandDto,
  versionedRevisionCommandSchema,
  VersionedRevisionCommandDto,
} from './dto/component-command.dto';
import { ComponentCommandContext } from './domain/component.commands';
import { ComponentCommandService } from './services/component-command.service';

type AuthenticatedRequest = Request & { user?: AuthUser };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('components.write')
@Controller('components/commands')
export class ComponentCommandController {
  constructor(private readonly commands: ComponentCommandService) {}

  @Post()
  createComponent(
    @Body(new ZodValidationPipe(createComponentCommandSchema))
    body: CreateComponentCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.create({
      ...body,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions')
  createRevision(
    @Param('componentId') componentId: string,
    @Body(new ZodValidationPipe(createComponentRevisionCommandSchema))
    body: CreateComponentRevisionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.createRevision({
      ...body,
      componentId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions/:revisionId/bom/replace')
  replaceBom(
    @Param('componentId') componentId: string,
    @Param('revisionId') revisionId: string,
    @Body(new ZodValidationPipe(replaceEngineeringBomCommandSchema))
    body: ReplaceEngineeringBomCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.replaceBom({
      ...body,
      componentId,
      revisionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions/:revisionId/bom/validate')
  validateBom(
    @Param('componentId') componentId: string,
    @Param('revisionId') revisionId: string,
    @Body(new ZodValidationPipe(validateEngineeringBomCommandSchema))
    body: ValidateEngineeringBomCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.validateBom({
      ...body,
      componentId,
      revisionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions/:revisionId/submit-review')
  submitRevisionReview(
    @Param('componentId') componentId: string,
    @Param('revisionId') revisionId: string,
    @Body(new ZodValidationPipe(versionedRevisionCommandSchema))
    body: VersionedRevisionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.submitForReview({
      ...body,
      componentId,
      revisionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions/:revisionId/approve')
  approveRevision(
    @Param('componentId') componentId: string,
    @Param('revisionId') revisionId: string,
    @Body(new ZodValidationPipe(versionedRevisionCommandSchema))
    body: VersionedRevisionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.approve({
      ...body,
      componentId,
      revisionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/revisions/:revisionId/release')
  releaseRevision(
    @Param('componentId') componentId: string,
    @Param('revisionId') revisionId: string,
    @Body(new ZodValidationPipe(releaseComponentRevisionCommandSchema))
    body: ReleaseComponentRevisionCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.releaseRevision({
      ...body,
      componentId,
      revisionId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/deprecate')
  deprecateComponent(
    @Param('componentId') componentId: string,
    @Body(new ZodValidationPipe(deprecateComponentCommandSchema))
    body: DeprecateComponentCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.deprecate({
      ...body,
      componentId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  @Post(':componentId/archive')
  archiveComponent(
    @Param('componentId') componentId: string,
    @Body(new ZodValidationPipe(archiveComponentCommandSchema))
    body: ArchiveComponentCommandDto,
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-causation-id') causationId?: string,
  ) {
    return this.commands.archive({
      ...body,
      componentId,
      ...this.context(request, idempotencyKey, correlationId, causationId),
    });
  }

  private context(
    request: AuthenticatedRequest,
    idempotencyKey?: string,
    correlationId?: string,
    causationId?: string,
  ): ComponentCommandContext {
    const actorId = request.user?.id;
    if (!actorId) {
      throw new UnauthorizedException('Authenticated actor is required');
    }
    const key = idempotencyKey?.trim();
    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    if (key.length > 200) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 200 characters',
      );
    }
    return {
      actorId,
      idempotencyKey: key,
      correlationId: correlationId?.trim() || undefined,
      causationId: causationId?.trim() || undefined,
    };
  }
}
