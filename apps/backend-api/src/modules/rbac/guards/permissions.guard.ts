import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RbacService } from '../services/rbac.service';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      path?: string;
    }>();

    const user = request.user;

    if (!user) {
      await this.rbacService.logPermissionDenied({
        permissions: requiredPermissions,
        path: request.path,
      });

      throw new ForbiddenException('Permission denied');
    }

    const allowed = await this.rbacService.hasPermissions(
      user.id,
      requiredPermissions,
    );

    if (!allowed) {
      await this.rbacService.logPermissionDenied({
        userId: user.id,
        permissions: requiredPermissions,
        path: request.path,
      });

      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
