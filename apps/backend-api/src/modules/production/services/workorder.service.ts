import { Injectable } from '@nestjs/common';

import { WorkOrderRepository } from '../repositories/work-order.repository';

@Injectable()
export class WorkOrderService {
  constructor(private readonly repository: WorkOrderRepository) {}

  async create(body: any) {
    return this.repository.create({
      productCode: body.productCode,

      quantity: body.quantity,

      plannedStart: new Date(),

      status: 'PLANNED',
    });
  }

  async release(id: string) {
    return this.repository.release(id);
  }

  async findAll() {
    return this.repository.findAll();
  }
}
