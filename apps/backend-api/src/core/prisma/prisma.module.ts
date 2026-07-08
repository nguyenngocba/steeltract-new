import {
  Global,
  Module,
} from '@nestjs/common'

import { PrismaService } from './prisma.service'
import { PerformanceModule } from '../performance/performance.module'

@Global()
@Module({
  imports: [PerformanceModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
