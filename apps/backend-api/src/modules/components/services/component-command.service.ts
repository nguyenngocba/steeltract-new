import { createHash, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
  Prisma,
} from '@prisma/client';

import {
  ApproveComponentRevisionCommand,
  ArchiveComponentCommand,
  ArchiveComponentRevisionCommand,
  ComponentCommandContext,
  CreateComponentCommand,
  CreateComponentRevisionCommand,
  DeprecateComponentCommand,
  ReactivateComponentCommand,
  ReleaseComponentRevisionCommand,
  ReplaceEngineeringBomCommand,
  ReturnRevisionToDraftCommand,
  SubmitRevisionForReviewCommand,
  UpdateComponentMetadataCommand,
  UpdateRevisionContentCommand,
  ValidateEngineeringBomCommand,
  WithdrawRevisionApprovalCommand,
} from '../domain/component.commands';
import {
  ComponentAggregate,
  ComponentBomAggregate,
  ComponentDomainError,
  ComponentRevisionAggregate,
} from '../domain/component.aggregate';
import { ComponentsRepository } from '../repositories/components.repository';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ComponentCommandService {
  constructor(private readonly repository: ComponentsRepository) {}

  create(command: CreateComponentCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedComponent(
        command,
        'component.created',
        tx,
      );
      if (replay) return replay;

      const component = await this.repository.create(
        {
          code: command.code,
          name: command.name,
          description: command.description,
          lifecycleState: ComponentLifecycleState.DRAFT,
          aggregateVersion: 1,
          project: command.projectId
            ? { connect: { id: command.projectId } }
            : undefined,
        },
        tx,
      );
      ComponentAggregate.create(component.id);
      await this.record(
        'component.created',
        component.id,
        1,
        {
          componentId: component.id,
          code: component.code,
          name: component.name,
          description: component.description,
          projectId: component.projectId,
          state: ComponentLifecycleState.DRAFT,
          currentRevisionId: null,
          changedFields: [],
        },
        command,
        tx,
      );
      return component;
    });
  }

  updateMetadata(command: UpdateComponentMetadataCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedComponent(
        command,
        'component.metadata.updated',
        tx,
      );
      if (replay) return replay;
      const current = await this.component(command.componentId, tx);
      const aggregate = this.aggregate(current);
      if (aggregate.state === ComponentLifecycleState.ARCHIVED) {
        throw new BadRequestException('Archived Component is immutable');
      }
      const changedFields = [
        command.name !== undefined ? 'name' : null,
        command.description !== undefined ? 'description' : null,
      ].filter((value): value is string => Boolean(value));
      if (!changedFields.length) {
        throw new BadRequestException('No Component metadata change supplied');
      }
      const updated = await this.repository.updateAggregate(
        current.id,
        command.expectedVersion,
        { name: command.name, description: command.description },
        tx,
      );
      this.assertVersion(updated, 'Component');
      await this.record(
        'component.metadata.updated',
        current.id,
        command.expectedVersion + 1,
        {
          componentId: current.id,
          code: current.code,
          name: command.name ?? current.name,
          description:
            command.description !== undefined
              ? command.description
              : current.description,
          projectId: current.projectId,
          state: aggregate.state,
          currentRevisionId: current.currentRevisionId,
          changedFields,
        },
        command,
        tx,
      );
      return updated;
    });
  }

  deprecate(command: DeprecateComponentCommand) {
    return this.changeComponentState(
      command,
      'component.deprecated',
      (aggregate) => aggregate.deprecate(),
      { reason: command.reason },
    );
  }

  reactivate(command: ReactivateComponentCommand) {
    return this.changeComponentState(
      command,
      'component.reactivated',
      (aggregate) => aggregate.reactivate(),
      {},
    );
  }

  archive(command: ArchiveComponentCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedComponent(
        command,
        'component.archived',
        tx,
      );
      if (replay) return replay;
      const current = await this.component(command.componentId, tx);
      const aggregate = this.aggregate(current);
      const releaseCount = await this.repository.countReleaseEvidence(
        current.id,
        tx,
      );
      const state = this.domain(() =>
        aggregate.archive(
          releaseCount > 0,
          this.clearanceGranted(command.downstreamClearance),
        ),
      );
      const updated = await this.repository.updateAggregate(
        current.id,
        command.expectedVersion,
        { lifecycleState: state },
        tx,
      );
      this.assertVersion(updated, 'Component');
      await this.record(
        'component.archived',
        current.id,
        command.expectedVersion + 1,
        {
          componentId: current.id,
          code: current.code,
          name: current.name,
          description: current.description,
          projectId: current.projectId,
          state,
          changedFields: ['lifecycleState'],
          reason: command.reason,
        },
        command,
        tx,
      );
      return updated;
    });
  }

  createRevision(command: CreateComponentRevisionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRevision(
        command,
        'component.revision.created',
        tx,
      );
      if (replay) return replay;
      const current = await this.component(command.componentId, tx);
      this.domain(() => this.aggregate(current).canCreateRevision());
      const revision = await this.repository.createRevision(
        {
          componentId: current.id,
          revisionNo: command.revisionNo,
          baseRevisionId: command.baseRevisionId,
          content: this.json(command.content ?? {}),
          createdBy: command.actorId,
        },
        tx,
      );
      const bom = await this.repository.createBomDefinition(
        { componentRevisionId: revision.id },
        tx,
      );
      const component = await this.repository.updateAggregate(
        current.id,
        command.expectedComponentVersion,
        {},
        tx,
      );
      this.assertVersion(component, 'Component');
      await this.record(
        'component.revision.created',
        revision.id,
        1,
        {
          componentId: current.id,
          revisionId: revision.id,
          revisionNo: revision.revisionNo,
          state: ComponentRevisionState.DRAFT,
          baseRevisionId: revision.baseRevisionId,
          bomDefinitionId: bom.id,
        },
        command,
        tx,
        'ComponentRevision',
        `component:${current.id}`,
      );
      return this.repository.findRevision(revision.id, tx);
    });
  }

  updateRevisionContent(command: UpdateRevisionContentCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRevision(
        command,
        'component.revision.content.updated',
        tx,
      );
      if (replay) return replay;
      const revision = await this.revision(command.revisionId, tx);
      this.assertRevisionOwner(revision.componentId, command.componentId);
      this.domain(() => this.revisionAggregate(revision).updateContent());
      const updated = await this.repository.updateRevision(
        revision.id,
        command.expectedVersion,
        {
          content: this.json(command.content),
          contentHash: command.contentHash,
        },
        tx,
      );
      this.assertVersion(updated, 'ComponentRevision');
      if (
        revision.bomDefinition?.state === ComponentBomDefinitionState.VALIDATED
      ) {
        const invalidated = await this.repository.updateBomDefinition(
          revision.bomDefinition.id,
          revision.bomDefinition.aggregateVersion,
          {
            state: ComponentBomDefinitionState.DRAFT,
            validatedAt: null,
            validatedBy: null,
          },
          tx,
        );
        this.assertVersion(invalidated, 'ComponentBomDefinition');
        await this.record(
          'component.bom.definition.invalidated',
          revision.bomDefinition.id,
          revision.bomDefinition.aggregateVersion + 1,
          this.bomPayload(
            revision,
            revision.bomDefinition.id,
            command.contentHash,
            'DRAFT',
          ),
          command,
          tx,
          'ComponentBomDefinition',
          `component:${revision.componentId}`,
        );
      }
      await this.recordRevision(
        'component.revision.content.updated',
        updated!,
        command,
        tx,
        { changedSections: command.changedSections },
      );
      return updated;
    });
  }

  submitForReview(command: SubmitRevisionForReviewCommand) {
    return this.transitionRevision(
      command,
      'component.revision.review.submitted',
      (aggregate, revision) =>
        aggregate.submitForReview(
          this.requiredBom(revision.id, revision.bomDefinition).state,
        ),
    );
  }

  returnToDraft(command: ReturnRevisionToDraftCommand) {
    return this.transitionRevision(
      command,
      'component.revision.review.returned',
      (aggregate) => aggregate.returnToDraft(),
      { reason: command.reason },
    );
  }

  approve(command: ApproveComponentRevisionCommand) {
    return this.transitionRevision(
      command,
      'component.revision.approved',
      (aggregate) => aggregate.approve(),
      { approvedBy: command.actorId },
      { approvedBy: command.actorId, approvedAt: new Date() },
    );
  }

  withdrawApproval(command: WithdrawRevisionApprovalCommand) {
    return this.transitionRevision(
      command,
      'component.revision.approval.withdrawn',
      (aggregate) => aggregate.withdrawApproval(),
      { reason: command.reason },
    );
  }

  archiveRevision(command: ArchiveComponentRevisionCommand) {
    return this.transitionRevision(
      command,
      'component.revision.archived',
      (aggregate) =>
        aggregate.archive(this.clearanceGranted(command.downstreamClearance)),
      { reason: command.reason },
      { archivedAt: new Date(), archiveReason: command.reason },
    );
  }

  replaceBom(command: ReplaceEngineeringBomCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedBom(
        command,
        'component.bom.definition.updated',
        tx,
      );
      if (replay) return replay;
      const revision = await this.revision(command.revisionId, tx);
      this.assertRevisionOwner(revision.componentId, command.componentId);
      this.domain(() => this.revisionAggregate(revision).updateContent());
      const contentHash = this.bomContentHash(command.lines, command.routing);
      if (contentHash !== command.contentHash) {
        throw new ConflictException('BOM content hash does not match content');
      }
      const bom = this.requiredBom(revision.id, revision.bomDefinition);
      const state = this.domain(() => ComponentBomAggregate.replace(bom.state));
      const updatedRevision = await this.repository.updateRevision(
        revision.id,
        command.expectedVersion,
        { contentHash },
        tx,
      );
      this.assertVersion(updatedRevision, 'ComponentRevision');
      let bomWriteVersion = command.expectedBomVersion;
      if (bom.state === ComponentBomDefinitionState.VALIDATED) {
        const invalidated = await this.repository.updateBomDefinition(
          bom.id,
          bomWriteVersion,
          {
            state: ComponentBomDefinitionState.DRAFT,
            validatedAt: null,
            validatedBy: null,
          },
          tx,
        );
        this.assertVersion(invalidated, 'ComponentBomDefinition');
        bomWriteVersion += 1;
        await this.record(
          'component.bom.definition.invalidated',
          bom.id,
          bomWriteVersion,
          this.bomPayload(
            revision,
            bom.id,
            bom.contentHash ?? contentHash,
            ComponentBomDefinitionState.DRAFT,
          ),
          command,
          tx,
          'ComponentBomDefinition',
          `component:${revision.componentId}`,
        );
      }
      const updated = await this.repository.updateBomDefinition(
        bom.id,
        bomWriteVersion,
        {
          state,
          lines: this.json(command.lines),
          routing: this.json(command.routing),
          contentHash,
          validatedAt: null,
          validatedBy: null,
        },
        tx,
      );
      this.assertVersion(updated, 'ComponentBomDefinition');
      await this.record(
        'component.bom.definition.updated',
        bom.id,
        bomWriteVersion + 1,
        this.bomPayload(revision, bom.id, contentHash, state),
        command,
        tx,
        'ComponentBomDefinition',
        `component:${revision.componentId}`,
      );
      await this.recordRevision(
        'component.revision.content.updated',
        updatedRevision!,
        { ...command, idempotencyKey: `${command.idempotencyKey}:revision` },
        tx,
        { changedSections: ['bom'], contentHash },
      );
      return updated;
    });
  }

  validateBom(command: ValidateEngineeringBomCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedBom(
        command,
        'component.bom.definition.validated',
        tx,
      );
      if (replay) return replay;
      const revision = await this.revision(command.revisionId, tx);
      this.assertRevisionOwner(revision.componentId, command.componentId);
      this.domain(() => this.revisionAggregate(revision).updateContent());
      if (revision.aggregateVersion !== command.expectedVersion) {
        throw new ConflictException('ComponentRevision version conflict');
      }
      const bom = this.requiredBom(revision.id, revision.bomDefinition);
      if (bom.contentHash !== command.contentHash) {
        throw new ConflictException(
          'BOM content hash changed before validation',
        );
      }
      const state = this.domain(() =>
        ComponentBomAggregate.validate(bom.state),
      );
      const updated = await this.repository.updateBomDefinition(
        bom.id,
        command.expectedBomVersion,
        {
          state,
          validatedBy: command.actorId,
          validatedAt: new Date(),
        },
        tx,
      );
      this.assertVersion(updated, 'ComponentBomDefinition');
      await this.record(
        'component.bom.definition.validated',
        bom.id,
        command.expectedBomVersion + 1,
        this.bomPayload(revision, bom.id, command.contentHash, state),
        command,
        tx,
        'ComponentBomDefinition',
        `component:${revision.componentId}`,
      );
      return updated;
    });
  }

  releaseRevision(command: ReleaseComponentRevisionCommand) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRevision(
        command,
        'component.revision.released',
        tx,
      );
      if (replay) return replay;
      const component = await this.component(command.componentId, tx);
      const componentAggregate = this.aggregate(component);
      const revision = await this.revision(command.revisionId, tx);
      this.assertRevisionOwner(revision.componentId, component.id);
      const bom = this.requiredBom(revision.id, revision.bomDefinition);
      const revisionState = this.domain(() =>
        this.revisionAggregate(revision).release(bom.state),
      );
      const componentState = this.domain(() =>
        componentAggregate.release(revision.id),
      );
      if (!bom.contentHash || bom.contentHash !== revision.contentHash) {
        throw new ConflictException(
          'Revision and validated BOM content hashes must match at release',
        );
      }

      const previous = component.currentRevision;
      if (previous && previous.id !== revision.id) {
        const superseded = await this.repository.updateRevision(
          previous.id,
          previous.aggregateVersion,
          {
            state: ComponentRevisionState.SUPERSEDED,
            supersededAt: new Date(),
          },
          tx,
        );
        this.assertVersion(superseded, 'Previous ComponentRevision');
        if (previous.bomDefinition) {
          const supersededBom = await this.repository.updateBomDefinition(
            previous.bomDefinition.id,
            previous.bomDefinition.aggregateVersion,
            { state: ComponentBomDefinitionState.SUPERSEDED },
            tx,
          );
          this.assertVersion(supersededBom, 'Previous ComponentBomDefinition');
        }
        await this.recordRevision(
          'component.revision.superseded',
          superseded!,
          command,
          tx,
          { supersededByRevisionId: revision.id },
          `${command.idempotencyKey}:superseded`,
        );
      }

      const released = await this.repository.updateRevision(
        revision.id,
        command.expectedVersion,
        {
          state: revisionState,
          releasedBy: command.actorId,
          releasedAt: new Date(),
        },
        tx,
      );
      this.assertVersion(released, 'ComponentRevision');
      const releasedBom = await this.repository.updateBomDefinition(
        bom.id,
        bom.aggregateVersion,
        { state: ComponentBomDefinitionState.RELEASED },
        tx,
      );
      this.assertVersion(releasedBom, 'ComponentBomDefinition');
      const updatedComponent = await this.repository.updateAggregate(
        component.id,
        command.expectedComponentVersion,
        componentState,
        tx,
      );
      this.assertVersion(updatedComponent, 'Component');
      await this.repository.createReleaseEvidence(
        {
          componentId: component.id,
          revisionId: revision.id,
          previousRevisionId: previous?.id,
          contentHash: bom.contentHash,
          releasedBy: command.actorId,
        },
        tx,
      );
      await this.recordRevision(
        'component.revision.released',
        released!,
        command,
        tx,
        {
          bomDefinitionId: bom.id,
          contentHash: bom.contentHash,
          previousRevisionId: previous?.id ?? null,
        },
      );
      return released;
    });
  }

  private changeComponentState(
    command: VersionedComponent,
    eventName: string,
    transition: (aggregate: ComponentAggregate) => ComponentLifecycleState,
    extra: Record<string, unknown>,
  ) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedComponent(command, eventName, tx);
      if (replay) return replay;
      const current = await this.component(command.componentId, tx);
      const state = this.domain(() => transition(this.aggregate(current)));
      const updated = await this.repository.updateAggregate(
        current.id,
        command.expectedVersion,
        { lifecycleState: state },
        tx,
      );
      this.assertVersion(updated, 'Component');
      await this.record(
        eventName,
        current.id,
        command.expectedVersion + 1,
        {
          componentId: current.id,
          code: current.code,
          name: current.name,
          description: current.description,
          projectId: current.projectId,
          state,
          changedFields: ['lifecycleState'],
          currentRevisionId: current.currentRevisionId,
          ...extra,
        },
        command,
        tx,
      );
      return updated;
    });
  }

  private transitionRevision(
    command: VersionedRevision,
    eventName: string,
    transition: (
      aggregate: ComponentRevisionAggregate,
      revision: RevisionRecord,
    ) => ComponentRevisionState,
    eventExtra: Record<string, unknown> = {},
    updateExtra: Prisma.ComponentRevisionUpdateManyMutationInput = {},
  ) {
    return this.repository.transaction(async (tx) => {
      const replay = await this.replayedRevision(command, eventName, tx);
      if (replay) return replay;
      const revision = await this.revision(command.revisionId, tx);
      this.assertRevisionOwner(revision.componentId, command.componentId);
      const state = this.domain(() =>
        transition(this.revisionAggregate(revision), revision),
      );
      const updated = await this.repository.updateRevision(
        revision.id,
        command.expectedVersion,
        { ...updateExtra, state },
        tx,
      );
      this.assertVersion(updated, 'ComponentRevision');
      if (
        eventName === 'component.revision.archived' &&
        revision.bomDefinition
      ) {
        const archivedBom = await this.repository.updateBomDefinition(
          revision.bomDefinition.id,
          revision.bomDefinition.aggregateVersion,
          { state: ComponentBomDefinitionState.ARCHIVED },
          tx,
        );
        this.assertVersion(archivedBom, 'ComponentBomDefinition');
      }
      await this.recordRevision(eventName, updated!, command, tx, eventExtra);
      return updated;
    });
  }

  private async recordRevision(
    eventName: string,
    revision: RevisionRecord,
    command: ComponentCommandContext,
    tx: Tx,
    extra: Record<string, unknown> = {},
    key = command.idempotencyKey,
  ) {
    return this.record(
      eventName,
      revision.id,
      revision.aggregateVersion,
      {
        componentId: revision.componentId,
        revisionId: revision.id,
        revisionNo: revision.revisionNo,
        state: revision.state,
        baseRevisionId: revision.baseRevisionId,
        bomDefinitionId: revision.bomDefinition?.id ?? null,
        contentHash: revision.contentHash ?? null,
        ...extra,
      },
      { ...command, idempotencyKey: key },
      tx,
      'ComponentRevision',
      `component:${revision.componentId}`,
    );
  }

  private async record(
    eventName: string,
    aggregateId: string,
    aggregateVersion: number,
    payload: Record<string, unknown>,
    context: ComponentCommandContext,
    tx: Tx,
    aggregateType = 'Component',
    orderingKey = `component:${aggregateId}`,
  ) {
    const occurredAt = new Date();
    const eventId = randomUUID();
    const idempotencyKey = `${context.idempotencyKey}:${eventName}`;
    const timelineComponentId = payload.componentId;
    if (typeof timelineComponentId === 'string') {
      await this.repository.createTimeline(
        {
          component: { connect: { id: timelineComponentId } },
          action: eventName,
          note: `Canonical aggregate version ${aggregateVersion}`,
        },
        tx,
      );
    }
    await this.repository.createActivityLog(
      {
        action: eventName,
        entity: aggregateType,
        entityId: aggregateId,
        module: 'components',
        userId: context.actorId,
        metadata: this.json({ aggregateVersion, orderingKey }),
      },
      tx,
    );
    const auditKey = `${context.idempotencyKey}:audit:${eventName}`;
    await this.repository.createOutboxEvent(
      {
        eventName: 'audit.activity.created',
        payload: this.json({
          action: eventName,
          entity: aggregateType,
          entityId: aggregateId,
          module: 'components',
          aggregateVersion,
        }),
        metadata: this.json({
          module: 'components',
          persistToOutbox: true,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey: auditKey,
        }),
        idempotencyKey: auditKey,
        maxRetries: 10,
      },
      tx,
    );
    return this.repository.createOutboxEvent(
      {
        eventName,
        payload: this.json({ ...payload, aggregateVersion }),
        metadata: this.json({
          eventId,
          eventName,
          eventVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'components',
          aggregateType,
          aggregateId,
          aggregateVersion,
          correlationId: context.correlationId ?? context.idempotencyKey,
          causationId: context.causationId ?? null,
          idempotencyKey,
          commandHash: this.stableHash(context),
          actorId: context.actorId,
          tenantId: null,
          orderingKey,
          persistToOutbox: true,
        }),
        idempotencyKey,
        maxRetries: 10,
      },
      tx,
    );
  }

  private async component(id: string, tx: Tx) {
    const component = await this.repository.findAggregate(id, tx);
    if (!component) throw new NotFoundException('Component not found');
    return component;
  }

  private async revision(id: string, tx: Tx) {
    const revision = await this.repository.findRevision(id, tx);
    if (!revision) throw new NotFoundException('Component revision not found');
    return revision;
  }

  private aggregate(component: ComponentRecord) {
    return this.domain(() => ComponentAggregate.hydrate(component));
  }

  private revisionAggregate(revision: RevisionRecord) {
    return ComponentRevisionAggregate.hydrate(revision);
  }

  private requiredBom(
    revisionId: string,
    bom: RevisionRecord['bomDefinition'],
  ) {
    if (!bom) {
      throw new ConflictException(
        `Revision ${revisionId} has no BOM definition`,
      );
    }
    return bom;
  }

  private assertRevisionOwner(actual: string, expected: string) {
    if (actual !== expected) {
      throw new BadRequestException('Revision does not belong to Component');
    }
  }

  private clearanceGranted(clearance: {
    production: boolean;
    qc: boolean;
    yard: boolean;
    logistics: boolean;
    projects: boolean;
    checkedAt: string;
  }) {
    if (!clearance.checkedAt || Number.isNaN(Date.parse(clearance.checkedAt))) {
      throw new BadRequestException(
        'Downstream clearance timestamp is invalid',
      );
    }
    return (
      clearance.production &&
      clearance.qc &&
      clearance.yard &&
      clearance.logistics &&
      clearance.projects
    );
  }

  private assertVersion(value: unknown, aggregate: string): asserts value {
    if (!value) {
      throw new ConflictException(`${aggregate} version conflict`);
    }
  }

  private domain<T>(callback: () => T): T {
    try {
      return callback();
    } catch (error) {
      if (error instanceof ComponentDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async replayedComponent(
    context: ComponentCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.repository.findOutboxEvent(
      `${context.idempotencyKey}:${eventName}`,
      tx,
    );
    if (!event) return null;
    this.assertReplayMatches(event.metadata, context);
    const payload = event.payload as { componentId?: string };
    return payload.componentId
      ? this.repository.findAggregate(payload.componentId, tx)
      : null;
  }

  private async replayedRevision(
    context: ComponentCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.repository.findOutboxEvent(
      `${context.idempotencyKey}:${eventName}`,
      tx,
    );
    if (!event) return null;
    this.assertReplayMatches(event.metadata, context);
    const payload = event.payload as { revisionId?: string };
    return payload.revisionId
      ? this.repository.findRevision(payload.revisionId, tx)
      : null;
  }

  private async replayedBom(
    context: ComponentCommandContext,
    eventName: string,
    tx: Tx,
  ) {
    const event = await this.repository.findOutboxEvent(
      `${context.idempotencyKey}:${eventName}`,
      tx,
    );
    if (!event) return null;
    this.assertReplayMatches(event.metadata, context);
    const payload = event.payload as { bomDefinitionId?: string };
    return payload.bomDefinitionId
      ? this.repository.findBomDefinition(payload.bomDefinitionId, tx)
      : null;
  }

  private bomPayload(
    revision: RevisionRecord,
    bomDefinitionId: string,
    contentHash: string,
    state: ComponentBomDefinitionState | 'DRAFT',
  ) {
    return {
      componentId: revision.componentId,
      revisionId: revision.id,
      bomDefinitionId,
      contentHash,
      state,
      changedSections: ['lines', 'routing'],
    };
  }

  private json(value: unknown) {
    return value as Prisma.InputJsonValue;
  }

  private bomContentHash(lines: unknown, routing: unknown) {
    return this.stableHash({ lines, routing });
  }

  private assertReplayMatches(
    metadata: Prisma.JsonValue,
    context: ComponentCommandContext,
  ) {
    const stored = metadata as { commandHash?: string } | null;
    if (
      !stored?.commandHash ||
      stored.commandHash !== this.stableHash(context)
    ) {
      throw new ConflictException(
        'Idempotency key was already used by a different Component command',
      );
    }
  }

  private stableHash(value: unknown) {
    const canonicalize = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(canonicalize);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => [key, canonicalize(item)]),
        );
      }
      return value;
    };
    return createHash('sha256')
      .update(JSON.stringify(canonicalize(value)))
      .digest('hex');
  }
}

type ComponentRecord = NonNullable<
  Awaited<ReturnType<ComponentsRepository['findAggregate']>>
>;
type RevisionRecord = NonNullable<
  Awaited<ReturnType<ComponentsRepository['findRevision']>>
>;
type VersionedComponent =
  | DeprecateComponentCommand
  | ReactivateComponentCommand;
type VersionedRevision =
  | SubmitRevisionForReviewCommand
  | ReturnRevisionToDraftCommand
  | ApproveComponentRevisionCommand
  | WithdrawRevisionApprovalCommand
  | ArchiveComponentRevisionCommand;
