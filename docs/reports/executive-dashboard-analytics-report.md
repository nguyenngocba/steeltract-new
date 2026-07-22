# Báo cáo Triển khai: EPIC 12.1 — Executive Dashboard Analytics & Activity Center

Date: 2026-07-21
Status: **COMPLETED & CERTIFIED**

---

## 1. Tóm tắt Thực thi (Executive Summary)

EPIC 12.1 hoàn thiện các khối tính năng phân tích vận hành (Operational Analytics), dòng thời gian hoạt động hợp nhất (Unified Recent Activity Timeline) và Trung tâm Cảnh báo (Notifications Center) trên trang **Executive Dashboard (`DashboardPage.tsx`)**.

Giữ nguyên 100% cấu trúc giao diện đã khóa ở EPIC 12.0, các tính năng nâng cấp hoàn toàn dựa trên dữ liệu thật từ backend API hiện có across 8 modules. Tuyệt đối không tạo dữ liệu giả, không sinh mảng xu hướng giả.

---

## 2. Nâng cấp Chi tiết theo Các Phần (Sections)

### Section 1 — Trend Analytics & Dedicated Panels
- **Production Trend**: Phân bố trạng thái lệnh sản xuất (Running, Completed, Blocked/Other) từ `productionApi.orders()`.
- **Logistics Trend**: Phân bố trạng thái vận chuyển điều xe (Planned, In Transit, Arrived, Cancelled) từ `getDispatchOrders()`.
- **Project Trend**: Trực quan hóa tiến độ các công trình đang triển khai (`ACTIVE` / progress < 100%) so với các công trình đã hoàn thành từ `getProjectsRuntime()`.
- **QC Trend**: Trực quan hóa 3 chỉ số kiểm định chính (`Passed`, `Rework`, `Failed / NCR`) từ `getQcCockpit()`.
- **Empty States**: Khi chưa phát sinh dữ liệu ở bất kỳ phân hệ nào, hiển thị `CockpitEmptyState` giải thích rõ lý do thay vì vẽ biểu đồ giả.

### Section 2 — Recent Activities (Unified Activity Timeline)
- Hợp nhất tất cả các sự kiện vận hành từ: Nhật ký hệ thống (Admin System Logs), Lệnh điều xe (Logistics Dispatch Orders), Kiểm định QC (QC Inspections).
- Sắp xếp sự kiện mới nhất lên đầu (Newest first).
- Phân nhóm thời gian theo 3 khối trực quan: **Hôm nay (Today)**, **Hôm qua (Yesterday)**, **Trước đó (Earlier)**.
- Tích hợp điều hướng trực tiếp (Click navigation target) chuyển người dùng đến module tương ứng khi nhấp vào sự kiện.

### Section 3 — Notifications Center
- Phân loại 3 mức độ ưu tiên: **Critical**, **Warning**, **Information**.
- Trích xuất tự động từ các điều kiện vận hành thực tế (Sự cố QC NCR chưa đóng, Vật tư dưới ngưỡng tồn tối thiểu, Lệnh chờ duyệt/điều phối).
- Mỗi thông báo cung cấp tiêu đề, mô tả, module nguồn, ưu tiên và nút hành động `Xử lý ➔` điều hướng thẳng tới module xử lý.

### Section 4 — Global Dashboard Filters
- **Time Range Chips**: `Hôm nay`, `7 Ngày`, `30 Ngày`.
- **Project Filter Dropdown**: Lọc dữ liệu theo từng công trình cụ thể.
- **Warehouse Filter Dropdown**: Lọc dữ liệu tồn kho theo từng kho hàng (`useWarehouses`).
- **Reset Button (`Xóa lọc`)**: Lập tức xuất hiện khi có bất kỳ bộ lọc nào đang được kích hoạt.

---

## 3. Kết quả Kiểm tra (Verification Results)

- `pnpm -C apps/frontend build`: **PASS**
- `pnpm -C apps/backend-api build`: **PASS**
- `git diff --check`: **PASS**
