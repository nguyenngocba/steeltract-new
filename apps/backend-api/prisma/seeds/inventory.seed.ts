import { PrismaClient }
from '@prisma/client'

const prisma =
  new PrismaClient()

async function main() {

  const warehouse =
    await prisma.masterWarehouse.create({

      data: {

        code:
          'WH-A',

        name:
          'Warehouse A',
      },
    })

  const unit =
    await prisma.masterUnit.create({

      data: {

        code:
          'PCS',

        name:
          'Pieces',

        symbol:
          'pcs',
        category: 'GENERAL',
      },
    })

  const category =
    await prisma.inventoryCategory.create({

      data: {

        code:
          'STEEL',

        name:
          'Steel Material',
      },
    })

  await prisma.inventoryItem.create({

    data: {

      code:
        'MAT-0001',

      name:
        'Steel Plate SS400',

      quantity:
        520,

      unitId:
        unit.id,

      categoryId:
        category.id,
    },
  })

  console.log(
    'INVENTORY SEEDED',
  )
}

main()
