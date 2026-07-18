export const enterpriseDataScalabilityPolicy = {
  hot: {
    inventoryTransactionsDays: 730,
    activityLogDays: 180,
    outboxDispatchedDays: 90,
    projectionReceiptsDays: 180,
    domainTimelineDays: 730,
  },
  warm: {
    format: 'parquet',
    immutable: true,
    encryptionRequired: true,
    checksumRequired: true,
    archiveRequiresProjectionWatermark: true,
    deleteRequiresVerifiedWarmCopy: true,
  },
  cold: {
    retentionYears: 10,
    legalHoldOverridesDeletion: true,
  },
  replay: {
    defaultBatchSize: 250,
    maximumBatchSize: 2000,
    defaultMaximumEventsPerRun: 100_000,
  },
  partitionReview: {
    minimumRows: 50_000_000,
    candidateTables: [
      'inventory_transactions',
      'inventory_transaction_items',
      'activity_logs',
      'outbox_events',
      'enterprise_projection_receipts',
      'dispatch_events',
      'ProductionMaterialLedger',
    ],
    strategy: 'monthly-range-created-at',
  },
} as const;
