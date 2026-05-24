import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const hashedPassword = await bcrypt.hash('123', 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      username: 'admin',
    },
  });

  if (existingUser) {
    const admin = await prisma.user.update({
      where: {
        username: 'admin',
      },

      data: {
        password: hashedPassword,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Admin updated');

    await seedAdminAccess(admin.id);

    return;
  }

  const admin = await prisma.user.create({
    data: {
      username: 'admin',

      email: 'admin@steeltrack.vn',

      password: hashedPassword,

      fullName: 'System Admin',

      status: 'ACTIVE',
    },
  });

  await seedAdminAccess(admin.id);

  console.log('✅ Admin created');
}

async function seedAdminAccess(userId: string) {
  const permissions = [
    'inventory.read',
    'inventory.write',
    'projects.read',
    'projects.write',
    'project.approve',
    'components.read',
    'components.write',
    'tasks.read',
    'tasks.write',
    'rbac.read',
    'rbac.write',
    'workflow.read',
    'workflow.write',
    'attachments.read',
    'attachments.write',
    'jobs.read',
    'jobs.write',
    'analytics.read',
    'analytics.write',
    'production.read',
    'production.write',
    'qc.read',
    'qc.write',
    'yard.read',
    'yard.write',
  ];

  const role = await prisma.role.upsert({
    where: {
      name: 'admin',
    },
    create: {
      name: 'admin',
      description: 'System administrator',
    },
    update: {
      description: 'System administrator',
    },
  });

  for (const name of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        name,
      },
      create: {
        name,
      },
      update: {},
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    create: {
      userId,
      roleId: role.id,
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
