# Báo cáo Triển khai: Multi-Material Pending Items UX (Outbound Pilot)

## 1. Tổng quan
Hệ thống quản lý xuất kho (Outbound) đã được nâng cấp lên cơ chế quản lý danh sách chờ cục bộ (Local Pending Items List), tương tự như thí điểm Inbound thành công trước đó. Thay vì tạo từng phiếu xuất đơn lẻ cho từng vật tư, nhân viên vận hành giờ đây có thể gom nhiều dòng vật tư khác nhau vào một danh sách chờ cục bộ và xác nhận gửi đi trong một yêu cầu API duy nhất.

## 2. Kiến trúc & Quản lý State
- **State cục bộ**:
  - `pendingItems`: Mảng chứa các đối tượng vật tư chờ xuất được lưu tạm thời trên RAM của Client.
  - `showPendingList`: Trạng thái đóng/mở panel xem chi tiết danh sách chờ.
- **Rule gộp trùng (Merging Rule)**:
  - Nếu thêm một dòng vật tư có cùng **Inventory Item**, cùng **Zone (Vị trí)**, cùng **Slot (Ô)**, cùng **Level (Tầng)**, cùng **Đơn vị tính (UOM)** và cùng **Đối tượng nhận (Target)**, số lượng sẽ tự động cộng dồn vào dòng có sẵn.
  - Nếu khác bất kỳ trường nào ở trên, dòng mới sẽ được thêm độc lập vào danh sách chờ.
- **Giao dịch nguyên tử (Atomic Confirm)**:
  - Khi nhấn "Xác nhận xuất kho", toàn bộ danh sách chờ sẽ được biên dịch thành một mảng `items[]` gửi đi trong một request duy nhất.
  - Định dạng payload API:
    - Đối với **PROJECT** (Xuất công trình): 1 dòng xuất âm số lượng tại vị trí xuất.
    - Đối với **COMPONENT_PRODUCTION** (Xuất sản xuất cấu kiện): 2 dòng (1 dòng xuất âm tại vị trí xuất kho chính, 1 dòng nhập dương tại vị trí kho SX nhận).

## 3. Quản lý Tồn khả dụng tại Vị trí (Outbound-Specific Stock Calculations)
Khác với Inbound, Outbound yêu cầu kiểm soát tồn khả dụng rất nghiêm ngặt để tránh nhân viên xuất vượt tồn thực tế tại ô/tầng đó:
1. **Tồn ô/tầng thực tế (`sourceLocationQty`)**: Tổng số lượng vật tư đang có tại ô và tầng đã chọn trong DB.
2. **Số lượng đã nằm trong hàng chờ (`pendingQtyAtLoc`)**: Tổng số lượng của vật tư đó đang nằm trong danh sách chờ xuất tại đúng ô/tầng này.
3. **Tồn khả dụng thực tế (`availableLocationQty`)**: `sourceLocationQty - pendingQtyAtLoc`.
4. **Cảnh báo trực quan (`isStockExceeded`)**: Nếu số lượng nhập trong form lớn hơn `availableLocationQty`, một cảnh báo màu vàng nổi bật sẽ xuất hiện:
   > ⚠️ Cảnh báo: Tổng số lượng chờ xuất (X tấn) vượt quá lượng tồn kho khả dụng tại ô/tầng này (Y tấn).
   - *Lưu ý*: Theo đặc tả nghiệp vụ, hệ thống chỉ hiển thị cảnh báo trực quan để hỗ trợ Operator ra quyết định chứ không tự động giảm số lượng hoặc chặn thêm vào pending.

## 4. Phục hồi Vị trí 2D khi Sửa dòng Chờ
- Khi nhấn nút Sửa (✏️) trên một dòng chờ xuất, thông tin dòng đó sẽ được nạp ngược lại vào form nhập liệu chính, và dòng đó sẽ tạm thời bị xóa khỏi danh sách chờ.
- Bản đồ 2D (`WarehouseMiniMap`) lắng nghe trực tiếp sự thay đổi của `form.sourceSlotId` and `form.sourceLevel`. Khi các giá trị này được nạp từ dòng chờ, bản đồ 2D sẽ tự động di chuyển tiêu điểm (focus) và highlight đúng ô/tầng đó, giúp người dùng không phải thao tác tìm lại trên bản đồ.

## 5. An toàn và Khôi phục Lỗi (Error Recovery)
- **Dirty Confirmation**: Nếu người dùng nhấn nút Hủy hoặc click ra ngoài khi danh sách chờ hoặc form có dữ liệu chưa lưu, hệ thống sẽ hiển thị hộp thoại xác nhận để tránh mất dữ liệu do vô tình click.
- **Non-destructive API Error**: Nếu API tạo transaction trả về lỗi (ví dụ: mất kết nối, lỗi validation phía server), danh sách chờ `pendingItems` **không bị xóa**. Người dùng có thể sửa đổi hoặc gửi lại mà không bị mất danh sách đã nhập.
