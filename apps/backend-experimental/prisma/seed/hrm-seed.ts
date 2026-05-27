import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.employee.createMany({
    data: [
      {
        employeeCode: 'EMP-001',

        fullName: 'Nguyen Van A',

        department: 'Production',

        position: 'Welding Operator',

        shiftGroup: 'SHIFT-A',

        status: 'active',

        joinedAt: new Date(),
      },

      {
        employeeCode: 'EMP-002',

        fullName: 'Tran Van B',

        department: 'QC',

        position: 'QC Inspector',

        shiftGroup: 'SHIFT-B',

        status: 'active',

        joinedAt: new Date(),
      },
    ],
  })

  await prisma.shiftSchedule.createMany({
    data: [
      {
        shiftCode: 'SHIFT-A',

        shiftName: 'Morning Shift',

        startTime: '07:00',

        endTime: '15:00',

        breakMinutes: 60,

        status: 'active',
      },

      {
        shiftCode: 'SHIFT-B',

        shiftName: 'Night Shift',

        startTime: '15:00',

        endTime: '23:00',

        breakMinutes: 60,

        status: 'active',
      },
    ],
  })

  await prisma.operatorAssignment.createMany({
    data: [
      {
        employeeCode: 'EMP-001',

        machineCode: 'MC-01',

        assignedShift: 'SHIFT-A',

        assignedDate: new Date(),

        status: 'active',
      },
    ],
  })

  console.log('HRM SEEDED')
}

main()
