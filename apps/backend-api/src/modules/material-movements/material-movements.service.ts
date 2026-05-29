import { Injectable }
  from '@nestjs/common'

@Injectable()
export class MaterialMovementsService {
  private movements = [
    {
      id: 'MOV-001',

      type: 'INBOUND',

      material:
        'Steel Beam H400',

      quantity: 120,

      warehouse:
        'MAIN-WH',

      createdAt:
        new Date()
          .toISOString(),
    },

    {
      id: 'MOV-002',

      type: 'OUTBOUND',

      material:
        'Steel Plate 12mm',

      quantity: 45,

      warehouse:
        'YARD-B',

      createdAt:
        new Date()
          .toISOString(),
    },
  ]

  list() {
    return this.movements
  }

  create(
    payload: any,
  ) {
    const movement = {
      id:
        'MOV-' +
        Date.now(),

      type:
        payload.type,

      material:
        payload.material,

      quantity:
        payload.quantity,

      warehouse:
        payload.warehouse,

      createdAt:
        new Date()
          .toISOString(),
    }

    this.movements.unshift(
      movement,
    )

    return movement
  }
}
