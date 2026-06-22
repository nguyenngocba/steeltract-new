-- Report inventory transaction records whose code and transactionNo diverge.
-- This script is diagnostic only. It does not modify historical records.

SELECT COUNT(*) AS mismatched_inventory_transaction_count
FROM inventory_transactions
WHERE code IS DISTINCT FROM "transactionNo";

SELECT code, "transactionNo"
FROM inventory_transactions
WHERE code IS DISTINCT FROM "transactionNo"
ORDER BY "createdAt" DESC;
