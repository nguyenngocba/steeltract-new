import { prisma } from '../../src/database/prisma'

async function main() {
  await prisma.productionOrder.createMany({
    data: [
      {
        orderCode: 'WO-2026-001',

        projectName: 'Factory Expansion',

        componentCode: 'CK-220',

        quantity: 120,

        status: 'running',

        priority: 'high',

        startDate: new Date(),

        dueDate: new Date(),

        assignedMachine: 'MC-02',

        assignedZone: 'ZONE-A',

        progress: 68,
      },

      {
        orderCode: 'WO-2026-002',

        projectName: 'Warehouse Project',

        componentCode: 'CK-440',

        quantity: 80,

        status: 'waiting',

        priority: 'medium',

        startDate: new Date(),

        dueDate: new Date(),

        assignedMachine: 'MC-03',

        assignedZone: 'ZONE-B',

        progress: 12,
      },
    ],
  })

  console.log('MES SEEDED')
}

main()
