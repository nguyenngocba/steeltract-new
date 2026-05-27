import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'

import { Server } from 'socket.io'

import { inventoryRouter } from './modules/inventory/inventory.routes'
import { yardRouter } from './modules/yard/yard.routes'
import { componentsRouter } from './modules/components/components.routes'
import { initializeIotGateway } from './modules/iot/gateways/iot.gateway'
import { authRouter } from './modules/auth/auth.routes'
import { usersRouter } from './modules/users/users.routes'
import { rolesRouter } from './modules/roles/roles.routes'
import { mesRouter } from './modules/mes/mes.routes'
import { cmmsRouter } from './modules/cmms/cmms.routes'
import { trackingRouter } from './modules/tracking/tracking.routes'
import { qcRouter } from './modules/qc/qc.routes'
import { hrmRouter } from './modules/hrm/hrm.routes'
import { erpRouter } from './modules/erp/erp.routes'
import { workflowRouter } from './modules/workflow/workflow.routes'
import { aiRouter } from './modules/ai/ai.routes'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

initializeIotGateway(io)

app.use('/api/inventory', inventoryRouter)
app.use('/api/yard', yardRouter)
app.use('/api/components', componentsRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/mes', mesRouter)
app.use('/api/cmms', cmmsRouter)
app.use('/api/tracking', trackingRouter)
app.use('/api/qc', qcRouter)
app.use('/api/hrm', hrmRouter)
app.use('/api/erp', erpRouter)
app.use('/api/workflow', workflowRouter)
app.use('/api/ai', aiRouter)

setInterval(() => {
  io.emit('inventory:event', {
    title: 'Xuất kho vật tư',
    description: 'Beam H400 → Xưởng',
  })

  io.emit('yard:event', {
    title: 'Di chuyển bãi',
    description: 'Zone A1 → C3',
  })

  io.emit('fabrication:event', {
    title: 'Gia công hoàn thành',
    description: 'CK-220',
  })
}, 5000)

server.listen(process.env.PORT, () => {
  console.log(`SERVER RUNNING ${process.env.PORT}`)
})
