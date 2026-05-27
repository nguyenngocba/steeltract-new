import mqtt from 'mqtt'

export const mqttClient =
  mqtt.connect(
    process.env.MQTT_URL ||
    'mqtt://localhost:1883'
  )

mqttClient.on('connect', () => {
  console.log('MQTT CONNECTED')

  mqttClient.subscribe('steeltrack/#')
})

mqttClient.on('message', (topic, payload) => {
  console.log(
    'MQTT MESSAGE',
    topic,
    payload.toString()
  )
})
