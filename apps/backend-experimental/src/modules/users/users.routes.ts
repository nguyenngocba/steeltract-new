import { Router } from 'express'
import bcrypt from 'bcrypt'

import { prisma } from '../../database/prisma'
import { authMiddleware } from '../auth/auth.middleware'

export const usersRouter = Router()

usersRouter.use(authMiddleware)

usersRouter.get('/', async (_, res) => {
  const users =
    await prisma.user.findMany({
      include: {
        role: true,
      },
    })

  res.json(users)
})

usersRouter.post('/', async (req, res) => {
  const password =
    await bcrypt.hash(req.body.password, 10)

  const user =
    await prisma.user.create({
      data: {
        ...req.body,
        password,
      },
    })

  res.json(user)
})
