import { Router } from 'express'
import bcrypt from 'bcrypt'

import { prisma } from '../../database/prisma'
import { signToken } from './jwt'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const {
    username,
    password,
  } = req.body

  const user =
    await prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

  if (!user) {
    return res.status(401).json({
      message: 'User not found',
    })
  }

  const valid =
    await bcrypt.compare(
      password,
      user.password
    )

  if (!valid) {
    return res.status(401).json({
      message: 'Wrong password',
    })
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role.name,
  })

  res.json({
    token,
    user,
  })
})
