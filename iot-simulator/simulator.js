const mqtt = require('mqtt')

const client =
  mqtt.connect('mqtt://localhost:1883')

client.on('connect', () => {
  console.log('SIMULATOR CONNECTED')

  setInterval(() => {
    const payload = {
      machineCode:
        'MC-' +
        Math.floor(Math.random() * 5),

      temperature:
        Math.floor(
          Math.random() * 100
        ),

      vibration:
        Math.floor(
          Math.random() * 10
        ),

      power:
        Math.floor(
          Math.random() * 100
        ),

      load:
        Math.floor(
          Math.random() * 100
        ),

      humidity:
        Math.floor(
          Math.random() * 100
        ),

      timestamp:
        new Date().toISOString(),
    }

    client.publish(
      'steeltrack/machine',
      JSON.stringify(payload)
    )

    console.log(payload)
  }, 3000)
})
