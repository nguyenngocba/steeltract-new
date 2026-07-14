# Đánh giá UI/UX & Khảo sát Đồng bộ Giao diện: Xuất kho (Outbound Pilot)

Tài liệu này đánh giá mức độ nhất quán giao diện và trải nghiệm người dùng của màn hình Xuất kho (Outbound) sau khi tích hợp cơ chế Pending Items.

---

## 1. Định hướng Thiết kế & Design Language
Màn hình Xuất kho kế thừa toàn bộ ngôn ngữ thiết kế **Industrial Cockpit** chuẩn hóa của SteelTrack:
- **Cockpit Color Palette**:
  - Tông màu nền tối chủ đạo của Slate/Zinc phối hợp với các chi tiết màu neon (Cyan-300 cho hành động chính, Emerald-400 cho các số liệu tích cực, Amber-400 cho cảnh báo).
  - Khung bao ngoài của danh sách chờ sử dụng `border-cyan-400/20 bg-cyan-400/5` đem lại cảm giác hiện đại và nhất quán với Inbound.
- **Typography & Hierarchy**:
  - Tiêu đề "Danh sách chờ xuất" dạng uppercase tracking-wider với kích thước chữ nhỏ (`text-xs` hoặc `text-[10px]` cho badges), đảm bảo độ cô đọng và mật độ thông tin cao (high density).

## 2. Các Thành phần Giao diện & Tương tác
- **Pending Header**:
  - Nằm ở trên cùng của form nhập liệu, hiển thị số lượng dòng vật tư hiện có.
  - Tóm tắt tổng khối lượng theo nhóm đơn vị (UOMs) và tổng giá trị dự kiến bằng màu xanh Emerald (`text-emerald-400`).
  - Nút chuyển đổi trạng thái "Xem danh sách / Ẩn danh sách" phản hồi mượt mà qua thuộc tính transition-colors.
- **Pending Panel**:
  - Danh sách cuộn tối đa `max-h-48` có thuộc tính `overflow-y-auto` ngăn việc Drawer bị kéo quá dài trên màn hình độ phân giải thấp.
  - Các dòng vật tư được phân tách bằng đường viền tinh tế `divide-white/5` và hiệu ứng hover nhẹ `hover:bg-white/[0.02]`.
- **Nút hành động dòng**:
  - Biểu tượng ✏️ (Sửa) và ❌ (Xóa) được bọc trong các lớp đệm nhỏ, chuyển màu hover sang màu tương ứng (`text-cyan-400` và `text-red-400`) tạo tín hiệu trực quan rõ ràng.

## 3. Bản đồ Warehouse 2D (`WarehouseMiniMap`)
- Định vị trực quan vị trí nguồn xuất hàng (Source Location) và vị trí đích nhận hàng (Destination Location) trực tiếp trong một khung nhìn chia đôi (`grid-cols-2` khi xuất sản xuất, `grid-cols-1` khi xuất công trình).
- Trải nghiệm chuyển tiêu điểm khi click Sửa (✏️) hoạt động tức thì, giúp giảm tải thao tác thủ công tìm kiếm vị trí của Operator.
