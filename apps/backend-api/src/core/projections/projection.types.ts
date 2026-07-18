import { OutboxEvent, Prisma } from '@prisma/client';

export const enterpriseProjectionNames = [
  'ProductionOrderSummary',
  'WorkOrderSummary',
  'ProductionTimeline',
  'ProductionExecution',
  'ProductionDashboard',
  'OperatorWorkQueue',
  'ComponentSummary',
  'CurrentReleasedRevision',
  'RevisionHistory',
  'EngineeringBOMView',
  'ReleaseTimeline',
  'MaterialAvailability',
  'ReservationProjection',
  'LocationBalance',
  'StockMovementSummary',
  'ProductionMaterialStatus',
  'ProductionVsInventory',
  'ComponentUsage',
  'OpenReservations',
  'ReleasedComponentCatalog',
  'QcInspectionSummary',
  'QcNcrSummary',
  'QcTimeline',
  'YardItemSummary',
  'YardMovementTimeline',
  'YardLoadingSummary',
  'ShipmentSummary',
  'ShipmentTimeline',
  'ProjectMaterialAllocation',
  'ProjectAcceptanceSummary',
  'ProjectTimeline',
] as const;

export type EnterpriseProjectionName =
  (typeof enterpriseProjectionNames)[number];

export type ProjectionSourceEvent = Pick<
  OutboxEvent,
  | 'id'
  | 'eventName'
  | 'payload'
  | 'metadata'
  | 'createdAt'
  | 'retryCount'
  | 'maxRetries'
>;

export type ProjectionDocumentDraft = {
  entityKey: string;
  scopeKey?: string;
  data: Prisma.InputJsonObject;
};

export type ProjectionReducer = (
  current: Prisma.JsonValue | null,
  event: ProjectionSourceEvent,
) => ProjectionDocumentDraft | null;

export type ProjectionDefinition = {
  name: EnterpriseProjectionName;
  schemaVersion: number;
  mode: 'latest' | 'timeline';
  matches: (eventName: string) => boolean;
  reduce: ProjectionReducer;
};

export type ProjectionListQuery = {
  page: number;
  limit: number;
  scopeKey?: string;
  state?: string;
  cursor?: string;
  withTotal?: boolean;
};
