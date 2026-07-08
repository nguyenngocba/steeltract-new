# Production Read Model Design (Performance & Query Optimization)

Phần hệ Sản xuất (MES) chứa nhiều dữ liệu giao dịch tần suất cao như cập nhật trạng thái gia công, đo lường cảm biến máy móc, ghi nhận phế liệu và dừng máy. Để đảm bảo giao diện điều hành không bị chậm (lag), luồng đọc dữ liệu (Read Path) phải được tách biệt hoàn toàn khỏi luồng ghi (Write Path).

---

## 1. Giới Hạn Hiệu Năng Của Việc Truy Vấn Trực Tiếp (Live Query Bottlenecks)

Nếu truy vấn trực tiếp từ cơ sở dữ liệu quan hệ (PostgreSQL) qua Prisma để tổng hợp thông tin Dashboard Sản xuất, hệ thống sẽ gặp các vấn đề nghiêm trọng khi số lượng bản ghi tăng lên:
*   Phép tính OEE yêu cầu gộp (Join) giữa bảng `machines`, `production_stages`, `production_logs` và `machine_downtimes` trên phạm vi hàng triệu dòng.
*   Việc tính toán tỷ lệ sẵn sàng vật tư (Material Readiness %) cho hàng ngàn cấu kiện cùng lúc sẽ gây nghẽn kết nối cơ sở dữ liệu (Connection Pool Starvation).
*   Các truy vấn danh sách công việc chờ (Queue) tại Work Center lặp đi lặp lại do công nhân sử dụng thiết bị quét mã vạch kiểm tra thường xuyên.

---

## 2. Thiết Kế Read Model Bộ Nhớ Đệm (In-Memory Cached Read Model)

Tương tự phân hệ Vật tư (với `DashboardInventoryReadModelService`), phân hệ Sản xuất sẽ sử dụng một lớp dịch vụ Read Model tạm thời để lưu trữ dữ liệu tính toán sẵn trong bộ nhớ đệm (hoặc Redis sau này) với cơ chế tự động hết hạn (TTL).

```text
Request (GET /api/production/overview)
  -> Check Cache (DashboardProductionReadModel)
       |
       +---> [HIT] Trả về dữ liệu ngay (Latency < 5ms)
       |
       +---> [MISS]
               -> Chạy Live Repository Query (Gộp số liệu thực)
               -> Cập nhật Cache (TTL = 30 giây)
               -> Trả về kết quả cho Client
```

### Dịch vụ `DashboardProductionReadModelService`
```typescript
@Injectable()
export class DashboardProductionReadModelService {
  private cache: {
    data: ProductionDashboardPayload | null;
    expiresAt: number;
  } = { data: null, expiresAt: 0 };

  private readonly TTL_MS = 30000; // 30 giây bảo toàn tài nguyên DB

  constructor(private prodRepo: ProductionRepository) {}

  async getDashboardOverview(): Promise<ProductionDashboardPayload> {
    const now = Date.now();
    if (this.cache.data && this.cache.expiresAt > now) {
      return this.cache.data; // Cache hit
    }

    // Cache miss - Thực hiện tổng hợp dữ liệu nặng từ DB
    const liveData = await this.aggregateDashboardData();
    
    this.cache = {
      data: liveData,
      expiresAt: now + this.TTL_MS
    };

    return liveData;
  }

  private async aggregateDashboardData(): Promise<ProductionDashboardPayload> {
    // Gọi các hàm Repository tối ưu hóa bằng SQL thô (Raw SQL) hoặc Index
    // ...
  }
}
```

---

## 3. Phân Tách API Theo Tab (Tab-Gated API Boundary)

Được kế thừa từ thiết kế thành công của Project Detail, màn hình chi tiết lệnh sản xuất (`Production Order Detail`) sẽ không tải toàn bộ thông tin trong một payload khổng lồ. Thay vào đó, API được chia theo Tab để tối ưu hóa lượng dữ liệu truyền tải:

```text
GET /production/orders/:id/detail/overview    -> Tải thông tin chung & Tiến độ tổng quát (Budget: < 100ms)
GET /production/orders/:id/detail/materials   -> Tải danh sách vật tư cấp phát, sử dụng thực tế (Budget: < 150ms)
GET /production/orders/:id/detail/stages      -> Tải quy trình routing thực tế & Trạng thái (Budget: < 100ms)
GET /production/orders/:id/detail/cost        -> Tải chi phí nguyên vật liệu tạm tính & Hao hụt (Budget: < 200ms)
GET /production/orders/:id/detail/logs        -> Tải lịch sử nhật ký vận hành (Phân trang, lazy loading, Budget: < 100ms)
```

Điều này giúp giảm dung lượng mạng trên thiết bị máy tính bảng (tablet) tại nhà xưởng vốn có kết nối mạng Wifi không ổn định.

---

## 4. Chiến Lược Đánh Chỉ Mục Dữ Liệu (Enterprise Indexing Strategy)

Để đảm bảo hiệu năng tối ưu tại quy mô dữ liệu 5 năm (khoảng 10 triệu bản ghi nhật ký sản xuất và cấp phát vật tư), các chỉ mục phức hợp (Composite Indexes) sau đây được đề xuất bổ sung vào Prisma Schema:

```prisma
// Tối ưu hóa việc tìm kiếm và phân loại lệnh sản xuất theo dự án và trạng thái
model ProductionOrder {
  // ...
  @@index([projectId, status])
  @@index([workOrderId, status])
}

// Tối ưu hóa việc kiểm tra công đoạn đang chạy và sắp xếp thứ tự hàng đợi
model ProductionStage {
  // ...
  @@index([workCenterId, status, sequence])
  @@index([machineId, status])
}

// Tối ưu hóa việc truy vấn nhật ký dừng máy của thiết bị theo thời gian để tính OEE
model MachineDowntime {
  // ...
  @@index([machineId, startedAt, endedAt])
}

// Tối ưu hóa tra cứu nhật ký sản xuất theo lệnh và công đoạn
model ProductionLog {
  // ...
  @@index([productionOrderId, stageId, createdAt])
}
```

Các chỉ mục này giúp loại bỏ việc quét toàn bộ bảng (Full Table Scan) trong các câu lệnh truy vấn báo cáo sản xuất hàng ngày.
