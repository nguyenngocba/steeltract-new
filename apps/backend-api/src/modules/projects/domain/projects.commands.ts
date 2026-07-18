export type ProjectCommandContext = {
  idempotencyKey: string;
  expectedVersion: number;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
};

export type CreateProjectCommand = ProjectCommandContext & {
  code: string;
  name: string;
  description?: string;
};

export type ProjectCommand = ProjectCommandContext & {
  projectId: string;
};

export type ActivateProjectCommand = ProjectCommand;

export type AddProjectPhaseCommand = ProjectCommand & {
  name: string;
  description?: string;
  plannedStartAt?: Date;
  plannedFinishAt?: Date;
  sortOrder?: number;
};

export type AddProjectTaskCommand = ProjectCommand & {
  phaseId: string;
  name: string;
  description?: string;
  plannedStartAt?: Date;
  plannedFinishAt?: Date;
  sortOrder?: number;
};

export type TransitionProjectTaskCommand = ProjectCommand & {
  taskId: string;
  status:
    | 'PLANNED'
    | 'READY'
    | 'IN_PROGRESS'
    | 'BLOCKED'
    | 'PAUSED'
    | 'COMPLETED'
    | 'CANCELLED';
};

export type AllocateProjectMaterialCommand = ProjectCommand & {
  taskId: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
};

export type TrackProjectDeliveryCommand = ProjectCommand & {
  shipmentId: string;
  logisticsEventId: string;
  status: 'DISPATCHED' | 'DELIVERED';
};

export type RecordProjectSiteReceiptCommand = ProjectCommand & {
  shipmentId: string;
  logisticsDeliveryEventId: string;
  receiptId: string;
  receivedAt: Date;
};

export type CompleteProjectAcceptanceCommand = ProjectCommand & {
  acceptanceId: string;
  shipmentId?: string;
  componentId?: string;
  result: 'ACCEPTED' | 'REJECTED';
  acceptedQuantity?: number;
  unit?: string;
};

export type CompleteProjectCommand = ProjectCommand;

export type CancelProjectCommand = ProjectCommand & {
  reason: string;
};
