# Báo cáo Triển khai: Multi-Material Pending Items UX (Transfer Pilot)

## 1. Tổng quan
Quy trình điều chuyển kho (Inventory Transfer) đã được nâng cấp lên cơ chế quản lý danh sách chờ cục bộ (Local Pending Items List), đồng bộ với thí điểm Inbound (EPIC183) và Outbound (EPIC184) trước đó. Việc nâng cấp này giúp tối ưu hóa nghiệp vụ điều chuyển nhiều loại vật tư cùng lúc giữa các vị trí trong một yêu cầu API duy nhất.

## 2. Kiến trúc & Quản lý State
- **State cục bộ**:
  - `pendingItems`: Mảng lưu trữ tạm thời các dòng vật tư chờ điều chuyển trên RAM Client.
  - `showPendingList`: Trạng thái đóng/mở panel xem chi tiết danh sách chờ.
- **Rule gộp trùng (Merging Rule)**:
  - Nếu thêm một dòng điều chuyển có cùng **Vật tư (materialId)**, cùng **Vị trí nguồn (fromZone/Slot/Level)**, cùng **Vị trí đích (toZone/Slot/Level)** và cùng **UOM (Đơn vị tính)**, số lượng sẽ tự động cộng dồn vào dòng có sẵn.
  - Khác bất kỳ vị trí nguồn hoặc đích nào sẽ tạo thành một dòng riêng biệt trong danh sách chờ.
- **Giao dịch nguyên tử (Atomic Confirm)**:
  - Khi nhấn xác nhận, toàn bộ danh sách chờ sẽ được dịch chuyển thành mảng `items[]` gửi đi trong một request API duy nhất.
  - Mỗi dòng chờ trong danh sách tương ứng với 2 phần tử trong `items[]` (1 dòng âm số lượng tại Vị trí nguồn, 1 dòng dương số lượng tại Vị trí đích).

## 3. Quản lý Tồn khả dụng tại Nguồn (Transfer-specific Validation)
Để tránh điều chuyển vượt quá số lượng thực tế của vị trí nguồn khi có nhiều dòng chờ sử dụng chung một nguồn:
1. **Tồn ô/tầng nguồn thực tế (`sourceQty`)**: Tổng số lượng vật tư đang có tại vị trí nguồn đã chọn trong DB.
2. **Số lượng đã nằm trong hàng chờ (`pendingQtyAtLoc`)**: Tổng số lượng vật tư đó đang nằm trong danh sách chờ điều chuyển từ đúng vị trí nguồn này.
3. **Tồn khả dụng nguồn thực tế (`availableSourceQty`)**: `sourceQty - pendingQtyAtLoc`.
4. **Cảnh báo vượt tồn**: Nếu số lượng điều chuyển nhập vào form lớn hơn `availableSourceQty`, một cảnh báo màu đỏ nổi bật sẽ hiển thị:
   > ⚠️ Số lượng điều chuyển vượt quá tồn khả dụng tại vị trí nguồn.
   Đồng thời, nút **+ Thêm vào danh sách chờ** sẽ bị vô hiệu hóa (disabled) để đảm bảo tính toàn vẹn dữ liệu.
5. **Vị trí đích**: Không yêu cầu kiểm tra tồn khả dụng vì đây là nghiệp vụ nhận hàng vào ô trống.

## 4. Phục hồi Vị trí 2D khi Sửa dòng Chờ
- Khi sửa (✏️) một dòng chờ, thông tin dòng đó sẽ được nạp lại vào form nhập liệu chính.
- Giao diện hai bản đồ 2D (`WarehouseMiniMap`) sẽ tự động highlight và di chuyển tiêu điểm về đúng:
  - Vị trí nguồn (`fromSlotId` và `fromLevel`) trên **Bản đồ nguồn**.
  - Vị trí đích (`toSlotId` và `toLevel`) trên **Bản đồ đích**.
  Điều này giúp giảm thiểu thao tác nhập và tìm vị trí trên bản đồ cho Operator.

## 5. An toàn và Khôi phục Lỗi (Error Recovery)
- **Dirty Close Warning**: Hiển thị cảnh báo xác nhận khi Operator hủy bỏ hoặc click ra ngoài Drawer nếu form hoặc danh sách chờ đang có dữ liệu chưa lưu.
- **Non-destructive API Error**: Nếu API trả về lỗi (như Serializable conflict hoặc lỗi kết nối), danh sách chờ `pendingItems` được giữ nguyên để Operator không bị mất dữ liệu đã nhập và có thể gửi lại.
