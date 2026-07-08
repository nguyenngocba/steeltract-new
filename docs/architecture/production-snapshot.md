# Production Snapshot Strategy (Persisted Read Models)

Bản thiết kế này chi tiết hóa cách thức phân hệ Sản xuất (MES) áp dụng kiến trúc **Persisted Snapshot** nhằm loại bỏ hoàn toàn các truy vấn tính toán nặng khỏi cơ sở dữ liệu giao dịch chính, cải thiện hiệu năng tải trang từ giây xuống mili-giây.

---

## 1. Các Bảng Snapshot Đề Xuất (Database Schema)

Để lưu trữ các bản snapshot đã được tính toán sẵn, hệ thống sẽ bổ sung các bảng cơ sở dữ liệu sau (tương thích với định dạng snapshot của phân hệ Vật tư):

```prisma
// Snapshot tổng quan của toàn bộ nhà xưởng phục vụ dashboard
model ProductionDashboardSnapshot {
  id              String   @id @default(uuid())
  snapshotKey     String   @unique // Ví dụ: "production:dashboard:global"
  generatedAt     DateTime @default(now())
  sourceWatermark String?  // Mã watermark sự kiện cuối cùng được xử lý
  payload         Json     // Chứa thông tin OEE nhà máy, sản lượng theo ngày, số cảnh báo hoạt động
  stale           Boolean  @default(false)
  refreshReason   String?
  updatedAt       DateTime @updatedAt

  @@index([stale])
}

// Snapshot chi tiết cho từng Lệnh sản xuất phục vụ màn hình Kanban và chi tiết Drawer
model ProductionOrderSnapshot {
  id                String   @id @default(uuid())
  productionOrderId String   @unique
  generatedAt       DateTime @default(now())
  payload           Json     // Chứa tiến độ %, sơ đồ routing thực tế, trạng thái cấp phát vật tư
  stale             Boolean  @default(false)
  refreshReason     String?
  updatedAt       DateTime @updatedAt

  @@index([stale])
}

// Snapshot hiệu suất của từng tổ đội sản xuất (Work Center)
model WorkCenterSnapshot {
  id            String   @id @default(uuid())
  workCenterId  String   @unique
  generatedAt   DateTime @default(now())
  payload       Json     // Chứa hàng đợi công việc hiện tại, danh sách máy hỏng, công suất sử dụng trong ngày
  stale         Boolean  @default(false)
  updatedAt     DateTime @updatedAt

  @@index([stale])
}
```

---

## 2. Đặc Tả Dữ Liệu Lưu Trữ (JSON Payload Structure)

Dưới đây là cấu trúc payload lưu trong trường `payload` của các bảng Snapshot.

### 2.1. Payload của `ProductionOrderSnapshot`
```json
{
  "orderNo": "PO-260708-00001",
  "componentCode": "BEAM-H400-01",
  "componentName": "Dầm chính H400",
  "weightTons": 1.45,
  "projectCode": "PROJ-EAST-01",
  "projectName": "Nhà máy Đông Anh - Giai đoạn 1",
  "materialReadinessPercent": 100.0,
  "overallProgressPercent": 40.0,
  "currentStage": "WELDING",
  "routing": [
    { "stageCode": "CUTTING", "status": "COMPLETED", "worker": "Nguyen Van A", "completedAt": "2026-07-08T08:00:00Z" },
    { "stageCode": "ASSEMBLY", "status": "COMPLETED", "worker": "Tran Van B", "completedAt": "2026-07-08T10:30:00Z" },
    { "stageCode": "WELDING", "status": "IN_PROGRESS", "worker": "Le Van C", "startedAt": "2026-07-08T11:00:00Z" },
    { "stageCode": "PAINTING", "status": "PENDING" },
    { "stageCode": "QC", "status": "PENDING" }
  ],
  "materialSummary": {
    "totalRequired": 3,
    "totalIssued": 3,
    "totalReturned": 0,
    "totalConsumed": 2.1,
    "totalScrap": 0.1,
    "hasShortage": false
  },
  "costSummary": {
    "plannedMaterialCost": 24500000,
    "actualMaterialCost": 25100000,
    "variancePercent": 2.45
  }
}
```

### 2.2. Payload của `WorkCenterSnapshot`
```json
{
  "workCenterName": "Phân xưởng Cắt Thép Tấm",
  "capacityHoursToday": 24.0,
  "allocatedHoursToday": 18.5,
  "utilizationPercent": 77.08,
  "activeWorkersCount": 6,
  "activeMachinesCount": 3,
  "downtimeMachinesCount": 1,
  "queue": {
    "waitingOrdersCount": 4,
    "waitingTotalWeightTons": 8.7,
    "items": [
      { "orderNo": "PO-260708-00003", "priority": "HIGH", "plannedStart": "2026-07-08T13:00:00Z" },
      { "orderNo": "PO-260708-00004", "priority": "MEDIUM", "plannedStart": "2026-07-08T14:30:00Z" }
    ]
  }
}
```

---

## 3. Cơ Chế Làm Tươi & Tái Dựng (Refresh & Rebuild Triggers)

Việc cập nhật Snapshot được chia thành 2 chế độ: Cập nhật tăng trưởng (Incremental Update) theo sự kiện và Tái dựng toàn bộ (Full Rebuild) theo chu kỳ.

### 3.1. Incremental Update (Theo sự kiện thực tế)
Khi hệ thống nhận được các Outbox Event sản xuất, hệ thống sẽ đánh dấu snapshot tương ứng là `stale=true` và tạo một Job cập nhật nền chạy song song.

*   `production.material.issued` -> Đánh dấu hỏng snapshot Lệnh liên quan.
*   `production.stage.completed` -> Đánh dấu hỏng snapshot Lệnh và snapshot Work Center.
*   `production.downtime.logged` -> Đánh dấu hỏng snapshot Work Center ngay lập tức.

### 3.2. Scheduled Rebuild (Chạy tự động theo giờ/ngày)
Vào lúc **23:00 mỗi ngày**, một cron job hệ thống sẽ tự động quét toàn bộ các máy móc thiết bị và chạy tác vụ tính toán OEE cho ngày hôm đó, ghi nhận vào bảng `MachineOee` và tạo Snapshot OEE mới cho ngày hôm sau.

---

## 4. Định Dạng Idempotency Key Cho Tác Vụ Nền

Tất cả các job cập nhật snapshot sản xuất đều phải tuân thủ nghiêm ngặt quy tắc đặt tên khóa chống trùng lặp của Background Engine:

```text
Job: snapshot.production.update
Queue: snapshots
IdempotencyKey: snapshot:production:update:<type>:<scopeId>:<watermark>
```

**Ví dụ thực tế**:
*   Job cập nhật lệnh PO số 15: `snapshot:production:update:order:PO-15:20260708151500`
*   Job cập nhật tổ hàn số 2: `snapshot:production:update:workcenter:WC-WELD-02:20260708151500`
*   Job cập nhật OEE máy CNC 1: `snapshot:production:update:oee:MCH-CNC-01:20260708`

Nếu có 10 sự kiện hoàn thành công đoạn cắt thép tấm xảy ra liên tục tại máy CNC 1 trong vòng 1 phút, Background Engine sẽ gộp chúng lại dựa trên Idempotency Key để chỉ chạy tính toán tái dựng snapshot đúng 1 lần duy nhất, tránh gây quá tải CPU của máy chủ cơ sở dữ liệu.
