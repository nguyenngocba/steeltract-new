# Projects Snapshot Strategy (Persisted Read Models)

Bản thiết kế này chi tiết hóa cách thức phân hệ Quản lý Dự án (PMS) áp dụng kiến trúc **Persisted Snapshot** nhằm loại bỏ hoàn toàn các truy vấn tính toán cây phân cấp (Hierarchical Tree Queries) và phân bổ tài nguyên/chi phí phức tạp khỏi cơ sở dữ liệu giao dịch chính, mang lại tốc độ truy xuất tức thời cho người dùng.

---

## 1. Các Bảng Snapshot Đề Xuất (Database Schema)

Để lưu trữ các snapshot đã được tính toán sẵn cho dự án, hệ thống sẽ sử dụng bảng `ProjectDashboardSnapshot` (đã có trong schema) và bổ sung định nghĩa bảng `ProjectRuntimeSnapshot` dưới dạng persisted read-model:

```prisma
// Snapshot tổng hợp phục vụ dashboard và màn hình Command Center (Đã có trong Schema)
model ProjectDashboardSnapshot {
  id                 String   @id @default(cuid())
  projectId          String   @unique
  progress           Float    @default(0)       // Tiến độ % tổng thể của dự án
  delayedTaskCount   Int      @default(0)       // Số lượng task đang bị trễ hạn
  completedTaskCount Int      @default(0)       // Số lượng task đã hoàn thành
  activeTaskCount    Int      @default(0)       // Số lượng task đang chạy
  materialProgress   Float    @default(0)       // Tiến độ cấp phát vật tư %
  componentProgress  Float    @default(0)       // Tiến độ lắp dựng cấu kiện %
  logisticsProgress  Float    @default(0)       // Tiến độ vận chuyển cấu kiện %
  costProgress       Float    @default(0)       // Tỷ lệ tiêu hao ngân sách %
  healthScore        Float    @default(100)     // Điểm số sức khỏe dự án (0-100)
  updatedAt          DateTime @updatedAt
  createdAt          DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([updatedAt])
  @@map("project_dashboard_snapshots")
}

// Bảng Snapshot chi tiết thời gian thực lưu trữ toàn bộ cấu trúc WBS và định mức (Đề xuất kỹ thuật)
model ProjectRuntimeSnapshot {
  id              String   @id @default(cuid())
  projectId       String   @unique
  generatedAt     DateTime @default(now())
  sourceWatermark String?  // Mã watermark outbox event cuối cùng được xử lý để tránh xử lý đè
  payload         Json     // Chứa toàn bộ cây WBS, allocations, dependencies dạng JSON lồng ghép
  stale           Boolean  @default(false)   // Đánh dấu cần rebuild
  refreshReason   String?  // Lý do rebuild (ví dụ: task.updated)
  updatedAt       DateTime @updatedAt

  @@index([stale])
  @@map("project_runtime_snapshots")
}
```

---

## 2. Đặc Tả Dữ Liệu Lưu Trữ (JSON Payload Structure)

Dưới đây là cấu trúc payload JSON chi tiết được lưu trong trường `payload` của `ProjectRuntimeSnapshot` phục vụ hiển thị Gantt chart và cây WBS:

### 2.1. Payload của `ProjectRuntimeSnapshot`
```json
{
  "projectId": "proj-east-01",
  "projectCode": "PROJ-2026-001",
  "projectName": "Nhà máy Thép Đông Anh - Giai đoạn 1",
  "wbs": [
    {
      "taskId": "task-root-1",
      "parentTaskId": null,
      "name": "Hạng mục: Kết cấu móng & Neo bulong",
      "status": "IN_PROGRESS",
      "progress": 65.0,
      "plannedStart": "2026-07-01T07:00:00Z",
      "plannedFinish": "2026-07-15T17:00:00Z",
      "scheduledStart": "2026-07-01T07:00:00Z",
      "scheduledFinish": "2026-07-16T17:00:00Z",
      "cascadeDelayDays": 1,
      "sortOrder": 1,
      "children": [
        {
          "taskId": "task-child-1-1",
          "parentTaskId": "task-root-1",
          "name": "Lắp đặt bulong neo móng trục A-D",
          "status": "COMPLETED",
          "progress": 100.0,
          "plannedStart": "2026-07-01T07:00:00Z",
          "plannedFinish": "2026-07-05T17:00:00Z",
          "scheduledStart": "2026-07-01T07:00:00Z",
          "scheduledFinish": "2026-07-05T17:00:00Z",
          "cascadeDelayDays": 0,
          "sortOrder": 1,
          "dependencies": [],
          "materialAllocations": [
            {
              "inventoryItemId": "item-bolt-anchor-m36",
              "materialCode": "BOLT-M36-SS400",
              "plannedQty": 120.0,
              "issuedQty": 120.0,
              "usedQty": 120.0,
              "returnedQty": 0.0,
              "remainingQty": 0.0
            }
          ],
          "componentAllocations": [],
          "resources": [
            {
              "type": "WORKER_GROUP",
              "name": "Tổ lắp dựng số 1",
              "quantity": 5.0
            }
          ],
          "cost": {
            "budgetCost": 45000000.0,
            "actualCost": 44500000.0,
            "variance": -500000.0
          }
        },
        {
          "taskId": "task-child-1-2",
          "parentTaskId": "task-root-1",
          "name": "Cân chỉnh cao độ & Rót vữa cổ móng",
          "status": "IN_PROGRESS",
          "progress": 30.0,
          "plannedStart": "2026-07-06T07:00:00Z",
          "plannedFinish": "2026-07-15T17:00:00Z",
          "scheduledStart": "2026-07-07T07:00:00Z",
          "scheduledFinish": "2026-07-16T17:00:00Z",
          "cascadeDelayDays": 1,
          "sortOrder": 2,
          "dependencies": [
            {
              "dependsOnTaskId": "task-child-1-1",
              "type": "FS",
              "lagDays": 1
            }
          ],
          "materialAllocations": [
            {
              "inventoryItemId": "item-mortar-grout-gp",
              "materialCode": "MORTAR-GROUT-GP",
              "plannedQty": 2.5,
              "issuedQty": 2.0,
              "usedQty": 0.5,
              "returnedQty": 0.0,
              "remainingQty": 0.5
            }
          ],
          "componentAllocations": [],
          "resources": [
            {
              "type": "WORKER_GROUP",
              "name": "Tổ hoàn thiện bê tông",
              "quantity": 3.0
            }
          ],
          "cost": {
            "budgetCost": 12000000.0,
            "actualCost": 3500000.0,
            "variance": 0.0
          }
        }
      ]
    }
  ]
}
```

---

## 3. Cơ Chế Làm Tươi & Tái Dựng Snapshot (Rebuild Strategy)

Tác vụ tái dựng snapshot đòi hỏi nhiều tài nguyên tính toán. Do đó, hệ thống sử dụng cơ chế kích hoạt bất đồng bộ qua Background Engine thay vì thực thi trực tiếp trong request luồng ghi.

### 3.1. Incremental Mark (Đánh dấu hỏng snapshot)
Khi các Outbox Event sau được ghi nhận, Background Engine sẽ đánh dấu snapshot của dự án là `stale=true` và tạo một rebuild job:
- `projects.task.created` hoặc `projects.task.deleted`.
- `projects.task.updated` (có sự thay đổi về ngày tháng hoặc tiến độ).
- `projects.allocation.material.updated` hoặc `projects.allocation.component.updated`.
- `projects.inspection.completed` (QC nghiệm thu làm thay đổi tiến độ thực tế).
- `logistics.dispatch.received` (Ký nhận cấu kiện hiện trường thay đổi tình trạng phân bổ).

### 3.2. Background Rebuilder Job Execution
Job Worker quét hàng đợi snapshot, thực hiện:
1. Đọc toàn bộ cây `ProjectTask` cùng các bảng quan hệ phụ thuộc (cost, allocations, resources, dependencies) của `projectId` liên quan từ DB.
2. Xây dựng lại cấu trúc cây JSON lồng nhau (Nested Tree Structure) dựa trên liên kết `parentTaskId`.
3. Tính toán lại tổng lũy kế tiến độ (`progress`), chi phí thực tế (`actualCost`) từ các node con lên các node cha.
4. Ghi đè dữ liệu JSON vào trường `payload` của `ProjectRuntimeSnapshot`, đặt lại trạng thái `stale=false`.

---

## 4. Định Dạng Idempotency Key Cho Tác Vụ Nền

Tất cả các job cập nhật snapshot dự án phải tuân thủ quy tắc đặt tên khóa chống trùng lặp để bảo vệ database khỏi tình trạng "Rebuild Storm" (quá tải do yêu cầu tính toán lại liên tục):

```text
Job Name: snapshot.project.rebuild
Queue: snapshots
IdempotencyKey: snapshot:project:rebuild:<projectId>:<watermark>
```

**Ví dụ thực tế**:
- Job tái dựng snapshot cho dự án `PROJ-01` kích hoạt bởi sự kiện ngày 2026-07-08 lúc 15:30: `snapshot:project:rebuild:PROJ-01:20260708153000`

Nếu quản đốc công trường cập nhật tiến độ cho 20 task của cùng một dự án trong vòng 30 giây, 20 sự kiện `projects.task.updated` sẽ được phát ra. Nhờ cơ chế Idempotency Key, Background Engine sẽ tự động gộp (debounce/deduplicate) các yêu cầu này và chỉ thực hiện chạy job tái dựng snapshot đúng **1 lần duy nhất** cho dự án đó, tiết kiệm 95% tài nguyên CPU của database.

---

## 5. Phân Tích Rủi Ro Kiến Trúc (Snapshot Risks)

- **Rebuild Storms (Bão tái dựng)**:
  - *Rủi ro*: Khi một dự án lớn có > 5,000 tasks thay đổi lịch trình ở node gốc, hàng nghìn task con bị ảnh hưởng kích hoạt hàng nghìn sự kiện cập nhật dẫn đến nghẽn hàng đợi job.
  - *Giải pháp*: Giới hạn tần suất chạy rebuild job tối đa 1 lần mỗi 10 giây cho một dự án cụ thể. Nếu có yêu cầu mới trong khoảng thời gian này, job tiếp theo sẽ được delay (đẩy lùi) thay vì chạy ngay.
- **Database Locks (Khóa bảng khi cập nhật payload lớn)**:
  - *Rủi ro*: Trường `payload` JSON của một dự án lớn có dung lượng lên tới 5MB - 10MB. Việc cập nhật ghi đè dòng snapshot này có thể gây khóa bảng `project_runtime_snapshots`, block các truy vấn đọc khác.
  - *Giải pháp*: Sử dụng cơ chế cập nhật Read-Commit không khóa, hoặc lưu trữ payload snapshot lớn trong hệ thống Object Storage (S3/MinIO) và chỉ lưu trữ URL liên kết trong database nếu dung lượng payload vượt quá 2MB.

---

## 6. Chỉ Số Giám Sát Operations Center

- **`pms.snapshot.rebuild_duration_ms`**: Thời gian thực thi trung bình để tái dựng hoàn chỉnh 1 snapshot dự án. (Cảnh báo: > 1,500ms).
- **`pms.snapshot.freshness_seconds`**: Khoảng thời gian kể từ lần cuối cùng dữ liệu thay đổi thực tế xảy ra đến khi snapshot được cập nhật xong. (Cảnh báo: > 60 giây).

---

## 7. Cơ Hội Tích Hợp AI

- **AI-Driven Predictive Snapshot Prebuilder**: AI phân tích thời gian thao tác của kỹ sư trên Gantt chart. Nếu phát hiện kỹ sư đang mở chế độ chỉnh sửa WBS, AI tự động kích hoạt tính toán và lưu sẵn các phương án schedule dự phòng vào snapshot tạm thời, giúp việc thao tác kéo thả trên Gantt chart mượt mà không có độ trễ.

---

## 8. Sprint Roadmap

- **Sprint 1**: Thiết lập DB model `ProjectRuntimeSnapshot` và logic nạp dữ liệu từ repository sang cấu trúc JSON phân cấp.
- **Sprint 2**: Triển khai `SnapshotRebuilder` job cho PMS và tích hợp cơ chế chống trùng lặp Idempotency Keys.
