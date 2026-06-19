-- Sprint 15B: Inventory transaction item valuation backfill.
--
-- Purpose:
--   Populate missing unitPrice / totalAmount on historical
--   inventory_transaction_items rows without changing schema.
--
-- Costing rule:
--   1. Build a weighted average cost per material from positive
--      transaction lines that already have unitPrice or totalAmount.
--   2. For every operational transaction item with missing valuation,
--      preserve existing unitPrice/totalAmount when present.
--   3. Fill missing unitPrice from weighted average cost.
--   4. Fill missing totalAmount as ABS(quantity) * unitPrice.
--   5. If no historical cost exists, write 0 instead of NULL so the
--      source row is complete and can be reviewed explicitly.

BEGIN;

WITH material_average_cost AS (
  SELECT
    i."inventoryItemId",
    SUM(
      COALESCE(
        ABS(i."totalAmount"),
        ABS(i.quantity) * ABS(i."unitPrice"),
        0
      )
    ) / NULLIF(SUM(ABS(i.quantity)), 0) AS "averageCost"
  FROM "inventory_transaction_items" i
  JOIN "inventory_transactions" t
    ON t.id = i."transactionId"
  WHERE i.quantity > 0
    AND t.type IN ('IMPORT', 'EXPORT', 'TRANSFER', 'RETURN', 'ADJUSTMENT')
    AND (
      i."unitPrice" IS NOT NULL
      OR i."totalAmount" IS NOT NULL
    )
    AND COALESCE(
      ABS(i."totalAmount"),
      ABS(i.quantity) * ABS(i."unitPrice"),
      0
    ) > 0
  GROUP BY i."inventoryItemId"
),
rows_to_fix AS (
  SELECT
    i.id,
    COALESCE(
      ABS(i."unitPrice"),
      CASE
        WHEN i."totalAmount" IS NOT NULL AND ABS(i.quantity) > 0
          THEN ABS(i."totalAmount") / ABS(i.quantity)
        ELSE NULL
      END,
      mac."averageCost",
      0
    ) AS "nextUnitPrice",
    COALESCE(
      ABS(i."totalAmount"),
      ABS(i.quantity) * COALESCE(ABS(i."unitPrice"), mac."averageCost", 0),
      0
    ) AS "nextTotalAmount"
  FROM "inventory_transaction_items" i
  JOIN "inventory_transactions" t
    ON t.id = i."transactionId"
  LEFT JOIN material_average_cost mac
    ON mac."inventoryItemId" = i."inventoryItemId"
  WHERE t.type IN ('IMPORT', 'EXPORT', 'TRANSFER', 'RETURN', 'ADJUSTMENT')
    AND (
      i."unitPrice" IS NULL
      OR i."totalAmount" IS NULL
    )
)
UPDATE "inventory_transaction_items" i
SET
  "unitPrice" = r."nextUnitPrice",
  "totalAmount" = r."nextTotalAmount"
FROM rows_to_fix r
WHERE i.id = r.id;

COMMIT;

-- Verification:
-- SELECT
--     t.type,
--     COUNT(*) total_rows,
--     COUNT(i."totalAmount") rows_with_amount
-- FROM inventory_transaction_items i
-- JOIN inventory_transactions t
--     ON t.id = i."transactionId"
-- GROUP BY t.type
-- ORDER BY t.type;
