import bcrypt from 'bcrypt'

import { prisma } from '../../src/database/prisma'

async function main() {
  const adminRole =
    await prisma.role.create({
      data: {
        name: 'ADMIN',
      },
    })

  await prisma.permission.createMany({
    data: [
      {
        roleId: adminRole.id,
        module: 'inventory',
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
      {
        roleId: adminRole.id,
        module: 'yard',
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
      {
        roleId: adminRole.id,
        module: 'components',
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    ],
  })

  const password =
    await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      username: 'admin',
      password,
      fullName: 'System Admin',
      roleId: adminRole.id,
    },
  })

  console.log('AUTH SEEDED')
}

main()
