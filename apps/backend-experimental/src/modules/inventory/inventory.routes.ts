import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const inventoryRouter = Router()

inventoryRouter.get('/', async (_, res) => {
  const materials =
    await prisma.material.findMany()

  res.json(materials)
})

inventoryRouter.post('/', async (req, res) => {
  const material =
    await prisma.material.create({
      data: req.body,
    })

  res.json(material)
})

inventoryRouter.get('/transactions', async (_, res) => {
  const transactions =
    await prisma.inventoryTransaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

  res.json(transactions)
})
