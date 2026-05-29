import { Module }
  from '@nestjs/common'

import { CommandBus }
  from './command.bus'

import { QueryBus }
  from './query.bus'

@Module({
  providers: [
    CommandBus,
    QueryBus,
  ],

  exports: [
    CommandBus,
    QueryBus,
  ],
})
export class CqrsModule {}
