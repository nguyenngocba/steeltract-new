import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      app: 'SteelTrack ERP API',
      status: 'running',
    }
  }
}
