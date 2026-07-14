import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  SnapshotUpdateDispatcher,
  SnapshotModule,
} from '../jobs/snapshot-update-dispatcher.service';
import { DomainEvent } from './domain-event.interface';
import { EventBusService } from './event-bus.service';

interface SnapshotEventPayload {
  id?: string;
  orderId?: string;
  aggregateId?: string;
  projectId?: string;
  inventoryItemId?: string;
  warehouseId?: string;
  dispatchOrderId?: string;
  productionOrderId?: string;
  workCenterId?: string;
  componentId?: string;
  inspectionId?: string;
  yardZoneId?: string;
  sourceVersion?: string;
}

export const snapshotEventMap: Record<
  string,
  {
    module: SnapshotModule;
    snapshotType: string;
  }
> = {
  'inventory.transaction.created': {
    module: 'inventory',
    snapshotType: 'InventoryDashboardSnapshot',
  },
  'inventory.stock.changed': {
    module: 'inventory',
    snapshotType: 'MaterialLocationBalanceSnapshot',
  },
  'inventory.stock_bucket.updated': {
    module: 'inventory',
    snapshotType: 'MaterialLocationBalanceSnapshot',
  },
  'inventory.material.updated': {
    module: 'inventory',
    snapshotType: 'MaterialLocationBalanceSnapshot',
  },
  'inventory.return.received': {
    module: 'inventory',
    snapshotType: 'InventoryDashboardSnapshot',
  },
  'project.task.created': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot',
  },
  'project.task.updated': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot',
  },
  'project.task.deleted': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot',
  },
  'project.created': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.updated': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.deleted': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.component.changed': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.wbs.generated': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.tasks.bulk_updated': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.template.applied': {
    module: 'projects',
    snapshotType: 'ProjectRuntimeSnapshot',
  },
  'project.schedule.changed': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot:progress',
  },
  'project.material.changed': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot:materials',
  },
  'project.cost.changed': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot:costs',
  },
  'project.inspection.changed': {
    module: 'projects',
    snapshotType: 'ProjectDetailSnapshot:progress',
  },
  'logistics.dispatch.changed': {
    module: 'logistics',
    snapshotType: 'LogisticsDispatchSnapshot',
  },
  'production.started': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.stage.completed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.delayed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.completed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.created': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.released': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.ready': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.started': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.paused': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.resumed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.completed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.closed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.order.cancelled': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.material.reserved': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.material.released': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.material.issued': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.material.consumed': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'production.material.returned': {
    module: 'production',
    snapshotType: 'ProductionOrderSnapshot',
  },
  'component.updated': {
    module: 'components',
    snapshotType: 'ComponentSummarySnapshot',
  },
  'qc.inspection.started': {
    module: 'qc',
    snapshotType: 'QcInspectionSnapshot',
  },
  'qc.inspection.completed': {
    module: 'qc',
    snapshotType: 'QcInspectionSnapshot',
  },
  'qc.issue.created': {
    module: 'qc',
    snapshotType: 'QcInspectionSnapshot',
  },
  'qc.ncr.created': {
    module: 'qc',
    snapshotType: 'QcInspectionSnapshot',
  },
  'qc.rework.required': {
    module: 'qc',
    snapshotType: 'QcInspectionSnapshot',
  },
  'yard.item.placed': {
    module: 'yard',
    snapshotType: 'YardWorkspaceSnapshot',
  },
  'yard.item.moved': {
    module: 'yard',
    snapshotType: 'YardWorkspaceSnapshot',
  },
  'yard.item.removed': {
    module: 'yard',
    snapshotType: 'YardWorkspaceSnapshot',
  },
  'yard.zone.updated': {
    module: 'yard',
    snapshotType: 'YardWorkspaceSnapshot',
  },
  'yard.snapshot.generated': {
    module: 'yard',
    snapshotType: 'YardDashboardSnapshot',
  },
};

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly unsubscribers: Array<() => void> = [];

  constructor(
    @Inject(EventBusService)
    private readonly eventBus: EventBusService,
    @Inject(SnapshotUpdateDispatcher)
    private readonly dispatcher: SnapshotUpdateDispatcher,
  ) {}

  onModuleInit() {
    Object.keys(snapshotEventMap).forEach((eventName) => {
      this.unsubscribers.push(
        this.eventBus.subscribe<SnapshotEventPayload>(eventName, (event) =>
          this.handleSnapshotEvent(event),
        ),
      );
    });
  }

  onModuleDestroy() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  private async handleSnapshotEvent(
    event: DomainEvent<string, SnapshotEventPayload>,
  ) {
    const mapping = snapshotEventMap[event.name];

    if (!mapping) {
      return;
    }

    await this.dispatcher.requestUpdate({
      scope: {
        module: mapping.module,
        snapshotType: mapping.snapshotType,
        scopeId: event.payload.aggregateId,
        projectId: event.payload.projectId,
        inventoryItemId: event.payload.inventoryItemId,
        warehouseId: event.payload.warehouseId,
        dispatchOrderId: event.payload.dispatchOrderId,
        productionOrderId:
          event.payload.productionOrderId ??
          event.payload.orderId ??
          event.payload.aggregateId ??
          event.payload.id,
        workCenterId: event.payload.workCenterId,
        componentId:
          event.payload.componentId ??
          event.payload.aggregateId ??
          event.payload.id,
        inspectionId:
          event.payload.inspectionId ??
          event.payload.aggregateId ??
          event.payload.id,
        yardZoneId: event.payload.yardZoneId,
      },
      reason: 'domain-event',
      sourceEventId: event.metadata?.eventId,
      sourceWatermark: event.payload.sourceVersion,
      priority: 70,
    });
  }
}
