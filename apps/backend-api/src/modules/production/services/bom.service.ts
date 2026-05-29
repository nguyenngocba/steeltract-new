import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/prisma/prisma.service'

@Injectable()
export class BOMService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async create(
    body: any,
  ) {

    return this.prisma.bOM.create({

      data: {

        bomNo:
          `BOM-${Date.now()}`,

        productCode:
          body.productCode,

        productName:
          body.productName,

        version:
          'V1',
      },
    })
  }

  async findAll() {

    return this.prisma.bOM.findMany({

      include: {

        items: true,
      },
    })
  }
}
