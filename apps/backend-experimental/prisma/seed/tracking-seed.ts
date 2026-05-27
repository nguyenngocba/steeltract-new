import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.trackingTag.createMany({
    data: [
      {
        tagCode: 'QR-VT-001',

        tagType: 'QR',

        referenceType: 'material',

        referenceCode: 'VT-001',

        status: 'active',

        lastLocation: 'ZONE-A',
      },

      {
        tagCode: 'RFID-CK-220',

        tagType: 'RFID',

        referenceType: 'component',

        referenceCode: 'CK-220',

        status: 'active',

        lastLocation: 'YARD-B',
      },
    ],
  })

  console.log('TRACKING SEEDED')
}

main()
