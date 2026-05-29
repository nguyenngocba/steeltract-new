import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/prisma/prisma.service'

@Injectable()
export class WorkOrderService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async create(
    body: any,
  ) {

    return this.prisma.workOrder.create({

      data: {

        workOrderNo:
          `WO-${Date.now()}`,

        productCode:
          body.productCode,

        quantity:
          body.quantity,

        plannedStart:
          new Date(),

        status:
          'PLANNED',
      },
    })
  }

  async release(
    id: string,
  ) {

    return this.prisma.workOrder.update({

      where: {

        id,
      },

      data: {

        status:
          'RELEASED',
      },
    })
  }

  async findAll() {

    return this.prisma.workOrder.findMany({

      orderBy: {

        createdAt:
          'desc',
      },
    })
  }
}
