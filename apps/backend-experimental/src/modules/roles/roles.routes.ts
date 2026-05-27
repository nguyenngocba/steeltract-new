import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const rolesRouter = Router()

rolesRouter.get('/', async (_, res) => {
  const roles =
    await prisma.role.findMany({
      include: {
        permissions: true,
      },
    })

  res.json(roles)
})
