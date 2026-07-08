# Enterprise Performance SLA (SteelTrack Core Platform)

Tài liệu này định nghĩa Thỏa thuận mức dịch vụ (SLA) về hiệu năng hệ thống, thời gian phản hồi API, độ trễ xử lý tác vụ nền, độ tươi của dữ liệu (Snapshot Freshness) và các ngưỡng cảnh báo vận hành trong trung tâm điều khiển Operations Center của SteelTrack.

---

## 1. Mục tiêu Hiệu năng & Phạm vi Áp dụng (SLA Objectives)

Hệ thống SteelTrack ERP + MES + Yard Management phục vụ hoạt động sản xuất liên tục tại nhà máy và công trường. Các chỉ số SLA dưới đây được cam kết đo lường tại lớp HTTP API ở điều kiện hoạt động bình thường và tải đỉnh (Peak Load) với lượng dữ liệu tích lũy đến 5 năm (theo [Data Growth 5-Year Plan](file:///opt/projects/steeltrack/docs/architecture/data-growth-5-year-plan.md)).

Mọi API endpoint mới hoặc sửa đổi bắt buộc phải vượt qua các chốt kiểm soát hiệu năng (Performance Gates) được quy định trong [Enterprise Performance Gate Guidelines](file:///opt/projects/steeltrack/docs/audit/enterprise-performance-gate.md) trước khi triển khai.

---

## 2. Cam kết Thời gian Phản hồi API (API Response Time SLA)

Thời gian phản hồi được đo lường từ khi máy chủ nhận request đến khi phản hồi đầy đủ dữ liệu (Time to First Byte - TTFB + Payload Transfer), tính theo phân vị **P95** và **P99**:

| Loại API | SLA Latency (P95) | SLA Latency (P99) | Định nghĩa & Phạm vi áp dụng | Phương thức tối ưu hóa bắt buộc |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | **< 150ms** | **< 300ms** | Các API tổng quan chỉ số vận hành, Command Center (ví dụ: `GET /operations-center/overview`, `GET /dashboard/executive-cockpit`). | Đọc trực tiếp từ precomputed snapshots (ví dụ: [DashboardReaderService](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/dashboard-reader.service.ts)) hoặc cached read models có TTL ngắn. Nghiêm cấm chạy truy vấn aggregation trực tiếp trên bảng giao dịch gốc (`inventory_transactions`, `yard_movements`). |
| **Lookup** | **< 80ms** | **< 150ms** | Các API gợi ý, truy vấn khóa ngoại, autocomplete, dropdown phục vụ biểu mẫu nhập liệu (nhập/xuất kho, gán vị trí bãi). | Sử dụng cache phân tán/bộ nhớ trong (Redis/Process cache) thông qua [CacheService](file:///opt/projects/steeltrack/apps/backend-api/src/core/performance/cache.service.ts) với TTL dài, phân trang chặt chẽ (giới hạn tối đa 50 bản ghi/lần). |
| **Search / List**| **< 300ms** | **< 500ms** | Các API tìm kiếm, lọc danh sách (vật tư, lệnh sản xuất, cấu kiện, dự án) có hỗ trợ phân trang và tìm kiếm toàn văn hoặc nhiều điều kiện. | Bắt buộc sử dụng Pagination định dạng Cursor hoặc Offset kết hợp các chỉ mục phức hợp (Composite Index) được thiết kế trong [Enterprise Data Engine](file:///opt/projects/steeltrack/docs/architecture/data-growth-5-year-plan.md). Rà soát EXPLAIN plans loại bỏ hoàn toàn Sequential Scan. |
| **Detail** | **< 120ms** | **< 200ms** | Xem chi tiết một bản ghi cụ thể (ví dụ: Material Detail, Project Detail, Dispatch Order Detail) cùng các thông tin quan hệ phụ thuộc. | Áp dụng cơ chế **Lazy Loading** theo tab qua API phân đoạn (ví dụ: `GET /projects/:id/detail/:tab`). Đọc dữ liệu chi tiết từ domain snapshots (như [InventoryMaterialSnapshot](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L986)) trước, fallback về repository gốc chỉ khi snapshot bị stale hoặc trống. |
| **Report** | **< 1000ms** | **< 2000ms** | Xuất báo cáo, truy vấn dữ liệu phân tích lịch sử biến động kho, hiệu suất thiết bị (OEE), tiến độ dự án lũy kế. | Thực hiện tổng hợp định kỳ qua tác vụ ngầm (Background Job) và lưu trữ kết quả trung gian vào các bảng Rollup hoặc Read Model chuyên biệt. Tránh tính toán trực tiếp realtime trên tập dữ liệu thô lớn hơn 100,000 dòng. |

---

## 3. Quy trình & Cơ chế Tác vụ Nền (Background Engine SLA)

Hệ thống tác vụ ngầm vận hành theo cơ chế Pull-based điều phối bởi [BackgroundJobManager](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/background-job-manager.service.ts) và thực thi qua [JobWorkerService](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/job-worker.service.ts). 

### 3.1. Độ trễ Kích hoạt & Thực thi (Job Latency Target)
*   **Tác vụ ưu tiên cao (Priority >= 90)**: Bắt đầu thực thi trong vòng **< 2 giây** kể từ khi enqueued.
*   **Tác vụ cập nhật Snapshot (Priority 50 - 89)**: Bắt đầu thực thi trong vòng **< 5 giây**.
*   **Tác vụ bảo trì & Rebuild hàng loạt (Priority < 50)**: Bắt đầu thực thi trong vòng **< 60 giây** (hoặc lập lịch ngoài giờ cao điểm).

### 3.2. Cơ chế Thử lại & Exponential Backoff (Retry Policy)
Khi một background job gặp lỗi (ví dụ: lỗi kết nối database, khóa bản ghi tạm thời), hệ thống sẽ áp dụng chính sách Exponential Backoff nhằm giảm thiểu tần suất thử lại dồn dập gây nghẽn tài nguyên:
*   **Công thức tính thời gian chờ (Backoff Math)**:
    $$\text{delaySeconds} = \text{baseSeconds} \times 2^{(\text{retryCount} - 1)}$$
    *Trong đó*: `baseSeconds` mặc định là **10 giây** (cấu hình qua [JobRetryPolicyService](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/job-retry-policy.service.ts)).
*   **Bảng tính thời gian chờ thực tế**:
    *   Lần thử lại 1: Chờ $10 \times 2^0 = 10$ giây.
    *   Lần thử lại 2: Chờ $10 \times 2^1 = 20$ giây.
    *   Lần thử lại 3: Chờ $10 \times 2^2 = 40$ giây.
    *   Lần thử lại 4: Chờ $10 \times 2^3 = 80$ giây.
    *   Lần thử lại 5: Chờ $10 \times 2^4 = 160$ giây.

### 3.3. Hộp thư Chết (Dead-Letter Queue - DLQ)
*   Số lần thử lại tối đa (`maxRetries`): **5 lần**.
*   Sau lần thứ 5 thất bại liên tiếp, job sẽ tự động được đánh dấu trạng thái là `DEAD_LETTER` trong bảng [BackgroundJob](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L2431) và ngừng thử lại tự động.
*   Hệ thống ghi nhận vết lỗi cuối cùng (`lastError`) kèm stack trace để kỹ sư SRE điều tra.

### 3.4. Cô lập và Giải phóng Tác vụ Treo (Heartbeat & Isolation)
*   Mỗi job đang thực thi phải liên tục cập nhật trường `heartbeatAt` định kỳ.
*   Nếu một job ở trạng thái `RUNNING` quá **5 phút** không cập nhật heartbeat (Stale Job), hệ thống tự động coi tiến trình đó đã chết đột ngột. Worker giám sát sẽ tự động mở khóa (Unlock), chuyển trạng thái về `PENDING`, tăng `retryCount` để worker khác có thể nhận lại xử lý.

---

## 4. Độ tươi dữ liệu Snapshot (Snapshot Freshness SLA)

Để duy trì hiệu năng API cực cao (< 150ms), SteelTrack chuyển đổi các luồng đọc dữ liệu sang kiến trúc Snapshot-first. Dữ liệu Snapshot được cập nhật bất đồng bộ ngoài luồng ghi giao dịch chính nhằm tránh kéo dài thời gian khóa database (lock contention).

Độ tươi của Snapshot biểu thị độ trễ tối đa (Lag) chấp nhận được của dữ liệu hiển thị so với dữ liệu thực tế trong cơ sở dữ liệu giao dịch:

| Ký hiệu Snapshot | Tên Snapshot | Độ trễ Tối đa (Target Lag) | Điều kiện kích hoạt cập nhật (Triggers) |
| :--- | :--- | :--- | :--- |
| `INV-DASH-SS` | **InventoryDashboardSnapshot** | **1 - 5 phút** | Các sự kiện nhập xuất phát hành qua Outbox (`inventory.transaction.created`, `inventory.stock.changed`). |
| `MAT-MOVE-SS` | **MaterialDailyMovementSnapshot**| **15 phút** | Daily Rollup tự động + Incremental append mỗi khi có lô hàng lớn dịch chuyển. |
| `MAT-LOC-SS` | **MaterialLocationBalanceSnapshot**| **Thời gian thực (< 5s)**| Cập nhật ngay lập tức sau khi hoàn thành giao dịch kho tại vị trí cụ thể (Zone, Slot, Level) để phục vụ kiểm tra/suy hao lập tức. |
| `PROJ-RUN-SS` | **ProjectRuntimeSnapshot** | **5 phút** | Thay đổi tác vụ công việc (`project.task.created`/`updated`/`deleted`), cập nhật tiến độ công trường. |
| `PROJ-HLTH-SS`| **ProjectTaskHealthSnapshot** | **1 - 5 phút** | Thay đổi liên kết phụ thuộc WBS, thay đổi phân bổ tài nguyên hoặc chi phí phát sinh. |
| `LOGI-DISP-SS`| **LogisticsDispatchSnapshot** | **1 phút** | Cập nhật vị trí GPS xe vận chuyển, sự kiện cập nhật trạng thái đơn điều xe (`departed`, `arrived`, `completed`). |
| `EXEC-DASH-SS`| **DashboardExecutiveSnapshot** | **5 phút** | Scheduler kích hoạt tiến trình compose dữ liệu tổng hợp từ các module snapshot thành phần. |

---

## 5. Ngưỡng Cảnh báo Vận hành tại Operations Center (Alerting Thresholds)

Operations Center tại địa chỉ `/operations-center` (dữ liệu lấy qua [GET /operations-center/overview](file:///opt/projects/steeltrack/apps/backend-api/src/modules/operations-center/operations-center.repository.ts)) thực hiện giám sát liên tục trạng thái hạ tầng kỹ thuật và đưa ra các cảnh báo theo phân cấp nghiêm trọng:

| Chỉ số Giám sát (Metrics) | Cảnh báo (Warning Threshold) | Nguy cấp (Critical Threshold) | Biện pháp Xử lý & Khắc phục |
| :--- | :--- | :--- | :--- |
| **Độ trễ hàng đợi Outbox** | `> 50 events` | `> 200 events` | Hàng đợi truyền sự kiện bị ứ đọng. Kiểm tra dịch vụ mạng hoặc tăng số lượng instance xử lý của Event Consumer Service. |
| **Độ lệch Snapshot (Lag)** | `> 15 phút` | `> 60 phút` | Tiến trình rebuild snapshot bị nghẽn. Rà soát [SnapshotRebuilder](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/snapshot-rebuilder.service.ts) xem có job nào bị treo khóa hoặc lỗi xử lý logic ném ngoại lệ liên tục. |
| **Tỷ lệ lỗi Jobs (Failed Rate)**| `> 5%` tổng số job | `> 15%` tổng số job | Tỷ lệ tác vụ ngầm bị fail tăng cao. Kiểm tra log hệ thống tìm kiếm các lỗi nghiệp vụ hệ thống, lỗi kết nối API bên ngoài (ví dụ: SMS/Email/Telegram gateway). |
| **Tỷ lệ quét không chỉ mục** | `< 95% index scans` | `< 85% index scans` | PostgreSQL đang phải quét tuần tự (Sequential Scan) trên bảng lớn. Chạy truy vấn phân tích chậm thông qua [OperationsCenterRepository](file:///opt/projects/steeltrack/apps/backend-api/src/modules/operations-center/operations-center.repository.ts) để phát hiện và bổ sung Index composite bị thiếu. |
| **Đĩa cứng khả dụng** | `< 15% trống` | `< 5% trống` | Phân vùng đĩa vật lý lưu trữ tài liệu đính kèm `STORAGE_ROOT` gần đầy. Thực hiện dọn dẹp các tệp tạm hoặc mở rộng dung lượng đĩa ảo hóa. |
| **Tải CPU (Load Average)** | `> 70%` dung lượng lõi | `> 90%` dung lượng lõi | Quá tải tính toán. Có thể do rò rỉ luồng xử lý hoặc tác vụ nặng (Rebuild toàn bộ dự án lớn) đang chiếm dụng CPU. Chuyển tác vụ nặng sang chạy đêm. |
| **Tiêu hao Bộ nhớ (RAM)** | `> 80%` dung lượng hệ thống | `> 95%` dung lượng hệ thống | Nguy cơ tràn bộ nhớ (Out of Memory - OOM). Kiểm tra các mảng lớn lưu trữ trong bộ nhớ đệm local, rà soát memory leak. |

---

## 6. Cơ chế Khắc phục Khẩn cấp (SOP Remediation)

Khi Operations Center kích hoạt cảnh báo nguy cấp (**Critical Alert**):
1.  **Chốt chặn Fallback**: Hệ thống tự động chuyển đổi luồng đọc từ Snapshot sang truy vấn trực tiếp Transactional DB qua Repository tương ứng (ví dụ: [InventoryRepository](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.repository.ts) hoặc [ProjectsRepository](file:///opt/projects/steeltrack/apps/backend-api/src/modules/projects/repositories/projects.repository.ts)) nhằm đảm bảo tính đúng đắn dữ liệu cho người dùng cuối dù latency tăng lên.
2.  **Khôi phục Tác vụ ngầm**: Thực hiện kích hoạt lệnh Rebuild Snapshot thủ công cho scope bị ảnh hưởng từ Operations Center thông qua [SnapshotUpdateDispatcher](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/snapshot-update-dispatcher.service.ts).
3.  **Xử lý Hàng đợi lỗi**: Sử dụng chức năng Replay trong Operations Center để gửi lại các Outbox Event bị kẹt hoặc chuyển trạng thái các Job từ `DEAD_LETTER` về `PENDING` sau khi đã vá lỗi logic ứng dụng.
