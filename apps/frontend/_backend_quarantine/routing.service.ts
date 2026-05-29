import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/database/prisma.service'

@Injectable()
export class RoutingService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async create(
    body: any,
  ) {

    return this.prisma.routing.create({

      data: {

        routingNo:
          `RT-${Date.now()}`,

        productCode:
          body.productCode,

        version:
          'V1',
      },
    })
  }

  async findAll() {

    return this.prisma.routing.findMany({

      include: {

        operations: true,
      },
    })
  }
}
