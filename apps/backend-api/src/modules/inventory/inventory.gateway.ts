import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class InventoryGateway {
  @WebSocketServer()
  server: Server

  emitTransactionCreated(
    payload: any,
  ) {
    this.server.emit(
      'inventory.transaction.created',
      payload,
    )
  }
}
