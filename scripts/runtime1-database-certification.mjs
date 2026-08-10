import { chmod, readFile, writeFile } from 'node:fs/promises';
import prismaPackage from '../apps/backend-api/node_modules/@prisma/client/default.js';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-runtime1-business-evidence.json';
const rest = JSON.parse(await readFile(evidenceFile, 'utf8'));
const ids = rest.summary.ids;
const runId = rest.runId;
const reverseWorkflow = Boolean(ids.reverseTransferId);

try {
  const [material, requirement, order, instance, inspection, placement, dispatch, activity] = await Promise.all([
    prisma.inventoryItem.findUnique({
      where: { id: ids.materialId },
      include: { locationStocks: true, transactionItems: { include: { transaction: true } } },
    }),
    prisma.projectComponentRequirement.findUnique({
      where: { id: ids.requirementId },
      include: { project: true, component: true, productionOrders: true, componentInstances: true },
    }),
    prisma.productionOrder.findUnique({
      where: { id: ids.productionOrderId },
      include: { workOrders: true, executions: true, materialReservations: { include: { lines: true } }, materialIssues: true },
    }),
    prisma.componentInstance.findUnique({
      where: { id: ids.componentInstanceId },
      include: { executions: true, qcInspections: true, timeline: true, yardPlacements: true, dispatchItems: true },
    }),
    prisma.qcInspection.findUnique({ where: { id: ids.inspectionId }, include: { results: true } }),
    prisma.yardItemPlacement.findUnique({ where: { id: ids.yardPlacementId } }),
    prisma.dispatchOrder.findUnique({ where: { id: ids.dispatchOrderId }, include: { items: true, events: true } }),
    prisma.activityLog.findMany({
      where: {
        OR: [
          { entityId: { in: [ids.materialId, ids.projectId, ids.productionOrderId, ids.componentInstanceId, ids.inspectionId, ids.yardPlacementId, ids.dispatchOrderId, ids.receiptId, ids.reverseTransferId].filter(Boolean) } },
          { metadata: { string_contains: runId } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const checks = [
    ['REST material exists in DB', material?.id === ids.materialId],
    ['Inventory item denormalized quantity is 95', Number(material?.quantity) === 95],
    ['Location stock total is 95', material?.locationStocks.reduce((sum, row) => sum + Number(row.quantity), 0) === 95],
    ['Requirement points to Project and Component', requirement?.projectId === ids.projectId && requirement?.componentId === ids.componentId],
    ['Requirement has one ProductionOrder and one physical instance', requirement?.productionOrders.length === 1 && requirement?.componentInstances.length === 1],
    ['ProductionOrder lineage matches requirement', order?.componentRequirementId === ids.requirementId],
    ['Production execution and WorkOrder completed', order?.executions.every((row) => row.state === 'COMPLETED') && order?.workOrders.every((row) => row.status === 'COMPLETED')],
    ['Physical instance has completed execution', instance?.executions.some((row) => row.status === 'COMPLETED')],
    ['Physical instance has canonical QC inspection', instance?.qcInspections.some((row) => row.id === ids.inspectionId)],
    ['QC PASS was persisted', inspection?.status === 'PASSED' && inspection.results.some((row) => row.status === 'PASS')],
    ['Dispatch item points to ComponentInstance', dispatch?.items.some((row) => row.componentInstanceId === ids.componentInstanceId)],
    [reverseWorkflow ? 'Reverse logistics returned instance to QC quarantine' : 'Forward logistics installed the physical instance',
      instance?.state === (reverseWorkflow ? 'PRODUCED_WAITING_QC' : 'INSTALLED')],
    ['Original Yard placement was closed on dispatch', placement?.removedAt != null],
    [reverseWorkflow ? 'Returned instance has a new active Yard placement' : 'Installed instance has no active Yard placement',
      reverseWorkflow
        ? instance?.yardPlacements.some((row) => row.removedAt == null)
        : instance?.yardPlacements.every((row) => row.removedAt != null)],
    ['ActivityLog rows exist for fixture', activity.length > 0],
  ].map(([name, pass]) => ({ name, pass: Boolean(pass) }));

  const output = {
    runId,
    checkedAt: new Date().toISOString(),
    checks,
    failed: checks.filter((item) => !item.pass),
    counts: {
      transactionRows: material?.transactionItems.length ?? 0,
      locationStocks: material?.locationStocks.length ?? 0,
      productionOrders: requirement?.productionOrders.length ?? 0,
      componentInstances: requirement?.componentInstances.length ?? 0,
      executions: instance?.executions.length ?? 0,
      inspections: instance?.qcInspections.length ?? 0,
      yardPlacements: instance?.yardPlacements.length ?? 0,
      dispatchItems: dispatch?.items.length ?? 0,
      dispatchEvents: dispatch?.events.length ?? 0,
      activityLogs: activity.length,
    },
    activityActions: activity.map((row) => row.action),
    states: {
      productionOrder: order?.status,
      workOrders: order?.workOrders.map((row) => row.status),
      executions: order?.executions.map((row) => row.state),
      componentInstance: instance?.state,
      inspection: inspection?.status,
      dispatch: dispatch?.status,
      originalYardPlacementRemovedAt: placement?.removedAt,
      activeYardPlacements: instance?.yardPlacements.filter((row) => row.removedAt == null).length,
    },
  };
  const outputPath = process.env.RUNTIME_DATABASE_EVIDENCE_FILE ?? '/tmp/system-runtime1-database-evidence.json';
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  await chmod(outputPath, 0o600);
  console.log(JSON.stringify({ outputPath, ...output }, null, 2));
  if (output.failed.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
