import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common'

import { WorkflowService }
from '../services/workflow.service'

import { JwtAuthGuard }
from '../../auth/guards/jwt-auth.guard'

@Controller('workflow')
export class WorkflowController {

  constructor(
    private readonly workflowService:
      WorkflowService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('approvals')
  async getApprovals() {

    return this.workflowService
      .getApprovals()
  }

  @UseGuards(JwtAuthGuard)
  @Post('approvals')
  async createApproval(
    @Body() body: any,
  ) {

    return this.workflowService
      .createApproval(body)
  }
}
