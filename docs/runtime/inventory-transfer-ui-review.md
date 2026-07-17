# Đánh giá UI/UX & Khảo sát Đồng bộ Giao diện: Điều chuyển (Transfer Pilot)

Tài liệu này đánh giá mức độ nhất quán giao diện và trải nghiệm người dùng của màn hình Điều chuyển (Transfer) sau khi tích hợp cơ chế Pending Items.

---

## 1. Định hướng Thiết kế & Design Language
Màn hình Điều chuyển kế thừa toàn bộ ngôn ngữ thiết kế **Industrial Cockpit** chuẩn hóa của SteelTrack:
- **Cockpit Color Palette**:
  - Tông màu nền tối chủ đạo Slate/Zinc phối hợp với các chi tiết màu neon (Cyan-300 cho hành động chính, Emerald-400 cho các số liệu tích cực, Red-400 cho cảnh báo vượt tồn).
  - Khung bao ngoài của danh sách chờ sử dụng `border-cyan-400/20 bg-cyan-400/5` đem lại cảm giác hiện đại và nhất quán với Inbound & Outbound.
- **Typography & Hierarchy**:
  - Tiêu đề "Danh sách chờ điều chuyển" dạng uppercase tracking-wider với kích thước chữ nhỏ (`text-xs` hoặc `text-[10px]` cho badges), đảm bảo mật độ thông tin cao.

## 2. Các Thành phần Giao diện & Tương tác
- **Pending Header**:
  - Hiển thị số lượng dòng điều chuyển hiện có.
  - Tóm tắt tổng khối lượng theo nhóm đơn vị (UOMs) và tổng số lần điều chuyển dự kiến bằng màu Cyan (`text-cyan-300`).
  - Nút chuyển đổi trạng thái "Xem danh sách / Ẩn danh sách" phản hồi mượt mà qua thuộc tính transition-colors.
- **Pending Panel**:
  - Danh sách cuộn tối đa `max-h-48` có thuộc tính `overflow-y-auto` để đảm bảo vừa vặn trên các màn hình có độ phân giải thấp.
  - Các dòng vật tư được phân tách bằng đường viền tinh tế `divide-white/5` và hiệu ứng hover nhẹ `hover:bg-white/[0.02]`.
- **Nút hành động dòng**:
  - Biểu tượng ✏️ (Sửa) và ❌ (Xóa) được bọc trong các lớp đệm nhỏ, chuyển màu hover sang màu tương ứng (`text-cyan-400` và `text-red-400`) tạo tín hiệu trực quan rõ ràng.

## 3. Bản đồ Warehouse 2D song song (`WarehouseMiniMap`)
- Định vị trực quan vị trí nguồn xuất hàng (Source Location) và vị trí đích nhận hàng (Destination Location) song song trong một khung nhìn chia đôi (`grid-cols-2`).
- Trải nghiệm chuyển tiêu điểm khi click Sửa (✏️) hoạt động đồng thời trên cả hai bản đồ, tự động định vị đúng ô nguồn trên bản đồ trái và ô đích trên bản đồ phải, giúp Operator kiểm soát tốt hơn.
