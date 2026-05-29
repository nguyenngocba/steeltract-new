import {
  Injectable,
} from '@nestjs/common'

import { PrismaService }
from '../../../core/database/prisma.service'

@Injectable()
export class QCService {

  constructor(

    private readonly prisma:
      PrismaService,
  ) {}

  async inspections() {

    return this.prisma.qCInspection.findMany({

      orderBy: {

        createdAt:
          'desc',
      },
    })
  }

  async createInspection(
    body: any,
  ) {

    return this.prisma.qCInspection.create({

      data: {

        inspectionNo:
          `QC-${Date.now()}`,

        workOrderId:
          body.workOrderId,

        inspector:
          body.inspector,

        result:
          body.result,

        defectQty:
          body.defectQty || 0,
      },
    })
  }

  async createNCR(
    body: any,
  ) {

    return this.prisma.qCNCR.create({

      data: {

        ncrNo:
          `NCR-${Date.now()}`,

        issue:
          body.issue,

        severity:
          body.severity,
      },
    })
  }
}
