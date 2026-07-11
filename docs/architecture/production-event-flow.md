# Production Event Flow (Outbox & Event-Driven Architecture)

Phân hệ Sản xuất (MES) sử dụng cơ chế xử lý phi đồng bộ dựa trên sự kiện (Event-Driven Architecture) để đảm bảo tính sẵn sàng cao, hiệu năng phản hồi tốt và tính nhất quán cuối cùng (Eventual Consistency).

---

## 1. Luồng Giao Dịch Bất Biến & Outbox Pattern

Mọi trạng thái thay đổi trong sản xuất đều phải được ghi nhận cùng một lúc với Outbox Event trong cùng một Database Transaction nhằm tránh tình trạng mất mát sự kiện (Dual-write problem).

```text
+---------------------------------------------------------+
| NestJS Business Transaction                             |
|                                                         |
|  1. Cập nhật trạng thái Lệnh/Công đoạn (Prisma Write)    |
|  2. Tạo dòng OutboxEvent (Prisma Write)                 |
+---------------------------------------------------------+
                           |
                           v (Commit Transaction)
+---------------------------------------------------------+
| Outbox Table (outbox_events)                            |
+---------------------------------------------------------+
                           |
                           v (EventPublisherService polls & publishes)
+---------------------------------------------------------+
| EventBusService (In-Process Broker)                     |
+---------------------------------------------------------+
       |                                           |
       v                                           v
+-----------------------------+             +-----------------------------+
| EventConsumerService        |             | Background Engine Worker    |
| (Gửi lệnh sản xuất qua bãi)  |             | (Tái dựng snapshot, OEE)    |
+-----------------------------+             +-----------------------------+
```

---

## 2. Danh Sách Các Sự Kiện Cốt Lõi (Canonical Events)

Toàn bộ sự kiện thuộc phân hệ Sản xuất đều bắt đầu bằng tiền tố `production.*`.

| Tên Sự Kiện | Ý Nghĩa | Mô Tả Payload |
| --- | --- | --- |
| `production.order.created` | Tạo lệnh sản xuất cấu kiện mới | `orderId`, `orderNo`, `bomId`, `quantity`, `projectId` |
| `production.order.released` | Phát hành lệnh sản xuất | `orderId`, `orderNo`, `releasedAt`, `actorId` |
| `production.order.ready` | Lệnh đủ điều kiện sẵn sàng chạy | `orderId`, `orderNo`, `readyAt`, `actorId` |
| `production.order.started` | Lệnh bắt đầu gia công thực tế | `orderId`, `orderNo`, `startedAt`, `operatorId` |
| `production.order.paused` | Tạm dừng lệnh đang chạy | `orderId`, `orderNo`, `pausedAt`, `actorId`, `reason` |
| `production.order.resumed` | Tiếp tục lệnh đang tạm dừng | `orderId`, `orderNo`, `resumedAt`, `actorId` |
| `production.order.completed` | Hoàn thành thực thi lệnh | `orderId`, `orderNo`, `completedAt`, `actorId` |
| `production.order.closed` | Đóng lệnh sau đối soát | `orderId`, `orderNo`, `closedAt`, `actorId` |
| `production.order.cancelled` | Hủy lệnh nháp | `orderId`, `orderNo`, `cancelledAt`, `actorId`, `reason` |
| `production.stage.started` | Bắt đầu chạy một công đoạn | `orderId`, `stageId`, `stageCode`, `machineId`, `workerId` |
| `production.stage.completed` | Hoàn thành một công đoạn | `orderId`, `stageId`, `stageCode`, `scrapWeight`, `durationHours` |
| `production.material.issued` | Cấp phát vật tư từ Kho SX ra tổ | `orderId`, `issueId`, `materialId`, `quantity`, `location` |
| `production.material.returned`| Trả lại vật tư thừa về Kho chính | `orderId`, `returnId`, `materialId`, `quantity` |
| `production.component.completed`| Cấu kiện hoàn thành & đạt QC | `orderId`, `componentId`, `qcInspectionNo`, `passedAt` |
| `production.downtime.logged` | Máy sản xuất gặp sự cố dừng chạy | `machineId`, `downtimeId`, `category`, `startedAt` |

Lifecycle naming policy:

* New Production Order lifecycle publishers emit only `production.order.*`.
* `production.started`, `production.completed`, and `production.delayed` are
  legacy compatibility names. Consumers may continue accepting them while old
  Outbox rows drain, but new command handlers must not publish them.
* `production.order.delayed` may be emitted as an operational warning, but it
  does not represent a canonical state transition.
* The Outbox row and Production Order mutation must be written in the same
  database transaction. Event handlers and snapshot jobs run only after commit.

---

## 3. Cấu Trúc Hợp Đồng Sự Kiện (Event Contracts)

Dưới đây là thiết kế chi tiết Payload JSON cho hai sự kiện quan trọng nhất:

### 3.1. Sự kiện `production.stage.completed`
Được phát đi khi một công đoạn (như Hàn - Welding) hoàn thành. Đây là dữ liệu đầu vào quan trọng để tính toán OEE và tiến độ dự án.

```typescript
export interface ProductionStageCompletedEvent {
  eventId: string;          // UUID duy nhất của sự kiện
  eventType: 'production.stage.completed';
  timestamp: string;        // ISO 8601
  watermark: string;        // Sequence marker phục vụ idempotency
  payload: {
    orderId: string;
    stageId: string;
    stageCode: 'CUTTING' | 'ASSEMBLY' | 'WELDING' | 'PAINTING' | 'QC';
    sequence: number;
    machineId?: string;
    workerId: string;
    actualHours: number;    // Thời gian gia công thực tế
    outputQuantity: number; // Số lượng hoàn thành
    scrapWeight: number;    // Khối lượng phế liệu phát sinh (kg)
    qcRequired: boolean;
  };
}
```

### 3.2. Sự kiện `production.downtime.logged`
Phục vụ tính toán chỉ số khả dụng (Availability) của máy móc trong OEE.

```typescript
export interface ProductionDowntimeLoggedEvent {
  eventId: string;
  eventType: 'production.downtime.logged';
  timestamp: string;
  payload: {
    downtimeId: string;
    machineId: string;
    workCenterId: string;
    category: 'PLANNED_MAINTENANCE' | 'UNPLANNED_BREAKDOWN' | 'MATERIAL_SHORTAGE' | 'NO_OPERATOR';
    startedAt: string;
    endedAt?: string;       // Nullable khi bắt đầu sự cố dừng máy
    durationMinutes?: number;
    reason: string;
  };
}
```

---

## 4. Định Tuyến Sự Kiện & Tác Vụ Nền (Event Consumer Routing)

Khi `EventConsumerService` nhận được các sự kiện trên thông qua `EventBusService`, nó sẽ điều phối công việc sang Background Engine để thực hiện các tác vụ tốn tài nguyên mà không chặn giao diện người dùng.

```typescript
@Injectable()
export class ProductionEventConsumer {
  constructor(
    private jobScheduler: JobSchedulerService,
    private logger: LoggerService
  ) {}

  @OnEvent('production.stage.completed')
  async handleStageCompleted(event: ProductionStageCompletedEvent) {
    this.logger.info(`Nhận sự kiện stage completed cho Order: ${event.payload.orderId}`);
    
    // 1. Lập lịch Job cập nhật tiến độ Lệnh sản xuất & Cấu kiện liên đới
    await this.jobScheduler.schedule({
      name: 'snapshot.production.update',
      queue: 'snapshots',
      priority: 70, // Ưu tiên trung bình - cao
      idempotencyKey: `snapshot:production:update:order:${event.payload.orderId}:${event.watermark}`,
      payload: {
        module: 'production',
        snapshotType: 'order-detail',
        scopeId: event.payload.orderId,
        reason: 'domain-event'
      }
    });

    // 2. Nếu là công đoạn cuối (QC Đạt), kích hoạt Job tự động cập nhật vị trí bãi Yard Staging
    if (event.payload.stageCode === 'QC') {
      await this.jobScheduler.schedule({
        name: 'snapshot.yard.update',
        queue: 'snapshots',
        priority: 90, // Ưu tiên rất cao để thủ kho bãi thấy cấu kiện lập tức
        idempotencyKey: `snapshot:yard:update:component:${event.payload.orderId}`,
        payload: {
          module: 'yard',
          snapshotType: 'staging-readiness',
          scopeId: event.payload.orderId
        }
      });
    }
  }
}
```

---

## 5. Quy Tắc Chống Trùng Lặp & Khôi Phục (Idempotency & Retry)

*   **Idempotency Key**: Tất cả các job nền sinh ra từ sự kiện sản xuất đều mang khóa duy nhất theo định dạng `snapshot:production:<event_name>:<scope_id>:<watermark>`. Tránh tính toán lại nhiều lần OEE khi sự kiện bị gửi trùng (At-least-once delivery).
*   **Retry Policy**: Sử dụng cơ chế lũy thừa cơ số 2 (Exponential Backoff) mặc định của hệ thống với thời gian trễ từ 5 giây đến tối đa 1 giờ trước khi chuyển vào trạng thái lỗi `DEAD_LETTER` hiển thị trên Operations Center.
