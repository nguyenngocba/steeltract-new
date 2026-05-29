import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/prisma/prisma.service'

@Injectable()
export class PurchaseReceivingService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async receive(
    body: any,
  ) {

    return this.prisma.purchaseReceiving.create({

      data: {

        receivingNo:
          `RCV-${Date.now()}`,

        supplierId:
          body.supplierId,

        materialId:
          body.materialId,

        quantity:
          body.quantity,
      },
    })
  }

  async history() {

    return this.prisma.purchaseReceiving.findMany({

      orderBy: {

        createdAt:
          'desc',
      },
    })
  }
}
