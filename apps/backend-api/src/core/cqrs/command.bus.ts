import { Injectable }
  from '@nestjs/common'

import { Command }
  from './command.types'

type Handler = (
  payload: any,
) => Promise<any>

@Injectable()
export class CommandBus {
  private handlers =
    new Map<
      string,
      Handler
    >()

  register(
    type: string,
    handler: Handler,
  ) {
    this.handlers.set(
      type,
      handler,
    )
  }

  async execute(
    command: Command,
  ) {
    const handler =
      this.handlers.get(
        command.type,
      )

    if (!handler) {
      throw new Error(
        `No handler for ${command.type}`,
      )
    }

    return handler(
      command.payload,
    )
  }
}
