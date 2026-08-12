import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { nextOperationalCode } from '../../../common/utils/code-generator';

@Injectable()
export class PurchaseReceivingService {
  constructor(private readonly prisma: PrismaService) {}

  async receive(body: any) {
    return this.prisma.purchaseReceiving.create({
      data: {
        receivingNo: await nextOperationalCode(
          this.prisma,
          'purchaseReceiving',
          'receivingNo',
          'RCV',
        ),

        supplierId: body.supplierId,

        materialId: body.materialId,

        quantity: body.quantity,
      },
    });
  }

  async history() {
    return this.prisma.purchaseReceiving.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
