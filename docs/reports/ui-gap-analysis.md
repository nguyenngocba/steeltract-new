# Báo Cáo Đánh Giá Khoảng Cách UI (UI Gap Analysis)

**Dự án**: SteelTrack ERP - Executive Dashboard Redesign V3
**Tài liệu tham chiếu**: 
- `docs/ui-reference/kpi chinh.png`
- `docs/ui-reference/chi tiet bang.png`

---

## 1. Phân Tích Hình Ảnh Tham Chiếu (Reference Images Analysis)

### Ảnh 1: `kpi chinh.png` (Trang Tổng Quan Chỉ Huy)
- **Hệ thống Grid**: Hệ thống lưới 12 cột chuẩn, tỷ lệ phân chia cột rõ rệt giữa 70% bên trái (Nghiệp vụ trực quan) và 30% bên phải (Timeline & Tác vụ).
- **Hàng KPI Cards**: Gồm chính xác 8 thẻ KPI nằm trên cùng một hàng ngang. Mỗi thẻ chứa:
  - Icon phân hệ góc trên bên trái.
  - Tên chỉ số dạng chữ in hoa mờ góc trên bên phải.
  - Con số giá trị lớn nổi bật chính giữa.
  - Tỷ lệ thay đổi delta và sparkline SVG sắc nét.
  - Đèn trạng thái nhỏ (chấm tròn xanh/vàng/đỏ).
- **Bố cục Biểu đồ**: Thay thế hoàn toàn các khối văn bản thô bằng biểu đồ phân bổ hình tròn (Donut) và biểu đồ cột (Grouped Bar), đảm bảo không cần cuộn trang ở độ phân giải 1920x1080.
- **Màu sắc**: Nền tối Navy sâu, kết hợp các tông màu chức năng: Xanh lục (Healthy), Xanh lam (Normal), Cam (Warning), Đỏ (Critical), Tím (Financial).

### Ảnh 2: `chi tiet bang.png` (Modal Phân Tích Chi Tiết)
- **Bố cục**: Modal chiếm `95vw` chiều rộng và `92vh` chiều cao với hiệu ứng làm mờ kính cường lực (Glassmorphism).
- **Cột Trái (Sidebar Filters)**: Rộng cố định chứa các bộ lọc chuyên sâu (Kho, Công trình, Nhóm vật tư, Nhà cung cấp) và thẻ Tóm tắt Giá trị hiện tại.
- **Cột Phải (Báo Cáo Phân Tích)**:
  - Tỷ lệ chiếm dụng không gian: Biểu đồ chiếm 70%, Bảng số liệu chi tiết chiếm 30%.
  - Luồng thông tin: 5 thẻ KPI tóm tắt hàng ngang ➔ Biểu đồ Xu hướng 12 tháng lớn (chiếm 40% chiều cao) ➔ 2 Biểu đồ Phân tích ➔ 2 Biểu đồ Phân bổ ➔ Bảng Chi tiết cuộn cố định header ➔ Các Thẻ Highlights.

---

## 2. Khoảng Cách Đối Với UI Hiện Tại (Gap Analysis)

| Chỉ số / Bố cục | Trạng thái hiện tại | Yêu cầu chuẩn hóa V3 |
| --- | --- | --- |
| **Cuộn Trang (Scrolling)** | Vẫn xuất hiện thanh cuộn dọc do các card quá cao. | Ép chặt chiều cao các cấu phần để hiển thị 100% trên màn 1920x1080. |
| **Trực quan hóa Phân hệ** | Còn các khối Text mô tả rủi ro & phụ thuộc. | Chuyển hoàn toàn sang biểu đồ hình tròn (Donut) và thanh tiến trình lấp đầy. |
| **Ngôn ngữ Nhãn** | Hỗn hợp Tiếng Anh và Tiếng Việt. | Dịch toàn bộ 100% sang Tiếng Việt (Giá trị tồn kho, Số lượng tồn, v.v.). |
| **Bảng số liệu chi tiết** | Hiển thị quá nhiều cột không cần thiết. | Giới hạn tối đa 5 hàng, chỉ giữ lại các cột cốt lõi đầu/cuối kỳ. |
