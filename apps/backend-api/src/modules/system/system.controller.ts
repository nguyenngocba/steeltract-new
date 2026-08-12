import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserStatus } from '@prisma/client';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import type { AuthUser } from '../rbac/types/auth-user';
import {
  createSystemRoleSchema,
  replaceSystemRolePermissionsSchema,
  updateSystemRoleSchema,
  type CreateSystemRoleDto,
  type ReplaceSystemRolePermissionsDto,
  type UpdateSystemRoleDto,
} from './dto/role-administration.dto';
import { SystemRoleAdminService } from './system-role-admin.service';
import {
  createSystemUserSchema,
  replaceSystemUserRolesSchema,
  resetSystemUserPasswordSchema,
  updateSystemUserSchema,
  updateSystemUserStatusSchema,
  type CreateSystemUserDto,
  type ReplaceSystemUserRolesDto,
  type ResetSystemUserPasswordDto,
  type UpdateSystemUserDto,
  type UpdateSystemUserStatusDto,
} from './dto/user-administration.dto';
import { SystemUserAdminService } from './system-user-admin.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('settings.view')
@Controller('system')
export class SystemController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleAdminService: SystemRoleAdminService,
    private readonly userAdminService: SystemUserAdminService,
  ) {}

  @Get('overview')
  async overview() {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      roles,
      permissions,
      activityTotal,
      recentActivities,
      inventoryItems,
      suppliers,
      projects,
      components,
      qcInspections,
      yardPlacements,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
      this.prisma.role.count(),
      this.prisma.permission.count(),
      this.prisma.activityLog.count(),
      this.prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryItem.count(),
      this.prisma.supplier.count(),
      this.prisma.project.count(),
      this.prisma.component.count(),
      this.prisma.qcInspection.count(),
      this.prisma.yardItemPlacement.count({ where: { removedAt: null } }),
    ]);

    return {
      company: {
        name: process.env.COMPANY_NAME ?? 'STEELTRACK',
        taxCode: process.env.COMPANY_TAX_CODE ?? '',
        address: process.env.COMPANY_ADDRESS ?? '',
        phone: process.env.COMPANY_PHONE ?? '',
        email: process.env.COMPANY_EMAIL ?? '',
        website: process.env.COMPANY_WEBSITE ?? '',
      },
      system: {
        language: 'Tiếng Việt',
        timezone: 'Asia/Ho_Chi_Minh',
        dateFormat: 'dd/mm/yyyy',
        numberFormat: '1.234,56',
        currency: 'VND',
        weightUnit: 'kg',
        lengthUnit: 'mm',
      },
      documents: {
        inboundPrefix: 'PN-',
        outboundPrefix: 'PX-',
        transferPrefix: 'PC-',
        productionPrefix: 'SX-',
        productionOrderPrefix: 'LSX-',
        qcPrefix: 'QC-',
        serialLength: 6,
      },
      notifications: {
        lowStock: true,
        productionOverdue: true,
        qcFailed: true,
        inventoryMovement: true,
        login: false,
        system: true,
      },
      integrations: [
        {
          name: 'Email SMTP',
          status: process.env.SMTP_HOST ? 'CONNECTED' : 'NOT_CONFIGURED',
        },
        { name: 'Excel Export', status: 'ENABLED' },
        { name: 'AutoCAD', status: 'NOT_CONFIGURED' },
        { name: 'Accounting Software', status: 'NOT_CONFIGURED' },
        { name: 'Integration API', status: 'ENABLED' },
      ],
      backup: {
        enabled: true,
        frequency: 'Hằng ngày',
        retentionDays: 30,
        storagePath: process.env.BACKUP_PATH ?? '/backups/steeltrack',
      },
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        roles,
        permissions,
        activityTotal,
        masterDataTotal: inventoryItems + suppliers + projects + components,
        operationalRecords: qcInspections + yardPlacements,
      },
      recentActivities,
    };
  }

  @Get('users')
  @RequirePermissions('users.view')
  async users() {
    return this.userAdminService.listUsers();
  }

  @Get('users/:id')
  @RequirePermissions('users.view')
  async userDetail(@Param('id') id: string) {
    return this.userAdminService.getUser(id);
  }

  @RequirePermissions('users.create')
  @Post('users')
  async createUser(
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(createSystemUserSchema))
    dto: CreateSystemUserDto,
  ) {
    return this.userAdminService.createUser(dto, req.user.id);
  }

  @RequirePermissions('users.edit')
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(updateSystemUserSchema))
    dto: UpdateSystemUserDto,
  ) {
    return this.userAdminService.updateUser(id, dto, req.user.id);
  }

  @RequirePermissions('users.edit')
  @Put('users/:id/roles')
  async replaceUserRoles(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(replaceSystemUserRolesSchema))
    dto: ReplaceSystemUserRolesDto,
  ) {
    return this.userAdminService.replaceRoles(id, dto, req.user.id);
  }

  @RequirePermissions('users.disable')
  @Post('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(updateSystemUserStatusSchema))
    dto: UpdateSystemUserStatusDto,
  ) {
    return this.userAdminService.updateStatus(id, dto, req.user.id);
  }

  @RequirePermissions('users.edit')
  @Post('users/:id/reset-password')
  async resetUserPassword(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(resetSystemUserPasswordSchema))
    dto: ResetSystemUserPasswordDto,
  ) {
    return this.userAdminService.resetPassword(id, dto, req.user.id);
  }

  @Get('roles')
  @RequirePermissions('roles.view')
  async roles() {
    return this.roleAdminService.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('permissions.view')
  async permissions() {
    return this.roleAdminService.listPermissions();
  }

  @RequirePermissions('roles.edit')
  @Post('roles')
  async createRole(
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(createSystemRoleSchema))
    dto: CreateSystemRoleDto,
  ) {
    return this.roleAdminService.createRole(dto, req.user.id);
  }

  @RequirePermissions('roles.edit')
  @Patch('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(updateSystemRoleSchema))
    dto: UpdateSystemRoleDto,
  ) {
    return this.roleAdminService.updateRole(id, dto, req.user.id);
  }

  @RequirePermissions('roles.edit')
  @Put('roles/:id/permissions')
  async replaceRolePermissions(
    @Param('id') id: string,
    @Req() req: { user: AuthUser },
    @Body(new ZodValidationPipe(replaceSystemRolePermissionsSchema))
    dto: ReplaceSystemRolePermissionsDto,
  ) {
    return this.roleAdminService.replacePermissions(id, dto, req.user.id);
  }

  @Get('role-matrix')
  @RequirePermissions('roles.view')
  async roleMatrix() {
    return this.roleAdminService.roleMatrix();
  }

  @Get('settings-catalog')
  async settingsCatalog() {
    const [
      totalUsers,
      roles,
      permissions,
      activityTotal,
      uomTotal,
      uomActive,
      categories,
      materialUsageTypes,
      materialTypes,
      materials,
      warehouses,
      activeWarehouses,
      notifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
      this.prisma.activityLog.count(),
      this.prisma.masterUnit.count(),
      this.prisma.masterUnit.count({ where: { active: true } }),
      this.prisma.inventoryCategory.count(),
      this.prisma.masterMaterialUsageType.count(),
      this.prisma.materialType.count(),
      this.prisma.inventoryItem.count({ where: { deletedAt: null } }),
      this.prisma.masterWarehouse.count(),
      this.prisma.masterWarehouse.count({ where: { active: true } }),
      this.prisma.notification.count(),
    ]);

    return {
      generatedAt: new Date(),
      categories: [
        {
          key: 'system-information',
          label: 'Thông tin hệ thống',
          status: 'ENV_READ_ONLY',
          source: '/system/overview',
          editable: false,
          count: 1,
        },
        {
          key: 'users',
          label: 'Người dùng',
          status: 'REAL_EDITABLE',
          source: '/system/users',
          editable: true,
          count: totalUsers,
        },
        {
          key: 'roles',
          label: 'Vai trò / Profile phân quyền',
          status: 'REAL_EDITABLE',
          source: '/system/roles',
          editable: true,
          count: roles,
        },
        {
          key: 'permissions',
          label: 'Permission catalog',
          status: 'REAL_READ_ONLY',
          source: '/system/permissions',
          editable: false,
          count: permissions,
        },
        {
          key: 'uom',
          label: 'Đơn vị & quy đổi',
          status: 'REAL_EDITABLE',
          source: '/master-data/uom',
          editable: true,
          count: uomTotal,
          metadata: {
            active: uomActive,
          },
        },
        {
          key: 'material-categories',
          label: 'Danh mục vật tư',
          status: 'REAL_EDITABLE',
          source: '/master-data/material-categories',
          editable: true,
          count: categories,
        },
        {
          key: 'material-usage-types',
          label: 'Loại vật tư',
          status: 'REAL_EDITABLE',
          source: '/master-data/material-usage-types',
          editable: true,
          count: materialUsageTypes,
          metadata: {
            canonicalModel: 'MasterMaterialUsageType',
          },
        },
        {
          key: 'materials',
          label: 'Material Master',
          status: 'REAL_EDITABLE',
          source: '/inventory/items',
          editable: true,
          count: materials,
          metadata: {
            createsStock: false,
          },
        },
        {
          key: 'material-types',
          label: 'Quy cách / Nhóm kỹ thuật',
          status: 'REAL_EDITABLE',
          source: '/master-data/material-types',
          editable: true,
          count: materialTypes,
          metadata: {
            canonicalModel: 'MaterialType',
            schemaGate:
              'Profile/specification/grade/dimension chi tiết chưa có model riêng.',
          },
        },
        {
          key: 'warehouses',
          label: 'Kho',
          status: 'REAL_EDITABLE',
          source: '/master-data/warehouses',
          editable: true,
          count: warehouses,
          metadata: {
            active: activeWarehouses,
            canonicalModel: 'MasterWarehouse',
          },
        },
        {
          key: 'activity-log',
          label: 'Nhật ký hoạt động',
          status: 'REAL_READ_ONLY',
          source: '/system/activity-logs',
          editable: false,
          count: activityTotal,
        },
        {
          key: 'notifications',
          label: 'Thông báo hệ thống',
          status: 'REAL_READ_ONLY',
          source: '/system/notifications',
          editable: false,
          count: notifications,
        },
        {
          key: 'backup',
          label: 'Sao lưu & phục hồi',
          status: 'NOT_IMPLEMENTED',
          source: 'SYSTEM.7',
          editable: false,
          count: 0,
        },
      ],
      safeRuntime: {
        application: process.env.APP_NAME ?? 'SteelTrack ERP',
        environment: process.env.NODE_ENV ?? 'development',
        timezone: process.env.TZ ?? 'Asia/Ho_Chi_Minh',
        serverTime: new Date().toISOString(),
      },
    };
  }

  @Get('activity-logs')
  async activityLogs(
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        module: module || undefined,
        action: action || undefined,
        entity: entity || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const userIds = Array.from(
      new Set(logs.map((log) => log.userId).filter(Boolean)),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return logs.map((log) => ({
      ...log,
      user: log.userId ? (userMap.get(log.userId) ?? null) : null,
    }));
  }

  @Get('activity-summary')
  async activitySummary() {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const byAction: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] ?? 0) + 1;
      const module = log.module ?? 'system';
      byModule[module] = (byModule[module] ?? 0) + 1;
      const day = log.createdAt.toISOString().slice(5, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    return {
      total: logs.length,
      byAction,
      byModule,
      byDay,
    };
  }

  @Get('notifications')
  async notifications() {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const unread = notifications.filter((item) => !item.isRead).length;
    const highPriority = notifications.filter((item) =>
      ['CRITICAL', 'WARNING', 'HIGH'].includes(
        (item.severity ?? '').toUpperCase(),
      ),
    ).length;
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const item of notifications) {
      const severity = item.severity ?? 'INFO';
      const type = item.type ?? 'system';
      bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
      byType[type] = (byType[type] ?? 0) + 1;
    }

    return {
      summary: {
        total: notifications.length,
        unread,
        read: notifications.length - unread,
        highPriority,
      },
      bySeverity,
      byType,
      items: notifications,
    };
  }
}
