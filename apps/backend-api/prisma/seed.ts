import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  const hashedPassword = await bcrypt.hash(
    '123',
    10,
  )

  const existingUser =
    await prisma.user.findUnique({
      where: {
        username: 'admin',
      },
    })

  if (existingUser) {
    await prisma.user.update({
      where: {
        username: 'admin',
      },

      data: {
        password:
          hashedPassword,
        status: 'ACTIVE',
      },
    })

    console.log(
      '✅ Admin updated',
    )

    return
  }

  await prisma.user.create({
    data: {
      username: 'admin',

      email:
        'admin@steeltrack.vn',

      password:
        hashedPassword,

      fullName:
        'System Admin',

      status: 'ACTIVE',
    },
  })

  console.log(
    '✅ Admin created',
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })