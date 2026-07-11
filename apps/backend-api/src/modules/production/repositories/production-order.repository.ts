import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ProductionRepository } from './production.repository';

@Injectable()
export class ProductionOrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productionRepository: ProductionRepository,
  ) {}

  findMany(params: Parameters<ProductionRepository['findOrders']>[0]) {
    return this.productionRepository.findOrders(params);
  }

  count(params: Parameters<ProductionRepository['countOrders']>[0]) {
    return this.productionRepository.countOrders(params);
  }

  findById(id: string, tx?: Prisma.TransactionClient) {
    return this.productionRepository.findOrderById(id, tx);
  }

  create(
    data: Prisma.ProductionOrderCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return this.productionRepository.createOrder(data, tx);
  }

  update(
    id: string,
    data: Prisma.ProductionOrderUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.productionRepository.updateOrder(id, data, tx);
  }

  createActivity(
    data: Prisma.ActivityLogCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return this.productionRepository.createActivityLog(data, tx);
  }

  createOutboxEvent(
    data: {
      eventName: string;
      payload: Prisma.InputJsonValue;
      metadata: Prisma.InputJsonValue;
      idempotencyKey: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    return tx.outboxEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: {
        eventName: data.eventName,
        payload: data.payload,
        metadata: data.metadata,
        idempotencyKey: data.idempotencyKey,
      },
      update: {},
    });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
