import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

import { CreateTaskDto, ListTasksDto, UpdateTaskDto } from '../dto/tasks.dto';

import { TasksRepository } from '../repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  async findAll(query: ListTasksDto) {
    const search = query.search || query.q;
    const hasPagination = query.page !== undefined || query.limit !== undefined;

    const filters = {
      search,
      status: query.status,
      priority: query.priority,
      componentId: query.componentId,
    };

    if (!hasPagination) {
      return this.repository.findAll(filters);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findAll({
        ...filters,
        skip,
        take: limit,
      }),
      this.repository.count(filters),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  create(dto: CreateTaskDto) {
    return this.repository.transaction(async (tx) => {
      const task = await this.repository.create(
        {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: dto.dueDate,
          component: dto.componentId
            ? {
                connect: {
                  id: dto.componentId,
                },
              }
            : undefined,
        },
        tx,
      );

      await this.log('CREATE', task.id, task, tx);

      return task;
    });
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const task = await this.repository.update(
        id,
        {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          dueDate: dto.dueDate,
          component: dto.componentId
            ? {
                connect: {
                  id: dto.componentId,
                },
              }
            : undefined,
        },
        tx,
      );

      await this.log('UPDATE', task.id, task, tx);

      return task;
    });
  }

  remove(id: string) {
    return this.repository.transaction(async (tx) => {
      await this.assertExists(id, tx);

      const task = await this.repository.delete(id, tx);

      await this.log('DELETE', task.id, task, tx);

      return task;
    });
  }

  private async assertExists(id: string, tx: Prisma.TransactionClient) {
    const task = await this.repository.findOne(id, tx);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private log(
    action: string,
    entityId: string,
    task: {
      title: string;
      status: TaskStatus;
      priority: TaskPriority;
    },
    tx: Prisma.TransactionClient,
  ) {
    return this.repository.createActivityLog(
      {
        action,
        entity: 'Task',
        entityId,
        module: 'tasks',
        metadata: {
          title: task.title,
          status: task.status,
          priority: task.priority,
        },
      },
      tx,
    );
  }
}
