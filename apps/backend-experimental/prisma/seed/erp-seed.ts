import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.supplier.createMany({
    data: [
      {
        supplierCode: 'SUP-001',

        supplierName: 'Hoa Phat Steel',

        contactPerson: 'Nguyen Van C',

        phoneNumber: '0909000001',

        status: 'active',
      },

      {
        supplierCode: 'SUP-002',

        supplierName: 'Pomina Steel',

        contactPerson: 'Tran Van D',

        phoneNumber: '0909000002',

        status: 'active',
      },
    ],
  })

  await prisma.purchaseOrder.createMany({
    data: [
      {
        poCode: 'PO-2026-001',

        supplierCode: 'SUP-001',

        orderDate: new Date(),

        expectedDate: new Date(),

        totalAmount: 480000000,

        status: 'approved',

        createdBy: 'admin',
      },

      {
        poCode: 'PO-2026-002',

        supplierCode: 'SUP-002',

        orderDate: new Date(),

        expectedDate: new Date(),

        totalAmount: 210000000,

        status: 'pending',

        createdBy: 'admin',
      },
    ],
  })

  await prisma.costingRecord.createMany({
    data: [
      {
        costingCode: 'COST-001',

        referenceCode: 'CK-220',

        materialCost: 12000000,

        laborCost: 4200000,

        machineCost: 1800000,

        overheadCost: 1200000,

        totalCost: 19200000,
      },
    ],
  })

  await prisma.expenseRecord.createMany({
    data: [
      {
        expenseCode: 'EXP-001',

        category: 'Maintenance',

        amount: 12000000,

        description:
          'Machine repair',

        recordedBy: 'finance',

        expenseDate: new Date(),
      },
    ],
  })

  await prisma.financialTransaction.createMany({
    data: [
      {
        transactionCode: 'TRX-001',

        transactionType: 'purchase',

        amount: 480000000,

        description:
          'Steel purchase order',

        status: 'completed',

        transactionDate: new Date(),
      },
    ],
  })

  console.log('ERP SEEDED')
}

main()
