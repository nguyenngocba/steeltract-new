import { PrismaClient, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

function daysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

async function main() {
  console.log('Resetting inventory phase2 demo data...')

  await prisma.$transaction(async (tx) => {
    // Clear inventory transactional truth first.
    await tx.inventoryTransactionItem.deleteMany({})
    await tx.inventoryTransaction.deleteMany({})
    await tx.returnRequestItem.deleteMany({})
    await tx.returnRequest.deleteMany({})
    await tx.inventoryItem.deleteMany({})

    // Remove previous phase2 demo entities only.
    await tx.component.deleteMany({
      where: { code: { startsWith: 'STK-CMP-' } },
    })
    await tx.project.deleteMany({
      where: { code: { startsWith: 'STK-PRJ-' } },
    })
    await tx.supplier.deleteMany({
      where: { code: { startsWith: 'STK-SUP-' } },
    })
  })

  const [zoneA, zoneB] = await Promise.all([
    prisma.warehouseZone.upsert({
      where: { code: 'A01' },
      create: { code: 'A01', name: 'Warehouse Zone A01' },
      update: { name: 'Warehouse Zone A01' },
    }),
    prisma.warehouseZone.upsert({
      where: { code: 'B01' },
      create: { code: 'B01', name: 'Warehouse Zone B01' },
      update: { name: 'Warehouse Zone B01' },
    }),
  ])

  const category = await prisma.inventoryCategory.upsert({
    where: { code: 'STK-STEEL' },
    create: {
      code: 'STK-STEEL',
      name: 'Thép kết cấu',
      description: 'Nhóm vật tư phase 2 demo',
    },
    update: {},
  })

  const kgUnit = await prisma.masterUnit.findFirst({
    where: { code: 'KG' },
  })

  const suppliers = await Promise.all(
    [
      ['STK-SUP-01', 'Công ty Thép Miền Nam'],
      ['STK-SUP-02', 'Nhà cung cấp Hòa Phát'],
      ['STK-SUP-03', 'NCC Vật tư Công trình'],
    ].map(([code, name]) =>
      prisma.supplier.create({
        data: {
          code,
          name,
          contact: 'Demo Contact',
          phone: '0900000000',
          email: `${code.toLowerCase()}@steeltrack.local`,
          address: 'Da Nang',
        },
      }),
    ),
  )

  const projects = await Promise.all(
    [
      ['STK-PRJ-01', 'Dự án Nhà xưởng A'],
      ['STK-PRJ-02', 'Dự án Kho B'],
      ['STK-PRJ-03', 'Dự án Cầu C'],
    ].map(([code, name]) =>
      prisma.project.create({
        data: {
          code,
          name,
        },
      }),
    ),
  )

  await Promise.all(
    [
      ['STK-CMP-01', 'Dầm chính A'],
      ['STK-CMP-02', 'Cột B'],
      ['STK-CMP-03', 'Giằng C'],
    ].map(([code, name], idx) =>
      prisma.component.create({
        data: {
          code,
          name,
          projectId: projects[idx % projects.length].id,
        },
      }),
    ),
  )

  const materials = await Promise.all(
    [
      ['STK-MAT-001', 'HB200'],
      ['STK-MAT-002', 'PL12'],
      ['STK-MAT-003', 'I200'],
    ].map(([code, name]) =>
      prisma.inventoryItem.create({
        data: {
          code: String(code),
          name: String(name),
          categoryId: category.id,
          unit: 'KG',
          unitId: kgUnit?.id,
          minimumStock: 500,
          zoneId: zoneA.id,
          quantity: 0,
        },
      }),
    ),
  )

  const txSpecs: Array<{
    code: string
    no: string
    type: TransactionType
    date: Date
    supplierId?: string
    projectId?: string
    items: Array<{
      itemId: string
      qty: number
      price?: number
      zoneId?: string
    }>
  }> = [
    {
      code: 'STK-TX-0001',
      no: 'NK-2606-001',
      type: 'IMPORT',
      date: daysAgo(12),
      supplierId: suppliers[0].id,
      items: [{ itemId: materials[0].id, qty: 1800, price: 18000, zoneId: zoneA.id }],
    },
    {
      code: 'STK-TX-0002',
      no: 'NK-2606-002',
      type: 'IMPORT',
      date: daysAgo(10),
      supplierId: suppliers[1].id,
      items: [{ itemId: materials[1].id, qty: 1500, price: 14500, zoneId: zoneA.id }],
    },
    {
      code: 'STK-TX-0003',
      no: 'NK-2606-003',
      type: 'IMPORT',
      date: daysAgo(8),
      supplierId: suppliers[2].id,
      items: [{ itemId: materials[2].id, qty: 1300, price: 16800, zoneId: zoneA.id }],
    },
    {
      code: 'STK-TX-0004',
      no: 'XK-2606-001',
      type: 'EXPORT',
      date: daysAgo(6),
      projectId: projects[0].id,
      items: [{ itemId: materials[0].id, qty: -300, price: 18000, zoneId: zoneA.id }],
    },
    {
      code: 'STK-TX-0005',
      no: 'XK-2606-002',
      type: 'EXPORT',
      date: daysAgo(5),
      projectId: projects[1].id,
      items: [{ itemId: materials[1].id, qty: -250, price: 14500, zoneId: zoneA.id }],
    },
    {
      code: 'STK-TX-0006',
      no: 'DC-2606-001',
      type: 'TRANSFER',
      date: daysAgo(4),
      items: [
        { itemId: materials[0].id, qty: -200, zoneId: zoneA.id },
        { itemId: materials[0].id, qty: 200, zoneId: zoneB.id },
      ],
    },
    {
      code: 'STK-TX-0007',
      no: 'DC-2606-002',
      type: 'TRANSFER',
      date: daysAgo(3),
      items: [
        { itemId: materials[2].id, qty: -120, zoneId: zoneA.id },
        { itemId: materials[2].id, qty: 120, zoneId: zoneB.id },
      ],
    },
  ]

  for (const spec of txSpecs) {
    await prisma.inventoryTransaction.create({
      data: {
        code: spec.code,
        transactionNo: spec.no,
        type: spec.type,
        direction:
          spec.type === 'IMPORT'
            ? 'INBOUND'
            : spec.type === 'EXPORT'
              ? 'OUTBOUND'
              : 'INTERNAL',
        supplierId: spec.supplierId,
        projectId: spec.projectId,
        transactionDate: spec.date,
        remarks: 'Phase2 demo seed',
        items: {
          create: spec.items.map((line) => ({
            inventoryItemId: line.itemId,
            quantity: line.qty,
            unitPrice: line.price ?? null,
            totalAmount:
              line.price != null
                ? line.qty * line.price
                : null,
            zoneId: line.zoneId,
            unitId: kgUnit?.id,
          })),
        },
      },
    })
  }

  // Rebuild quantity snapshot from transaction history.
  const grouped = await prisma.inventoryTransactionItem.groupBy({
    by: ['inventoryItemId'],
    _sum: { quantity: true },
  })

  await Promise.all(
    grouped.map((g) =>
      prisma.inventoryItem.update({
        where: { id: g.inventoryItemId },
        data: { quantity: Number(g._sum.quantity ?? 0) },
      }),
    ),
  )

  console.log('Inventory phase2 demo reset completed.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
