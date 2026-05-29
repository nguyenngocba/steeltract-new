import { Injectable }
  from '@nestjs/common'

type QueryHandler = (
  payload?: any,
) => Promise<any>

@Injectable()
export class QueryBus {
  private handlers =
    new Map<
      string,
      QueryHandler
    >()

  register(
    type: string,
    handler: QueryHandler,
  ) {
    this.handlers.set(
      type,
      handler,
    )
  }

  async execute(
    type: string,
    payload?: any,
  ) {
    const handler =
      this.handlers.get(
        type,
      )

    if (!handler) {
      throw new Error(
        `No query handler for ${type}`,
      )
    }

    return handler(payload)
  }
}
