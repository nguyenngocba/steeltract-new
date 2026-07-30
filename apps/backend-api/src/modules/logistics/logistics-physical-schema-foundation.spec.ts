import { ComponentInstanceState, Prisma } from '@prisma/client';

describe('LOGISTICS.2A physical logistics schema foundation', () => {
  it('exposes canonical physical ComponentInstance logistics states', () => {
    expect(Object.values(ComponentInstanceState)).toEqual(
      expect.arrayContaining([
        ComponentInstanceState.IN_YARD,
        ComponentInstanceState.IN_TRANSIT,
        ComponentInstanceState.DELIVERED,
      ]),
    );
  });

  it('keeps DispatchItem componentInstanceId optional for legacy history', () => {
    const dispatchItem = Prisma.dmmf.datamodel.models.find(
      (model) => model.name === 'DispatchItem',
    );

    expect(dispatchItem).toBeDefined();

    const componentInstanceId = dispatchItem?.fields.find(
      (field) => field.name === 'componentInstanceId',
    );
    const componentInstance = dispatchItem?.fields.find(
      (field) => field.name === 'componentInstance',
    );

    expect(componentInstanceId).toMatchObject({
      kind: 'scalar',
      type: 'String',
      isRequired: false,
      isList: false,
      isUnique: false,
    });
    expect(componentInstance).toMatchObject({
      kind: 'object',
      type: 'ComponentInstance',
      isRequired: false,
      isList: false,
      relationName: 'ComponentInstanceDispatchItems',
    });
  });

  it('allows one ComponentInstance to have historical DispatchItem attempts', () => {
    const componentInstance = Prisma.dmmf.datamodel.models.find(
      (model) => model.name === 'ComponentInstance',
    );

    const dispatchItems = componentInstance?.fields.find(
      (field) => field.name === 'dispatchItems',
    );

    expect(dispatchItems).toMatchObject({
      kind: 'object',
      type: 'DispatchItem',
      isList: true,
      relationName: 'ComponentInstanceDispatchItems',
    });
  });
});
