import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { RbacService } from '../../rbac/services/rbac.service';
import { AuthUser } from '../../rbac/types/auth-user';

const PERMISSION_BY_TYPE: Record<string, string> = {
  IMPORT: 'inventory.receive',
  INBOUND: 'inventory.receive',
  EXPORT: 'inventory.issue',
  OUTBOUND: 'inventory.issue',
  TRANSFER: 'inventory.transfer',
  ADJUSTMENT: 'inventory.adjust',
  RETURN: 'inventory.return',
};

const INVENTORY_TRANSACTION_PERMISSIONS = [
  ...new Set(Object.values(PERMISSION_BY_TYPE)),
];

@Injectable()
export class InventoryTransactionPermissionsGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      body?: { type?: string };
      path?: string;
    }>();
    const requestedPermission = request.body?.type
      ? PERMISSION_BY_TYPE[String(request.body.type).toUpperCase()]
      : undefined;
    const candidates = requestedPermission
      ? [requestedPermission]
      : INVENTORY_TRANSACTION_PERMISSIONS;
    const allowed = request.user
      ? (
          await Promise.all(
            candidates.map((permission) =>
              this.rbacService.hasPermissions(request.user!.id, [permission]),
            ),
          )
        ).some(Boolean)
      : false;

    if (allowed) return true;

    await this.rbacService.logPermissionDenied({
      userId: request.user?.id,
      permissions: candidates,
      path: request.path,
    });
    throw new ForbiddenException('Permission denied');
  }
}
