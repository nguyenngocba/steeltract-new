import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.maintenanceMachine.createMany({
    data: [
      {
        machineCode: 'MC-01',

        machineName: 'CNC Cutting Machine',

        category: 'Cutting',

        manufacturer: 'Mazak',

        serialNumber: 'MZ-2026-001',

        status: 'running',

        location: 'ZONE-A',

        healthScore: 92,
      },

      {
        machineCode: 'MC-02',

        machineName: 'Robot Welding Arm',

        category: 'Welding',

        manufacturer: 'Kuka',

        serialNumber: 'KK-2026-002',

        status: 'maintenance',

        location: 'ZONE-B',

        healthScore: 61,
      },
    ],
  })

  await prisma.maintenanceWorkOrder.createMany({
    data: [
      {
        workOrderCode: 'MWO-001',

        machineCode: 'MC-02',

        maintenanceType: 'Preventive',

        priority: 'high',

        assignedTechnician: 'Nguyen Van A',

        issueDescription:
          'Motor vibration abnormal',

        status: 'in_progress',

        estimatedHours: 4,
      },

      {
        workOrderCode: 'MWO-002',

        machineCode: 'MC-01',

        maintenanceType: 'Inspection',

        priority: 'medium',

        assignedTechnician: 'Tran Van B',

        issueDescription:
          'Monthly inspection',

        status: 'waiting',

        estimatedHours: 2,
      },
    ],
  })

  console.log('CMMS SEEDED')
}

main()
