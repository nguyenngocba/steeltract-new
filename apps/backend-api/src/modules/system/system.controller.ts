import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

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
        { name: 'Email SMTP', status: process.env.SMTP_HOST ? 'CONNECTED' : 'NOT_CONFIGURED' },
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
        masterDataTotal:
          inventoryItems + suppliers + projects + components,
        operationalRecords:
          qcInspections + yardPlacements,
      },
      recentActivities,
    };
  }

  @Get('users')
  async users() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userIds = users.map((user) => user.id);
    const latestLogs = userIds.length
      ? await this.prisma.activityLog.findMany({
          where: { userId: { in: userIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            userId: true,
            action: true,
            module: true,
            createdAt: true,
          },
        })
      : [];
    const latestByUser = new Map<string, (typeof latestLogs)[number]>();
    for (const log of latestLogs) {
      if (log.userId && !latestByUser.has(log.userId)) {
        latestByUser.set(log.userId, log);
      }
    }

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivityAt: latestByUser.get(user.id)?.createdAt ?? null,
      lastActivityAction: latestByUser.get(user.id)?.action ?? null,
      lastActivityModule: latestByUser.get(user.id)?.module ?? null,
      roles: user.userRoles.map((item) => item.role),
    }));
  }

  @Get('roles')
  async roles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        userRoles: true,
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role.userRoles.length,
      permissions: role.rolePermissions.map((item) => item.permission),
    }));
  }

  @Get('role-matrix')
  async roleMatrix() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    const moduleAliases = [
      ['dashboard', 'Tổng quan'],
      ['projects', 'Dự án'],
      ['components', 'Quản lý cấu kiện'],
      ['production', 'Sản xuất'],
      ['inventory', 'Kho vật tư'],
      ['yard', 'Bãi tập kết'],
      ['logistics', 'Vận chuyển'],
      ['qc', 'Chất lượng (QC)'],
      ['reports', 'Báo cáo'],
      ['settings', 'Cài đặt hệ thống'],
      ['users', 'Người dùng'],
      ['roles', 'Vai trò'],
      ['system-logs', 'Nhật ký hệ thống'],
    ] as const;
    const actions = ['view', 'create', 'update', 'delete', 'export'];

    return {
      modules: moduleAliases.map(([key, label]) => ({ key, label })),
      actions,
      permissionCount: permissions.length,
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
    ) as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return logs.map((log) => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) ?? null : null,
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
      ['CRITICAL', 'WARNING', 'HIGH'].includes((item.severity ?? '').toUpperCase()),
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
