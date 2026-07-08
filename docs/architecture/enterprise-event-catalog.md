# Enterprise Event Catalog & Outbox Payloads (EPIC210)

Danh mục Sự kiện Hệ thống (Outbox Events) được điều phối thông qua [OutboxService](file:///opt/projects/steeltrack/apps/backend-api/src/core/outbox/outbox.service.ts) và phát hành thông qua [EventPublisherService]. Mọi sự kiện đều được ghi nhận transactional cùng lúc với dữ liệu nghiệp vụ chính vào bảng [OutboxEvent](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L2406).

## 1. Nguyên tắc Đặt tên Sự kiện (Event Naming Convention)

Tên sự kiện phải tuân theo cấu trúc phân tầng phân cách bằng dấu chấm:
```text
[context_name].[entity_name].[action_name]
```
- `context_name`: Tên phân vùng domain (ví dụ: `inventory`, `production`, `projects`).
- `entity_name`: Tên thực thể chịu ảnh hưởng (ví dụ: `material`, `work-order`, `task`).
- `action_name`: Hành động ở dạng quá khứ để biểu thị trạng thái đã hoàn thành (ví dụ: `created`, `updated`, `dispatched`, `completed`).

---

## 2. Danh mục Sự kiện & Payload Mẫu

### 2.1. Phân hệ Inventory (`inventory`)

#### Sự kiện: `inventory.transaction.created`
*   **Mô tả**: Phát hành khi có phiếu nhập kho, xuất kho hoặc điều chuyển được ghi nhận thành công trong cơ sở dữ liệu.
*   **Payload Mẫu**:
```json
{
  "transactionId": "tx_clx89abcd0001inv",
  "transactionNo": "IMP-260708-00001",
  "transactionType": "IMPORT",
  "warehouseId": "wh_main_store_01",
  "operatorId": "usr_admin_01",
  "timestamp": "2026-07-08T16:21:06.000Z",
  "items": [
    {
      "inventoryItemId": "item_steel_h10_001",
      "quantity": 12.5,
      "unitPrice": 18500000.0,
      "totalAmount": 231250000.0,
      "sourceLocation": null,
      "destinationLocation": {
        "zoneId": "zone_a_02",
        "slotId": "slot_05",
        "level": 1
      }
    }
  ]
}
```

#### Sự kiện: `inventory.return.received`
*   **Mô tả**: Phát hành khi một phiếu trả vật tư từ công trường dự án được phê duyệt nhận lại vào kho chính.
*   **Payload Mẫu**:
```json
{
  "returnRequestId": "ret_clx90efgh0002inv",
  "projectId": "proj_complex_steel_01",
  "receivedById": "usr_operator_02",
  "receivedAt": "2026-07-08T16:21:06.000Z",
  "items": [
    {
      "inventoryItemId": "item_steel_h10_001",
      "returnedQuantity": 1.5,
      "unitPrice": 18500000.0,
      "warehouseId": "wh_main_store_01",
      "zoneId": "zone_a_02"
    }
  ]
}
```

---

### 2.2. Phân hệ Production/MES (`production`)

#### Sự kiện: `production.work-order.released`
*   **Mô tả**: Phát hành khi lệnh sản xuất (Work Order/Manufacturing Order) chuyển từ trạng thái `DRAFT` sang `RELEASED`, cho phép xưởng sản xuất thực thi và giữ chỗ (reserve) vật tư định mức.
*   **Payload Mẫu**:
```json
{
  "workOrderId": "wo_clx91ijkl0003prod",
  "workOrderNo": "WO-260708-00001",
  "productId": "comp_column_h400_01",
  "quantity": 50,
  "scheduledStartDate": "2026-07-09T07:00:00.000Z",
  "scheduledEndDate": "2026-07-15T17:00:00.000Z",
  "bomItems": [
    {
      "inventoryItemId": "item_steel_h10_001",
      "requiredQuantity": 15.0
    }
  ]
}
```

#### Sự kiện: `production.material.consumed`
*   **Mô tả**: Phát hành khi ghi nhận tiêu hao vật tư thực tế tại các tổ máy trong xưởng sản xuất.
*   **Payload Mẫu**:
```json
{
  "consumptionId": "con_clx92mnop0004prod",
  "workOrderId": "wo_clx91ijkl0003prod",
  "inventoryItemId": "item_steel_h10_001",
  "consumedQuantity": 1.25,
  "scrapQuantity": 0.05,
  "returnedQuantity": 0.0,
  "machineId": "mac_cnc_plasma_01",
  "shiftId": "shift_morning_01",
  "operatorId": "usr_worker_12",
  "timestamp": "2026-07-08T16:21:06.000Z"
}
```

#### Sự kiện: `production.downtime.logged`
*   **Mô tả**: Phát hành khi ghi nhận thời gian dừng máy tại xưởng để theo dõi và tính toán OEE.
*   **Payload Mẫu**:
```json
{
  "downtimeId": "down_clx93qrst0005prod",
  "machineId": "mac_cnc_plasma_01",
  "shiftId": "shift_morning_01",
  "reasonCode": "NO_MATERIAL",
  "startedAt": "2026-07-08T14:30:00.000Z",
  "endedAt": "2026-07-08T15:15:00.000Z",
  "durationMinutes": 45,
  "operatorId": "usr_worker_12"
}
```

---

### 2.3. Phân hệ Projects (`projects`)

#### Sự kiện: `projects.task.progress-updated`
*   **Mô tả**: Phát hành khi tiến độ thực tế (WBS) của một công việc dự án được cập nhật từ công trường.
*   **Payload Mẫu**:
```json
{
  "projectId": "proj_complex_steel_01",
  "taskId": "task_wbs_erection_01",
  "progressPercentage": 65.5,
  "actualStartDate": "2026-07-01T08:00:00.000Z",
  "actualEndDate": null,
  "updatedById": "usr_supervisor_01",
  "timestamp": "2026-07-08T16:21:06.000Z"
}
```

---

### 2.4. Phân hệ Yard (`yard`)

#### Sự kiện: `yard.component.placed`
*   **Mô tả**: Phát hành khi cấu kiện thành phẩm hoàn thành sản xuất được nhập và định vị tại bãi xếp dỡ thành phẩm.
*   **Payload Mẫu**:
```json
{
  "placementId": "plc_clx94uvwx0006yard",
  "componentId": "comp_column_h400_01_serial01",
  "warehouseId": "wh_yard_store_02",
  "zoneId": "zone_heavy_structural_a",
  "slotId": "slot_row10_col02",
  "level": 1,
  "placedById": "usr_crane_op_03",
  "timestamp": "2026-07-08T16:21:06.000Z"
}
```

---

### 2.5. Phân hệ QC (`qc`)

#### Sự kiện: `qc.inspection.completed`
*   **Mô tả**: Kiểm định chất lượng của một cấu kiện hoặc lô vật tư đầu vào kết thúc.
*   **Payload Mẫu**:
```json
{
  "inspectionId": "insp_clx95yzab0007qc",
  "entityType": "COMPONENT",
  "entityId": "comp_column_h400_01_serial01",
  "inspectorId": "usr_qc_lead_01",
  "passed": false,
  "defectCode": "WELDING_DEFECT",
  "ncrGenerated": true,
  "ncrId": "ncr_clx96cdef0008qc",
  "timestamp": "2026-07-08T16:21:06.000Z"
}
```

---

### 2.6. Phân hệ Logistics (`logistics`)

#### Sự kiện: `logistics.dispatch.departed`
*   **Mô tả**: Phát hành khi xe vận chuyển cấu kiện xuất phát khỏi bãi xếp dỡ hướng ra công trình.
*   **Payload Mẫu**:
```json
{
  "dispatchOrderId": "disp_clx97ghij0009log",
  "vehicleId": "veh_truck_30t_01",
  "driverName": "Nguyen Van A",
  "departedAt": "2026-07-08T16:21:06.000Z",
  "itemCount": 12,
  "estimatedDeliveryTime": "2026-07-08T19:30:00.000Z"
}
```

---

## 3. Metadata chuẩn của Outbox Event

Mỗi bản ghi ghi nhận vào bảng `outbox_events` chứa phần metadata chuẩn dùng cho hạ tầng định tuyến sự kiện:

*   `eventId`: Định danh duy nhất UUID của sự kiện.
*   `module`: Context phát hành sự kiện (ví dụ: `inventory`).
*   `correlationId`: Dùng để trace luồng xử lý qua nhiều module.
*   `causationId`: Định danh sự kiện trực tiếp gây ra sự kiện này.
*   `userId`: Tài khoản thực hiện hành động gây ra sự kiện.
