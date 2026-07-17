export interface ComponentCommandContext {
  actorId: string;
  idempotencyKey: string;
  correlationId?: string;
  causationId?: string;
}

export interface VersionedComponentCommand extends ComponentCommandContext {
  componentId: string;
  expectedVersion: number;
}

export interface VersionedRevisionCommand extends ComponentCommandContext {
  componentId: string;
  revisionId: string;
  expectedVersion: number;
}

export interface ComponentDownstreamClearance {
  production: boolean;
  qc: boolean;
  yard: boolean;
  logistics: boolean;
  projects: boolean;
  checkedAt: string;
}

export interface CreateComponentCommand extends ComponentCommandContext {
  code: string;
  name: string;
  description?: string;
  projectId?: string;
}

export interface UpdateComponentMetadataCommand extends VersionedComponentCommand {
  name?: string;
  description?: string | null;
}

export interface DeprecateComponentCommand extends VersionedComponentCommand {
  reason: string;
}

export type ReactivateComponentCommand = VersionedComponentCommand;

export interface ArchiveComponentCommand extends VersionedComponentCommand {
  reason: string;
  downstreamClearance: ComponentDownstreamClearance;
}

export interface CreateComponentRevisionCommand extends ComponentCommandContext {
  componentId: string;
  expectedComponentVersion: number;
  revisionNo: string;
  baseRevisionId?: string;
  content?: unknown;
}

export interface UpdateRevisionContentCommand extends VersionedRevisionCommand {
  content: unknown;
  contentHash: string;
  changedSections: string[];
}

export type SubmitRevisionForReviewCommand = VersionedRevisionCommand;

export interface ReturnRevisionToDraftCommand extends VersionedRevisionCommand {
  reason: string;
}

export type ApproveComponentRevisionCommand = VersionedRevisionCommand;

export interface WithdrawRevisionApprovalCommand extends VersionedRevisionCommand {
  reason: string;
}

export interface ReleaseComponentRevisionCommand extends VersionedRevisionCommand {
  expectedComponentVersion: number;
}

export interface ArchiveComponentRevisionCommand extends VersionedRevisionCommand {
  reason: string;
  downstreamClearance: ComponentDownstreamClearance;
}

export interface ReplaceEngineeringBomCommand extends VersionedRevisionCommand {
  expectedBomVersion: number;
  lines: unknown;
  routing: unknown;
  contentHash: string;
}

export interface ValidateEngineeringBomCommand extends VersionedRevisionCommand {
  expectedBomVersion: number;
  contentHash: string;
}
