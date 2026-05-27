import { mqttClient } from '../runtime/mqtt.client'

import { saveTelemetry } from '../telemetry/telemetry.engine'

export function initializeIotGateway(
  io: any
) {
  mqttClient.on(
    'message',
    async (topic, payloadBuffer) => {
      try {
        const payload =
          JSON.parse(
            payloadBuffer.toString()
          )

        await saveTelemetry(payload)

        io.emit(
          'iot:telemetry',
          payload
        )

        io.emit(
          'machine:update',
          {
            machineCode:
              payload.machineCode,

            temperature:
              payload.temperature,

            load:
              payload.load,

            vibration:
              payload.vibration,
          }
        )

        console.log(
          'IOT TELEMETRY SAVED'
        )
      } catch (error) {
        console.error(error)
      }
    }
  )
}
