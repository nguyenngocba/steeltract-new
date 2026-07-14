import { Injectable, NotFoundException } from '@nestjs/common';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';

import type {
  QcInspectionHistoryDto,
  QcWorkspaceReadDto,
} from '../dto/qc.dto';
import { QcReadModelRepository } from '../repositories/qc-read-model.repository';

@Injectable()
export class QcReadModelService {
  constructor(
    private readonly repository: QcReadModelRepository,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  workspace(query: QcWorkspaceReadDto) {
    this.metrics.recordQcReadModelHit();
    return this.repository.workspace(query);
  }

  async inspectionDetail(id: string) {
    this.metrics.recordQcReadModelHit();
    const row = await this.repository.inspectionDetail(id);
    if (!row) throw new NotFoundException('QC inspection not found');
    return row;
  }

  inspectionHistory(id: string, query: QcInspectionHistoryDto) {
    this.metrics.recordQcReadModelHit();
    return this.repository.inspectionHistory(id, query);
  }

  ncrSummary() {
    this.metrics.recordQcReadModelHit();
    return this.repository.ncrSummary();
  }
}
