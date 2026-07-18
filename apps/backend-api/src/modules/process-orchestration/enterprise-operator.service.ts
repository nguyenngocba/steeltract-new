import { Injectable } from '@nestjs/common';

import { InventoryService } from '../inventory/inventory.service';
import { LogisticsCommandService } from '../logistics/logistics-command.service';
import { ProjectCommandService } from '../projects/services/project-command.service';
import { ProductionCommandService } from '../production/services/production-command.service';
import { QcCommandService } from '../qc/services/qc-command.service';
import { YardCommandService } from '../yard/services/yard-command.service';
import {
  AcceptProjectOperation,
  AllocateMaterialsOperation,
  CompleteProjectOperation,
  CompleteQcInspectionOperation,
  DispatchShipmentOperation,
  EnterpriseOperationResult,
  ExecuteProductionOperation,
  MoveToYardOperation,
  PrepareShipmentOperation,
  ReceiveAtSiteOperation,
  ReceiveMaterialsOperation,
  ReleaseProductionOperation,
} from './enterprise-operator.types';
import {
  EnterpriseProcessContext,
  EnterpriseProcessResult,
} from './enterprise-process.types';
import { EnterpriseProcessService } from './enterprise-process.service';

@Injectable()
export class EnterpriseOperatorService {
  constructor(
    private readonly process: EnterpriseProcessService,
    private readonly inventory: InventoryService,
    private readonly production: ProductionCommandService,
    private readonly qc: QcCommandService,
    private readonly yard: YardCommandService,
    private readonly logistics: LogisticsCommandService,
    private readonly projects: ProjectCommandService,
  ) {}

  async receiveMaterials(
    context: EnterpriseProcessContext,
    operation: ReceiveMaterialsOperation,
  ) {
    const result = await this.process.coordinate('receive-materials', context, [
      {
        name: 'inventory.receive-materials',
        execute: () =>
          this.inventory.createTransaction({
            ...operation.transaction,
            performedBy: operation.transaction.performedBy ?? context.actorId,
            referenceModule:
              operation.transaction.referenceModule ?? 'operator-application',
            referenceId: operation.transaction.referenceId ?? context.processId,
          }),
      },
    ]);
    return this.result('RECEIVE_MATERIALS', result);
  }

  async allocateMaterialsToProject(
    context: EnterpriseProcessContext,
    operation: AllocateMaterialsOperation,
  ) {
    return this.result(
      'ALLOCATE_MATERIALS_TO_PROJECT',
      await this.process.runMaterialAllocation(context, operation),
    );
  }

  async releaseProduction(
    context: EnterpriseProcessContext,
    operation: ReleaseProductionOperation,
  ) {
    return this.result(
      'RELEASE_PRODUCTION',
      await this.process.runProductionRelease(context, operation),
    );
  }

  async executeProduction(
    context: EnterpriseProcessContext,
    operation: ExecuteProductionOperation,
  ) {
    const step =
      operation.mode === 'START_ORDER'
        ? {
            name: 'production.start-order',
            execute: () =>
              this.production.startOrder(
                this.command(
                  operation.command,
                  context,
                  'production.start-order',
                ),
              ),
          }
        : {
            name: 'production.start-execution',
            execute: () =>
              this.production.startExecution(
                this.command(
                  operation.command,
                  context,
                  'production.start-execution',
                ),
              ),
          };
    return this.result(
      'EXECUTE_PRODUCTION',
      await this.process.coordinate('execute-production', context, [step]),
    );
  }

  async completeQcInspection(
    context: EnterpriseProcessContext,
    operation: CompleteQcInspectionOperation,
  ) {
    return this.result(
      'COMPLETE_QC_INSPECTION',
      await this.process.coordinate('complete-qc-inspection', context, [
        {
          name: 'qc.complete-inspection',
          execute: () =>
            this.qc.completeInspection(
              this.command(
                operation.command,
                context,
                'qc.complete-inspection',
              ),
            ),
        },
      ]),
    );
  }

  async moveToYard(
    context: EnterpriseProcessContext,
    operation: MoveToYardOperation,
  ) {
    const step =
      operation.mode === 'PLACE'
        ? {
            name: 'yard.place',
            execute: () =>
              this.yard.place(
                this.command(operation.command, context, 'yard.place'),
              ),
          }
        : {
            name: 'yard.relocate',
            execute: () =>
              this.yard.relocate(
                this.command(operation.command, context, 'yard.relocate'),
              ),
          };
    return this.result(
      'MOVE_TO_YARD',
      await this.process.coordinate('move-to-yard', context, [step]),
    );
  }

  async prepareShipment(
    context: EnterpriseProcessContext,
    operation: PrepareShipmentOperation,
  ) {
    return this.result(
      'PREPARE_SHIPMENT',
      await this.process.runShipment(context, {
        ...operation,
        dispatch: false,
      }),
    );
  }

  async dispatchShipment(
    context: EnterpriseProcessContext,
    operation: DispatchShipmentOperation,
  ) {
    return this.result(
      'DISPATCH_SHIPMENT',
      await this.process.coordinate('dispatch-shipment', context, [
        {
          name: 'logistics.dispatch',
          execute: () =>
            this.logistics.dispatch(
              this.command(operation.command, context, 'logistics.dispatch'),
            ),
        },
      ]),
    );
  }

  async receiveAtSite(
    context: EnterpriseProcessContext,
    operation: ReceiveAtSiteOperation,
  ) {
    return this.result(
      'RECEIVE_AT_SITE',
      await this.process.coordinate('receive-at-site', context, [
        {
          name: 'logistics.confirm-delivery',
          execute: () =>
            this.logistics.confirmDelivery(
              this.command(
                operation.delivery,
                context,
                'logistics.confirm-delivery',
              ),
            ),
        },
        {
          name: 'project.track-delivery',
          execute: () =>
            this.projects.trackDelivery(
              this.command(
                operation.projectDelivery,
                context,
                'project.track-delivery',
              ),
            ),
        },
        {
          name: 'project.record-site-receipt',
          execute: () =>
            this.projects.recordSiteReceipt(
              this.command(
                operation.siteReceipt,
                context,
                'project.record-site-receipt',
              ),
            ),
        },
      ]),
    );
  }

  async acceptProject(
    context: EnterpriseProcessContext,
    operation: AcceptProjectOperation,
  ) {
    return this.result(
      'ACCEPT_PROJECT',
      await this.process.coordinate('accept-project', context, [
        {
          name: 'project.complete-acceptance',
          execute: () =>
            this.projects.completeAcceptance(
              this.command(
                operation.command,
                context,
                'project.complete-acceptance',
              ),
            ),
        },
      ]),
    );
  }

  async completeProject(
    context: EnterpriseProcessContext,
    operation: CompleteProjectOperation,
  ) {
    return this.result(
      'COMPLETE_PROJECT',
      await this.process.coordinate('complete-project', context, [
        {
          name: 'project.complete',
          execute: () =>
            this.projects.complete(
              this.command(operation.command, context, 'project.complete'),
            ),
        },
      ]),
    );
  }

  private command<T extends object>(
    command: T,
    context: EnterpriseProcessContext,
    step: string,
  ) {
    return {
      ...command,
      actorId: context.actorId,
      correlationId: context.correlationId,
      causationId: context.causationId ?? context.processId,
      idempotencyKey: `${context.processId}:${step}`,
    };
  }

  private result(
    operation: string,
    process: EnterpriseProcessResult,
  ): EnterpriseOperationResult {
    return {
      operation,
      status: process.status,
      processId: process.processId,
      correlationId: process.correlationId,
      timeline: process.completedSteps.map((step, index) => ({
        sequence: index + 1,
        step,
        status: 'COMPLETED',
      })),
      auditReceipt: {
        eventName: 'audit.activity.created',
        module: 'process-orchestration',
        idempotencyKey: `enterprise-process:${process.processId}:completed`,
      },
      data: process.results,
    };
  }
}
