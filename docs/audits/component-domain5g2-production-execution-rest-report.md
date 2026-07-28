# STABILITY.DOMAIN5G.2 - ProductionExecution REST Command Completion

Date: 2026-07-28

## Previous REST Surface

Before this sprint, `ProductionCommandController` exposed:

- Production Order commands under `/production/commands/orders/...`
- WorkOrder commands under `/production/commands/work-orders/...`
- ComponentInstanceExecution commands under `/production/commands/instance-executions/...`

Missing REST surface:

- `ProductionExecution` start
- `ProductionExecution` pause
- `ProductionExecution` resume
- `ProductionExecution` complete
- `ProductionExecution` abort

The service layer already had the lifecycle. The controller did not expose it.

## Existing Service Capabilities

Existing application methods in `ProductionCommandService`:

| Capability | Service method | Existing state rules |
| --- | --- | --- |
| Start execution | `startExecution` | Order and WorkOrder must be in progress |
| Pause execution | `pauseExecution` | `RUNNING -> PAUSED`, reason required |
| Resume execution | `resumeExecution` | `PAUSED -> RUNNING` |
| Complete execution | `completeExecution` | `RUNNING -> COMPLETED` |
| Abort execution | `abortExecution` | `CREATED/RUNNING/PAUSED -> ABORTED`, reason required |

Idempotency remains handled by existing command/outbox replay logic. The controller only forwards authenticated command context.

## Routes Added

Added to `ProductionCommandController` under the existing command route convention:

```text
POST /production/commands/executions/start
POST /production/commands/executions/:executionRunId/pause
POST /production/commands/executions/:executionRunId/resume
POST /production/commands/executions/:executionRunId/complete
POST /production/commands/executions/:executionRunId/abort
```

No existing route was renamed or removed.

## DTO Changes

Additive DTO schemas:

- `startProductionExecutionCommandSchema`
- `versionedProductionExecutionCommandSchema`
- `reasonedProductionExecutionCommandSchema`

Body contract:

```ts
{
  productionOrderId: string;
  workOrderId: string;
  expectedVersion: number;
  reason?: string;
}
```

`pause` and `abort` require `reason`. `start` accepts only existing service fields: `productionOrderId`, `workOrderId`, `workCenterId?`, `machineId?`.

## Authorization

The new routes inherit `@UseGuards(JwtAuthGuard)` from `ProductionCommandController`.

Mutation idempotency remains enforced by the shared `context()` helper:

- authenticated actor required
- `Idempotency-Key` required
- correlation/causation headers forwarded

## Lifecycle Rules

No lifecycle rule was implemented in the controller.

Rules remain owned by:

- `ProductionExecutionAggregate`
- `ProductionCommandService.transitionExecution`
- `ProductionOrderRepository.updateExecution`

## Invalid Transition Tests

Runtime smoke verified invalid transition rejection:

```json
{
  "path": "/production/commands/executions/2b8450e8-b28e-41cf-87e0-b4e93253fe59/resume",
  "status": 400,
  "message": "Production Execution cannot resume from COMPLETED"
}
```

Controller unit tests verify command boundary forwarding for `completeExecution` and `abortExecution`.

## Active Execution Guard

The DOMAIN5G blocker was reproduced before completion:

```json
{
  "path": "/production/commands/work-orders/50c7b9f5-b64c-489a-aa64-1f8bbcc59c42/complete",
  "status": 400,
  "message": "Work Order has an active execution run"
}
```

After completing the active `ProductionExecution` through the new REST command, the same WorkOrder completion path returned `201`.

## Production Completion

Runtime fixture: `DOMAIN5G2-1785225842103`.

Production flow passed:

- PO created
- PO released
- PO ready
- PO started
- WorkOrder active guard rejected completion while execution was running
- Execution pause/resume passed
- ComponentInstanceExecution assign/start/complete passed
- ProductionExecution complete passed
- WorkOrder complete passed

Final production accounting:

```json
{
  "productionOrder": "DOMAIN5G2-1785225842103-PO",
  "quantity": 2,
  "workOrderState": "COMPLETED",
  "executionState": "COMPLETED"
}
```

## ComponentInstance Transition

After ComponentInstanceExecution completion:

```json
[
  {
    "instanceNo": "CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-001",
    "state": "PRODUCED_WAITING_QC"
  },
  {
    "instanceNo": "CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-002",
    "state": "PRODUCED_WAITING_QC"
  }
]
```

The state transition was produced by existing DOMAIN.5E lifecycle logic. No direct DB mutation was used.

## QC Handoff

Waiting QC source returned both physical identities before inspection:

```text
GET /components/foundation/instances?state=PRODUCED_WAITING_QC&productionOrderId=<fixture>&limit=50
total = 2
```

## QC HTTP Smoke

Authenticated HTTP smoke:

- Instance A: `PRODUCED_WAITING_QC -> QC_PASSED`
- Instance B: `PRODUCED_WAITING_QC -> QC_FAILED -> NCR`

Evidence:

```json
[
  {
    "instanceNo": "CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-001",
    "state": "QC_PASSED"
  },
  {
    "instanceNo": "CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-002",
    "state": "QC_FAILED"
  }
]
```

NCR:

```json
{
  "ncrNo": "DOMAIN5G2-1785225842103-NCR",
  "status": "OPEN",
  "componentInstanceId": "cms4ddgs0001kpvtlbflttg3x"
}
```

Rework/Scrap/Use-as-is were not executed in this sprint because PASS/FAIL/NCR certified the restored HTTP execution path and finished-goods boundary. Disposition command routes remain existing QC command surface.

## Finished Goods Reconciliation

Finished Goods source:

```text
GET /components/instances/finished-goods?productionOrderId=<fixture>&limit=50
```

Result:

```json
{
  "total": 1,
  "instances": [
    {
      "id": "cms4ddgs0001jpvtldav244kw",
      "instanceNo": "CPL-20260728-86A3E524-DOMAIN5G2-1785225842103-PO-001",
      "state": "QC_PASSED"
    }
  ]
}
```

The failed instance did not appear in Finished Goods.

## Side Effects

QC PASS alone did not create inventory or yard side effects.

| Counter | Before | After |
| --- | ---: | ---: |
| InventoryTransaction | 0 | 0 |
| YardItemPlacement | 0 | 0 |

## API Regression

Runtime smoke used existing compatible endpoints successfully:

- `POST /production/commands/orders`
- `POST /production/commands/orders/:id/release`
- `POST /production/commands/orders/:id/ready`
- `POST /production/commands/orders/:id/start`
- `POST /production/commands/work-orders/:workOrderId/complete`
- `POST /production/commands/instance-executions/assign`
- `POST /production/commands/instance-executions/:id/start`
- `POST /production/commands/instance-executions/:id/complete`

No legacy production route was renamed.

## Frontend Impact

No frontend source was changed.

Current UI wiring for these new REST commands is P1 unless a screen needs operator-level execution pause/resume/complete actions immediately. This sprint remained backend/runtime focused.

## Browser Smoke

NOT TESTED.

Authenticated browser harness was not available in this runtime. Backend/runtime API E2E is GREEN. Overall DOMAIN.5G remains YELLOW only for browser certification.

## Files Changed

- `apps/backend-api/src/modules/production/dto/production-command.dto.ts`
- `apps/backend-api/src/modules/production/production-command.controller.ts`
- `apps/backend-api/src/modules/production/production-command.controller.spec.ts`
- `docs/audits/component-domain5g-runtime-certification.md`
- `docs/audits/component-domain5g2-production-execution-rest-report.md`

No schema, migration, frontend, inventory, yard, dashboard, or QC business rule changes.

## Verification

| Check | Result |
| --- | --- |
| `pnpm -C apps/backend-api exec prisma validate` | PASS |
| `pnpm -C apps/backend-api exec prisma migrate status` | PASS |
| `pnpm -C apps/backend-api test -- production-command.controller.spec.ts` | PASS |
| `pnpm -C apps/backend-api test -- production-command.service.spec.ts production-instance-execution.service.spec.ts` | PASS |
| `pnpm -C apps/backend-api test -- qc.controller.ts qc-command.service` | PASS |
| `pnpm -C apps/backend-api test` | PASS, 79 suites / 249 tests |
| `pnpm -C apps/backend-api build` | PASS |
| `pnpm -C apps/frontend build` | PASS, existing chunk-size warning only |

## Remaining P0

None for backend/runtime HTTP workflow.

## Remaining P1

1. Browser certification for Production PO detail, `/qc/final`, and `/components/stock`.
2. Optional frontend wiring for operator execution transition actions.
3. Optional WorkOrder ready command REST exposure if multi-step route-by-route execution needs to proceed without order-level ready orchestration.

## Final DOMAIN.5G Status

- Backend/runtime API E2E: **GREEN**
- Browser certification: **NOT TESTED**
- Overall DOMAIN.5G: **YELLOW / backend certified, browser pending**

## Recommendation

Proceed to browser certification or a small frontend wiring sprint. Do not expand backend domain logic; the missing runtime blocker has been resolved through command surface completion.
