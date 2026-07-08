# Production Domain Models & Repositories

Tài liệu này chi tiết hóa các thực thể (Entities), mối quan hệ (Relationships), các quy tắc ràng buộc dữ liệu (Validations) và thiết kế Repository cho phân hệ Sản xuất (MES).

---

## 1. Domain Entities & Database Schema Design

Dưới đây là đặc tả các Model trong cơ sở dữ liệu (tương thích với Prisma schema). Các thực thể mới được thiết kế bổ sung cho các thực thể hiện có.

```text
+------------------+         +------------------+         +------------------+
|    WorkOrder     |         | ProductionOrder  |         |   ProductionLog  |
| (Lệnh SX Tổng)   |1       *| (Lệnh Cấu Kiện)  |1       *| (Nhật ký SX)     |
+------------------+-------->+------------------+-------->+------------------+
                                      |1
                                      |
                                      |*
                             +------------------+
                             | ProductionStage  |
                             | (Runtime Stage)  |
                             +------------------+
                                      |1
                                      |
                                      |*
                             +------------------+
                             |  ProductionTask  |
                             | (Runtime Task)   |
                             +------------------+
```

### 1.1. WorkOrder (Lệnh Sản Xuất Tổng)
Quản lý các đợt phát lệnh sản xuất cấp trung (ví dụ: Batch kết cấu cho Tầng 1 Phân khu A).
*   `id`: String (UUID, Primary Key)
*   `workOrderNo`: String (Unique, định dạng `WO-YYMMDD-XXXXX`)
*   `productCode`: String (Mã nhóm sản phẩm hoặc cấu kiện chính)
*   `quantity`: Float (Số lượng cấu kiện tổng)
*   `plannedStart`: DateTime (Dự kiến bắt đầu)
*   `plannedEnd`: DateTime (Dự kiến kết thúc)
*   `status`: String (`PLANNED`, `RELEASED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
*   `projectId`: String (Mã dự án liên kết)
*   `createdAt`, `updatedAt`: DateTime

### 1.2. ProductionOrder (Lệnh Sản Xuất Cấu Kiện - Đã có trong Schema)
Mỗi cấu kiện (Component) đơn lẻ có một `ProductionOrder` tương ứng để theo dõi chi tiết BOM và lịch trình.
*   `id`: String (CUID, Primary Key)
*   `orderNo`: String (Unique, định dạng `PO-YYMMDD-XXXXX`)
*   `workOrderId`: String (FK liên kết với `WorkOrder`, nullable)
*   `bomId`: String (FK liên kết với `BOM`)
*   `componentId`: String (FK liên kết với `Component`, để gán định danh vật lý sau khi đúc/hoàn thành)
*   `projectId`: String (FK liên kết với `Project`)
*   `quantity`: Float (Thường là 1 cho cấu kiện đơn chiếc hoặc theo lô nhỏ)
*   `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
*   `status`: Enum (`DRAFT`, `RELEASED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`, `CANCELLED`)
*   `currentStageCode`: Enum (`CUTTING`, `ASSEMBLY`, `WELDING`, `PAINTING`, `QC`, `COMPLETED`)
*   `plannedStartAt`, `plannedEndAt`, `startedAt`, `completedAt`: DateTime

### 1.3. BOMRoutingStep & ProductionStage (Công đoạn & Routing thực tế)
*   `BOMRoutingStep` định nghĩa quy trình lý thuyết trong BOM (ví dụ: Step 10: Cắt bản mã).
*   `ProductionStage` (Đã có trong Schema) đại diện cho việc thực thi thực tế của công đoạn đó trên một lệnh sản xuất cụ thể.
    *   `id`: String (CUID, Primary Key)
    *   `productionOrderId`: String (FK liên kết `ProductionOrder`)
    *   `code`: Enum (`CUTTING`, `ASSEMBLY`, `WELDING`, `PAINTING`, `QC`, `STAGING_YARD`)
    *   `name`: String (Ví dụ: "Cắt Thô", "Gá Lắp", "Hàn Tự Động")
    *   `sequence`: Int (Thứ tự thực hiện, 1, 2, 3...)
    *   `status`: Enum (`PENDING`, `READY`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`)
    *   `workCenterId`: String (FK liên kết `WorkCenter`, nullable)
    *   `machineId`: String (FK liên kết `Machine`, nullable)
    *   `assignedWorkerId`: String (FK liên kết `Worker`, nullable)
    *   `actualHours`: Float (Số giờ chạy thực tế phục vụ tính OEE)
    *   `scrapWeight`: Float (Trọng lượng thép vụn tạo ra trong công đoạn này)

### 1.4. WorkCenter & Machine (Tổ đội & Máy móc - Đã có trong Schema)
*   `WorkCenter`: Các khu vực làm việc vật lý (Khu Cắt Plasma, Phân xưởng Gá, Buồng Sơn).
*   `Machine`: Các thiết bị cụ thể thuộc WorkCenter (Máy cắt CNC-01, Máy hàn cổng-02).
    *   `status`: Enum (`AVAILABLE`, `RUNNING`, `DOWN`, `MAINTENANCE`)
    *   `utilization`: Float (Hiệu suất sử dụng tạm tính)

### 1.5. Shift (Ca sản xuất)
Quản lý lịch làm việc để tính toán công suất thiết kế.
*   `id`: String (UUID)
*   `name`: String (Ví dụ: "Ca Sáng", "Ca Chiều", "Ca Đêm")
*   `startTime`: String (Định dạng "HH:mm", ví dụ: "06:00")
*   `endTime`: String (Định dạng "HH:mm", ví dụ: "14:00")
*   `workingDays`: String[] (Mảng các ngày trong tuần chạy ca này, ví dụ: `["MONDAY", "TUESDAY"]`)

### 1.6. ProductionCapacity (Công suất và Hàng đợi - Queue)
*   `Capacity`: Khai báo công suất tối đa của một WorkCenter hoặc Machine theo ngày/ca.
    *   `id`: String
    *   `workCenterId` / `machineId`: String
    *   `date`: DateTime
    *   `maxHours`: Float (Số giờ khả dụng tối đa)
    *   `allocatedHours`: Float (Số giờ đã được xếp lịch)
*   `ProductionQueue` (Hàng đợi tại trạm):
    *   Được cấu thành từ danh sách các `ProductionStage` có trạng thái `READY` tại một `workCenterId` cụ thể, được sắp xếp theo độ ưu tiên `priority` và ngày giao hàng yêu cầu `plannedStartAt`.

### 1.7. ComponentAssembly (Nhật ký Gá lắp Cấu kiện)
Khi lắp ráp các cấu kiện lớn từ các chi tiết/vật tư riêng biệt.
*   `id`: String
*   `productionOrderId`: String
*   `materialItemId`: String (Thép tấm, thép hình cụ thể được cắt ra và gá vào)
*   `assembledAt`: DateTime
*   `operatorId`: String (Công nhân thực hiện gá)

### 1.8. Rework & Scrap (Sửa chữa & Phế liệu)
*   `ProductionRework`:
    *   `id`: String
    *   `productionOrderId`: String
    *   `failedStageCode`: String (Công đoạn bị lỗi phát hiện bởi QC)
    *   `nonConformanceReportId`: String (FK liên kết với NCR của phân hệ QC)
    *   `reworkReason`: String
    *   `actionTaken`: String
    *   `costEstimated`: Float
    *   `status`: Enum (`PENDING`, `IN_PROGRESS`, `RESOLVED`)
*   `ProductionScrap`:
    *   `id`: String
    *   `productionOrderId`: String
    *   `materialId`: String (Vật tư bị hỏng)
    *   `weight`: Float (Khối lượng thép phế liệu thu hồi)
    *   `reasonCode`: String (Lỗi cắt sai, lỗi hàn thủng, vật tư nứt sẵn...)
    *   `reportedAt`: DateTime

### 1.9. MachineDowntime & OEE Metrics (Dừng máy & Hiệu suất thiết bị)
*   `MachineDowntime`:
    *   `id`: String
    *   `machineId`: String
    *   `downtimeCategory`: Enum (`PLANNED_MAINTENANCE`, `UNPLANNED_BREAKDOWN`, `MATERIAL_SHORTAGE`, `NO_OPERATOR`, `POWER_OUTAGE`)
    *   `startedAt`: DateTime
    *   `endedAt`: DateTime (Nullable khi đang diễn ra)
    *   `durationMinutes`: Float (Tính toán tự động)
    *   `reason`: String
*   `MachineOee`:
    *   `id`: String
    *   `machineId`: String
    *   `date`: DateTime
    *   `availability`: Float (Tỷ lệ sẵn sàng: thời gian chạy thực / thời gian kế hoạch)
    *   `performance`: Float (Tỷ lệ hiệu suất: sản lượng thực tế / công suất định mức)
    *   `quality`: Float (Tỷ lệ chất lượng: cấu kiện đạt QC / tổng cấu kiện sản xuất)
    *   `oee`: Float (Chỉ số OEE = availability * performance * quality)

---

## 2. Thiết Kế Repository (Repository Layer Boundary)

Tuân thủ nguyên tắc **Controller -> Service -> Repository -> Prisma**, toàn bộ các câu truy vấn phức tạp của phân hệ MES phải được bọc trong các Repository tương ứng. Không cho phép gọi trực tiếp `prismaClient` từ Services.

### 2.1. ProductionRepository (`apps/backend-api/src/production/repositories/production.repository.ts`)
```typescript
@Injectable()
export class ProductionRepository {
  constructor(private prisma: PrismaService) {}

  // Lấy chi tiết lệnh sản xuất cùng các thông tin gộp phục vụ render drawer nhanh
  async findOrderWithBomAndIssues(id: string): Promise<ProductionOrderWithDetails> {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        bom: { include: { items: { include: { material: true } } } },
        materialIssues: true,
        stages: { orderBy: { sequence: 'asc' } },
        logs: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
  }

  // Cập nhật trạng thái công đoạn kèm ghi nhận Log bất biến trong cùng Transaction
  async transitionStageStatus(
    stageId: string,
    fromStatus: ProductionStageStatus,
    toStatus: ProductionStageStatus,
    workerId?: string,
    machineId?: string,
    logMessage?: string
  ): Promise<ProductionStage> {
    return this.prisma.$transaction(async (tx) => {
      const stage = await tx.productionStage.update({
        where: { id: stageId },
        data: {
          status: toStatus,
          assignedWorkerId: workerId,
          machineId: machineId,
          startedAt: toStatus === 'IN_PROGRESS' ? new Date() : undefined,
          completedAt: toStatus === 'COMPLETED' ? new Date() : undefined
        }
      });

      await tx.productionLog.create({
        data: {
          productionOrderId: stage.productionOrderId,
          stageId: stage.id,
          type: 'STAGE_CHANGE',
          message: logMessage || `Stage ${stage.name} chuyển từ ${fromStatus} sang ${toStatus}`,
          workerId,
          machineId
        }
      });

      return stage;
    });
  }

  // Lấy danh sách cấu kiện gá lắp thực tế để tính toán tiến độ
  async getAssemblyProgress(orderId: string) {
    return this.prisma.componentAssembly.findMany({
      where: { productionOrderId: orderId },
      include: { materialItem: true }
    });
  }
}
```

### 2.2. WorkOrderRepository
```typescript
@Injectable()
export class WorkOrderRepository {
  constructor(private prisma: PrismaService) {}

  // Lấy chi tiết tiến độ sản xuất tổng hợp của WorkOrder gom nhóm từ các lệnh thành phần
  async getWorkOrderProgressSummary(workOrderId: string) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { workOrderId },
      select: {
        status: true,
        quantity: true,
        stages: {
          select: { status: true }
        }
      }
    });
    // Thuật toán gộp tiến độ theo trọng số hoặc số lượng cấu kiện đạt QC
    // ...
  }
}
```

---

## 3. Các Ràng Buộc Nghiệp Vụ Quan Trọng (Validation Gates)

1.  **Gater Khởi Chạy Lệnh (`Order Start Gate`)**:
    *   Chỉ được phép nhấn `Bắt đầu` Lệnh sản xuất khi Material Readiness (Tỷ lệ chuẩn bị vật tư) tại Kho SX đạt tối thiểu **100%** (cho phép ghi đè cấu hình cảnh báo đối với vật tư phụ nếu được Admin duyệt).
    *   Tự động khóa (Block) công đoạn tiếp theo nếu công đoạn trước chưa có trạng thái `COMPLETED` (luồng tuần tự bắt buộc trong gia công thép).
2.  **Gater Bàn Giao Thành Phẩm (`Staging to Yard Gate`)**:
    *   Cấu kiện chỉ được chuyển sang trạng thái `READY` để xếp bãi (Yard Staging) khi công đoạn cuối cùng (`QC`) có trạng thái chất lượng là `PASSED` hoặc được ký duyệt NCR bởi giám sát QC.
3.  **Hao Hụt Vật Tư Quy Đổi (`Scrap Validation`)**:
    *   Khối lượng phế liệu (`ScrapWeight`) của một công đoạn cắt tấm thép không được vượt quá **wastePercent** định mức khai báo trong BOMItem. Nếu vượt quá, hệ thống sẽ tự động gửi cảnh báo bất thường (Anomaly Alert) lên Operations Center.
