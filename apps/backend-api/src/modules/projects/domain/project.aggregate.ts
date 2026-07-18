import { ProjectStatus, ProjectTaskStatus } from '@prisma/client';

export class ProjectDomainError extends Error {}

const mutableProjectStates = new Set<ProjectStatus>([
  ProjectStatus.PLANNING,
  ProjectStatus.ACTIVE,
  ProjectStatus.DELAYED,
  ProjectStatus.ON_HOLD,
]);

const executionStates = new Set<ProjectStatus>([
  ProjectStatus.ACTIVE,
  ProjectStatus.DELAYED,
  ProjectStatus.ON_HOLD,
]);

export class ProjectAggregate {
  private constructor(
    readonly id: string,
    readonly status: ProjectStatus,
    readonly version: number,
    readonly taskStatuses: ProjectTaskStatus[],
    readonly hasAcceptance: boolean,
  ) {}

  static create(code: string, name: string) {
    if (!code.trim()) throw new ProjectDomainError('Project code is required');
    if (!name.trim()) throw new ProjectDomainError('Project name is required');
  }

  static hydrate(input: {
    id: string;
    status: ProjectStatus;
    version: number;
    taskStatuses: ProjectTaskStatus[];
    hasAcceptance: boolean;
  }) {
    return new ProjectAggregate(
      input.id,
      input.status,
      input.version,
      input.taskStatuses,
      input.hasAcceptance,
    );
  }

  addPhaseOrTask() {
    this.requireMutable('add phase or task');
  }

  activate() {
    if (this.status !== ProjectStatus.PLANNING) {
      throw new ProjectDomainError(
        `Project cannot activate from ${this.status}`,
      );
    }
    return ProjectStatus.ACTIVE;
  }

  allocateMaterial(quantity: number) {
    this.requireMutable('allocate material');
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ProjectDomainError('Material allocation must be positive');
    }
  }

  trackDelivery() {
    if (!executionStates.has(this.status)) {
      throw new ProjectDomainError(
        `Project cannot track delivery from ${this.status}`,
      );
    }
  }

  recordSiteReceipt(deliveryStatus: 'DISPATCHED' | 'DELIVERED') {
    this.trackDelivery();
    if (deliveryStatus !== 'DELIVERED') {
      throw new ProjectDomainError(
        'Site receipt requires a delivered Logistics fact',
      );
    }
  }

  completeAcceptance(hasSiteReceipt: boolean) {
    this.trackDelivery();
    if (!hasSiteReceipt) {
      throw new ProjectDomainError('Project acceptance requires site receipt');
    }
  }

  complete() {
    if (!executionStates.has(this.status)) {
      throw new ProjectDomainError(
        `Project cannot complete from ${this.status}`,
      );
    }
    if (!this.hasAcceptance) {
      throw new ProjectDomainError('Project completion requires acceptance');
    }
    if (
      this.taskStatuses.length === 0 ||
      this.taskStatuses.some(
        (status) =>
          status !== ProjectTaskStatus.COMPLETED &&
          status !== ProjectTaskStatus.CANCELLED,
      )
    ) {
      throw new ProjectDomainError(
        'Project completion requires all tasks to be terminal',
      );
    }
    return ProjectStatus.COMPLETED;
  }

  cancel() {
    this.requireMutable('cancel');
    return ProjectStatus.CANCELLED;
  }

  private requireMutable(action: string) {
    if (!mutableProjectStates.has(this.status)) {
      throw new ProjectDomainError(
        `Project cannot ${action} from ${this.status}`,
      );
    }
  }
}

const taskTransitions = new Map<ProjectTaskStatus, Set<ProjectTaskStatus>>([
  [ProjectTaskStatus.DRAFT, new Set([ProjectTaskStatus.PLANNED])],
  [
    ProjectTaskStatus.PLANNED,
    new Set([ProjectTaskStatus.READY, ProjectTaskStatus.CANCELLED]),
  ],
  [
    ProjectTaskStatus.READY,
    new Set([ProjectTaskStatus.IN_PROGRESS, ProjectTaskStatus.CANCELLED]),
  ],
  [
    ProjectTaskStatus.IN_PROGRESS,
    new Set([
      ProjectTaskStatus.BLOCKED,
      ProjectTaskStatus.PAUSED,
      ProjectTaskStatus.COMPLETED,
      ProjectTaskStatus.CANCELLED,
    ]),
  ],
  [
    ProjectTaskStatus.BLOCKED,
    new Set([ProjectTaskStatus.READY, ProjectTaskStatus.CANCELLED]),
  ],
  [
    ProjectTaskStatus.PAUSED,
    new Set([ProjectTaskStatus.IN_PROGRESS, ProjectTaskStatus.CANCELLED]),
  ],
]);

export class ProjectTaskAggregate {
  private constructor(
    readonly id: string,
    readonly projectId: string,
    readonly status: ProjectTaskStatus,
  ) {}

  static hydrate(input: {
    id: string;
    projectId: string;
    status: ProjectTaskStatus;
  }) {
    return new ProjectTaskAggregate(input.id, input.projectId, input.status);
  }

  transition(next: ProjectTaskStatus) {
    if (!taskTransitions.get(this.status)?.has(next)) {
      throw new ProjectDomainError(
        `Project task cannot move from ${this.status} to ${next}`,
      );
    }
    return next;
  }
}
