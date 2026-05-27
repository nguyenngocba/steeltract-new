import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const componentsRouter = Router()

componentsRouter.get('/', async (_, res) => {
  const components =
    await prisma.component.findMany()

  res.json(components)
})

componentsRouter.get('/telemetry', async (_, res) => {
  const telemetry =
    await prisma.machineTelemetry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

  res.json(telemetry)
})
