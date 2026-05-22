import { PrismaService } from '../../core/prisma/prisma.service'

interface ActivityLogData {
  action: string
  entity: string
  entityId?: string
  metadata?: any
}

export async function createActivityLog(
  prisma: PrismaService,
  data: ActivityLogData,
) {
  return prisma.activityLog.create({
    data: {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      metadata: data.metadata,
    },
  })
}
