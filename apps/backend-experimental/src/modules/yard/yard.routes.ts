import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const yardRouter = Router()

yardRouter.get('/slots', async (_, res) => {
  const slots =
    await prisma.yardSlot.findMany()

  res.json(slots)
})

yardRouter.post('/slots', async (req, res) => {
  const slot =
    await prisma.yardSlot.create({
      data: req.body,
    })

  res.json(slot)
})
