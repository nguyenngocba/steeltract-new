import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/database/prisma.service'

@Injectable()
export class MachineService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async findAll() {

    return this.prisma.machine.findMany({

      orderBy: {

        createdAt:
          'desc',
      },
    })
  }

  async create(
    body: any,
  ) {

    return this.prisma.machine.create({

      data: body,
    })
  }

  async updateStatus(
    id: string,
    status: string,
  ) {

    return this.prisma.machine.update({

      where: {

        id,
      },

      data: {

        status,
      },
    })
  }
}
