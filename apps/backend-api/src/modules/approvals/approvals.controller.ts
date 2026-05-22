import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('approvals')
export class ApprovalsController {
  constructor(
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.approval.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {
    return this.prisma.approval.create({
      data: {
        module:
          body.module,

        referenceId:
          body.referenceId,

        requester:
          body.requester,

        note:
          body.note,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.approval.update({
      where: {
        id,
      },

      data: {
        approver:
          body.approver,

        status:
          'APPROVED',

        approvedAt:
          new Date(),
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prisma.approval.update({
      where: {
        id,
      },

      data: {
        approver:
          body.approver,

        status:
          'REJECTED',

        approvedAt:
          new Date(),
      },
    })
  }
}