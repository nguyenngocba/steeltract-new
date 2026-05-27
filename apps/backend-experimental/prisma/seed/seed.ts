import { prisma } from '../../src/database/prisma'

async function main() {
  await prisma.material.createMany({
    data: [
      {
        code: 'VT-001',
        name: 'Beam H400',
        category: 'Steel',
        unit: 'Cây',
        quantity: 248,
        warehouse: 'Kho A',
        location: 'A1-R02',
        minStock: 50,
      },
      {
        code: 'VT-002',
        name: 'Plate 12mm',
        category: 'Plate',
        unit: 'Tấm',
        quantity: 600,
        warehouse: 'Kho B',
        location: 'B2-R03',
        minStock: 100,
      },
    ],
  })

  console.log('SEEDED')
}

main()
