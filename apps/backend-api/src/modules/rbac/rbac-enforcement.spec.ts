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

  it('maps representative controller endpoints to read/write permissions', () => {
    expect(permissions(InventoryController)).toEqual(['inventory.read']);
    expect(
      permissions(InventoryController.prototype.createTransaction),
    ).toEqual(['inventory.write']);

    expect(permissions(ComponentsController)).toEqual(['components.read']);
    expect(permissions(ComponentsController.prototype.create)).toEqual([
      'components.write',
    ]);
    expect(permissions(ComponentCommandController)).toEqual([
      'components.write',
    ]);

    expect(permissions(ProductionController)).toEqual(['production.read']);
    expect(permissions(ProductionController.prototype.create)).toEqual([
      'production.write',
    ]);
    expect(permissions(ProductionCommandController)).toEqual([
      'production.write',
    ]);
    expect(
      permissions(
        ProductionCommandController.prototype
          .getComponentInstanceExecutionHistory,
      ),
    ).toEqual(['production.read']);

    expect(permissions(QcController)).toEqual(['qc.read']);
    expect(permissions(QcController.prototype.passInspectionCommand)).toEqual([
      'qc.write',
    ]);
    expect(permissions(QcController.prototype.failInspectionCommand)).toEqual([
      'qc.write',
    ]);

    expect(permissions(ProjectsController)).toEqual(['projects.read']);
    expect(permissions(ProjectsController.prototype.create)).toEqual([
      'projects.write',
    ]);

    expect(permissions(SuppliersController)).toEqual(['master-data.read']);
    expect(permissions(SuppliersController.prototype.create)).toEqual([
      'master-data.write',
    ]);
    expect(permissions(DictionariesController)).toEqual(['master-data.read']);
    expect(permissions(DictionariesController.prototype.create)).toEqual([
      'master-data.write',
    ]);
    expect(permissions(DictionariesController.prototype.deactivate)).toEqual([
      'master-data.write',
    ]);

    expect(permissions(LogisticsController)).toEqual(['logistics.read']);
    expect(permissions(LogisticsController.prototype.createDispatchOrder)).toEqual([
      'logistics.write',
    ]);

    expect(permissions(YardController)).toEqual(['yard.read']);
    expect(permissions(YardController.prototype.stageComponentInstance)).toEqual([
      'yard.write',
    ]);
    expect(permissions(YardController.prototype.moveItem)).toEqual([
      'yard.write',
    ]);

    expect(permissions(SystemController)).toEqual(['rbac.read']);
    expect(permissions(SystemController.prototype.createUser)).toEqual([
      'rbac.write',
    ]);
    expect(permissions(SystemController.prototype.updateUser)).toEqual([
      'rbac.write',
    ]);
    expect(permissions(SystemController.prototype.replaceUserRoles)).toEqual([
      'rbac.write',
    ]);
    expect(permissions(SystemController.prototype.updateUserStatus)).toEqual([
      'rbac.write',
    ]);
    expect(permissions(SystemController.prototype.resetUserPassword)).toEqual([
      'rbac.write',
    ]);
    expect(permissions(SystemController.prototype.createRole)).toEqual([
      'rbac.write',
    ]);
    expect(
      permissions(SystemController.prototype.replaceRolePermissions),
    ).toEqual(['rbac.write']);
    expect(permissions(UomController)).toEqual(['master-data.read']);
    expect(permissions(UomController.prototype.create)).toEqual([
      'master-data.write',
    ]);
  });
});
