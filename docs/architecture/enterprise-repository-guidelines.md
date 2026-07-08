# Enterprise Repository Guidelines (EPIC210)

Hướng dẫn tiêu chuẩn lập trình lớp Repository và luồng dữ liệu (Code Flow) trong SteelTrack. Chuỗi luồng dữ liệu bắt buộc đi qua:
```text
[Client] -> [Controller] -> [Service] -> [Repository] -> [Prisma ORM] -> [Database]
```

---

## 1. Vai trò của từng Tầng (Layer Responsibilities)

### 1.1. Lớp Controller
*   **Nhiệm vụ**: Tiếp nhận yêu cầu HTTP, kiểm tra quyền hạn (Guards/RBAC), xác thực dữ liệu đầu vào thông qua Zod hoặc Class-Validator DTOs, chuyển đổi định dạng và trả về HTTP response code thích hợp.
*   **Ràng buộc**: Không chứa logic nghiệp vụ, không gọi trực tiếp Prisma Service. Chỉ gọi lớp Service tương ứng.
*   **Ví dụ**: [JobsController](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/jobs.controller.ts)

### 1.2. Lớp Service
*   **Nhiệm vụ**: Chứa logic nghiệp vụ lõi (business rules), quản lý biên giao dịch (Transaction Boundaries), gọi các Repository để đọc ghi dữ liệu, và phát hành sự kiện qua Event Bus hoặc ghi nhận Outbox Event.
*   **Ràng buộc**: Luôn bọc các luồng nghiệp vụ thay đổi trạng thái trong giao dịch. Giao dịch chéo bảng bắt buộc sử dụng cơ chế transaction lan truyền (Transaction Propagation) thông qua đối tượng Client cơ sở dữ liệu dùng chung.

### 1.3. Lớp Repository
*   **Nhiệm vụ**: Đóng gói hoàn toàn các câu lệnh truy vấn dữ liệu Prisma. Đảm bảo tái sử dụng câu lệnh, tối ưu hóa các select, join và index.
*   **Ràng buộc**: Tuyệt đối không import logic nghiệp vụ. Cung cấp tham số `db` kiểu `PrismaService | Prisma.TransactionClient` để hỗ trợ chạy trong transaction của Service.
*   **Ví dụ**: [InventoryRepository](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.repository.ts)

---

## 2. Mã nguồn Mẫu chuẩn (Standard Code Pattern)

Dưới đây là thiết kế mẫu chuẩn cho nghiệp vụ tạo Lệnh sản xuất (Work Order) liên kết kho vật tư:

### 2.1. Lớp DTO / Validation
```typescript
// apps/backend-api/src/modules/production/dto/create-work-order.dto.ts
import { IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BomItemDto {
  @IsString()
  inventoryItemId: string;

  @IsNumber()
  @Min(0.001)
  requiredQuantity: number;
}

export class CreateWorkOrderDto {
  @IsString()
  workOrderNo: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  bomItems: BomItemDto[];
}
```

### 2.2. Lớp Repository
```typescript
// apps/backend-api/src/modules/production/repositories/production.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ProductionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async createWorkOrder(data: Prisma.WorkOrderCreateInput, db: DbClient = this.prisma) {
    return db.workOrder.create({
      data,
      include: {
        bomItems: true,
        statusMaster: true,
      },
    });
  }

  async findWorkOrderById(id: string, db: DbClient = this.prisma) {
    return db.workOrder.findUnique({
      where: { id },
      include: {
        bomItems: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }
}
```

### 2.3. Lớp Service (Quản lý Transaction và Outbox)
```typescript
// apps/backend-api/src/modules/production/services/production.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { OutboxService } from '../../../core/outbox/outbox.service';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class ProductionService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(ProductionRepository)
    private readonly productionRepo: ProductionRepository,
    @Inject(OutboxService)
    private readonly outboxService: OutboxService,
  ) {}

  async create(dto: CreateWorkOrderDto) {
    // Chạy ACID Transaction toàn bộ nghiệp vụ ghi
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Work Order thông qua repo, truyền instance tx vào
      const workOrder = await this.productionRepo.createWorkOrder({
        workOrderNo: dto.workOrderNo,
        quantity: dto.quantity,
        product: { connect: { id: dto.productId } },
        bomItems: {
          create: dto.bomItems.map(item => ({
            inventoryItemId: item.inventoryItemId,
            requiredQuantity: item.requiredQuantity,
          })),
        },
      }, tx);

      // 2. Ghi nhận sự kiện hệ thống vào Outbox cùng transaction
      await this.outboxService.createEvent({
        eventName: 'production.work-order.released',
        payload: {
          workOrderId: workOrder.id,
          workOrderNo: workOrder.workOrderNo,
          quantity: workOrder.quantity,
          bomItems: dto.bomItems,
        },
        metadata: {
          module: 'production',
          correlationId: `wo-creation-${workOrder.id}`,
        },
      }, tx);

      return workOrder;
    });
  }
}
```

---

## 3. Quy tắc tránh lỗi N+1 Query & Tối ưu hóa truy vấn

1.  **Selective Inclusion (Chỉ Include khi cần thiết)**: Tuyệt đối không lạm dụng `include: { _all: true }` hoặc kéo theo các bảng nhật ký lớn (như `ActivityLog`, `JobExecution`) trong các câu truy vấn danh sách lớn.
2.  **Sử dụng Query Profiling**: Luôn kiểm soát số lượng truy vấn DB sinh ra trong một HTTP Request thông qua `/performance/metrics`. Nếu phát hiện cảnh báo `queries.nPlusOneWarnings`, phải thay thế bằng phép truy vấn gộp hoặc sử dụng `Prisma.findMany` kèm điều kiện `in`.
3.  **Tránh Raw Queries**: Chỉ sử dụng `$queryRaw` cho các phép toán hình học không gian phức tạp của Yard R3F hoặc các báo cáo tài chính gộp cực kỳ đặc thù. Khi viết raw query, bắt buộc sử dụng biến truyền thông qua dấu ngoặc nhọn để tránh lỗi SQL Injection:
    ```typescript
    await this.prisma.$queryRaw`SELECT * FROM inventory_items WHERE code = ${itemCode}`;
    ```
