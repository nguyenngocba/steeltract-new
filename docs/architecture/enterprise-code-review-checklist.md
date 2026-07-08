# Bảng Kiểm Phê Duyệt Mã Nguồn Cấp Doanh Nghiệp (Enterprise Code Review Checklist)

Tài liệu này xác định các tiêu chí bắt buộc áp dụng khi phê duyệt Pull Request (PR) cho bất kỳ module nghiệp vụ mới nào trong hệ thống **SteelTrack ERP/MES**. 

Quy tắc cứng: **Bắt buộc phải đáp ứng đủ 9 chỉ tiêu kỹ thuật dưới đây**. Chỉ cần thiếu hoặc không đáp ứng 1 chỉ tiêu, PR sẽ tự động bị từ chối merge (Rejected).

---

## Danh sách 9 Chỉ Tiêu Bắt Buộc

### 1. Phân Lớp Repository (Repository Pattern)
*   **Yêu cầu**: Toàn bộ logic truy vấn cơ sở dữ liệu (đọc/ghi) phải được cô lập bên trong lớp Repository chuyên biệt kế thừa từ mô hình của module gốc. Nghiêm cấm việc gọi trực tiếp Prisma Client hoặc viết SQL thô trong các lớp Controller hoặc Service.
*   **Minh chứng triển khai**:
    *   Phải tạo file repository tương ứng, ví dụ: [inventory.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.repository.ts) hoặc [projects.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/projects/projects.repository.ts).
    *   Các hàm trong Service phải gọi qua repository: `this.inventoryRepository.findItemDetail(...)`.
*   **Tiêu chí từ chối (Rejection Criteria)**:
    *   Gọi trực tiếp `this.prisma.material.findUnique(...)` hoặc `this.prisma.$queryRaw` trong các file service (ví dụ: `inventory.service.ts`, `projects.service.ts`).
    *   Viết logic kết hợp (joins) phức tạp hoặc map dữ liệu thô bên ngoài lớp Repository.

### 2. Bộ Nhớ Tạm/Mô Hình Đọc (Persisted Snapshot)
*   **Yêu cầu**: Các màn hình Dashboard và danh sách tổng hợp dung lượng lớn bắt buộc phải đọc từ các bảng Snapshot được lưu trữ thay vì tính toán thời gian thực (real-time query). Bất kỳ module mới nào cũng phải định nghĩa các thực thể Snapshot và cơ chế cập nhật bất đồng bộ.
*   **Minh chứng triển khai**:
    *   Định nghĩa thực thể Snapshot trong Prisma, ví dụ như `InventoryMaterialSnapshot` và `InventoryLocationSnapshot` trong [inventory-snapshot.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/inventory-snapshot.repository.ts).
    *   Có logic xử lý rebuild snapshot: [snapshot-rebuilder.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/snapshot-rebuilder.service.ts).
*   **Tiêu chí từ chối**:
    *   Đọc trực tiếp dữ liệu thô (raw data) của hàng triệu dòng giao dịch (transactions) để hiển thị biểu đồ trên Dashboard mà không đi qua lớp snapshot.
    *   Thiếu định nghĩa schema cho bảng Snapshot tương ứng trong file thiết kế cơ sở dữ liệu.

### 3. Giám Sát Hiệu Năng Thời Gian Thực (Runtime Metrics)
*   **Yêu cầu**: Mọi API Endpoint mới phải được giám sát tự động bằng cơ chế Interceptor của hệ thống, ghi nhận: Thời gian phản hồi HTTP, Số lượng câu lệnh SQL thực thi, Tổng thời gian truy vấn SQL, Dung lượng bộ nhớ heap thay đổi, và Phân loại ngân sách truy vấn (Query Budget).
*   **Minh chứng triển khai**:
    *   Đăng ký API mới qua Interceptor giám sát: [runtime-metrics.interceptor.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/performance/runtime-metrics.interceptor.ts).
    *   Ghi nhận chỉ số qua [performance-metrics.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/performance/performance-metrics.service.ts).
    *   Phát hiện và ghi nhật ký truy vấn chậm (slow query logs) vượt ngưỡng quy định vào file [slow-query.log](file:///opt/projects/steeltrack/docs/runtime/slow-query.log) (ngưỡng mặc định > 200ms).
*   **Tiêu chí từ chối**:
    *   Bypass interceptor giám sát hoặc không đăng ký Endpoint.
    *   Tạo ra các câu lệnh SQL lặp (N+1 queries) mà không bị hệ thống ghi nhận cảnh báo.

### 4. Tích Hợp Trung Tâm Vận Hành (Operations Center Integration)
*   **Yêu cầu**: Module mới phải tích hợp đầy đủ chỉ số sức khỏe hệ thống vào API `/operations-center/overview` và hiển thị trên giao diện Cockpit điều hành hệ thống.
*   **Minh chứng triển khai**:
    *   Khai báo và cung cấp dữ liệu kiểm tra sức khỏe snapshot, độ trễ sự kiện (lag), tỉ lệ trúng cache/snapshot (hit ratio) và trạng thái job trong [operations-center.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/operations-center/operations-center.service.ts).
    *   Cung cấp các ngưỡng cảnh báo (alerts) phân loại theo mức độ nghiêm trọng (Severity: Info, Warning, Critical) tích hợp vào Cockpit hệ thống.
*   **Tiêu chí từ chối**:
    *   Module chạy ngầm hoặc ghi nhận lỗi nhưng Trung tâm vận hành không thể phát hiện.
    *   Không cập nhật API endpoint `/operations-center/overview` để trả về telemetry của module mới.

### 5. Cấu Trúc Đọc Tối Ưu (Read Model & Tab-Gating)
*   **Yêu cầu**: Áp dụng phân tách rõ ràng luồng ghi (Commands) và luồng đọc (Queries). Đối với luồng đọc, phải sử dụng cơ chế Tab-Gated (tải lười - lazy load) và phân vùng cache theo key.
*   **Minh chứng triển khai**:
    *   Chia nhỏ các tab hiển thị chi tiết (ví dụ: Overview, Materials, Components, Costs) qua API dạng `GET /module/:id/detail/:tab` và lưu bộ nhớ tạm phía client (ví dụ: React Query với cache key riêng).
    *   Xây dựng Service tối ưu chỉ đọc: [inventory-read-model.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory-read-model.service.ts) hoặc tuân thủ [projects-read-model.md](file:///opt/projects/steeltrack/docs/architecture/projects-read-model.md).
*   **Tiêu chí từ chối**:
    *   API trả về một payload khổng lồ chứa toàn bộ liên kết (drawings, logs, attachments, transactions) khi người dùng chỉ cần xem thông tin tổng quan.
    *   Không phân vùng cache key khiến việc chuyển tab bị tải lại toàn bộ dữ liệu.

### 6. Cờ Tính Năng & Cơ Chế Giảm Cấp (Feature Flags & Fallback)
*   **Yêu cầu**: Kích hoạt và chuyển đổi linh hoạt giữa việc đọc Snapshot và đọc dữ liệu real-time thông qua Feature Flags (biến môi trường hoặc DB settings). Module phải tự động hạ cấp xuống luồng đọc dữ liệu trực tiếp (runtime aggregate) nếu Snapshot bị thiếu, hết hạn (stale) hoặc không khớp dữ liệu (mismatch parity check).
*   **Minh chứng triển khai**:
    *   Đăng ký biến môi trường điều khiển trong [snapshot-feature-flag.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/snapshot-feature-flag.service.ts) (ví dụ: `USE_NEW_MODULE_SNAPSHOT`).
    *   Sử dụng [snapshot-reader.strategy.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/snapshot-reader.strategy.ts) và [dashboard-reader.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/snapshots/dashboard-reader.service.ts) để điều phối Fallback.
*   **Tiêu chí từ chối**:
    *   Không cài đặt cơ chế tự động chuyển đổi fallback khi snapshot lỗi, dẫn đến crash trang trắng hoặc API trả về lỗi 500.
    *   Thiếu parity check tự động so sánh dữ liệu thực tế và dữ liệu snapshot.

### 7. Tác Vụ Chạy Ngầm Bất Đồng Bộ (Background Jobs)
*   **Yêu cầu**: Mọi tác vụ nặng (như tính toán báo cáo, rebuild snapshot, đồng bộ dữ liệu) phải được chuyển thành job chạy ngầm bất động bộ do Background Engine xử lý. Các job này phải đảm bảo tính chạy lại được (idempotent), hỗ trợ lưu trữ trạng thái lỗi và có chính sách thử lại (retry policy).
*   **Minh chứng triển khai**:
    *   Đăng ký job thông qua [background-job-manager.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/background-job-manager.service.ts).
    *   Xác định chính sách retry thích hợp trong [job-retry-policy.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/job-retry-policy.service.ts) và xử lý dead-letter queue (DLQ) trong [job-worker.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/jobs/job-worker.service.ts).
*   **Tiêu chí từ chối**:
    *   Rebuild snapshot trực tiếp trong HTTP request thread gây nghẽn luồng xử lý chính.
    *   Job không lưu Idempotency Key dẫn đến việc xử lý trùng lặp dữ liệu khi chạy lại.

### 8. Giao Dịch Đáng Tin Cậy (Transactional Outbox Events)
*   **Yêu cầu**: Các hành động thay đổi trạng thái (create, update, delete) không được thực hiện tác vụ phụ (side-effects) trực tiếp trong cùng một transaction. Thay vào đó, phải lưu sự kiện vào bảng `outbox_events` trong cùng một transaction nghiệp vụ và sử dụng Event Publisher để phát đi bất đồng bộ.
*   **Minh chứng triển khai**:
    *   Sử dụng [outbox.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/outbox/outbox.service.ts) để ghi nhận các sự kiện nghiệp vụ dưới dạng transactional outbox.
    *   Đảm bảo các sự kiện có cấu trúc schema chuẩn hóa được định nghĩa trong [enterprise-event-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-event-catalog.md).
*   **Tiêu chí từ chối**:
    *   Gọi hàm gửi email, push notification, hoặc update bảng snapshot trực tiếp trong transaction của controller/service.
    *   Không sử dụng bảng `outbox_events` để đảm bảo tính nhất quán (Atomicity và Durability).

### 9. Cổng Kiểm Soát Hiệu Năng (Performance Budget Gate)
*   **Yêu cầu**: Mọi truy vấn mới phải vượt qua các tiêu chí ngân sách hiệu năng và được gán nhãn thuộc tính Query Budget cụ thể (Dashboard, Detail, Lookup, Search, Report).
*   **Minh chứng triển khai**:
    *   Khai báo Budget Decorator trên API Endpoint, ví dụ sử dụng [query-budget.ts](file:///opt/projects/steeltrack/apps/backend-api/src/core/performance/query-budget.ts).
    *   Đảm bảo tuân thủ tiêu chí hiệu năng quy định tại [enterprise-performance-gate.md](file:///opt/projects/steeltrack/docs/audit/enterprise-performance-gate.md):
        *   **API Dashboard/Cockpit**: Thời gian phản hồi < 100ms, Số truy vấn SQL <= 3.
        *   **API Danh sách (Search/List)**: Bắt buộc phân trang (Pagination), Số truy vấn SQL <= 5.
        *   **API Chi tiết (Detail)**: Số truy vấn SQL <= 8.
*   **Tiêu chí từ chối**:
    *   Một API tải trang chính thực thi trên 15 câu lệnh SQL (gây lỗi N+1 queries).
    *   Truy vấn không phân trang đối với các bảng ghi chép biến động lịch sử hoặc giao dịch.

---

## Quy Trình Đánh Giá Pull Request (PR Review Pipeline)

1.  **Lập trình viên**: Điền đầy đủ thông tin bảng tự kiểm tra (Self-Checklist) trong mô tả PR.
2.  **Hệ thống CI/CD**: Tự động thực thi phân tích tĩnh (Static Analysis) kiểm tra các decorator ngân sách truy vấn và cấu trúc repository.
3.  **Reviewer (Tech Lead / Architect)**: Xác minh từng file thay đổi dựa trên checklist này. Chỉ phê duyệt merge khi và chỉ khi 9/9 chỉ tiêu được đáp ứng.
