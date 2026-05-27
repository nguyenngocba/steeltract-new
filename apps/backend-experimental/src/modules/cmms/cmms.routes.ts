import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const cmmsRouter = Router()

# =========================================================
# GET MACHINES
# =========================================================

cmmsRouter.get(
  '/machines',
  async (_, res) => {
    const machines =
      await prisma.maintenanceMachine.findMany()

    res.json(machines)
  }
)

# =========================================================
# GET WORK ORDERS
# =========================================================

cmmsRouter.get(
  '/work-orders',
  async (_, res) => {
    const orders =
      await prisma.maintenanceWorkOrder.findMany({
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

cmmsRouter.post(
  '/work-orders',
  async (req, res) => {
    const order =
      await prisma.maintenanceWorkOrder.create({
        data: req.body,
      })

    res.json(order)
  }
)

# =========================================================
# GET SCHEDULES
# =========================================================

cmmsRouter.get(
  '/schedules',
  async (_, res) => {
    const schedules =
      await prisma.maintenanceSchedule.findMany()

    res.json(schedules)
  }
)

# =========================================================
# GET HISTORY
# =========================================================

cmmsRouter.get(
  '/history',
  async (_, res) => {
    const history =
      await prisma.maintenanceHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(history)
  }
)
