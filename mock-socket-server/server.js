const { Server } = require('socket.io')

const io = new Server(3000, {
  cors: {
    origin: '*',
  },
})

console.log('SOCKET SERVER RUNNING ON 3000')

setInterval(() => {
  io.emit('inventory:event', {
    title: 'Xuất kho vật tư',
    description: 'Beam H400 → Xưởng',
  })
}, 5000)

setInterval(() => {
  io.emit('yard:event', {
    title: 'Di chuyển bãi',
    description: 'Zone A1 → Zone C3',
  })
}, 7000)

setInterval(() => {
  io.emit('fabrication:event', {
    title: 'Gia công hoàn thành',
    description: 'Component CK-220',
  })
}, 9000)
