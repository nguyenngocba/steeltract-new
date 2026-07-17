# Hướng dẫn Vận hành: Quy trình Điều chuyển Multi-Material (Transfer Pilot)

Tài liệu này hướng dẫn Operator thực hiện quy trình điều chuyển nội bộ giữa các vị trí kho bằng cơ chế danh sách chờ (Pending Items List) trên hệ thống SteelTrack.

---

## Quy trình 5 Bước Thực hiện

### Bước 1: Mở Drawer điều chuyển kho
1. Chọn tab **Điều chuyển** trên màn hình **Vật tư kho**.
2. Nhấn nút **Tạo phiếu điều chuyển** để mở Drawer.
3. Chọn ngày điều chuyển kho.

### Bước 2: Chọn vật tư và khai báo vị trí nguồn/đích
1. Chọn **Vật tư** cần điều chuyển từ danh sách.
2. Chọn **Vị trí nguồn** (Từ vị trí kho).
   - Bản đồ 2D nguồn hiển thị và tự động highlight vị trí nguồn đã chọn.
   - Giao diện hiển thị số lượng tồn tại nguồn (`Tồn tại nguồn`) và tồn khả dụng thực tế sau khi trừ đi lượng đã nằm trong danh sách chờ từ nguồn đó (`Tồn khả dụng nguồn`).
3. Nhập **Số lượng** cần điều chuyển.
   - *Lưu ý*: Nếu số lượng nhập lớn hơn tồn khả dụng nguồn, cảnh báo lỗi sẽ hiển thị và hệ thống chặn việc thêm vào danh sách chờ.
4. Chọn **Vị trí đích** (Đến vị trí kho).
   - Bản đồ 2D đích sẽ highlight vị trí nhận đã chọn.
   - Chọn tiếp Ô đích và Tầng đích hoặc sử dụng nút **Gợi ý ô đích trống** để hệ thống tự động tìm vị trí trống.
5. Nhập **Lý do điều chuyển** nếu cần.

### Bước 3: Thêm vào danh sách chờ điều chuyển
1. Nhấn nút **+ Thêm vào danh sách chờ điều chuyển**.
2. Vật tư điều chuyển sẽ được đưa vào danh sách chờ ở trên cùng của Drawer.
3. Form nhập liệu chính sẽ được làm sạch để Operator tiếp tục nhập vật tư khác.

### Bước 4: Kiểm tra và chỉnh sửa danh sách chờ (Nếu cần)
1. Nhấp nút **Xem danh sách** trên Pending Header để kiểm tra chi tiết các dòng chờ điều chuyển.
2. Để xóa một dòng chờ: Nhấn biểu tượng ❌.
3. Để sửa một dòng chờ: Nhấn biểu tượng ✏️.
   - Dòng đó sẽ được tải lại vào form nhập liệu, đồng thời bị xóa khỏi danh sách chờ tạm thời.
   - Bản đồ 2D Nguồn và Bản đồ 2D Đích sẽ tự động xoay tiêu điểm và highlight về đúng các tọa độ tương ứng của dòng đang sửa.

### Bước 5: Xác nhận điều chuyển
1. Bạn có thể đính kèm tài liệu ở mục tải tệp đính kèm.
2. Nhấn **Xác nhận điều chuyển (X)** (với X là số dòng trong danh sách chờ).
3. Hệ thống sẽ thực hiện một request nguyên tử đến API. Khi thành công, Drawer sẽ tự động đóng và danh sách chờ sẽ được xóa sạch.
4. Nếu có lỗi mạng hoặc API thất bại, danh sách chờ điều chuyển vẫn được giữ nguyên để Operator không phải nhập lại.
