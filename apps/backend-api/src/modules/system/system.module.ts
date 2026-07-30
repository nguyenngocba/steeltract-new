import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SystemController } from './system.controller';
import { SystemRoleAdminRepository } from './system-role-admin.repository';
import { SystemRoleAdminService } from './system-role-admin.service';
import { SystemUserAdminRepository } from './system-user-admin.repository';
import { SystemUserAdminService } from './system-user-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
  providers: [
    SystemRoleAdminRepository,
    SystemRoleAdminService,
    SystemUserAdminRepository,
    SystemUserAdminService,
  ],
})
export class SystemModule {}
