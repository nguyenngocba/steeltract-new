import { QcIssueSeverity } from '@prisma/client';

export type QcCommandContext = {
  idempotencyKey: string;
  expectedVersion: number;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
};

export type CompleteQcInspectionCommand = QcCommandContext & {
  inspectionId: string;
  decision: 'ACCEPT' | 'REJECT';
  notes?: string;
};

export type CreateQcNcrCommand = QcCommandContext & {
  inspectionId: string;
  ncrNo: string;
  issueId?: string;
  severity: QcIssueSeverity;
  title: string;
  description?: string;
  defectCode?: string;
  reasonCode?: string;
};

export type QcDispositionType =
  | 'ACCEPT'
  | 'REJECT'
  | 'REWORK'
  | 'SCRAP_RECOMMENDATION';

export type CompleteQcDispositionCommand = QcCommandContext & {
  ncrId: string;
  dispositionId: string;
  dispositionType: QcDispositionType;
  reason?: string;
  approvedQuantity?: number;
  unit?: string;
};
