import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
} from '@prisma/client';

export class ComponentDomainError extends Error {}

function assertState<T extends string>(
  aggregate: string,
  current: T,
  allowed: readonly T[],
  command: string,
) {
  if (!allowed.includes(current)) {
    throw new ComponentDomainError(
      `${command} is not allowed for ${aggregate} in ${current}`,
    );
  }
}

export class ComponentAggregate {
  private constructor(
    readonly id: string,
    readonly state: ComponentLifecycleState,
    readonly version: number,
    readonly currentRevisionId: string | null,
  ) {}

  static create(id: string) {
    return new ComponentAggregate(id, ComponentLifecycleState.DRAFT, 1, null);
  }

  static hydrate(input: {
    id: string;
    lifecycleState: ComponentLifecycleState | null;
    aggregateVersion: number;
    currentRevisionId: string | null;
  }) {
    if (!input.lifecycleState) {
      throw new ComponentDomainError(
        'Legacy component has not been adopted into the canonical aggregate',
      );
    }
    return new ComponentAggregate(
      input.id,
      input.lifecycleState,
      input.aggregateVersion,
      input.currentRevisionId,
    );
  }

  canCreateRevision() {
    assertState(
      'Component',
      this.state,
      [ComponentLifecycleState.DRAFT, ComponentLifecycleState.ACTIVE],
      'CreateComponentRevision',
    );
  }

  release(revisionId: string) {
    assertState(
      'Component',
      this.state,
      [ComponentLifecycleState.DRAFT, ComponentLifecycleState.ACTIVE],
      'ReleaseComponentRevision',
    );
    return {
      lifecycleState: ComponentLifecycleState.ACTIVE,
      currentRevisionId: revisionId,
    };
  }

  deprecate() {
    assertState(
      'Component',
      this.state,
      [ComponentLifecycleState.ACTIVE],
      'DeprecateComponent',
    );
    return ComponentLifecycleState.DEPRECATED;
  }

  reactivate() {
    assertState(
      'Component',
      this.state,
      [ComponentLifecycleState.DEPRECATED],
      'ReactivateComponent',
    );
    if (!this.currentRevisionId) {
      throw new ComponentDomainError(
        'ReactivateComponent requires a current released revision',
      );
    }
    return ComponentLifecycleState.ACTIVE;
  }

  archive(hasReleasedRevision: boolean, downstreamClear: boolean) {
    assertState(
      'Component',
      this.state,
      [ComponentLifecycleState.DRAFT, ComponentLifecycleState.DEPRECATED],
      'ArchiveComponent',
    );
    if (this.state === ComponentLifecycleState.DRAFT && hasReleasedRevision) {
      throw new ComponentDomainError(
        'Draft Component with release history cannot be archived directly',
      );
    }
    if (!downstreamClear) {
      throw new ComponentDomainError(
        'ArchiveComponent requires downstream owner clearance',
      );
    }
    return ComponentLifecycleState.ARCHIVED;
  }
}

export class ComponentRevisionAggregate {
  private constructor(
    readonly id: string,
    readonly componentId: string,
    readonly state: ComponentRevisionState,
    readonly version: number,
  ) {}

  static hydrate(input: {
    id: string;
    componentId: string;
    state: ComponentRevisionState;
    aggregateVersion: number;
  }) {
    return new ComponentRevisionAggregate(
      input.id,
      input.componentId,
      input.state,
      input.aggregateVersion,
    );
  }

  updateContent() {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.DRAFT],
      'UpdateRevisionContent',
    );
  }

  submitForReview(bomState: ComponentBomDefinitionState) {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.DRAFT],
      'SubmitRevisionForReview',
    );
    if (bomState !== ComponentBomDefinitionState.VALIDATED) {
      throw new ComponentDomainError(
        'SubmitRevisionForReview requires a validated BOM definition',
      );
    }
    return ComponentRevisionState.IN_REVIEW;
  }

  returnToDraft() {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.IN_REVIEW],
      'ReturnRevisionToDraft',
    );
    return ComponentRevisionState.DRAFT;
  }

  approve() {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.IN_REVIEW],
      'ApproveComponentRevision',
    );
    return ComponentRevisionState.APPROVED;
  }

  withdrawApproval() {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.APPROVED],
      'WithdrawRevisionApproval',
    );
    return ComponentRevisionState.DRAFT;
  }

  release(bomState: ComponentBomDefinitionState) {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.APPROVED],
      'ReleaseComponentRevision',
    );
    if (bomState !== ComponentBomDefinitionState.VALIDATED) {
      throw new ComponentDomainError(
        'ReleaseComponentRevision requires the validated BOM definition',
      );
    }
    return ComponentRevisionState.RELEASED;
  }

  archive(downstreamClear: boolean) {
    assertState(
      'ComponentRevision',
      this.state,
      [ComponentRevisionState.DRAFT, ComponentRevisionState.SUPERSEDED],
      'ArchiveComponentRevision',
    );
    if (!downstreamClear) {
      throw new ComponentDomainError(
        'ArchiveComponentRevision requires downstream owner clearance',
      );
    }
    return ComponentRevisionState.ARCHIVED;
  }
}

export class ComponentBomAggregate {
  static replace(state: ComponentBomDefinitionState) {
    assertState(
      'ComponentBomDefinition',
      state,
      [
        ComponentBomDefinitionState.DRAFT,
        ComponentBomDefinitionState.VALIDATED,
      ],
      'ReplaceEngineeringBomContent',
    );
    return ComponentBomDefinitionState.DRAFT;
  }

  static validate(state: ComponentBomDefinitionState) {
    assertState(
      'ComponentBomDefinition',
      state,
      [ComponentBomDefinitionState.DRAFT],
      'ValidateEngineeringBom',
    );
    return ComponentBomDefinitionState.VALIDATED;
  }
}
