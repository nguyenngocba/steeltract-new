import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SystemController } from './system.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
})
export class SystemModule {}
