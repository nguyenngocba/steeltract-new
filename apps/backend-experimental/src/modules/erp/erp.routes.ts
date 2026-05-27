import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const erpRouter = Router()

# =========================================================
# SUPPLIERS
# =========================================================

erpRouter.get(
  '/suppliers',
  async (_, res) => {

    const suppliers =
      await prisma.supplier.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(suppliers)
  }
)

# =========================================================
# PURCHASE ORDERS
# =========================================================

erpRouter.get(
  '/purchase-orders',
  async (_, res) => {

    const orders =
      await prisma.purchaseOrder.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(orders)
  }
)

# =========================================================
# COSTING
# =========================================================

erpRouter.get(
  '/costing',
  async (_, res) => {

    const costing =
      await prisma.costingRecord.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(costing)
  }
)

# =========================================================
# EXPENSES
# =========================================================

erpRouter.get(
  '/expenses',
  async (_, res) => {

    const expenses =
      await prisma.expenseRecord.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(expenses)
  }
)

# =========================================================
# FINANCIAL TRANSACTIONS
# =========================================================

erpRouter.get(
  '/transactions',
  async (_, res) => {

    const transactions =
      await prisma.financialTransaction.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(transactions)
  }
)

# =========================================================
# CREATE PURCHASE ORDER
# =========================================================

erpRouter.post(
  '/purchase-orders',
  async (req, res) => {

    const order =
      await prisma.purchaseOrder.create({
        data: req.body,
      })

    res.json(order)
  }
)
