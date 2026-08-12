import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  EnterpriseProjectionName,
  enterpriseProjectionNames,
  ProjectionDefinition,
  ProjectionSourceEvent,
} from './projection.types';

type JsonRecord = Record<string, unknown>;

const inventoryStockEvents = new Set([
  'inventory.received',
  'inventory.issued',
  'inventory.returned',
  'inventory.transferred',
  'inventory.adjusted',
  'inventory.stock.changed',
  'inventory.stock_bucket.updated',
  'inventory.material.updated',
]);
const inventoryMovementEvents = new Set([
  ...inventoryStockEvents,
  'inventory.transaction.created',
  'inventory.stocktake.completed',
]);
const componentIdentityEvents = new Set([
  'component.created',
  'component.metadata.updated',
  'component.deprecated',
  'component.reactivated',
  'component.archived',
]);

function payload(event: ProjectionSourceEvent): JsonRecord {
  return event.payload && typeof event.payload === 'object'
    ? (event.payload as JsonRecord)
    : {};
}

function metadata(event: ProjectionSourceEvent): JsonRecord {
  return event.metadata && typeof event.metadata === 'object'
    ? (event.metadata as JsonRecord)
    : {};
}

function firstString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function eventEntityKey(event: ProjectionSourceEvent, keys: string[]) {
  return (
    firstString(payload(event), keys) ??
    firstString(metadata(event), ['aggregateId']) ??
    event.id
  );
}

function eventOccurredAt(event: ProjectionSourceEvent) {
  return (
    firstString(metadata(event), ['occurredAt']) ??
    event.createdAt.toISOString()
  );
}

function latestData(
  current: Prisma.JsonValue | null,
  event: ProjectionSourceEvent,
) {
  const previous =
    current && typeof current === 'object' && !Array.isArray(current)
      ? (current as JsonRecord)
      : {};
  return {
    ...previous,
    ...payload(event),
    eventName: event.eventName,
    projectedAt: eventOccurredAt(event),
  } as Prisma.InputJsonObject;
}

function latest(
  name: EnterpriseProjectionName,
  matches: (eventName: string) => boolean,
  keys: string[],
  scopeKeys: string[] = [],
  transform?: (
    current: Prisma.JsonValue | null,
    event: ProjectionSourceEvent,
  ) => Prisma.InputJsonObject,
): ProjectionDefinition {
  return {
    name,
    schemaVersion: 1,
    mode: 'latest',
    matches,
    reduce: (current, event) => ({
      entityKey: eventEntityKey(event, keys),
      scopeKey: firstString(payload(event), scopeKeys),
      data: transform?.(current, event) ?? latestData(current, event),
    }),
  };
}

function timeline(
  name: EnterpriseProjectionName,
  matches: (eventName: string) => boolean,
  scopeKeys: string[],
): ProjectionDefinition {
  return {
    name,
    schemaVersion: 1,
    mode: 'timeline',
    matches,
    reduce: (_current, event) => ({
      entityKey: event.id,
      scopeKey:
        firstString(payload(event), scopeKeys) ??
        firstString(metadata(event), ['aggregateId']),
      data: {
        ...payload(event),
        eventName: event.eventName,
        occurredAt: eventOccurredAt(event),
      },
    }),
  };
}

function isCanonicalProduction(eventName: string) {
  return [
    'production.order.',
    'production.work-order.',
    'production.execution.',
    'production.completion.',
    'production.material.',
    'production.scrap.',
    'production.rework.',
  ].some((prefix) => eventName.startsWith(prefix));
}

@Injectable()
export class ProjectionRegistryService {
  private readonly definitions: ProjectionDefinition[] = [
    latest(
      'ProductionOrderSummary',
      (name) => name.startsWith('production.order.'),
      ['productionOrderId', 'orderId'],
      ['projectId'],
    ),
    latest(
      'WorkOrderSummary',
      (name) => name.startsWith('production.work-order.'),
      ['workOrderId'],
      ['productionOrderId'],
    ),
    timeline('ProductionTimeline', isCanonicalProduction, [
      'productionOrderId',
      'orderId',
    ]),
    latest(
      'ProductionExecution',
      (name) => name.startsWith('production.execution.'),
      ['executionRunId'],
      ['productionOrderId'],
    ),
    latest(
      'ProductionDashboard',
      (name) => name.startsWith('production.order.'),
      ['productionOrderId', 'orderId'],
      ['projectId'],
    ),
    latest(
      'OperatorWorkQueue',
      (name) => name.startsWith('production.work-order.'),
      ['workOrderId'],
      ['productionOrderId'],
    ),
    latest(
      'ComponentSummary',
      (name) => componentIdentityEvents.has(name),
      ['componentId'],
      ['projectId'],
    ),
    latest(
      'CurrentReleasedRevision',
      (name) => name === 'component.revision.released',
      ['componentId'],
      ['componentId'],
    ),
    timeline(
      'RevisionHistory',
      (name) => name.startsWith('component.revision.'),
      ['componentId'],
    ),
    latest(
      'EngineeringBOMView',
      (name) => name.startsWith('component.bom.definition.'),
      ['bomDefinitionId', 'revisionId'],
      ['componentId'],
    ),
    timeline(
      'ReleaseTimeline',
      (name) =>
        name === 'component.revision.released' ||
        name === 'component.revision.superseded',
      ['componentId'],
    ),
    latest(
      'MaterialAvailability',
      (name) => inventoryStockEvents.has(name),
      ['materialId', 'inventoryItemId'],
      ['warehouseId'],
    ),
    latest(
      'ReservationProjection',
      (name) =>
        name === 'production.material.reserved' ||
        name === 'production.material.released',
      ['reservationId', 'materialId', 'inventoryItemId'],
      ['productionOrderId'],
    ),
    latest(
      'LocationBalance',
      (name) => inventoryStockEvents.has(name),
      ['id', 'materialId', 'inventoryItemId'],
      ['warehouseId'],
    ),
    timeline(
      'StockMovementSummary',
      (name) => inventoryMovementEvents.has(name),
      ['materialId', 'inventoryItemId'],
    ),
    latest(
      'ProductionMaterialStatus',
      (name) => name.startsWith('production.material.'),
      ['materialIssueId', 'reservationId', 'materialId', 'inventoryItemId'],
      ['productionOrderId'],
    ),
    latest(
      'ProductionVsInventory',
      (name) =>
        name.startsWith('production.material.') ||
        inventoryStockEvents.has(name),
      ['materialId', 'inventoryItemId'],
      ['productionOrderId', 'warehouseId'],
      (current, event) => {
        const previous =
          current && typeof current === 'object' && !Array.isArray(current)
            ? (current as JsonRecord)
            : {};
        const side = event.eventName.startsWith('production.')
          ? 'production'
          : 'inventory';
        return {
          ...previous,
          [side]: payload(event),
          lastEventName: event.eventName,
          projectedAt: eventOccurredAt(event),
        } as Prisma.InputJsonObject;
      },
    ),
    latest(
      'ComponentUsage',
      (name) => name.startsWith('production.order.'),
      ['productionOrderId', 'orderId'],
      ['componentId'],
    ),
    latest(
      'OpenReservations',
      (name) =>
        name === 'production.material.reserved' ||
        name === 'production.material.released',
      ['reservationId', 'materialId', 'inventoryItemId'],
      ['productionOrderId'],
      (current, event) => ({
        ...latestData(current, event),
        open: event.eventName === 'production.material.reserved',
      }),
    ),
    latest(
      'ReleasedComponentCatalog',
      (name) =>
        name === 'component.revision.released' ||
        name === 'component.deprecated' ||
        name === 'component.reactivated' ||
        name === 'component.archived',
      ['componentId'],
      ['projectId'],
      (current, event) => ({
        ...latestData(current, event),
        eligible:
          event.eventName === 'component.revision.released' ||
          event.eventName === 'component.reactivated',
      }),
    ),
    latest(
      'QcInspectionSummary',
      (name) => name.startsWith('qc.inspection.'),
      ['inspectionId'],
      ['productionOrderId', 'componentId'],
    ),
    latest(
      'QcNcrSummary',
      (name) =>
        name.startsWith('qc.ncr.') || name.startsWith('qc.disposition.'),
      ['ncrId', 'dispositionId'],
      ['inspectionId', 'productionOrderId'],
    ),
    timeline('QcTimeline', (name) => name.startsWith('qc.'), [
      'inspectionId',
      'ncrId',
      'productionOrderId',
    ]),
    latest(
      'YardItemSummary',
      (name) => name.startsWith('yard.item.'),
      ['yardItemId', 'itemId', 'placementId'],
      ['zoneId'],
    ),
    timeline('YardMovementTimeline', (name) => name.startsWith('yard.item.'), [
      'yardItemId',
      'itemId',
      'placementId',
    ]),
    latest(
      'YardLoadingSummary',
      (name) => name.startsWith('yard.loading.'),
      ['loadingTaskId', 'shipmentId'],
      ['shipmentId'],
    ),
    latest(
      'ShipmentSummary',
      (name) => name.startsWith('logistics.shipment.'),
      ['shipmentId', 'dispatchId'],
      ['projectId'],
    ),
    timeline(
      'ShipmentTimeline',
      (name) => name.startsWith('logistics.shipment.'),
      ['shipmentId', 'dispatchId'],
    ),
    latest(
      'ProjectMaterialAllocation',
      (name) => name === 'project.material.allocated',
      ['allocationId'],
      ['projectId', 'taskId'],
    ),
    latest(
      'ProjectAcceptanceSummary',
      (name) => name === 'project.acceptance.completed',
      ['acceptanceId'],
      ['projectId'],
    ),
    timeline('ProjectTimeline', (name) => name.startsWith('project.'), [
      'projectId',
    ]),
  ];

  all() {
    return this.definitions;
  }

  matching(eventName: string) {
    return this.definitions.filter((definition) =>
      definition.matches(eventName),
    );
  }

  get(name: string) {
    const definition = this.definitions.find((item) => item.name === name);
    if (!definition)
      throw new NotFoundException(`Projection ${name} not found`);
    return definition;
  }

  names() {
    return [...enterpriseProjectionNames];
  }
}
