import { Router } from 'express'

import QRCode from 'qrcode'

import { prisma } from '../../database/prisma'

export const trackingRouter = Router()

# =========================================================
# GET TAGS
# =========================================================

trackingRouter.get(
  '/tags',
  async (_, res) => {

    const tags =
      await prisma.trackingTag.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(tags)
  }
)

# =========================================================
# CREATE QR
# =========================================================

trackingRouter.post(
  '/generate-qr',
  async (req, res) => {

    const {
      tagCode,
    } = req.body

    const qr =
      await QRCode.toDataURL(tagCode)

    res.json({
      qr,
    })
  }
)

# =========================================================
# SCAN EVENT
# =========================================================

trackingRouter.post(
  '/scan',
  async (req, res) => {

    const payload =
      req.body

    const history =
      await prisma.trackingHistory.create({
        data: payload,
      })

    await prisma.trackingTag.update({
      where: {
        tagCode:
          payload.tagCode,
      },

      data: {
        lastLocation:
          payload.toLocation,
      },
    })

    res.json(history)
  }
)

# =========================================================
# HISTORY
# =========================================================

trackingRouter.get(
  '/history',
  async (_, res) => {

    const history =
      await prisma.trackingHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(history)
  }
)
