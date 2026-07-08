# Enterprise Operations Center Integration Guidelines (EPIC210)

Hướng dẫn tích hợp dịch vụ, giám sát trạng thái và hiển thị thông tin kỹ thuật vào trung tâm điều hành hệ thống [Operations Center](file:///opt/projects/steeltrack/apps/backend-api/src/modules/operations-center/). Đây là trung tâm giám sát chuyên biệt dành cho Quản trị viên (Admin) và Kỹ sư Vận hành (SRE), không chứa các chỉ số kinh doanh hoặc nghiệp vụ thông thường.

---

## 1. Bản đồ Chức năng của Operations Center

Operations Center tập hợp dữ liệu kỹ thuật từ 6 phân vùng chính thông qua API [GET /operations-center/overview](file:///opt/projects/steeltrack/apps/backend-api/src/modules/operations-center/operations-center.repository.ts):

1.  **System Health Dashboard**: Đo lường hệ điều hành (CPU Load, RAM usage, Filesystem disk IO).
2.  **Background Job Explorer**: Giám sát hàng đợi jobs ngầm (Queued, Running, Failed, Dead-lettered).
3.  **Outbox Pipe Monitor**: Theo dõi hàng đợi truyền thông báo (Pending, Dispatched, Lag count).
4.  **Snapshot Health Center**: Theo dõi độ trễ (Lag) và hiệu suất đọc đệm của `Inventory`, `Projects`, `Logistics` snapshots.
5.  **Runtime Analytics**: Bảng xếp hạng endpoint chậm, cảnh báo truy vấn N+1, số lượng truy vấn vượt ngân sách.
6.  **Database Health**: Dung lượng thực tế các bảng cơ sở dữ liệu, tỷ lệ quét chỉ mục (Index Scan Ratio) và rủi ro phình dữ liệu (Bloat).

---

## 2. Chỉ tiêu Phân ngưỡng Cảnh báo (Alert Threshold Rules)

Hệ thống tự động quét định kỳ thông qua [RuntimeHealthService] và phát cảnh báo đỏ (Severity Level Critical) lên màn hình điều hành nếu chạm các ngưỡng sau:

| Chỉ số giám sát | Ngưỡng Cảnh Báo (Warning) | Ngưỡng Nguy Cấp (Critical) | Mô tả & Cách xử lý |
| --- | --- | --- | --- |
| **Độ trễ hàng đợi Outbox** | `> 50 events` | `> 200 events` | Hàng đợi Outbox bị nghẹt. Kiểm tra lỗi mạng hoặc khởi động thêm tiến trình Event Consumer. |
| **Độ lệch Snapshot (Lag)** | `> 15 phút` | `> 60 phút` | Rebuilder đang bỏ qua hàng đợi hoặc luồng tính toán snapshot bị lỗi dừng tiến trình. |
| **Tỷ lệ lỗi Jobs (Failed Rate)**| `> 5%` | `> 15%` | Lỗi nghiệp vụ hoặc mất kết nối dịch vụ ngoài liên tục. |
| **Tỷ lệ quét không chỉ mục** | `< 95% index scans`| `< 85% index scans`| Cảnh báo cơ sở dữ liệu đang quét tuần tự quá nhiều. Bắt buộc rà soát index bảng lớn. |
| **Dung lượng Đĩa cứng khả dụng**| `< 15% trống` | `< 5% trống` | Đĩa lưu trữ vật lý của STORAGE_ROOT gần đầy. Cần chạy tác vụ dọn dẹp hoặc mở rộng đĩa. |

---

## 3. Quy chuẩn Thêm Health Check Probe cho Module Mới

Khi xây dựng một module mới (ví dụ: `qc` hoặc `logistics`), bắt buộc phải đăng ký status probe vào `RuntimeHealthService` để Operations Center có thể tự động thu thập thông tin:

```typescript
// apps/backend-api/src/modules/operations-center/services/runtime-health.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { QcRepository } from '../../qc/repositories/qc.repository';

@Injectable()
export class RuntimeHealthService {
  constructor(
    @Inject(QcRepository)
    private readonly qcRepo: QcRepository,
  ) {}

  // Đăng ký Probe giám sát phân hệ QC
  async getQcHealthStatus() {
    const totalPendingInspections = await this.qcRepo.countPending();
    const activeNcrs = await this.qcRepo.countActiveNcrs();

    return {
      status: activeNcrs > 10 ? 'WARN' : 'OK',
      metrics: {
        pendingInspections: totalPendingInspections,
        activeNcrs,
      },
      lastRun: new Date().toISOString(),
    };
  }
}
```

---

## 4. Tích hợp Giao diện Operations Center (Frontend)

Mọi cấu phần giám sát trong Operations Center phải sử dụng các React Components tiêu chuẩn:
- Thẻ đo lường tài nguyên: `<CockpitKpiCard />` với tone màu biến đổi linh hoạt theo trạng thái (`cyan` cho OK, `amber` cho WARN, `red` cho CRITICAL).
- Thẻ biểu đồ xu hướng: `<CockpitChartCard />` với kích thước chuẩn hóa và vô hiệu hóa các hoạt ảnh (animation) gây nặng máy.
- Bảng dữ liệu: `<CockpitTableShell />` kèm phân trang chuẩn hóa thông qua `<DataTablePagination />`.
