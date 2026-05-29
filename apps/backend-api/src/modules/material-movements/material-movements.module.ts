import { Module }
  from '@nestjs/common'

import { MaterialMovementsController }
  from './material-movements.controller'

import { MaterialMovementsService }
  from './material-movements.service'

@Module({
  controllers: [
    MaterialMovementsController,
  ],

  providers: [
    MaterialMovementsService,
  ],
})
export class MaterialMovementsModule {}
