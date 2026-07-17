import {
  ComponentBomDefinitionState,
  ComponentLifecycleState,
  ComponentRevisionState,
} from '@prisma/client';

import {
  ComponentAggregate,
  ComponentBomAggregate,
  ComponentDomainError,
  ComponentRevisionAggregate,
} from './component.aggregate';

describe('Components canonical aggregates', () => {
  it('activates a draft Component only as a revision release consequence', () => {
    const component = ComponentAggregate.hydrate({
      id: 'component-1',
      lifecycleState: ComponentLifecycleState.DRAFT,
      aggregateVersion: 1,
      currentRevisionId: null,
    });

    expect(component.release('revision-1')).toEqual({
      lifecycleState: ComponentLifecycleState.ACTIVE,
      currentRevisionId: 'revision-1',
    });
  });

  it('rejects release unless revision is approved and BOM is validated', () => {
    const revision = ComponentRevisionAggregate.hydrate({
      id: 'revision-1',
      componentId: 'component-1',
      state: ComponentRevisionState.IN_REVIEW,
      aggregateVersion: 2,
    });

    expect(() =>
      revision.release(ComponentBomDefinitionState.VALIDATED),
    ).toThrow(ComponentDomainError);
  });

  it('rejects review submission with an unvalidated BOM', () => {
    const revision = ComponentRevisionAggregate.hydrate({
      id: 'revision-1',
      componentId: 'component-1',
      state: ComponentRevisionState.DRAFT,
      aggregateVersion: 1,
    });

    expect(() =>
      revision.submitForReview(ComponentBomDefinitionState.DRAFT),
    ).toThrow('requires a validated BOM');
  });

  it('keeps released Revision and BOM content immutable', () => {
    const revision = ComponentRevisionAggregate.hydrate({
      id: 'revision-1',
      componentId: 'component-1',
      state: ComponentRevisionState.RELEASED,
      aggregateVersion: 5,
    });

    expect(() => revision.updateContent()).toThrow(ComponentDomainError);
    expect(() =>
      ComponentBomAggregate.replace(ComponentBomDefinitionState.RELEASED),
    ).toThrow(ComponentDomainError);
  });

  it('invalidates validated BOM content before replacement', () => {
    expect(
      ComponentBomAggregate.replace(ComponentBomDefinitionState.VALIDATED),
    ).toBe(ComponentBomDefinitionState.DRAFT);
  });

  it('requires deprecation before an active Component can archive', () => {
    const component = ComponentAggregate.hydrate({
      id: 'component-1',
      lifecycleState: ComponentLifecycleState.ACTIVE,
      aggregateVersion: 4,
      currentRevisionId: 'revision-1',
    });

    expect(() => component.archive(true, true)).toThrow(ComponentDomainError);
  });

  it('keeps legacy operational records outside the canonical state machine', () => {
    expect(() =>
      ComponentAggregate.hydrate({
        id: 'legacy-1',
        lifecycleState: null,
        aggregateVersion: 0,
        currentRevisionId: null,
      }),
    ).toThrow('has not been adopted');
  });
});
