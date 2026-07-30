import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createComponentDefinitionRequirementSchema,
  createComponentInstanceSchema,
  createProjectComponentRequirementSchema,
  listComponentInstancesSchema,
  listProjectComponentRequirementsSchema,
  type CreateComponentDefinitionRequirementDto,
  type CreateComponentInstanceDto,
  type CreateProjectComponentRequirementDto,
  type ListComponentInstancesDto,
  type ListProjectComponentRequirementsDto,
} from './dto/component-domain-foundation.dto';
import { ComponentDomainFoundationService } from './services/component-domain-foundation.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('components.read')
@Controller('components/foundation')
export class ComponentDomainFoundationController {
  constructor(
    private readonly service: ComponentDomainFoundationService,
  ) {}

  @Post('definition-requirements')
  @RequirePermissions('components.write')
  createDefinitionRequirement(
    @Body(new ZodValidationPipe(createComponentDefinitionRequirementSchema))
    body: CreateComponentDefinitionRequirementDto,
  ) {
    return this.service.createDefinitionRequirement(body);
  }

  @Post('requirements')
  @RequirePermissions('components.write')
  createRequirement(
    @Body(new ZodValidationPipe(createProjectComponentRequirementSchema))
    body: CreateProjectComponentRequirementDto,
  ) {
    return this.service.createRequirement(body);
  }

  @Get('requirements')
  listRequirements(
    @Query(new ZodValidationPipe(listProjectComponentRequirementsSchema))
    query: ListProjectComponentRequirementsDto,
  ) {
    return this.service.listRequirements(query);
  }

  @Post('instances')
  @RequirePermissions('components.write')
  createInstance(
    @Body(new ZodValidationPipe(createComponentInstanceSchema))
    body: CreateComponentInstanceDto,
  ) {
    return this.service.createInstance(body);
  }

  @Get('instances')
  listInstances(
    @Query(new ZodValidationPipe(listComponentInstancesSchema))
    query: ListComponentInstancesDto,
  ) {
    return this.service.listInstances(query);
  }
}
