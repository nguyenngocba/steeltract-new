import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { PermissionsGuard } from './guards/permissions.guard';
import { RbacRepository } from './repositories/rbac.repository';
import { RbacService } from './services/rbac.service';

@Module({
  imports: [PrismaModule],
  providers: [RbacRepository, RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
