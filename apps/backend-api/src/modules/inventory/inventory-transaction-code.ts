import { TransactionType } from '@prisma/client';

export function inventoryCodePrefix(type: TransactionType) {
  if (type === TransactionType.IMPORT) return 'NK';
  if (type === TransactionType.EXPORT) return 'XK';
  if (type === TransactionType.TRANSFER) return 'DC';
  if (type === TransactionType.ADJUSTMENT) return 'KK';
  return 'INV';
}
