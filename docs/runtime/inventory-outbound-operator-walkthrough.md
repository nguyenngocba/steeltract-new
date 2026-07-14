# Hướng dẫn Vận hành: Quy trình Xuất kho Multi-Material (Outbound Pilot)

Tài liệu này hướng dẫn Operator thực hiện quy trình xuất kho mới với giao diện danh sách chờ (Pending Items List) trên hệ thống SteelTrack.

---

## Quy trình 5 Bước Thực hiện

### Bước 1: Mở Drawer xuất kho và chọn thông tin chung
1. Chọn tab **Xuất kho** trên màn hình **Vật tư kho**.
2. Nhấn nút **Tạo phiếu xuất** hoặc hành động tương đương để mở Drawer.
3. Chọn ngày xuất kho và chọn **Đối tượng xuất**:
   - **Xuất cho công trình (PROJECT)**: Chọn tiếp **Đơn vị nhận** (Công trình nhận).
   - **Xuất cho sản xuất cấu kiện (COMPONENT_PRODUCTION)**.

### Bước 2: Nhập thông tin vật tư dòng đầu tiên
1. Chọn **Vật tư** cần xuất từ danh sách tìm kiếm.
2. Chọn **Vị trí vật tư** (Zone / Slot / Level). Giao diện hiển thị số lượng tồn tại ô/tầng đang chọn.
3. Bản đồ 2D (`WarehouseMiniMap`) tự động cập nhật tiêu điểm để làm nổi bật vị trí xuất đã chọn.
4. Nhập **Số lượng** cần xuất.
   - *Lưu ý*: Nếu số lượng xuất vượt quá tồn kho khả dụng tại vị trí (sau khi trừ đi lượng đã nằm trong danh sách chờ xuất của các dòng khác), hệ thống sẽ hiển thị cảnh báo:
     > ⚠️ Cảnh báo: Tổng số lượng chờ xuất vượt quá lượng tồn kho khả dụng...
   - Operator vẫn có thể tiếp tục thêm vào hàng chờ nếu muốn, hệ thống không chặn cứng.
5. Nếu đối tượng xuất là **Sản xuất cấu kiện**, chọn tiếp vị trí nhận tại Kho vật tư SX (Zone / Slot / Level) hoặc nhấn nút **Gợi ý ô trống** để hệ thống tự động tìm ô phù hợp.

### Bước 3: Thêm vào danh sách chờ xuất
1. Nhấn nút **+ Thêm vào danh sách chờ xuất**.
2. Vật tư vừa nhập sẽ được đẩy lên **Danh sách chờ xuất** ở phía trên cùng của Drawer.
3. Form nhập liệu chính được reset về trạng thái trống để sẵn sàng cho vật tư tiếp theo.
4. Giao diện Pending Header sẽ cập nhật tổng quan số lượng vật tư, tổng khối lượng và tổng giá trị dự kiến.

### Bước 4: Kiểm tra và hiệu chỉnh danh sách chờ (Nếu cần)
1. Nhấn nút **Xem danh sách** ở Pending Header để xem chi tiết các dòng chờ xuất.
2. Để xóa một dòng: Nhấp biểu tượng ❌ (Remove).
3. Để sửa một dòng: Nhấp biểu tượng ✏️ (Edit).
   - Dòng đó sẽ được đưa ngược trở lại form để chỉnh sửa số lượng hoặc vị trí.
   - Bản đồ 2D (`WarehouseMiniMap`) sẽ tự động di chuyển tiêu điểm về đúng vị trí (source slot/level) của dòng đang sửa.

### Bước 5: Xác nhận xuất kho
1. Operator có thể đính kèm tài liệu ở mục tải tệp đính kèm.
2. Nhập ghi chú chung cho toàn bộ phiếu xuất ở ô ghi chú dưới cùng.
3. Nhấn **Xác nhận xuất kho (X)** (trong đó X là số dòng vật tư chờ xuất).
4. Hệ thống thực hiện một request nguyên tử đến API. Sau khi thành công, màn hình sẽ thông báo và đóng Drawer. Danh sách chờ được làm trống hoàn toàn.
