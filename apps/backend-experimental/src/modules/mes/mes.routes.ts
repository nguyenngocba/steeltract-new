import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const mesRouter = Router()

# =========================================================
# GET WORK ORDERS
# =========================================================

mesRouter.get(
  '/orders',
  async (_, res) => {
    const orders =
      await prisma.productionOrder.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(orders)
  }
)

# =========================================================
# CREATE WORK ORDER
# =========================================================

mesRouter.post(
  '/orders',
  async (req, res) => {
    const order =
      await prisma.productionOrder.create({
        data: req.body,
      })

    res.json(order)
  }
)

# =========================================================
# GET TASKS
# =========================================================

mesRouter.get(
  '/tasks',
  async (_, res) => {
    const tasks =
      await prisma.productionTask.findMany()

    res.json(tasks)
  }
)

# =========================================================
# GET SCHEDULES
# =========================================================

mesRouter.get(
  '/schedules',
  async (_, res) => {
    const schedules =
      await prisma.productionSchedule.findMany()

    res.json(schedules)
  }
)
