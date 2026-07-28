import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ComponentDomainFoundationService } from './component-domain-foundation.service';

describe('ComponentDomainFoundationService', () => {
  const component = {
    id: 'component-1',
    code: 'BEAM-B01',
    lifecycleState: 'ACTIVE',
  };
  const revision = {
    id: 'revision-1',
    componentId: component.id,
    state: 'RELEASED',
  };
  const bom = {
    id: 'bom-definition-1',
    componentRevisionId: revision.id,
    state: 'RELEASED',
  };
  const project = {
    id: 'project-1',
    code: 'CT-001',
    name: 'Long Thanh',
  };

  function setup(overrides: Record<string, unknown> = {}) {
    const tx = { tx: true };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findProject: jest.fn().mockResolvedValue(project),
      findComponent: jest.fn().mockResolvedValue(component),
      findRevision: jest.fn().mockResolvedValue(revision),
      findBomDefinition: jest.fn().mockResolvedValue(bom),
      findRequirement: jest.fn().mockResolvedValue({
        id: 'requirement-1',
        componentId: component.id,
        componentRevisionId: revision.id,
      }),
      findProductionOrder: jest.fn().mockResolvedValue({
        id: 'order-1',
        componentId: component.id,
        componentRevisionId: revision.id,
        bomDefinitionId: bom.id,
        projectId: 'project-1',
        componentRequirementId: 'requirement-1',
      }),
      createRequirement: jest.fn().mockResolvedValue({ id: 'requirement-1' }),
      createDefinitionRequirement: jest.fn().mockResolvedValue({
        component: {
          id: component.id,
          code: component.code,
          name: component.code,
          lifecycleState: 'DRAFT',
        },
        requirement: {
          id: 'requirement-1',
          projectId: project.id,
          componentId: component.id,
          requiredQuantity: 20,
        },
      }),
      listRequirements: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      createInstance: jest.fn().mockResolvedValue({
        id: 'instance-1',
        instanceNo: 'BEAM-B01-001',
        state: 'PLANNED',
      }),
      listInstances: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      ...overrides,
    };
    return {
      repository,
      tx,
      service: new ComponentDomainFoundationService(repository as never),
    };
  }

  it('atomically creates a Component definition and Project requirement', async () => {
    const { repository, service, tx } = setup();

    const result = await service.createDefinitionRequirement({
      name: 'BEAM-B01',
      componentType: 'Dầm (Beam)',
      profile: 'H300',
      projectId: project.id,
      requiredQuantity: 20,
    });

    expect(repository.findProject).toHaveBeenCalledWith(project.id);
    expect(repository.transaction).toHaveBeenCalledTimes(1);
    expect(repository.createDefinitionRequirement).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'BEAM-B01',
        componentType: 'Dầm (Beam)',
        profile: 'H300',
        projectId: project.id,
        requiredQuantity: 20,
      }),
      expect.objectContaining({
        componentCode: expect.stringMatching(/^CPL-\d{8}-[A-F0-9]{8}$/),
        requirementNo: expect.stringMatching(/^PCR-\d{8}-[A-F0-9]{8}$/),
      }),
      tx,
    );
    expect(result.component.lifecycleState).toBe('DRAFT');
    expect(result.requirement.requiredQuantity).toBe(20);
    expect(repository.createInstance).not.toHaveBeenCalled();
    expect(repository.findProductionOrder).not.toHaveBeenCalled();
  });

  it('rolls back the canonical create when requirement creation fails', async () => {
    const failure = new Error('requirement failed');
    const { repository, service } = setup({
      createDefinitionRequirement: jest.fn().mockRejectedValue(failure),
    });

    await expect(
      service.createDefinitionRequirement({
        name: 'BEAM-B01',
        componentType: 'Dầm (Beam)',
        projectId: project.id,
        requiredQuantity: 20,
      }),
    ).rejects.toThrow(failure);

    expect(repository.createInstance).not.toHaveBeenCalled();
    expect(repository.findProductionOrder).not.toHaveBeenCalled();
  });

  it('rejects canonical create for an unknown Project', async () => {
    const { repository, service } = setup({
      findProject: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.createDefinitionRequirement({
        name: 'BEAM-B01',
        componentType: 'Dầm (Beam)',
        projectId: project.id,
        requiredQuantity: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.transaction).not.toHaveBeenCalled();
  });

  it('creates a project requirement against Component definition lineage', async () => {
    const { repository, service } = setup();

    await service.createRequirement({
      requirementNo: 'REQ-B01-LT',
      projectId: 'project-1',
      componentId: component.id,
      componentRevisionId: revision.id,
      bomDefinitionId: bom.id,
      requiredQuantity: 20,
    });

    expect(repository.createRequirement).toHaveBeenCalledWith(
      expect.objectContaining({
        componentId: component.id,
        componentRevisionId: revision.id,
        requiredQuantity: 20,
      }),
    );
    expect(repository.createInstance).not.toHaveBeenCalled();
  });

  it('rejects a requirement revision that belongs to another Component', async () => {
    const { service } = setup({
      findRevision: jest
        .fn()
        .mockResolvedValue({ ...revision, componentId: 'other-component' }),
    });

    await expect(
      service.createRequirement({
        requirementNo: 'REQ-B01-LT',
        projectId: 'project-1',
        componentId: component.id,
        componentRevisionId: revision.id,
        requiredQuantity: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a ComponentInstance as physical identity without QC or finished-goods elevation', async () => {
    const { repository, service } = setup();

    await service.createInstance({
      instanceNo: 'BEAM-B01-001',
      componentId: component.id,
      componentRevisionId: revision.id,
      bomDefinitionId: bom.id,
      requirementId: 'requirement-1',
      productionOrderId: 'order-1',
      serialSequence: 1,
    });

    expect(repository.createInstance).toHaveBeenCalledWith(
      expect.not.objectContaining({
        state: 'QC_PASSED',
      }),
    );
    expect(repository.createInstance).toHaveBeenCalledWith(
      expect.not.objectContaining({
        state: 'FINISHED_GOODS',
      }),
    );
  });

  it('rejects a ComponentInstance requirement with mismatched Component definition', async () => {
    const { service } = setup({
      findRequirement: jest.fn().mockResolvedValue({
        id: 'requirement-1',
        componentId: 'other-component',
        componentRevisionId: revision.id,
      }),
    });

    await expect(
      service.createInstance({
        instanceNo: 'BEAM-B01-001',
        componentId: component.id,
        componentRevisionId: revision.id,
        requirementId: 'requirement-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown Component definitions', async () => {
    const { service } = setup({ findComponent: jest.fn().mockResolvedValue(null) });

    await expect(
      service.createRequirement({
        requirementNo: 'REQ-B01-LT',
        projectId: 'project-1',
        componentId: component.id,
        requiredQuantity: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
