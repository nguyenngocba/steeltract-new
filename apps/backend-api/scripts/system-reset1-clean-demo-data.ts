import { access, stat } from 'node:fs/promises';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRESERVED_TABLES = [
  '_prisma_migrations',
  'inventory_categories',
  'master_material_statuses',
  'master_material_usage_types',
  'master_priorities',
  'master_project_categories',
  'master_qc_statuses',
  'master_supplier_categories',
  'master_transaction_types',
  'master_units',
  'master_workflow_statuses',
  'material_types',
  'permissions',
  'role_permissions',
  'roles',
  'user_roles',
  'users',
  'workflow_definitions',
  'workflow_steps',
] as const;

// Explicit allowlist: a newly introduced table is never deleted implicitly.
const BUSINESS_TABLES = [
  'BOM',
  'BOMItem',
  'BOMRoutingStep',
  'ComponentCosting',
  'ProductionCompletion',
  'ProductionMaterialConsumption',
  'ProductionMaterialIssue',
  'ProductionMaterialLedger',
  'ProductionMaterialReservation',
  'ProductionMaterialReservationLine',
  'ProductionRework',
  'ProductionScrap',
  'PurchaseReceiving',
  'Supplier',
  'WorkOrder',
  'activity_logs',
  'analytics_aggregations',
  'analytics_alerts',
  'analytics_metrics',
  'analytics_predictions',
  'analytics_snapshots',
  'approvals',
  'attachment_links',
  'attachment_versions',
  'attachments',
  'attendance',
  'background_jobs',
  'component_bom_definitions',
  'component_dashboard_snapshots',
  'component_instance_executions',
  'component_instance_timelines',
  'component_instances',
  'component_release_evidence',
  'component_revisions',
  'component_summary_snapshots',
  'component_timelines',
  'components',
  'cranes',
  'dashboard_monthly_rollups',
  'dashboard_snapshots',
  'dispatch_dashboard_snapshots',
  'dispatch_events',
  'dispatch_items',
  'dispatch_orders',
  'enterprise_projection_checkpoints',
  'enterprise_projection_documents',
  'enterprise_projection_failures',
  'enterprise_projection_receipts',
  'equipment_bookings',
  'inventory_balance_snapshots',
  'inventory_dashboard_snapshots',
  'inventory_items',
  'inventory_location_snapshots',
  'inventory_location_stocks',
  'inventory_location_stocks_backup',
  'inventory_material_snapshots',
  'inventory_monthly_rollups',
  'inventory_transaction_items',
  'inventory_transactions',
  'job_executions',
  'machines',
  'material_request_items',
  'material_requests',
  'non_conformance_reports',
  'notifications',
  'outbox_events',
  'production_dashboard_snapshots',
  'production_executions',
  'production_logs',
  'production_order_snapshots',
  'production_orders',
  'production_schedules',
  'production_stages',
  'production_tasks',
  'project_component_requirements',
  'project_dashboard_snapshots',
  'project_detail_snapshots',
  'project_task_component_allocations',
  'project_task_costs',
  'project_task_dependencies',
  'project_task_inspections',
  'project_task_material_allocations',
  'project_task_resources',
  'project_tasks',
  'project_templates',
  'projects',
  'purchase_order_items',
  'purchase_orders',
  'qc_attachments',
  'qc_checklist_items',
  'qc_checklists',
  'qc_dashboard_snapshots',
  'qc_inspection_snapshots',
  'qc_inspections',
  'qc_issues',
  'qc_results',
  'refresh_tokens',
  'return_request_items',
  'return_requests',
  'safety_inspections',
  'site_logs',
  'snapshot_job_logs',
  'snapshot_jobs',
  'snapshot_rebuild_requests',
  'supplier_scores',
  'tasks',
  'vehicles',
  'work_center_snapshots',
  'work_centers',
  'workers',
  'workflow_actions',
  'workflow_instances',
  'yard_dashboard_snapshots',
  'yard_item_placements',
  'yard_movements',
  'yard_rows',
  'yard_slots',
  'yard_snapshots',
  'yard_workspace_snapshots',
  'yard_zones',
] as const;

type CountRow = { table_name: string; row_count: bigint };
type ForeignKeyRow = {
  constraint_name: string;
  child_table: string;
  parent_table: string;
  nullable_columns: string[];
};

const quoteIdentifier = (identifier: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

async function getCounts(
  client: Prisma.TransactionClient | PrismaClient,
  tables: readonly string[],
) {
  const counts = new Map<string, number>();
  for (const table of tables) {
    const rows = await client.$queryRawUnsafe<CountRow[]>(
      `SELECT $1::text AS table_name, COUNT(*)::bigint AS row_count FROM ${quoteIdentifier(table)}`,
      table,
    );
    counts.set(table, Number(rows[0]?.row_count ?? 0));
  }
  return counts;
}

async function getForeignKeys(client: Prisma.TransactionClient | PrismaClient) {
  return client.$queryRaw<ForeignKeyRow[]>`
    SELECT
      constraint_record.conname AS constraint_name,
      child.relname AS child_table,
      parent.relname AS parent_table,
      COALESCE(
        ARRAY_AGG(attribute.attname ORDER BY key_column.ordinality)
          FILTER (WHERE NOT attribute.attnotnull),
        ARRAY[]::text[]
      ) AS nullable_columns
    FROM pg_constraint constraint_record
    JOIN pg_class child ON child.oid = constraint_record.conrelid
    JOIN pg_class parent ON parent.oid = constraint_record.confrelid
    JOIN pg_namespace namespace ON namespace.oid = child.relnamespace
    JOIN LATERAL unnest(constraint_record.conkey)
      WITH ORDINALITY AS key_column(attnum, ordinality) ON TRUE
    JOIN pg_attribute attribute
      ON attribute.attrelid = child.oid
      AND attribute.attnum = key_column.attnum
    WHERE constraint_record.contype = 'f'
      AND namespace.nspname = 'public'
    GROUP BY constraint_record.conname, child.relname, parent.relname
    ORDER BY child.relname, parent.relname, constraint_record.conname
  `;
}

function createDeleteOrder(foreignKeys: ForeignKeyRow[]) {
  const target = new Set<string>(BUSINESS_TABLES);
  const adjacency = new Map<string, Set<string>>();
  const indegree = new Map(BUSINESS_TABLES.map((table) => [table, 0]));

  for (const table of BUSINESS_TABLES) adjacency.set(table, new Set());

  for (const foreignKey of foreignKeys) {
    if (
      foreignKey.child_table === foreignKey.parent_table ||
      foreignKey.nullable_columns.length > 0 ||
      !target.has(foreignKey.child_table) ||
      !target.has(foreignKey.parent_table)
    ) {
      continue;
    }

    const parents = adjacency.get(foreignKey.child_table)!;
    if (!parents.has(foreignKey.parent_table)) {
      parents.add(foreignKey.parent_table);
      indegree.set(
        foreignKey.parent_table,
        (indegree.get(foreignKey.parent_table) ?? 0) + 1,
      );
    }
  }

  const queue = [...BUSINESS_TABLES]
    .filter((table) => indegree.get(table) === 0)
    .sort();
  const order: string[] = [];

  while (queue.length > 0) {
    const table = queue.shift()!;
    order.push(table);
    for (const parent of adjacency.get(table) ?? []) {
      const next = (indegree.get(parent) ?? 0) - 1;
      indegree.set(parent, next);
      if (next === 0) {
        queue.push(parent);
        queue.sort();
      }
    }
  }

  if (order.length !== BUSINESS_TABLES.length) {
    const cycle = BUSINESS_TABLES.filter((table) => !order.includes(table));
    throw new Error(`Required foreign-key cycle remains: ${cycle.join(', ')}`);
  }
  return order;
}

function toObject(counts: Map<string, number>) {
  return Object.fromEntries(
    [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
}

async function main() {
  const execute = process.argv.includes('--execute');
  const backupArgument = process.argv.find((argument) =>
    argument.startsWith('--backup='),
  );
  const backupPath = backupArgument?.slice('--backup='.length);

  const databaseTables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const databaseTableSet = new Set(
    databaseTables.map(({ tablename }) => tablename),
  );
  const missingTables = [...BUSINESS_TABLES, ...PRESERVED_TABLES].filter(
    (table) => !databaseTableSet.has(table),
  );
  if (missingTables.length > 0) {
    throw new Error(
      `Schema mismatch; expected tables missing: ${missingTables.join(', ')}`,
    );
  }

  const foreignKeys = await getForeignKeys(prisma);
  const externalReferences = foreignKeys.filter(
    ({ child_table, parent_table }) =>
      !BUSINESS_TABLES.includes(
        child_table as (typeof BUSINESS_TABLES)[number],
      ) &&
      BUSINESS_TABLES.includes(
        parent_table as (typeof BUSINESS_TABLES)[number],
      ),
  );
  const unexpectedExternalReferences = externalReferences.filter(
    ({ child_table, parent_table }) =>
      !(
        child_table === 'snapshot_metadata' && parent_table === 'snapshot_jobs'
      ),
  );
  if (unexpectedExternalReferences.length > 0) {
    throw new Error(
      `Preserved tables reference cleanup targets: ${JSON.stringify(unexpectedExternalReferences)}`,
    );
  }

  const beforeBusiness = await getCounts(prisma, BUSINESS_TABLES);
  const beforePreserved = await getCounts(prisma, PRESERVED_TABLES);
  const populatedBusiness = [...beforeBusiness.entries()].filter(
    ([, count]) => count > 0,
  );

  if (!execute) {
    console.log(
      JSON.stringify(
        {
          mode: 'DRY_RUN',
          populatedBusinessTables: Object.fromEntries(populatedBusiness),
          preservedTables: toObject(beforePreserved),
          rowsScheduledForDelete: populatedBusiness.reduce(
            (sum, [, count]) => sum + count,
            0,
          ),
          externalReferences,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!backupPath) {
    throw new Error(
      '--backup=<verified pg_dump path> is required for --execute',
    );
  }
  await access(backupPath);
  const backup = await stat(backupPath);
  if (!backup.isFile() || backup.size === 0) {
    throw new Error(`Backup is not a non-empty file: ${backupPath}`);
  }

  const deleted = await prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRawUnsafe(`SET LOCAL lock_timeout = '15s'`);
      await transaction.$executeRawUnsafe(
        `SET LOCAL statement_timeout = '10min'`,
      );

      const lockTables = [...BUSINESS_TABLES, 'snapshot_metadata']
        .sort()
        .map(quoteIdentifier)
        .join(', ');
      await transaction.$executeRawUnsafe(
        `LOCK TABLE ${lockTables} IN ACCESS EXCLUSIVE MODE`,
      );

      // SnapshotMetadata is configuration and is preserved, while its runtime
      // pointer/watermark must not reference the business history being removed.
      await transaction.$executeRawUnsafe(`
        UPDATE "snapshot_metadata"
        SET
          "last_successful_snapshot_date" = NULL,
          "last_successful_job_id" = NULL,
          "last_source_watermark" = NULL,
          "stale_from_date" = NULL,
          "readiness_status" = 'READY',
          "updated_at" = NOW()
      `);

      const transactionForeignKeys = await getForeignKeys(transaction);
      for (const foreignKey of transactionForeignKeys) {
        if (
          foreignKey.child_table === foreignKey.parent_table ||
          foreignKey.nullable_columns.length === 0 ||
          !BUSINESS_TABLES.includes(
            foreignKey.child_table as (typeof BUSINESS_TABLES)[number],
          ) ||
          !BUSINESS_TABLES.includes(
            foreignKey.parent_table as (typeof BUSINESS_TABLES)[number],
          )
        ) {
          continue;
        }
        const nullableColumn = foreignKey.nullable_columns[0];
        await transaction.$executeRawUnsafe(
          `UPDATE ${quoteIdentifier(foreignKey.child_table)} SET ${quoteIdentifier(nullableColumn)} = NULL WHERE ${quoteIdentifier(nullableColumn)} IS NOT NULL`,
        );
      }

      const deleteOrder = createDeleteOrder(transactionForeignKeys);
      const deletedRows = new Map<string, number>();
      for (const table of deleteOrder) {
        const count = await transaction.$executeRawUnsafe(
          `DELETE FROM ${quoteIdentifier(table)}`,
        );
        deletedRows.set(table, count);
      }

      const afterBusiness = await getCounts(transaction, BUSINESS_TABLES);
      const nonZero = [...afterBusiness.entries()].filter(
        ([, count]) => count !== 0,
      );
      if (nonZero.length > 0) {
        throw new Error(`Postcondition failed: ${JSON.stringify(nonZero)}`);
      }

      const afterPreserved = await getCounts(transaction, PRESERVED_TABLES);
      const changedPreserved = [...beforePreserved.entries()].filter(
        ([table, count]) => afterPreserved.get(table) !== count,
      );
      if (changedPreserved.length > 0) {
        throw new Error(
          `Preserved row counts changed: ${JSON.stringify(changedPreserved)}`,
        );
      }

      return deletedRows;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 30_000,
      timeout: 660_000,
    },
  );

  const afterPreserved = await getCounts(prisma, PRESERVED_TABLES);
  console.log(
    JSON.stringify(
      {
        mode: 'EXECUTED',
        backup: { path: backupPath, bytes: backup.size },
        deletedRows: toObject(deleted),
        totalDeleted: [...deleted.values()].reduce(
          (sum, count) => sum + count,
          0,
        ),
        businessPostcondition: 'ALL_ZERO',
        preservedTables: toObject(afterPreserved),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
