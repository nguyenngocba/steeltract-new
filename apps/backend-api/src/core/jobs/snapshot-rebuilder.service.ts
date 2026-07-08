import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { SnapshotValidatorService } from '../snapshots/snapshot-validator.service';
import {
  SnapshotWriterService,
  SnapshotWriteResult,
} from '../snapshots/snapshot-writer.service';
import { SnapshotUpdateRequest } from './snapshot-update-dispatcher.service';

export interface SnapshotRebuildResult extends SnapshotWriteResult {
  module: string;
  snapshotType: string;
  scopeId?: string;
  generatedAt: string;
  rowsRead: number;
  rowsWritten: number;
  durationMs: number;
  status: 'updated';
  validation?: unknown;
}

@Injectable()
export class SnapshotRebuilder {
  private readonly logger = new Logger(SnapshotRebuilder.name);

  constructor(
    @Inject(SnapshotWriterService)
    private readonly writer: SnapshotWriterService,
    @Inject(SnapshotValidatorService)
    private readonly validator: SnapshotValidatorService,
  ) {}

  async rebuild(request: SnapshotUpdateRequest): Promise<SnapshotRebuildResult> {
    this.logger.debug(
      `Snapshot rebuild requested for ${request.scope.module}/${request.scope.snapshotType}`,
    );

    const result = await this.writer.rebuild(request);
    const validation = await this.validate(request);

    return {
      ...result,
      validation,
    };
  }

  private validate(request: SnapshotUpdateRequest) {
    if (request.scope.module === 'inventory') {
      return this.validator.validateInventory(new Date());
    }

    if (request.scope.module === 'projects') {
      return this.validator.validateProject(request.scope.projectId);
    }

    if (request.scope.module === 'logistics') {
      return this.validator.validateDispatch(request.scope.dispatchOrderId);
    }

    return Promise.resolve(undefined);
  }
}
