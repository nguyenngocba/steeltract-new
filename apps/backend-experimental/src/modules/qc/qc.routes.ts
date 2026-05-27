import { Router } from 'express'

import multer from 'multer'

import { prisma } from '../../database/prisma'

export const qcRouter = Router()

const upload =
  multer({
    dest: 'uploads/',
  })

# =========================================================
# INSPECTIONS
# =========================================================

qcRouter.get(
  '/inspections',
  async (_, res) => {

    const data =
      await prisma.qualityInspection.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(data)
  }
)

# =========================================================
# DEFECTS
# =========================================================

qcRouter.get(
  '/defects',
  async (_, res) => {

    const data =
      await prisma.defectReport.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(data)
  }
)

# =========================================================
# NCR
# =========================================================

qcRouter.get(
  '/ncr',
  async (_, res) => {

    const data =
      await prisma.nCRRecord.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(data)
  }
)

# =========================================================
# CREATE DEFECT
# =========================================================

qcRouter.post(
  '/defects',
  upload.single('image'),

  async (req, res) => {

    const body =
      req.body

    const defect =
      await prisma.defectReport.create({
        data: {
          defectCode:
            body.defectCode,

          referenceCode:
            body.referenceCode,

          defectType:
            body.defectType,

          severity:
            body.severity,

          description:
            body.description,

          status:
            'open',

          reportedBy:
            body.reportedBy,

          imageUrl:
            req.file?.filename,
        },
      })

    res.json(defect)
  }
)
