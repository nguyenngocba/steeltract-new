# Enterprise Snapshot Catalog & Schemas (EPIC210)

Danh mục các bảng cơ sở dữ liệu Snapshots của các module kèm lược đồ schema chi tiết, được quản lý bởi [SnapshotRebuilder](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/snapshot-rebuilder.service.ts) và lưu giữ vật lý trong PostgreSQL.

---

## 1. Inventory Materials Snapshot (`inventory_material_snapshots`)

*   **Mô tả**: Lưu trữ thông tin tổng hợp, lịch sử di biến động và phân tích tồn kho của một mã vật tư duy nhất. Phục vụ trực tiếp cho ngăn chi tiết vật tư (Material Detail Drawer).
*   **Mô hình Prisma**: [InventoryMaterialSnapshot](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1663)

### Lược đồ cấu trúc Bảng (DB Schema):
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | Định danh UUID/CUID của bản ghi snapshot. |
| `materialId` | `VARCHAR(36)` | `UNIQUE`, `NOT NULL` | Mã liên kết khóa ngoại đến bảng `inventory_items`. |
| `generatedAt` | `TIMESTAMP` | `NOT NULL` | Thời điểm snapshot được tạo ra. |
| `stale` | `BOOLEAN` | `DEFAULT FALSE` | Cờ báo hiệu snapshot cần rebuild lại. |
| `version` | `INTEGER` | `DEFAULT 1` | Phiên bản cấu trúc của payload (dùng cho migration payload). |
| `sourceWatermark`| `VARCHAR(255)` | `NULL` | Transaction ID hoặc Event ID lớn nhất được áp dụng vào snapshot. |
| `payload` | `JSONB` | `NOT NULL` | Dữ liệu chi tiết dạng JSON (xem chi tiết schema bên dưới). |

### Chi tiết Lược đồ Payload JSON (`payload` schema):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "materialCode": { "type": "string" },
    "name": { "type": "string" },
    "unit": { "type": "string" },
    "stockBalance": {
      "type": "object",
      "properties": {
        "mainWarehouse": { "type": "number" },
        "productionWarehouse": { "type": "number" },
        "total": { "type": "number" }
      },
      "required": ["mainWarehouse", "productionWarehouse", "total"]
    },
    "averageCost": { "type": "number" },
    "totalValue": { "type": "number" },
    "locations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "warehouse": { "type": "string" },
          "zone": { "type": "string" },
          "slot": { "type": "string" },
          "level": { "type": "integer" },
          "qty": { "type": "number" }
        }
      }
    },
    "recentTransactions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "txNo": { "type": "string" },
          "type": { "type": "string" },
          "qty": { "type": "number" },
          "date": { "type": "string", "format": "date-time" }
        }
      }
    }
  },
  "required": ["materialCode", "name", "unit", "stockBalance", "averageCost", "totalValue"]
}
```

---

## 2. Inventory Locations Snapshot (`inventory_location_snapshots`)

*   **Mô tả**: Lưu trữ trạng thái sức chứa và phân bổ vật tư tại từng vị trí lưu trữ (Zone/Slot/Level) của hệ thống kho bãi. Phục vụ màn hình vị trí kho.
*   **Mô hình Prisma**: [InventoryLocationSnapshot](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1699)

### Lược đồ cấu trúc Bảng (DB Schema):
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | Định danh UUID/CUID của bản ghi snapshot. |
| `warehouseId` | `VARCHAR(36)` | `NOT NULL` | Khóa ngoại liên kết kho. |
| `zoneId` | `VARCHAR(36)` | `NOT NULL` | Khóa ngoại liên kết zone. |
| `slotId` | `VARCHAR(255)` | `NOT NULL` | Định danh vị trí slot. |
| `level` | `INTEGER` | `NOT NULL` | Định danh tầng lưu trữ. |
| `generatedAt` | `TIMESTAMP` | `NOT NULL` | Thời điểm snapshot được tạo ra. |
| `stale` | `BOOLEAN` | `DEFAULT FALSE` | Cờ báo hiệu cần rebuild. |
| `payload` | `JSONB` | `NOT NULL` | Chứa thông tin chiếm dụng, tải trọng hiện tại và danh sách vật tư. |

---

## 3. Projects Dashboard Snapshot (`project_dashboard_snapshots`)

*   **Mô tả**: Bản chụp tiến độ dự án, dự toán chi phí, rủi ro chậm muộn và chỉ số hiệu năng WBS của toàn bộ dự án hiện hành.
*   **Mô hình Prisma**: [ProjectDashboardSnapshot](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1728)

### Chi tiết Lược đồ Payload JSON (`payload` schema):
```json
{
  "projectId": "proj_complex_steel_01",
  "projectCode": "PROJ-HADO-2026",
  "projectName": "Tổ hợp nhà thép Hà Đô",
  "wbsSummary": {
    "totalTasks": 240,
    "completedTasks": 180,
    "delayedTasks": 5,
    "progressPercentage": 75.0
  },
  "costSummary": {
    "budgetCost": 12500000000.0,
    "actualCost": 9800000000.0,
    "varianceCost": 2700000000.0,
    "costPerformanceIndex": 1.05
  },
  "criticalPath": [
    "task_wbs_foundation_01",
    "task_wbs_structural_fabrication_02",
    "task_wbs_erection_03"
  ]
}
```

---

## 4. Quy tắc Kiểm định Parity (Snapshot Parity Check Rules)

Để tránh tình trạng dữ liệu snapshot bị lệch lệch so với cơ sở dữ liệu gốc (Drift Data), hệ thống bắt buộc chạy quy trình kiểm định chéo (Parity Check) theo tần suất hoặc kiểm tra xác suất:

1.  **Hàm kiểm thử so sánh (Parity Audit Method)**:
    Mỗi module updater phải cài đặt hàm so sánh như `validateInventory` trong [SnapshotValidatorService](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/snapshot-validator.service.ts).
2.  **Logic so khớp (Assertion Logic)**:
    ```typescript
    const liveData = await this.inventoryRepository.calculateLiveMaterialBalance(materialId);
    const snapshotData = await this.snapshotRepository.getMaterialSnapshot(materialId);
    
    const delta = Math.abs(liveData.total - snapshotData.payload.stockBalance.total);
    if (delta > 0.001) {
      this.logger.error(`[SNAPSHOT PARITY DRIFT] Material ${materialId} is out of sync. Delta: ${delta}`);
      await this.snapshotRebuilder.triggerForceRebuild('inventory', materialId);
    }
    ```
3.  **Tỷ lệ chấp nhận lỗi**:
    Sai lệch dữ liệu số lượng thép tấm/thép hình cho phép là `0.0` (phải khớp tuyệt đối 100%). Mọi sai số đều được phân loại là cảnh báo đỏ hệ thống (High Severity Alert) trong Operations Center.
