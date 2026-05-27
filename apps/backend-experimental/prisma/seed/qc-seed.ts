import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.qualityInspection.createMany({
    data: [
      {
        inspectionCode: 'QC-001',

        referenceType: 'component',

        referenceCode: 'CK-220',

        inspector: 'Nguyen Van A',

        inspectionType: 'visual',

        status: 'passed',

        score: 96,
      },

      {
        inspectionCode: 'QC-002',

        referenceType: 'welding',

        referenceCode: 'WL-882',

        inspector: 'Tran Van B',

        inspectionType: 'dimension',

        status: 'failed',

        score: 62,
      },
    ],
  })

  await prisma.defectReport.createMany({
    data: [
      {
        defectCode: 'DF-001',

        referenceCode: 'CK-220',

        defectType: 'welding',

        severity: 'high',

        description:
          'Weld crack detected',

        status: 'open',

        reportedBy: 'QC Team',
      },

      {
        defectCode: 'DF-002',

        referenceCode: 'CK-440',

        defectType: 'paint',

        severity: 'medium',

        description:
          'Surface paint inconsistency',

        status: 'reviewing',

        reportedBy: 'QA Team',
      },
    ],
  })

  await prisma.nCRRecord.createMany({
    data: [
      {
        ncrCode: 'NCR-001',

        defectCode: 'DF-001',

        correctiveAction:
          'Re-weld affected zone',

        rootCause:
          'Improper heat setting',

        assignedTo:
          'Maintenance Team',

        status: 'open',
      },
    ],
  })

  console.log('QC SEEDED')
}

main()
