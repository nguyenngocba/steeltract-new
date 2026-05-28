import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/database/prisma.service'

@Injectable()
export class SupplierService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async findAll() {

    return this.prisma.supplier.findMany({

      orderBy: {

        createdAt:
          'desc',
      },
    })
  }

  async create(
    body: any,
  ) {

    return this.prisma.supplier.create({

      data: body,
    })
  }
}
