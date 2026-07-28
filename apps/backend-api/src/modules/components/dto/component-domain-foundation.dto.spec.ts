import {
  createComponentDefinitionRequirementSchema,
  createComponentInstanceSchema,
  createProjectComponentRequirementSchema,
} from './component-domain-foundation.dto';

describe('Component DOMAIN.2 foundation DTOs', () => {
  it('requires componentType and positive requiredQuantity for canonical definition create', () => {
    expect(
      createComponentDefinitionRequirementSchema.safeParse({
        name: 'BEAM-B01',
        componentType: 'Dầm (Beam)',
        profile: 'H300',
        projectId: 'project-1',
        requiredQuantity: 20,
      }).success,
    ).toBe(true);

    expect(
      createComponentDefinitionRequirementSchema.safeParse({
        name: 'BEAM-B01',
        projectId: 'project-1',
        requiredQuantity: 20,
      }).success,
    ).toBe(false);
  });

  it('accepts a positive project component requirement quantity', () => {
    expect(
      createProjectComponentRequirementSchema.safeParse({
        requirementNo: 'REQ-B01-LT',
        projectId: 'project-1',
        componentId: 'component-1',
        requiredQuantity: 20,
      }).success,
    ).toBe(true);
  });

  it('rejects non-positive requirement quantity', () => {
    expect(
      createProjectComponentRequirementSchema.safeParse({
        requirementNo: 'REQ-B01-LT',
        projectId: 'project-1',
        componentId: 'component-1',
        requiredQuantity: 0,
      }).success,
    ).toBe(false);
  });

  it('does not allow callers to create a QC-passed or finished-goods instance directly', () => {
    expect(
      createComponentInstanceSchema.safeParse({
        instanceNo: 'BEAM-B01-001',
        componentId: 'component-1',
        componentRevisionId: 'revision-1',
        state: 'QC_PASSED',
      }).success,
    ).toBe(false);
  });
});
