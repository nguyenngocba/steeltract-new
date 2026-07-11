import { Prisma } from '@prisma/client';

export type InventoryPostingTransaction = Prisma.TransactionClient;

export type InventoryPostingLine = {
  inventoryItemId: string;
  quantity: number;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
};

export type InventoryMaterialPostingCommand = {
  referenceModule: string;
  referenceId: string;
  performedBy?: string;
  remarks?: string;
  lines: InventoryPostingLine[];
};
