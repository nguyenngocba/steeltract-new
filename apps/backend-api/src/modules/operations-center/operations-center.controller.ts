import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationsCenterService } from './operations-center.service';

@UseGuards(JwtAuthGuard)
@Controller('operations-center')
export class OperationsCenterController {
  constructor(
    private readonly operationsCenter: OperationsCenterService,
  ) {}

  @Get('overview')
  overview() {
    return this.operationsCenter.overview();
  }
}
