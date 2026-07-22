# Báo cáo Triển khai: EPIC 12.2 — Executive Drill-down Dashboards

Date: 2026-07-22
Status: **COMPLETED & CERTIFIED**

---

## 1. Tóm tắt Thực thi (Executive Summary)

EPIC 12.2 hoàn thành việc chuyển đổi toàn bộ các widgets trên Executive Dashboard thành các điểm điều hướng chi tiết tương tác (Executive Drill-down Dashboards).

Đồng thời, trang phân tích trung tâm **AnalyticsPage (`AnalyticsPage.tsx`)** đã được tái cấu trúc thành một dashboard phân tích đa phân hệ gồm 7 tab tương ứng với các lĩnh vực nghiệp vụ cốt lõi: Tồn kho, Sản xuất, Giao vận, Chất lượng (QC), Dự án, Kế hoạch, và Quản trị hệ thống.

---

## 2. Bản đồ Drill-down Tương tác (Interactive Navigation Map)

| Thành phần Dashboard (Widget) | Hành động kích hoạt | Trang/Phân hệ đích (Drill-down Target) |
| --- | --- | --- |
| KPI: Giá trị tồn kho & Vật tư sắp hết | Click Card | Phân tích Tồn kho (`/analytics?domain=inventory`) |
| KPI: Lệnh SX đang chạy | Click Card | Phân tích Sản xuất (`/analytics?domain=production`) |
| KPI: Dự án triển khai | Click Card | Phân tích Dự án (`/analytics?domain=projects`) |
| KPI: Giao hàng hôm nay | Click Card | Phân tích Giao vận (`/analytics?domain=logistics`) |
| KPI: Sự cố QC / NCR | Click Card | Phân tích Chất lượng (`/analytics?domain=qc`) |
| KPI: Chờ điều phối / duyệt | Click Card | Phân tích Kế hoạch (`/analytics?domain=planning`) |
| KPI: Sức khỏe hệ thống | Click Card | Phân tích Quản trị (`/analytics?domain=admin`) |
| Chart: Phân bố Trạng thái Sản xuất | Click Card | Phân tích Sản xuất (`/analytics?domain=production`) |
| Chart: Trạng thái Chuyến vận chuyển | Click Card | Phân tích Giao vận (`/analytics?domain=logistics`) |
| Chart: Phân bố Tiến độ Dự án | Click Card | Phân tích Dự án (`/analytics?domain=projects`) |
| Chart: Chỉ số Kiểm định QC | Click Card | Phân tích Chất lượng (`/analytics?domain=qc`) |
| Notification: `Xử lý ➔` | Click Button | Module đích (`/qc`, `/inventory`, `/logistics/dispatch`) |
| Activity Timeline: Dòng sự kiện | Click Item | Bản ghi gốc / Module liên quan |

---

## 3. Các Trang Phân tích Chuyên sâu (7 Analytics Domains)

Tất cả các tab trong `AnalyticsPage` được thiết kế chặt chẽ theo SteelTrack UI Canon và chỉ tích hợp dữ liệu thực tế từ backend:

1. **Inventory Analytics**: Trực quan hóa giá trị tồn kho, vật tư sắp hết, mã danh mục, danh sách vật tư thiếu hụt cấp bách và bảng lịch sử giao dịch kho phân trang.
2. **Production Analytics**: Trực quan hóa tiến độ lệnh MO, lệnh hoàn thành so với lệnh bị tắc nghẽn hao hụt, và bảng tiến trình gia công thực tế tại xưởng.
3. **Logistics Analytics**: Theo dõi tình trạng chờ điều xe, xe đang di chuyển, lượt giao hoàn tất và bảng lịch trình chuyến xe chạy tuyến chi tiết.
4. **QC Analytics**: Tổng kết lượt đạt/lỗi kiểm định, phân bố loại lỗi NCR và danh sách phiếu NCR không phù hợp chưa khắc phục.
5. **Project Analytics**: Theo dõi tiến độ công trình, giá trị hợp đồng xây dựng và bảng tiến trình WBS chi tiết cho từng dự án.
6. **Planning Analytics**: Cảnh báo rủi ro MRP, rủi ro dừng máy do thiếu hụt thép tấm và kế hoạch chuyến giao xe.
7. **Admin Analytics**: Tổng hợp số tài khoản, vai trò phân quyền và bảng nhật ký kiểm toán (Audit Logs) hệ thống thời gian thực.

---

## 4. Kết quả Kiểm tra (Verification Results)

- `pnpm -C apps/frontend build`: **PASS**
- `pnpm -C apps/backend-api build`: **PASS**
- `git diff --check`: **PASS**
