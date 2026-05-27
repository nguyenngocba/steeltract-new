import { prisma } from '../../../src/database/prisma'

export async function saveTelemetry(
  payload: any
) {
  await prisma.machineTelemetry.create({
    data: {
      machineCode:
        payload.machineCode,

      temperature:
        payload.temperature,

      load:
        payload.load,

      status:
        payload.temperature > 80
          ? 'danger'
          : 'normal',
    },
  })
}
