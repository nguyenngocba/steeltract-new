import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'

import { Server, Socket }
  from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RuntimeGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  handleConnection(
    client: Socket,
  ) {
    console.log(
      '[Runtime Gateway] connected:',
      client.id,
    )
  }

  handleDisconnect(
    client: Socket,
  ) {
    console.log(
      '[Runtime Gateway] disconnected:',
      client.id,
    )
  }

  emit(
    event: string,
    payload: unknown,
  ) {
    this.server.emit(
      event,
      payload,
    )
  }
}
