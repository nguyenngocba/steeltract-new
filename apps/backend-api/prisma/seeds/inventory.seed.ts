import { PrismaClient }
from '@prisma/client'

const prisma =
  new PrismaClient()

async function main() {

  const warehouse =
    await prisma.warehouse.create({

      data: {

        code:
          'WH-A',

        name:
          'Warehouse A',
      },
    })

  const unit =
    await prisma.unit.create({

      data: {

        code:
          'PCS',

        name:
          'Pieces',

        symbol:
          'pcs',
      },
    })

  const category =
    await prisma.category.create({

      data: {

        code:
          'STEEL',

        name:
          'Steel Material',
      },
    })

  await prisma.material.create({

    data: {

      code:
        'MAT-0001',

      name:
        'Steel Plate SS400',

      quantity:
        520,

      minStock:
        100,

      warehouseId:
        warehouse.id,

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
