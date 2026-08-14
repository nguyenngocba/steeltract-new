import { createServer } from 'node:http'

const port = Number(process.env.PORT ?? 8080)

createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200).end('ok\n')
    return
  }

  if (request.method !== 'POST' || request.url !== '/alerts') {
    response.writeHead(404).end()
    return
  }

  const chunks = []
  request.on('data', (chunk) => chunks.push(chunk))
  request.on('end', () => {
    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    const alertNames = (payload.alerts ?? [])
      .map((alert) => alert.labels?.alertname)
      .filter(Boolean)
    process.stdout.write(
      `${JSON.stringify({
        event: 'alerts_received',
        status: payload.status ?? 'unknown',
        alertNames,
      })}\n`,
    )
    response.writeHead(204).end()
  })
}).listen(port, '0.0.0.0', () => {
  process.stdout.write(
    `${JSON.stringify({ event: 'alert_receiver_ready', port })}\n`,
  )
})
