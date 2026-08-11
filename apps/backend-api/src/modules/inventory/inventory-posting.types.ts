import { Prisma } from '@prisma/client';

export type InventoryPostingTransaction = Prisma.TransactionClient;

export type InventoryPostingLine = {
  inventoryItemId: string;
  quantity: number;
  unitId?: string | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
};

export type InventoryMaterialPostingCommand = {
  referenceModule: string;
  referenceId: string;
  performedBy?: string;
  supplierId?: string;
  idempotencyKey?: string;
  commandHash?: string;
  transactionDate?: Date;
  remarks?: string;
  lines: InventoryPostingLine[];
};
