import { Module } from '@nestjs/common'

import { PrismaModule } from './core/prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { AppController } from './app.controller'
import { InventoryController } from './modules/inventory/inventory.controller'
import { ProjectsModule } from './modules/projects/projects.module'
import { ComponentsModule } from './modules/components/components.module'
import { TransactionsModule } from './modules/transactions/transactions.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { EventsGateway } from './core/ws/events.gateway'
import { AttendanceModule } from './modules/attendance/attendance.module'
import { SupplierScoreModule } from './modules/supplier-score/supplier-score.module'
import { EquipmentModule } from './modules/equipment/equipment.module'
import { WorkersModule } from './modules/workers/workers.module'
import { ZonesModule } from './modules/zones/zones.module'
import { SiteLogsModule } from './modules/site-logs/site-logs.module'
import { SafetyModule } from './modules/safety/safety.module'
import { VehiclesModule } from './modules/vehicles/vehicles.module'
import { MaterialRequestsModule } from './modules/material-requests/material-requests.module'
import { ApprovalsModule } from './modules/approvals/approvals.module'
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ComponentsModule,
    TransactionsModule,
    DashboardModule,
    TasksModule,
    AttendanceModule,
    SupplierScoreModule,
    EquipmentModule,
    WorkersModule,
    ZonesModule,
    SiteLogsModule,
    SafetyModule,
    VehiclesModule,
    MaterialRequestsModule,
    ApprovalsModule,
    PurchaseOrdersModule,
    AnalyticsModule,
  ],
  providers: [
    EventsGateway,
],

  controllers: [
  AppController,
  InventoryController,
],
})
export class AppModule {}
