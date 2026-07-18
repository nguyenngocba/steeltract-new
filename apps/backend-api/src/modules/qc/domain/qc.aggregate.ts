import { NcrStatus, QcInspectionStatus } from '@prisma/client';

import { QcDispositionType } from './qc.commands';

export class QcDomainError extends Error {}

const completableInspectionStates = new Set<QcInspectionStatus>([
  QcInspectionStatus.READY,
  QcInspectionStatus.IN_PROGRESS,
  QcInspectionStatus.REWORK_REQUIRED,
]);

const ncrEligibleInspectionStates = new Set<QcInspectionStatus>([
  QcInspectionStatus.IN_PROGRESS,
  QcInspectionStatus.FAILED,
  QcInspectionStatus.REWORK_REQUIRED,
  QcInspectionStatus.REJECTED,
]);

export class QcInspectionAggregate {
  private constructor(
    readonly id: string,
    readonly status: QcInspectionStatus,
    readonly version: number,
    readonly completedAt: Date | null,
  ) {}

  static hydrate(input: {
    id: string;
    status: QcInspectionStatus;
    version: number;
    completedAt: Date | null;
  }) {
    return new QcInspectionAggregate(
      input.id,
      input.status,
      input.version,
      input.completedAt,
    );
  }

  complete(decision: 'ACCEPT' | 'REJECT') {
    if (this.completedAt || !completableInspectionStates.has(this.status)) {
      throw new QcDomainError(`Inspection cannot complete from ${this.status}`);
    }
    return decision === 'ACCEPT'
      ? QcInspectionStatus.PASSED
      : QcInspectionStatus.FAILED;
  }

  requireNcrEligibility() {
    if (!ncrEligibleInspectionStates.has(this.status)) {
      throw new QcDomainError(
        `NCR cannot be raised for inspection in ${this.status}`,
      );
    }
  }
}

const openNcrStates = new Set<NcrStatus>([
  NcrStatus.OPEN,
  NcrStatus.UNDER_REVIEW,
  NcrStatus.REWORK_REQUIRED,
]);

const dispositionState: Record<QcDispositionType, NcrStatus> = {
  ACCEPT: NcrStatus.APPROVED,
  REJECT: NcrStatus.REJECTED,
  REWORK: NcrStatus.REWORK_REQUIRED,
  SCRAP_RECOMMENDATION: NcrStatus.APPROVED,
};

export class QcNcrAggregate {
  private constructor(
    readonly id: string,
    readonly status: NcrStatus,
    readonly version: number,
    readonly dispositionCompleted: boolean,
  ) {}

  static hydrate(input: {
    id: string;
    status: NcrStatus;
    version: number;
    dispositionCompleted: boolean;
  }) {
    return new QcNcrAggregate(
      input.id,
      input.status,
      input.version,
      input.dispositionCompleted,
    );
  }

  completeDisposition(type: QcDispositionType) {
    if (this.dispositionCompleted || !openNcrStates.has(this.status)) {
      throw new QcDomainError(
        `NCR disposition cannot complete from ${this.status}`,
      );
    }
    return dispositionState[type];
  }
}
