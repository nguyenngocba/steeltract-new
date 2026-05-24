import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { AuthUser } from '../rbac/types/auth-user';
import {
  createWorkflowDefinitionSchema,
  escalateWorkflowSchema,
  listWorkflowDefinitionsSchema,
  listWorkflowInstancesSchema,
  startWorkflowSchema,
  workflowActionSchema,
} from './dto/workflow.dto';

import type {
  CreateWorkflowDefinitionDto,
  EscalateWorkflowDto,
  ListWorkflowDefinitionsDto,
  ListWorkflowInstancesDto,
  StartWorkflowDto,
  WorkflowActionDto,
} from './dto/workflow.dto';
import { WorkflowService } from './services/workflow.service';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @RequirePermissions('workflow.write')
  @Post('definitions')
  createDefinition(
    @Body(new ZodValidationPipe(createWorkflowDefinitionSchema))
    body: CreateWorkflowDefinitionDto,
  ) {
    return this.workflowService.createDefinition(body);
  }

  @RequirePermissions('workflow.read')
  @Get('definitions')
  listDefinitions(
    @Query(new ZodValidationPipe(listWorkflowDefinitionsSchema))
    query: ListWorkflowDefinitionsDto,
  ) {
    return this.workflowService.listDefinitions(query);
  }

  @RequirePermissions('workflow.read')
  @Get('instances')
  listInstances(
    @Query(new ZodValidationPipe(listWorkflowInstancesSchema))
    query: ListWorkflowInstancesDto,
  ) {
    return this.workflowService.listInstances(query);
  }

  @RequirePermissions('workflow.read')
  @Get('instances/:id')
  getInstance(@Param('id') id: string) {
    return this.workflowService.getInstance(id);
  }

  @RequirePermissions('workflow.write')
  @Post('start')
  startWorkflow(
    @Body(new ZodValidationPipe(startWorkflowSchema)) body: StartWorkflowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workflowService.startWorkflow(body, request.user?.id);
  }

  @RequirePermissions('workflow.write')
  @Post('instances/:id/approve')
  approveStep(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(workflowActionSchema)) body: WorkflowActionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workflowService.approveStep(id, body, request.user?.id);
  }

  @RequirePermissions('workflow.write')
  @Post('instances/:id/reject')
  rejectStep(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(workflowActionSchema)) body: WorkflowActionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workflowService.rejectStep(id, body, request.user?.id);
  }

  @RequirePermissions('workflow.write')
  @Post('instances/:id/move-next')
  moveNextStep(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(workflowActionSchema)) body: WorkflowActionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workflowService.moveNextStep(id, body, request.user?.id);
  }

  @RequirePermissions('workflow.write')
  @Post('instances/:id/escalate')
  escalate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(escalateWorkflowSchema))
    body: EscalateWorkflowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workflowService.escalate(id, body, request.user?.id);
  }
}
