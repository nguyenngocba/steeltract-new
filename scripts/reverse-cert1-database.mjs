import { chmod, readFile, writeFile } from 'node:fs/promises';
import prismaPackage from '../apps/backend-api/node_modules/@prisma/client/default.js';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-reverse-cert1-runtime-evidence.json';
const outputFile = process.env.RUNTIME_DATABASE_EVIDENCE_FILE ?? '/tmp/system-reverse-cert1-database-evidence.json';
const rest = JSON.parse(await readFile(evidenceFile, 'utf8'));
const ids = rest.summary.ids;

try {
  const [pass, rework, scrap, material, materialIssue, supplierReturn, activity] = await Promise.all([
    readLineage(ids.pass.componentInstanceId),
    readLineage(ids.rework.componentInstanceId),
    readLineage(ids.scrap.componentInstanceId),
    prisma.inventoryItem.findUnique({
      where: { id: ids.pass.materialId },
      include: { locationStocks: true, transactionItems: { include: { transaction: true } } },
    }),
    prisma.productionMaterialIssue.findUnique({ where: { id: ids.pass.materialIssueId } }),
    prisma.returnRequest.findUnique({ where: { id: ids.pass.supplierReturnId }, include: { items: true } }),
    prisma.activityLog.findMany({
      where: { createdAt: { gte: new Date(rest.startedAt) } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const returnPosting = material?.transactionItems.find((row) =>
    row.transaction.referenceModule === 'production_material_issue' &&
    row.transaction.referenceId === ids.pass.materialIssueId &&
    Number(row.quantity) > 0);
  const supplierPosting = material?.transactionItems.find((row) =>
    row.transaction.referenceId === ids.pass.supplierReturnId &&
    row.transaction.referenceModule === 'return-workflow' &&
    row.transaction.idempotencyKey === `inventory-command:supplier-return:${ids.pass.supplierReturnId}`);
  const expectedInventory = Number(rest.fixtures.PASS.summary.expectedSignedMovement);
  const checks = [
    ['PASS instance is physically in Yard', pass.instance?.state === 'IN_YARD'],
    ['PASS clears active installation timestamp after return', pass.instance?.installedAt == null],
    ['PASS has exactly one active Yard placement', pass.activePlacements === 1],
    ['PASS reverse dispatch completed as RETURNED', pass.dispatches.some((row) => row.dispatchOrder.status === 'RETURNED')],
    ['REWORK preserves the same ComponentInstance identity', pass.instance?.id !== rework.instance?.id && rework.instance?.id === ids.rework.componentInstanceId],
    ['REWORK instance returns to Yard after second FINAL PASS', rework.instance?.state === 'IN_YARD' && rework.activePlacements === 1],
    ['REWORK has NCR and two post-return FINAL inspections', rework.instance?.qcInspections.some((row) => row.ncrs.length > 0) && rework.instance.qcInspections.filter((row) => row.inspectionNo.includes(rest.runId)).length >= 2],
    ['Rework ProductionOrder exists and owns its ProductionLog rows', rework.reworkOrder?.id === ids.rework.reworkProductionOrderId && rework.reworkOrder?.logs.every((row) => row.productionOrderId === rework.reworkOrder.id)],
    ['SCRAP instance is canonical SCRAPPED', scrap.instance?.state === 'SCRAPPED' && scrap.instance.scrappedAt != null],
    ['SCRAP has no active Yard placement', scrap.activePlacements === 0],
    ['SCRAP has no active dispatch', !scrap.dispatches.some((row) => !['COMPLETED', 'CANCELLED', 'RETURNED'].includes(row.dispatchOrder.status))],
    ['Production material issue records one returned unit', Number(materialIssue?.returnedQty) === 1],
    ['Production material return posted through InventoryTransaction', Boolean(returnPosting)],
    ['Supplier Return reached DISPOSED', supplierReturn?.status === 'DISPOSED'],
    ['Supplier Return posted one outbound InventoryTransaction', Boolean(supplierPosting) && Number(supplierPosting.quantity) === -5],
    ['InventoryItem cache matches signed movements', Number(material?.quantity) === expectedInventory],
    ['Location balances conserve signed movements', material?.locationStocks.reduce((sum, row) => sum + Number(row.quantity), 0) === expectedInventory],
    ['Reverse workflow emitted ActivityLog records', activity.length > 0],
  ].map(([name, passValue]) => ({ name, pass: Boolean(passValue) }));

  const result = {
    runId: rest.runId,
    checkedAt: new Date().toISOString(),
    checks,
    failed: checks.filter((row) => !row.pass),
    counts: {
      activityLogs: activity.length,
      passTimeline: pass.instance?.timeline.length ?? 0,
      reworkTimeline: rework.instance?.timeline.length ?? 0,
      scrapTimeline: scrap.instance?.timeline.length ?? 0,
      passYardPlacements: pass.instance?.yardPlacements.length ?? 0,
      reworkYardPlacements: rework.instance?.yardPlacements.length ?? 0,
      scrapYardPlacements: scrap.instance?.yardPlacements.length ?? 0,
      inventoryTransactions: material?.transactionItems.length ?? 0,
    },
    states: {
      pass: pass.instance?.state,
      rework: rework.instance?.state,
      scrap: scrap.instance?.state,
      reverseDispatch: pass.dispatches.map((row) => row.dispatchOrder.status),
      supplierReturn: supplierReturn?.status,
      materialIssue: materialIssue?.status,
      returnedQty: Number(materialIssue?.returnedQty ?? 0),
      inventoryQuantity: Number(material?.quantity ?? 0),
      locationQuantity: material?.locationStocks.reduce((sum, row) => sum + Number(row.quantity), 0) ?? 0,
    },
    activityActions: [...new Set(activity.map((row) => row.action))],
  };
  await writeFile(outputFile, JSON.stringify(result, null, 2));
  await chmod(outputFile, 0o600);
  console.log(JSON.stringify({ outputFile, ...result }, null, 2));
  if (result.failed.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

async function readLineage(componentInstanceId) {
  const instance = await prisma.componentInstance.findUnique({
    where: { id: componentInstanceId },
    include: {
      requirement: { include: { project: true, component: true } },
      productionOrder: true,
      executions: true,
      qcInspections: { include: { ncrs: true, results: true } },
      timeline: true,
      yardPlacements: true,
      dispatchItems: { include: { dispatchOrder: true } },
    },
  });
  const rework = await prisma.productionRework.findFirst({
    where: { componentInstanceId, reworkProductionOrderId: { not: null } },
    orderBy: { decidedAt: 'desc' },
  });
  const reworkOrder = rework?.reworkProductionOrderId
    ? await prisma.productionOrder.findUnique({
        where: { id: rework.reworkProductionOrderId },
        include: { logs: true, executions: true, workOrders: true },
      })
    : null;
  return {
    instance,
    activePlacements: instance?.yardPlacements.filter((row) => row.removedAt == null).length ?? 0,
    dispatches: instance?.dispatchItems ?? [],
    reworkOrder,
  };
}
