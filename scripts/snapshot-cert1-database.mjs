import { chmod, writeFile } from 'node:fs/promises';
import prismaPackage from '../apps/backend-api/node_modules/@prisma/client/default.js';

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const outputFile = process.env.RUNTIME_DATABASE_EVIDENCE_FILE ?? '/tmp/system-snapshot1-database-evidence.json';

try {
  const [
    dashboardSnapshots,
    inventoryBalances,
    dashboardMonthly,
    inventoryMonthly,
    snapshotJobs,
    metadata,
    inventoryOperational,
    productionOperational,
    qcOperational,
    projectOperational,
    yardOperational,
    dispatchOperational,
    projectionDocuments,
    projectionCheckpoints,
    projectionFailures,
    projectionReceipts,
    outbox,
  ] = await Promise.all([
    prisma.dashboardSnapshot.findMany({
      orderBy: [{ module: 'asc' }, { snapshotDate: 'desc' }],
      select: {
        module: true,
        snapshotDate: true,
        authoritative: true,
        stale: true,
        generatedAt: true,
        sourceWatermark: true,
        rowCount: true,
        kpis: true,
      },
    }),
    prisma.inventoryBalanceSnapshot.count(),
    prisma.dashboardMonthlyRollup.count(),
    prisma.inventoryMonthlyRollup.count(),
    prisma.snapshotJob.groupBy({ by: ['module', 'status'], _count: { _all: true } }),
    prisma.snapshotMetadata.findMany({ orderBy: [{ module: 'asc' }, { snapshotType: 'asc' }] }),
    prisma.inventoryDashboardSnapshot.findFirst({ where: { scopeKey: 'ALL' }, orderBy: { updatedAt: 'desc' } }),
    prisma.productionDashboardSnapshot.findFirst({ where: { scopeKey: 'ALL' }, orderBy: { updatedAt: 'desc' } }),
    prisma.qcDashboardSnapshot.findFirst({ where: { scopeKey: 'ALL' }, orderBy: { updatedAt: 'desc' } }),
    prisma.projectDashboardSnapshot.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.yardDashboardSnapshot.findFirst({ where: { scopeKey: 'ALL' }, orderBy: { updatedAt: 'desc' } }),
    prisma.dispatchDashboardSnapshot.aggregate({ _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.enterpriseProjectionDocument.groupBy({ by: ['projectionName'], _count: { _all: true } }),
    prisma.enterpriseProjectionCheckpoint.findMany({ orderBy: { projectionName: 'asc' } }),
    prisma.enterpriseProjectionFailure.groupBy({ by: ['projectionName', 'status'], _count: { _all: true } }),
    prisma.enterpriseProjectionReceipt.groupBy({ by: ['projectionName'], _count: { _all: true } }),
    prisma.outboxEvent.aggregate({ _count: { _all: true }, _max: { createdAt: true } }),
  ]);

  const duplicateSnapshots = await prisma.$queryRawUnsafe(`
    SELECT module::text, scope_key, snapshot_date, COUNT(*)::int AS count
    FROM dashboard_snapshots
    GROUP BY module, scope_key, snapshot_date
    HAVING COUNT(*) > 1
  `);
  const orphanProjectionNames = projectionDocuments
    .map((row) => row.projectionName)
    .filter((name) => !projectionCheckpoints.some((checkpoint) => checkpoint.projectionName === name));
  const failedJobs = snapshotJobs
    .filter((row) => row.status === 'FAILED')
    .reduce((sum, row) => sum + row._count._all, 0);
  const activeProjectionFailures = projectionFailures
    .filter((row) => row.status !== 'RESOLVED')
    .reduce((sum, row) => sum + row._count._all, 0);
  const modules = [...new Set(dashboardSnapshots.map((row) => row.module))];

  const checks = [
    { name: 'ERP authoritative snapshot exists', pass: dashboardSnapshots.some((row) => row.module === 'ERP' && row.authoritative && !row.stale) },
    { name: 'All required module snapshots exist', pass: ['INVENTORY', 'PRODUCTION', 'QC', 'PROJECTS', 'YARD', 'LOGISTICS'].every((module) => modules.includes(module)), details: { modules } },
    { name: 'Inventory balance snapshots exist', pass: inventoryBalances > 0, details: { inventoryBalances } },
    { name: 'Dashboard monthly rollups exist', pass: dashboardMonthly > 0, details: { dashboardMonthly } },
    { name: 'Inventory monthly rollups exist', pass: inventoryMonthly > 0, details: { inventoryMonthly } },
    { name: 'No duplicate dashboard snapshot identities', pass: duplicateSnapshots.length === 0, details: { duplicateSnapshots } },
    { name: 'No failed snapshot jobs', pass: failedJobs === 0, details: { failedJobs } },
    { name: 'No active projection failures', pass: activeProjectionFailures === 0, details: { activeProjectionFailures } },
    { name: 'No projection documents without checkpoints', pass: orphanProjectionNames.length === 0, details: { orphanProjectionNames } },
  ];

  const result = JSON.parse(JSON.stringify({
    checkedAt: new Date().toISOString(),
    summary: {
      status: checks.every((row) => row.pass) ? 'GO' : 'NO-GO',
      passed: checks.filter((row) => row.pass).length,
      failed: checks.filter((row) => !row.pass).length,
    },
    checks,
    historical: {
      dashboardSnapshots,
      inventoryBalances,
      dashboardMonthly,
      inventoryMonthly,
      jobs: snapshotJobs,
      metadata,
    },
    operational: {
      inventory: inventoryOperational,
      production: productionOperational,
      qc: qcOperational,
      projects: projectOperational,
      yard: yardOperational,
      dispatch: dispatchOperational,
    },
    projection: {
      documents: projectionDocuments,
      checkpoints: projectionCheckpoints,
      failures: projectionFailures,
      receipts: projectionReceipts,
      outbox,
    },
  }, (_key, value) => typeof value === 'bigint' ? value.toString() : value));

  await writeFile(outputFile, JSON.stringify(result, null, 2));
  await chmod(outputFile, 0o600);
  console.log(JSON.stringify({ outputFile, ...result.summary, checks }, null, 2));
} finally {
  await prisma.$disconnect();
}
