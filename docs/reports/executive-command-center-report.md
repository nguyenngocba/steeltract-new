# Báo cáo Triển khai: EPIC 12.3 — Executive Command Center

Date: 2026-07-22
Status: **COMPLETED & CERTIFIED**

---

## 1. Tóm tắt Thực thi (Executive Summary)

EPIC 12.3 nâng cấp trang **Executive Dashboard (`DashboardPage.tsx`)** từ một trang theo dõi tĩnh (Monitoring) thành một trung tâm chỉ huy vận hành tương tác trực tiếp (Executive Command Center).

Dispatcher/Manager hiện nay có thể đưa ra quyết định xử lý, ký duyệt, điều chỉnh tuyến xe và đặt hàng bổ sung tức thì ngay tại trang chủ nhờ các khối hành động trực tuyến và đề xuất thông minh dựa trên dữ liệu thật của hệ thống.

---

## 2. Các Tính năng Mới của Trung tâm Chỉ huy

### A. Bảng Quyết định & Chỉ huy Vận hành (Quick Action Workspace)
- Phát hiện và hiển thị các sự cố vận hành thực tế dưới dạng các **Thẻ hành động (Action Cards)** có đầy đủ nút hành động điều hướng.
- **Vật tư sắp hết**: Cho phép `Xem tồn kho` (phân hệ Tồn kho) hoặc `Tạo PO mua hàng` (phân hệ Mua sắm).
- **Lệnh SX có hao hụt**: Cho phép `Mở chi tiết MO` (phân hệ Sản xuất) hoặc `Kiểm tra vật tư` (phân hệ Kế hoạch/MRP).
- **Sự cố NCR lỗi kiểm định**: Cho phép `Giải quyết NCR` hoặc `Xem kiểm định` (phân hệ Chất lượng QC).
- **Hủy chuyến vận chuyển**: Cho phép `Xem điều xe` (phân hệ Logistics) để lập lịch bổ sung hoặc điều tài xế.

### B. Hàng đợi Công việc Điều hành (Operational Queue)
- Gom nhóm và phân loại các đầu việc vận hành theo 4 tab trạng thái:
  - **Gấp (Critical)**: Các phiếu sự cố NCR chất lượng chưa hoàn thành.
  - **Hôm nay (Today)**: Lệnh xe đang chạy tuyến hoặc bốc xếp Slots B.
  - **Tuần này (This Week)**: Lịch xe đã lên lịch chuyến trong tuần.
  - **Hoàn thành (Completed)**: Nhật ký lệnh MO đã hoàn thành xuất xưởng.

### C. Khối Cá nhân & Phê duyệt (Personal Task Panel)
- Hiển thị danh mục nhiệm vụ cá nhân như phê duyệt bốc xếp, ký duyệt nghiệm thu và các địa chỉ favorites liên kết nhanh.

### D. Khối Đề xuất Thông minh (Smart Recommendations)
- Chỉ hiển thị thẻ gợi ý khi phát hiện vật tư giảm dưới mức an toàn thực tế, đề xuất nhân viên đặt thêm lượng vật tư tối ưu.

### E. Lịch trình Vận chuyển & Thời hạn (Executive Calendar)
- Tổng hợp lịch bốc xếp xe, lịch xuất phát của các chuyến vận chuyển đã lên lịch cùng các mốc tiến độ dự án.

---

## 3. Kết quả Kiểm tra (Verification Results)

- `pnpm -C apps/frontend build`: **PASS**
- `pnpm -C apps/backend-api build`: **PASS**
- `git diff --check`: **PASS**
