import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets'

import { Server }
from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {

  @WebSocketServer()
  server: Server

  @SubscribeMessage(
    'inventory:update',
  )
  handleInventoryUpdate(
    @MessageBody() data: any,
  ) {

    this.server.emit(
      'inventory:updated',
      data,
    )

    return {
      success: true,
    }
  }

  @SubscribeMessage(
    'workflow:update',
  )
  handleWorkflowUpdate(
    @MessageBody() data: any,
  ) {

    this.server.emit(
      'workflow:updated',
      data,
    )

    return {
      success: true,
    }
  }
}
