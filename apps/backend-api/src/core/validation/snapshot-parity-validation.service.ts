import { Inject, Injectable } from '@nestjs/common';

import { SnapshotValidatorService } from '../snapshots/snapshot-validator.service';

@Injectable()
export class SnapshotParityValidationService {
  constructor(
    @Inject(SnapshotValidatorService)
    private readonly snapshots: SnapshotValidatorService,
  ) {}

  async validateAll() {
    const generatedAt = new Date().toISOString();
    const [inventory, projects, logistics] = await Promise.all([
      this.snapshots.validateInventory(new Date()),
      this.snapshots.validateProject(),
      this.snapshots.validateDispatch(),
    ]);

    return {
      generatedAt,
      modules: {
        inventory,
        projects,
        logistics,
      },
      summary: {
        warningCount:
          inventory.warnings.length +
          projects.warnings.length +
          logistics.warnings.length,
        checkedRows:
          inventory.checkedRows + projects.checkedRows + logistics.checkedRows,
      },
    };
  }
}
