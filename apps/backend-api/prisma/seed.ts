import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  const hashedPassword = await bcrypt.hash('123', 10);
  await seedUnitsOfMeasure();
  await seedMasterDataDictionaries();

  const existingUser = await prisma.user.findUnique({
    where: {
      username: 'admin',
    },
  });

  if (existingUser) {
    const admin = await prisma.user.update({
      where: {
        username: 'admin',
      },

      data: {
        password: hashedPassword,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Admin updated');

    await seedAdminAccess(admin.id);

    return;
  }

  const admin = await prisma.user.create({
    data: {
      username: 'admin',

      email: 'admin@steeltrack.vn',

      password: hashedPassword,

      fullName: 'System Admin',

      status: 'ACTIVE',
    },
  });

  await seedAdminAccess(admin.id);

  console.log('✅ Admin created');
}

async function seedAdminAccess(userId: string) {
  const permissions = [
    'master-data.read',
    'master-data.write',
    'inventory.read',
    'inventory.write',
    'projects.read',
    'projects.write',
    'project.approve',
    'components.read',
    'components.write',
    'tasks.read',
    'tasks.write',
    'rbac.read',
    'rbac.write',
    'workflow.read',
    'workflow.write',
    'attachments.read',
    'attachments.write',
    'jobs.read',
    'jobs.write',
    'analytics.read',
    'analytics.write',
    'production.read',
    'production.write',
    'qc.read',
    'qc.write',
    'yard.read',
    'yard.write',
  ];

  const role = await prisma.role.upsert({
    where: {
      name: 'admin',
    },
    create: {
      name: 'admin',
      description: 'System administrator',
    },
    update: {
      description: 'System administrator',
    },
  });

  for (const name of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        name,
      },
      create: {
        name,
      },
      update: {},
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    create: {
      userId,
      roleId: role.id,
    },
    update: {},
  });
}

async function seedUnitsOfMeasure() {
  const units = [
    {
      code: 'KG',
      name: 'Kilogram',
      symbol: 'kg',
      category: 'weight',
      precision: 3,
    },
    {
      code: 'TON',
      name: 'Metric ton',
      symbol: 't',
      category: 'weight',
      precision: 3,
      baseCode: 'KG',
      conversionFactor: 1000,
    },
    {
      code: 'M',
      name: 'Meter',
      symbol: 'm',
      category: 'length',
      precision: 3,
    },
    {
      code: 'MM',
      name: 'Millimeter',
      symbol: 'mm',
      category: 'length',
      precision: 0,
      baseCode: 'M',
      conversionFactor: 0.001,
    },
    {
      code: 'PCS',
      name: 'Piece',
      symbol: 'pcs',
      category: 'quantity',
      precision: 0,
    },
    {
      code: 'BOX',
      name: 'Box',
      symbol: 'box',
      category: 'quantity',
      precision: 0,
      baseCode: 'PCS',
    },
    {
      code: 'PLATE',
      name: 'Plate',
      symbol: 'plate',
      category: 'quantity',
      precision: 0,
      baseCode: 'PCS',
      conversionFactor: 1,
    },
    {
      code: 'SET',
      name: 'Set',
      symbol: 'set',
      category: 'quantity',
      precision: 0,
      baseCode: 'PCS',
    },
    {
      code: 'BUNDLE',
      name: 'Bundle',
      symbol: 'bundle',
      category: 'quantity',
      precision: 0,
      baseCode: 'PCS',
    },
    {
      code: 'M2',
      name: 'Square meter',
      symbol: 'm2',
      category: 'area',
      precision: 3,
    },
    {
      code: 'M3',
      name: 'Cubic meter',
      symbol: 'm3',
      category: 'volume',
      precision: 3,
    },
  ];

  for (const unit of units) {
    await prisma.masterUnit.upsert({
      where: {
        code: unit.code,
      },
      create: {
        code: unit.code,
        name: unit.name,
        symbol: unit.symbol,
        category: unit.category,
        precision: unit.precision,
        active: true,
        conversionFactor: unit.conversionFactor,
        createdBy: 'system',
        updatedBy: 'system',
        baseUnit: unit.baseCode
          ? {
              connect: {
                code: unit.baseCode,
              },
            }
          : undefined,
      },
      update: {
        name: unit.name,
        symbol: unit.symbol,
        category: unit.category,
        precision: unit.precision,
        active: true,
        conversionFactor: unit.conversionFactor,
        updatedBy: 'system',
        baseUnit: unit.baseCode
          ? {
              connect: {
                code: unit.baseCode,
              },
            }
          : {
              disconnect: true,
            },
      },
    });
  }

  console.log('✅ Units of measure seeded');
}

async function seedMasterDataDictionaries() {
  const categories = [
    ['STEEL_BEAM', 'Steel Beam', '#38bdf8'],
    ['PLATE', 'Plate', '#22c55e'],
    ['PIPE', 'Pipe', '#06b6d4'],
    ['BOLT', 'Bolt', '#f59e0b'],
    ['PAINT', 'Paint', '#a855f7'],
    ['WELDING', 'Welding', '#ef4444'],
    ['CONSUMABLES', 'Consumables', '#84cc16'],
    ['EQUIPMENT', 'Equipment', '#64748b'],
    ['ELECTRICAL', 'Electrical', '#eab308'],
    ['MECHANICAL', 'Mechanical', '#14b8a6'],
  ];

  for (const [code, name, color] of categories) {
    await prisma.inventoryCategory.upsert({
      where: { code },
      create: {
        code,
        name,
        color,
        active: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      update: {
        name,
        color,
        active: true,
        updatedBy: 'system',
      },
    });
  }

  const materialTypes = [
    ['H_BEAM', 'H-Beam', 'STEEL_BEAM'],
    ['I_BEAM', 'I-Beam', 'STEEL_BEAM'],
    ['CHANNEL', 'Channel', 'STEEL_BEAM'],
    ['ANGLE', 'Angle', 'STEEL_BEAM'],
    ['PIPE', 'Pipe', 'PIPE'],
    ['PLATE', 'Plate', 'PLATE'],
    ['BOLT', 'Bolt', 'BOLT'],
    ['NUT', 'Nut', 'BOLT'],
    ['WASHER', 'Washer', 'BOLT'],
  ];

  for (const [code, name, categoryCode] of materialTypes) {
    const category = await prisma.inventoryCategory.findUnique({
      where: { code: categoryCode },
    });

    if (!category) continue;

    await prisma.materialType.upsert({
      where: { code },
      create: {
        code,
        name,
        categoryId: category.id,
        active: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      update: {
        name,
        categoryId: category.id,
        active: true,
        updatedBy: 'system',
      },
    });
  }

  await seedSimpleModel('masterTransactionType', [
    {
      code: 'PURCHASE_RECEIPT',
      name: 'Purchase Receipt',
      direction: 'inbound',
      affectsStock: true,
      requiresApproval: false,
    },
    {
      code: 'PRODUCTION_ISSUE',
      name: 'Production Issue',
      direction: 'outbound',
      affectsStock: true,
      requiresApproval: true,
    },
    {
      code: 'SITE_RETURN',
      name: 'Site Return',
      direction: 'inbound',
      affectsStock: true,
      requiresApproval: false,
    },
    {
      code: 'WAREHOUSE_TRANSFER',
      name: 'Warehouse Transfer',
      direction: 'internal',
      affectsStock: true,
      requiresApproval: false,
    },
    {
      code: 'ADJUSTMENT',
      name: 'Adjustment',
      direction: 'internal',
      affectsStock: true,
      requiresApproval: true,
    },
    {
      code: 'SCRAP',
      name: 'Scrap',
      direction: 'outbound',
      affectsStock: true,
      requiresApproval: true,
    },
    {
      code: 'QC_HOLD',
      name: 'QC Hold',
      direction: 'internal',
      affectsStock: false,
      requiresApproval: false,
    },
    {
      code: 'RETURN_TO_SUPPLIER',
      name: 'Return To Supplier',
      direction: 'outbound',
      affectsStock: true,
      requiresApproval: true,
    },
    {
      code: 'PROJECT_ALLOCATION',
      name: 'Project Allocation',
      direction: 'internal',
      affectsStock: false,
      requiresApproval: false,
    },
    {
      code: 'CYCLE_COUNT_ADJUSTMENT',
      name: 'Cycle Count Adjustment',
      direction: 'internal',
      affectsStock: true,
      requiresApproval: true,
    },
  ]);

  await seedSimpleModel('masterWarehouse', [
    ['MAIN_WAREHOUSE', 'Main Warehouse'],
    ['STEEL_WAREHOUSE', 'Steel Warehouse'],
    ['BOLT_WAREHOUSE', 'Bolt Warehouse'],
    ['PAINT_WAREHOUSE', 'Paint Warehouse'],
    ['PROJECT_WAREHOUSE', 'Project Warehouse'],
    ['OUTDOOR_YARD', 'Outdoor Yard'],
  ]);

  const mainWarehouse = await prisma.masterWarehouse.findUnique({
    where: { code: 'MAIN_WAREHOUSE' },
  });
  const outdoorYard = await prisma.masterWarehouse.findUnique({
    where: { code: 'OUTDOOR_YARD' },
  });
  const zones: Array<[string, string, string | undefined]> = [
    ['ZONE_A', 'Zone A', mainWarehouse?.id],
    ['ZONE_B', 'Zone B', mainWarehouse?.id],
    ['RACK_A_01', 'Rack A-01', mainWarehouse?.id],
    ['SLOT_B_02', 'Slot B-02', mainWarehouse?.id],
    ['HEAVY_BEAM_AREA', 'Heavy Beam Area', outdoorYard?.id],
    ['PLATE_AREA', 'Plate Area', outdoorYard?.id],
  ];

  for (const [code, name, warehouseId] of zones) {
    await prisma.warehouseZone.upsert({
      where: { code },
      create: {
        code,
        name,
        warehouseId,
        active: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      update: {
        name,
        warehouseId,
        active: true,
        updatedBy: 'system',
      },
    });
  }

  await seedSimpleModel('masterQcStatus', [
    ['PENDING', 'Pending', 10],
    ['PASSED', 'Passed', 20],
    ['REJECTED', 'Rejected', 30],
    ['HOLD', 'Hold', 40],
    ['REWORK', 'Rework', 50],
    ['SCRAP', 'Scrap', 60],
  ]);
  await seedSimpleModel('masterPriority', [
    ['LOW', 'Low', 10],
    ['NORMAL', 'Normal', 20],
    ['HIGH', 'High', 30],
    ['CRITICAL', 'Critical', 40],
  ]);
  await seedSimpleModel('masterMaterialStatus', [
    ['AVAILABLE', 'Available', 10],
    ['RESERVED', 'Reserved', 20],
    ['ALLOCATED', 'Allocated', 30],
    ['HOLD', 'Hold', 40],
    ['DAMAGED', 'Damaged', 50],
    ['SCRAP', 'Scrap', 60],
  ]);
  await seedSimpleModel('masterSupplierCategory', [
    ['STEEL_SUPPLIER', 'Steel Supplier'],
    ['LOGISTICS', 'Logistics'],
    ['PAINT_SUPPLIER', 'Paint Supplier'],
    ['OUTSOURCING', 'Outsourcing'],
    ['SERVICES', 'Services'],
  ]);
  await seedSimpleModel('masterProjectCategory', [
    ['FACTORY', 'Factory'],
    ['WAREHOUSE', 'Warehouse'],
    ['COMMERCIAL', 'Commercial'],
    ['INFRASTRUCTURE', 'Infrastructure'],
  ]);
  await seedSimpleModel('masterWorkflowStatus', [
    ['DRAFT', 'Draft', 10],
    ['PENDING_APPROVAL', 'Pending Approval', 20],
    ['APPROVED', 'Approved', 30],
    ['IN_PROGRESS', 'In Progress', 40],
    ['COMPLETED', 'Completed', 50],
    ['CANCELLED', 'Cancelled', 60],
  ]);

  console.log('✅ Master data dictionaries seeded');
}

async function seedSimpleModel(
  modelName: string,
  rows: Array<any[] | Record<string, unknown>>,
) {
  const model = (prisma as unknown as Record<string, any>)[modelName];

  for (const row of rows) {
    const data = Array.isArray(row)
      ? {
          code: row[0],
          name: row[1],
          sortOrder: typeof row[2] === 'number' ? row[2] : undefined,
        }
      : row;

    await model.upsert({
      where: {
        code: data.code,
      },
      create: {
        ...data,
        active: true,
        createdBy: 'system',
        updatedBy: 'system',
      },
      update: {
        ...data,
        active: true,
        updatedBy: 'system',
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
