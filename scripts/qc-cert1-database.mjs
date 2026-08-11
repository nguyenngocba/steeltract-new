import { chmod, readFile, writeFile } from 'node:fs/promises';
import prismaPackage from '../apps/backend-api/node_modules/@prisma/client/default.js';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-qc-cert1-runtime-evidence.json';
const outputFile = process.env.RUNTIME_DATABASE_EVIDENCE_FILE ?? '/tmp/system-qc-cert1-database-evidence.json';
const rest = JSON.parse(await readFile(evidenceFile, 'utf8'));
const ids = rest.summary.ids;
const instanceIds = Object.values(ids.instanceIds).filter(Boolean);
const inspectionIds = Object.values(ids.inspectionIds).filter(Boolean);
const ncrIds = Object.values(ids.ncrIds).filter(Boolean);

try {
  const [material, instances, inspections, ncrs, rework, placements, dispatchItems, activities, outbox, projectionDocuments] = await Promise.all([
    prisma.inventoryItem.findUnique({
      where: { id: ids.materialId },
      include: { locationStocks: true, transactionItems: { include: { transaction: true } } },
    }),
    prisma.componentInstance.findMany({
      where: { id: { in: instanceIds } },
      include: { executions: true, qcInspections: true, ncrs: true, timeline: { orderBy: { occurredAt: 'asc' } }, yardPlacements: true, dispatchItems: true, productionReworks: true },
    }),
    prisma.qcInspection.findMany({ where: { id: { in: inspectionIds } }, include: { results: true, ncrs: true } }),
    prisma.nonConformanceReport.findMany({ where: { id: { in: ncrIds } }, orderBy: { createdAt: 'asc' } }),
    prisma.productionRework.findUnique({ where: { reworkRequestId: ids.reworkRequestId }, include: { reworkProductionOrder: true } }),
    prisma.yardItemPlacement.findMany({ where: { componentInstanceId: { in: instanceIds } } }),
    prisma.dispatchItem.findMany({ where: { componentInstanceId: { in: instanceIds } } }),
    prisma.activityLog.findMany({
      where: {
        OR: [
          { entityId: { in: [...instanceIds, ...inspectionIds, ...ncrIds, ids.productionOrderId, ids.reworkProductionOrderId].filter(Boolean) } },
          { metadata: { string_contains: rest.runId } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.outboxEvent.findMany({
      where: {
        createdAt: { gte: new Date(rest.startedAt) },
        eventName: { in: ['qc.inspection.completed', 'qc.ncr.created', 'qc.disposition.completed', 'production.rework.accepted', 'production.rework.completed'] },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.enterpriseProjectionDocument.findMany({
      where: {
        OR: [
          { projectionName: 'QcInspectionSummary', entityKey: { in: inspectionIds } },
          { projectionName: 'QcNcrSummary', entityKey: { in: ncrIds } },
        ],
      },
      orderBy: { updatedAt: 'asc' },
    }),
  ]);
  const [productionLogs, productionActivities] = await Promise.all([
    prisma.productionLog.findMany({
      where: {
        productionOrderId: ids.reworkProductionOrderId,
        message: { in: ['production.rework.accepted', 'production.rework.completed'] },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.activityLog.findMany({
      where: {
        entityId: rework?.id,
        action: { in: ['production.rework.accepted', 'production.rework.completed'] },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const byRole = Object.fromEntries(Object.entries(ids.instanceIds).map(([role, id]) => [role, instances.find((row) => row.id === id)]));
  const inspectionById = new Map(inspections.map((row) => [row.id, row]));
  const ncrById = new Map(ncrs.map((row) => [row.id, row]));
  const signedInventoryMovement = material?.transactionItems.reduce((sum, row) => sum + Number(row.quantity), 0) ?? 0;
  const activePlacements = placements.filter((row) => row.removedAt == null);
  const qcActivity = activities.filter((row) => row.module === 'qc');
  const duplicateActivityKeys = Object.entries(
    qcActivity.reduce((acc, row) => {
      const key = `${row.action}:${row.entity}:${row.entityId ?? ''}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).filter(([, count]) => count > 1);

  const checks = [
    ['Exactly five physical ComponentInstances exist', instances.length === 5],
    ['PASS instance is physically IN_YARD after eligibility and staging', byRole.pass?.state === 'IN_YARD'],
    ['FAIL instance remains QC_FAILED', byRole.fail?.state === 'QC_FAILED'],
    ['REWORK reused the same ComponentInstance and reached Yard after QC PASS', byRole.rework?.state === 'IN_YARD'],
    ['REWORK instance has original and rework executions', byRole.rework?.executions.length === 2],
    ['REWORK lineage contains exactly one ProductionRework linked to the same instance', byRole.rework?.productionReworks.length === 1 && byRole.rework.productionReworks[0].id === rework?.id],
    ['Production Rework is COMPLETED and its order is CLOSED', rework?.state === 'COMPLETED' && rework.reworkProductionOrder?.status === 'CLOSED'],
    ['ProductionLog rework rows use only the Rework ProductionOrder FK', productionLogs.length === 2 && productionLogs.every((row) => row.productionOrderId === ids.reworkProductionOrderId && row.productionOrderId !== rework?.id)],
    ['ProductionLog metadata retains the distinct ProductionRework aggregate identity', productionLogs.every((row) => row.metadata?.aggregateType === 'ProductionRework' && row.metadata?.aggregateId === rework?.id)],
    ['Production ActivityLog retains Rework entity identity and canonical ProductionOrder lineage', productionActivities.length === 2 && productionActivities.every((row) => row.entityId === rework?.id && row.metadata?.productionOrderId === ids.reworkProductionOrderId)],
    ['USE-AS-IS instance is physically IN_YARD after eligibility and staging', byRole.useAsIs?.state === 'IN_YARD'],
    ['SCRAP instance is SCRAPPED', byRole.scrap?.state === 'SCRAPPED' && byRole.scrap.scrappedAt != null],
    ['FAIL inspection has one OPEN NCR with PENDING disposition', ncrById.get(ids.ncrIds.fail)?.status === 'OPEN' && !ncrById.get(ids.ncrIds.fail)?.disposition],
    ['REWORK NCR records canonical disposition', ncrById.get(ids.ncrIds.rework)?.status === 'REWORK_REQUIRED' && ncrById.get(ids.ncrIds.rework)?.disposition === 'REWORK'],
    ['USE-AS-IS NCR records ACCEPT disposition', ncrById.get(ids.ncrIds.useAsIs)?.disposition === 'ACCEPT'],
    ['SCRAP NCR records scrap disposition', ncrById.get(ids.ncrIds.scrap)?.disposition === 'SCRAP_RECOMMENDATION'],
    ['Direct PASS inspection is an authoritative FINAL PASS result', inspectionById.get(ids.inspectionIds.pass)?.status === 'PASSED' && inspectionById.get(ids.inspectionIds.pass)?.results.some((row) => row.status === 'PASS')],
    ['REWORK second FINAL inspection is an authoritative PASS result', Boolean(ids.inspectionIds.reworkPass) && inspectionById.get(ids.inspectionIds.reworkPass)?.status === 'PASSED' && inspectionById.get(ids.inspectionIds.reworkPass)?.results.some((row) => row.status === 'PASS')],
    ['FAIL inspections retain authoritative FINAL FAIL results', [ids.inspectionIds.fail, ids.inspectionIds.reworkFail, ids.inspectionIds.useAsIs, ids.inspectionIds.scrap].every((id) => inspectionById.get(id)?.results.some((row) => row.status === 'FAIL'))],
    ['Only PASS, REWORK and USE-AS-IS scenarios have active Yard placements', activePlacements.length === 3 && activePlacements.every((row) => [ids.instanceIds.pass, ids.instanceIds.rework, ids.instanceIds.useAsIs].includes(row.componentInstanceId))],
    ['FAIL and SCRAP have no Yard placement', [ids.instanceIds.fail, ids.instanceIds.scrap].every((id) => !placements.some((row) => row.componentInstanceId === id))],
    ['No QC scenario was dispatched', dispatchItems.length === 0],
    ['Material inventory is conserved at 175 after one 25-unit consumption', Number(material?.quantity) === 175 && signedInventoryMovement === 175 && material?.locationStocks.reduce((sum, row) => sum + Number(row.quantity), 0) === 175],
    ['No duplicate InventoryTransactionItem identities exist', new Set(material?.transactionItems.map((row) => row.id)).size === material?.transactionItems.length],
    ['Canonical QC ActivityLog exists', qcActivity.length > 0],
    ['Canonical QC ActivityLog contains no duplicate action/entity rows', duplicateActivityKeys.length === 0],
    ['Canonical QC outbox facts exist', outbox.some((row) => row.eventName === 'qc.inspection.completed') && outbox.some((row) => row.eventName === 'qc.ncr.created') && outbox.some((row) => row.eventName === 'qc.disposition.completed')],
    ['Canonical QC projections contain every completed inspection and NCR', projectionDocuments.filter((row) => row.projectionName === 'QcInspectionSummary').length === inspectionIds.length && projectionDocuments.filter((row) => row.projectionName === 'QcNcrSummary').length === ncrIds.length],
    ['Canonical Production rework completion fact exists', outbox.some((row) => row.eventName === 'production.rework.completed')],
  ].map(([name, pass]) => ({ name, pass: Boolean(pass) }));

  const output = {
    runId: rest.runId,
    checkedAt: new Date().toISOString(),
    checks,
    failed: checks.filter((row) => !row.pass),
    states: Object.fromEntries(Object.entries(byRole).map(([role, row]) => [role, row?.state])),
    counts: {
      componentInstances: instances.length,
      inspections: inspections.length,
      ncrs: ncrs.length,
      activeYardPlacements: activePlacements.length,
      dispatchItems: dispatchItems.length,
      qcActivityLogs: qcActivity.length,
      outboxFacts: outbox.length,
      projectionDocuments: projectionDocuments.length,
      inventoryTransactionItems: material?.transactionItems.length ?? 0,
      productionReworkLogs: productionLogs.length,
      productionReworkActivities: productionActivities.length,
    },
    inventory: {
      denormalizedQuantity: Number(material?.quantity),
      locationStockQuantity: material?.locationStocks.reduce((sum, row) => sum + Number(row.quantity), 0),
      signedMovement: signedInventoryMovement,
    },
    inspections: inspections.map((row) => ({ id: row.id, status: row.status, results: row.results.map((result) => result.status), ncrIds: row.ncrs.map((ncr) => ncr.id) })),
    ncrs: ncrs.map((row) => ({ id: row.id, status: row.status, disposition: row.disposition, componentInstanceId: row.componentInstanceId })),
    activityActions: qcActivity.map((row) => ({ action: row.action, entity: row.entity, entityId: row.entityId })),
    productionLogs: productionLogs.map((row) => ({ productionOrderId: row.productionOrderId, message: row.message, metadata: row.metadata })),
    productionActivities: productionActivities.map((row) => ({ action: row.action, entity: row.entity, entityId: row.entityId, metadata: row.metadata })),
    duplicateActivityKeys,
    outboxEvents: outbox.map((row) => ({ eventName: row.eventName, payload: row.payload })),
    projections: projectionDocuments.map((row) => ({ projectionName: row.projectionName, entityKey: row.entityKey, sourceEventName: row.sourceEventName, updatedAt: row.updatedAt })),
    timelines: Object.fromEntries(Object.entries(byRole).map(([role, row]) => [role, row?.timeline.map((event) => event.eventType) ?? []])),
  };
  await writeFile(outputFile, JSON.stringify(output, null, 2));
  await chmod(outputFile, 0o600);
  console.log(JSON.stringify({ outputFile, ...output }, null, 2));
  if (output.failed.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
