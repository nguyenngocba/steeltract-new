import { Router } from 'express'

import { prisma } from '../../database/prisma'

export const hrmRouter = Router()

# =========================================================
# EMPLOYEES
# =========================================================

hrmRouter.get(
  '/employees',
  async (_, res) => {

    const employees =
      await prisma.employee.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(employees)
  }
)

# =========================================================
# SHIFTS
# =========================================================

hrmRouter.get(
  '/shifts',
  async (_, res) => {

    const shifts =
      await prisma.shiftSchedule.findMany()

    res.json(shifts)
  }
)

# =========================================================
# ATTENDANCE
# =========================================================

hrmRouter.get(
  '/attendance',
  async (_, res) => {

    const attendance =
      await prisma.attendanceRecord.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(attendance)
  }
)

# =========================================================
# OPERATOR ASSIGNMENT
# =========================================================

hrmRouter.get(
  '/operators',
  async (_, res) => {

    const operators =
      await prisma.operatorAssignment.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(operators)
  }
)

# =========================================================
# CHECK-IN
# =========================================================

hrmRouter.post(
  '/check-in',
  async (req, res) => {

    const body =
      req.body

    const attendance =
      await prisma.attendanceRecord.create({
        data: {
          employeeCode:
            body.employeeCode,

          shiftCode:
            body.shiftCode,

          checkIn:
            new Date(),

          attendanceStatus:
            'checked_in',
        },
      })

    res.json(attendance)
  }
)

# =========================================================
# CHECK-OUT
# =========================================================

hrmRouter.post(
  '/check-out',
  async (req, res) => {

    const body =
      req.body

    const latest =
      await prisma.attendanceRecord.findFirst({
        where: {
          employeeCode:
            body.employeeCode,
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

    if (!latest) {
      return res
        .status(404)
        .json({
          message:
            'Attendance not found',
        })
    }

    const checkOut =
      new Date()

    const hours =
      (
        checkOut.getTime() -
        latest.checkIn!.getTime()
      ) /
      1000 /
      60 /
      60

    const updated =
      await prisma.attendanceRecord.update({
        where: {
          id: latest.id,
        },

        data: {
          checkOut,
          workingHours:
            Number(hours.toFixed(2)),
          attendanceStatus:
            'completed',
        },
      })

    res.json(updated)
  }
)
