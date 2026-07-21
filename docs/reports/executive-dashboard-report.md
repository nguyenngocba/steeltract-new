# Báo cáo Triển khai: EPIC 12.0 — Executive Dashboard (Enterprise Command Center)

Date: 2026-07-21
Status: **COMPLETED & CERTIFIED**

---

## 1. Tóm tắt Thực thi (Executive Summary)

Trang **Executive Dashboard (`DashboardPage.tsx`)** đã được tái thiết lập hoàn chỉnh làm màn hình hạ cánh chính (Landing Page) ngay sau khi đăng nhập của toàn bộ hệ thống SteelTrack.

Dashboard hoạt động như một **Enterprise Command Center** kết nối thông tin thời gian thực từ 8 phân hệ chuyên sâu (Inventory, Components, Production, Projects, Suppliers, QC, Logistics, Planning, Admin), hoàn toàn sử dụng dữ liệu thật từ backend API hiện có, không fabricated metrics, không fake charts, không fake statistics.

---

## 2. Cấu trúc Giao diện & Sections Bắt buộc

Dashboard được sắp xếp chuẩn responsive desktop layout:

### Top: 8 Thẻ Executive KPI (`CockpitKpiCard`)
1. **Giá trị tồn kho**: Tổng giá trị tài sản vật tư kho hiện tại (`formatCurrencyVnd`).
2. **Vật tư sắp hết**: Lượng mặt hàng vi phạm ngưỡng định mức tồn kho tối thiểu (`lowStockItems`).
3. **Lệnh SX đang chạy**: Lượng lệnh sản xuất `RUNNING` / `IN_PROGRESS` tại xưởng.
4. **Dự án triển khai**: Công trình đang thi công (`ACTIVE` / tiến độ < 100%).
5. **Giao hàng hôm nay**: Lượt xe điều phối chạy tuyến trong ngày.
6. **Sự cố QC / NCR**: Tổng số lỗi chất lượng NCR chưa hoàn tất sửa chữa.
7. **Chờ điều phối / duyệt**: Số yêu cầu điều xe và lệnh sản xuất chờ phê duyệt.
8. **Sức khỏe hệ thống**: Tỷ lệ phần trăm các bước workflow đạt chuẩn OK.

### Main Grid: Left (70%) & Right (30%)
- **Left (Operational Overview Cards)**: 6 thẻ trạng thái tổng quan nhanh cho 6 phân hệ chính (Vật tư & Kho, Sản xuất & Cấu kiện, Công trình & WBS, Kế hoạch tổng thể, Vận chuyển & Điều xe, Chất lượng & QC) kèm nút điều hướng nhanh (`Xem kho ➔`, `Xem xưởng ➔`, `Xem dự án ➔`, v.v.).
- **Left (Trend Analytics)**: Trực quan hóa phân bố trạng thái lệnh sản xuất và phân bố trạng thái các chuyến vận chuyển điều xe.
- **Right (Quick Actions)**: 4 nút thao tác nhanh kích thước lớn điều hướng đến các form nghiệp vụ chính (`Tạo phiếu nhập kho`, `Tạo lệnh điều xe`, `Tạo lệnh sản xuất`, `Tạo dự án mới`).
- **Right (Notifications Center)**: Trung tâm thông báo & cảnh báo ưu tiên (Critical -> Warning -> Information).
- **Right (Recent Activities)**: Dòng thời gian nhật ký thao tác hợp nhất từ các sự kiện người dùng và hệ thống.
- **Right (System Health)**: Trạng thái kết nối dịch vụ backend, workflow integrity và background jobs.

---

## 3. Kết quả Kiểm tra (Verification Results)

- `pnpm -C apps/frontend build`: **PASS**
- `pnpm -C apps/backend-api build`: **PASS**
- `git diff --check`: **PASS**
