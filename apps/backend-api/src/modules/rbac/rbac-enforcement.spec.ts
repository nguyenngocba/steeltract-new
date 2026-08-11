import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ComponentsController } from '../components/components.controller';
import { ComponentCommandController } from '../components/component-command.controller';
import { InventoryController } from '../inventory/inventory.controller';
import { LogisticsController } from '../logistics/logistics.controller';
import { DictionariesController } from '../master-data/dictionaries/dictionaries.controller';
import { SuppliersController } from '../master-data/suppliers/suppliers.controller';
import { UomController } from '../master-data/uom/uom.controller';
import { ProductionController } from '../production/production.controller';
import { ProductionCommandController } from '../production/production-command.controller';
import { MaterialRequestsController } from '../material-requests/material-requests.controller';
import { PurchaseOrdersController } from '../purchase-orders/purchase-orders.controller';
import { ProcurementController } from '../purchasing/controllers/procurement.controller';
import { ProjectsController } from '../projects/projects.controller';
import { QcController } from '../qc/qc.controller';
import { SystemController } from '../system/system.controller';
import { YardController } from '../yard/yard.controller';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { CANONICAL_PERMISSIONS, RbacService } from './services/rbac.service';

function permissions(target: object) {
  return Reflect.getMetadata(PERMISSIONS_KEY, target);
}

describe('canonical RBAC enforcement', () => {
  it('keeps the canonical permission catalog stable for enforced modules', () => {
    expect(CANONICAL_PERMISSIONS).toEqual(
      expect.arrayContaining([
        'inventory.read',
        'inventory.write',
        'components.read',
        'components.write',
        'production.read',
        'production.write',
        'qc.read',
        'qc.write',
        'yard.read',
        'yard.write',
        'projects.read',
        'projects.write',
        'master-data.read',
        'master-data.write',
        'logistics.read',
        'logistics.write',
        'rbac.read',
        'dashboard.view',
        'inventory.receive',
        'procurement.view',
        'procurement.request.create',
        'procurement.po.create',
        'procurement.po.approve',
        'procurement.receipt',
        'procurement.return',
        'production.release',
        'qc.pass',
        'logistics.dispatch',
        'users.disable',
      ]),
    );
  });

  it('returns 403 when an authenticated user lacks a required permission', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['inventory.write']),
    } as unknown as Reflector;
    const rbacService = {
      hasPermissions: jest.fn().mockResolvedValue(false),
      logPermissionDenied: jest.fn().mockResolvedValue(undefined),
    } as unknown as RbacService;
    const guard = new PermissionsGuard(reflector, rbacService);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'viewer-1' },
          path: '/inventory/transactions',
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(rbacService.hasPermissions).toHaveBeenCalledWith('viewer-1', [
      'inventory.write',
    ]);
    expect(rbacService.logPermissionDenied).toHaveBeenCalledWith({
      userId: 'viewer-1',
      permissions: ['inventory.write'],
      path: '/inventory/transactions',
    });
  });

  it('allows an authenticated user with the required permission', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['production.write']),
    } as unknown as Reflector;
    const rbacService = {
      hasPermissions: jest.fn().mockResolvedValue(true),
    } as unknown as RbacService;
    const guard = new PermissionsGuard(reflector, rbacService);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'operator-1' },
          path: '/production/commands/orders',
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith('operator-1', [
      'production.write',
    ]);
  });

  it('maps representative controller endpoints to action permissions', () => {
    expect(permissions(InventoryController)).toEqual(['inventory.view']);
    expect(
      permissions(InventoryController.prototype.createTransaction),
    ).toBeUndefined();

    expect(permissions(ComponentsController)).toEqual(['components.view']);
    expect(permissions(ComponentsController.prototype.create)).toEqual([
      'components.create',
    ]);
    expect(permissions(ComponentCommandController)).toEqual([
      'components.edit',
    ]);

    expect(permissions(ProductionController)).toEqual(['production.view']);
    expect(permissions(ProductionController.prototype.create)).toEqual([
      'production.create',
    ]);
    expect(permissions(ProductionCommandController)).toEqual([
      'production.execute',
    ]);
    expect(
      permissions(
        ProductionCommandController.prototype
          .getComponentInstanceExecutionHistory,
      ),
    ).toEqual(['production.view']);

    expect(permissions(QcController)).toEqual(['qc.view']);
    expect(permissions(QcController.prototype.passInspectionCommand)).toEqual([
      'qc.pass',
    ]);
    expect(permissions(QcController.prototype.failInspectionCommand)).toEqual([
      'qc.fail',
    ]);

    expect(permissions(ProjectsController)).toEqual(['projects.view']);
    expect(permissions(ProjectsController.prototype.create)).toEqual([
      'projects.create',
    ]);

    expect(permissions(MaterialRequestsController)).toEqual([
      'procurement.view',
    ]);
    expect(permissions(MaterialRequestsController.prototype.create)).toEqual([
      'procurement.request.create',
    ]);
    expect(permissions(MaterialRequestsController.prototype.approve)).toEqual([
      'procurement.po.approve',
    ]);
    expect(permissions(PurchaseOrdersController)).toEqual([
      'procurement.view',
    ]);
    expect(permissions(PurchaseOrdersController.prototype.create)).toEqual([
      'procurement.po.create',
    ]);
    expect(permissions(PurchaseOrdersController.prototype.receive)).toEqual([
      'procurement.receipt',
    ]);
    expect(
      permissions(PurchaseOrdersController.prototype.createSupplierReturn),
    ).toEqual(['procurement.return']);
    expect(permissions(ProcurementController)).toEqual(['procurement.view']);

    expect(permissions(SuppliersController)).toEqual(['suppliers.view']);
    expect(permissions(SuppliersController.prototype.create)).toEqual([
      'suppliers.edit',
    ]);
    expect(permissions(DictionariesController)).toEqual(['settings.view']);
    expect(permissions(DictionariesController.prototype.create)).toEqual([
      'settings.edit',
    ]);
    expect(permissions(DictionariesController.prototype.deactivate)).toEqual([
      'settings.edit',
    ]);

    expect(permissions(LogisticsController)).toEqual(['logistics.view']);
    expect(permissions(LogisticsController.prototype.createDispatchOrder)).toEqual([
      'logistics.dispatch',
    ]);

    expect(permissions(YardController)).toEqual(['yard.view']);
    expect(permissions(YardController.prototype.stageComponentInstance)).toEqual([
      'yard.stage',
    ]);
    expect(permissions(YardController.prototype.moveItem)).toEqual([
      'yard.move',
    ]);

    expect(permissions(SystemController)).toEqual(['settings.view']);
    expect(permissions(SystemController.prototype.createUser)).toEqual([
      'users.create',
    ]);
    expect(permissions(SystemController.prototype.updateUser)).toEqual([
      'users.edit',
    ]);
    expect(permissions(SystemController.prototype.replaceUserRoles)).toEqual([
      'users.edit',
    ]);
    expect(permissions(SystemController.prototype.updateUserStatus)).toEqual([
      'users.disable',
    ]);
    expect(permissions(SystemController.prototype.resetUserPassword)).toEqual([
      'users.edit',
    ]);
    expect(permissions(SystemController.prototype.createRole)).toEqual([
      'roles.edit',
    ]);
    expect(
      permissions(SystemController.prototype.replaceRolePermissions),
    ).toEqual(['roles.edit']);
    expect(permissions(UomController)).toEqual(['settings.view']);
    expect(permissions(UomController.prototype.create)).toEqual([
      'settings.edit',
    ]);
  });

  it('accepts legacy broad grants for action permissions without widening view-only roles', async () => {
    const repository = {
      findUserRolesAndPermissions: jest
        .fn()
        .mockResolvedValueOnce([
          {
            role: {
              name: 'legacy-warehouse',
              rolePermissions: [
                { permission: { name: 'inventory.write' } },
              ],
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            role: {
              name: 'warehouse-viewer',
              rolePermissions: [
                { permission: { name: 'inventory.view' } },
              ],
            },
          },
        ]),
    };
    const service = new RbacService(repository as never);

    await expect(
      service.hasPermissions('legacy-user', ['inventory.receive']),
    ).resolves.toBe(true);
    await expect(
      service.hasPermissions('viewer-user', ['inventory.receive']),
    ).resolves.toBe(false);
  });
});
