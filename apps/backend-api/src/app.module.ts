import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { JobsModule } from './core/jobs/jobs.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { PerformanceModule } from './core/performance/performance.module';
import { WebsocketModule } from './core/ws/websocket.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionContextMiddleware } from './modules/rbac/middleware/permission-context.middleware';
import { RbacModule } from './modules/rbac/rbac.module';
import { AppController } from './app.controller';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ComponentsModule } from './modules/components/components.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { SupplierScoreModule } from './modules/supplier-score/supplier-score.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { WorkersModule } from './modules/workers/workers.module';
import { ZonesModule } from './modules/zones/zones.module';
import { SiteLogsModule } from './modules/site-logs/site-logs.module';
import { SafetyModule } from './modules/safety/safety.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { MaterialRequestsModule } from './modules/material-requests/material-requests.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsEngineModule } from './modules/analytics-engine/analytics-engine.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ProductionModule } from './modules/production/production.module';
import { QcModule } from './modules/qc/qc.module';
import { YardModule } from './modules/yard/yard.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { DictionariesModule } from './modules/master-data/dictionaries/dictionaries.module';
import { UomModule } from './modules/master-data/uom/uom.module';
import { SuppliersModule } from './modules/master-data/suppliers/suppliers.module';
import { RuntimeWsModule } from './core/ws/runtime-ws.module';
import { CqrsModule } from './core/cqrs/cqrs.module';
import { EventsModule } from './core/events/events.module';
import { TelemetryModule } from './core/telemetry/telemetry.module';
import { MaterialMovementsModule } from './modules/material-movements/material-movements.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
import { SystemModule } from './modules/system/system.module';
import { CostingModule } from './modules/costing/costing.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { OperationsCenterModule } from './modules/operations-center/operations-center.module';
import { ProjectionModule } from './core/projections/projection.module';
import { EnterpriseProcessModule } from './modules/process-orchestration/enterprise-process.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { HistoricalSnapshotEngineModule } from './core/historical-snapshots/historical-snapshot-engine.module';
import { HistoricalDashboardModule } from './core/historical-dashboard/historical-dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { ObservabilityModule } from './core/observability/observability.module';
import { RequestObservabilityMiddleware } from './core/observability/request-observability.middleware';
@Module({
  imports: [
    EventsModule,
    JobsModule,
    PerformanceModule,
    WebsocketModule,
    PrismaModule,
    AuthModule,
    RbacModule,
    InventoryModule,
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
    PurchasingModule,
    AnalyticsModule,
    AnalyticsEngineModule,
    WorkflowModule,
    AttachmentsModule,
    ProductionModule,
    QcModule,
    YardModule,
    SimulationModule,
    UomModule,
    SuppliersModule,
    DictionariesModule,
    RuntimeWsModule,
    CqrsModule,
    EventsModule,
    TelemetryModule,
    MaterialMovementsModule,
    RuntimeModule,
    SystemModule,
    CostingModule,
    LogisticsModule,
    OperationsCenterModule,
    ProjectionModule,
    EnterpriseProcessModule,
    HistoricalSnapshotEngineModule,
    HistoricalDashboardModule,
    HealthModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1_000 }]),
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestObservabilityMiddleware, PermissionContextMiddleware)
      .forRoutes('*');
  }
}
