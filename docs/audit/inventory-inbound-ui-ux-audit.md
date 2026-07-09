# Báo cáo Kiểm toán UI/UX Nhập kho (Inventory Inbound UI/UX Audit)

Tài liệu này đánh giá chi tiết giao diện người dùng, luồng thao tác và cơ chế liên kết dữ liệu (data binding) của tính năng **Nhập kho** trong phân hệ Quản lý kho WMS/Inventory của hệ thống SteelTrack.

---

## 1. Truy vết Luồng Nghiệp vụ Thực tế (Workflow Trace)

Luồng thao tác thực tế của người dùng khi thực hiện nghiệp vụ Nhập kho từ giao diện đến database được theo dõi như sau:

```
[Người dùng click Nhập kho trên Topbar]
             │
             ▼
[Mở Modal InboundTransactionModal]
             │
             ▼
[Chọn Ngày nhập, Nhà cung cấp, Vật tư] ──► (Gọi API suggestions lấy vị trí & đơn giá gần nhất)
             │
             ▼
[Nhập Số lượng, Đơn giá, VAT]
             │
             ▼
[Chọn Vị trí nhận: Zone ➔ Slot ➔ Level] ──► (Gợi ý ô trống tự động từ WarehouseMiniMap)
             │
             ▼
[Đính kèm tài liệu & Nhập ghi chú]
             │
             ▼
[Click "Xác nhận nhập kho"] ──► (Chặn double-submit bằng createTransaction.isPending)
             │
             ▼
[API: POST /inventory/transactions] ──► (Zod DTO Validation trên Backend)
             │
             ▼
[Repository: Lưu DB & Cập nhật Số dư] ──► (Ghi inventory_transactions & inventory_transaction_items)
             │
             ▼
[Event Store: Publish Outbox Event] ──► (Background Engine Rebuild Dashboard Snapshot)
             │
             ▼
[FE nhận Feedback: Toast Success] ──► (Invalidate & Refetch các Query cache liên quan)
```

---

## 2. Kết quả Đánh giá Chi tiết (UI/UX Review)

Qua kiểm toán giao diện `InboundTransactionModal` tại [InventoryTransactionModals.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/components/InventoryTransactionModals.tsx#L233-L652) và trang [InventoryInboundPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryInboundPage.tsx):

### A. Bố cục và Luồng Thao tác (Interaction & Layout)
*   **Hạn chế dòng vật tư (Single Item Limit)**: Form nhập kho chỉ hỗ trợ nhập **duy nhất 1 vật tư** cho mỗi giao dịch. Trong vận hành thực tế, khi nhận một hóa đơn/phiếu giao hàng từ nhà cung cấp có 20-30 dòng vật tư, nhân viên kho phải làm việc lặp đi lặp lại 20-30 lần để nhập hết phiếu. Đây là một điểm nghẽn nghiêm trọng (P0).
*   **Trải nghiệm Tìm kiếm Vật tư kém**: Ô chọn vật tư là thẻ `<select>` mặc định của trình duyệt. Khi danh mục vật tư lên tới hàng trăm mã, việc tìm kiếm bằng cách cuộn chuột rất mất thời gian và dễ nhầm lẫn.
*   **Thiếu cảnh báo khi đóng form chưa lưu**: Nếu người dùng vô tình click ra ngoài modal hoặc click nút "Đóng" trên tiêu đề modal, toàn bộ thông tin số lượng, đơn giá đã nhập sẽ bị mất ngay lập tức mà không có bất kỳ hộp thoại cảnh báo nào.
*   **Bố cục dàn trải**: Form đặt trong một Modal chiếm phần lớn không gian màn hình, che khuất toàn bộ bảng lịch sử giao dịch bên dưới. Bố cục form 2 cột chia đôi giữa các input và sơ đồ kho (`WarehouseMiniMap`) tạo cảm giác chật chội và không tuân thủ thiết kế dạng Slide-out Drawer rộng từ bên phải của Enterprise UI Guidelines.

### B. Chọn vị trí lưu kho (Warehouse & Location Selection)
*   **Tính phụ thuộc đúng đắn**: Luồng chọn vị trí `Zone` ➔ `Slot` (Ô) ➔ `Level` (Tầng) hoạt động tốt về mặt logic. Khi chọn một Zone, danh sách Slot sẽ tự động cập nhật và vô hiệu hóa (disable) những ô đã đầy tầng.
*   **Vị trí mặc định**: Hệ thống tự động gợi ý vị trí mặc định dựa trên thông tin định cấu hình của vật tư (`selectedMaterial.zoneId`). Tuy nhiên, nếu vị trí mặc định đó đã đầy, hệ thống sẽ tự động chuyển sang Zone đầu tiên còn trống, điều này có thể gây nhầm lẫn nếu thủ kho không chú ý.
*   **Công cụ sơ đồ kho**: Sơ đồ kho mini (`WarehouseMiniMap`) hoạt động tốt về trực quan, cho phép thủ kho click trực tiếp vào ô trống để tự động điền thông tin Zone/Slot/Level vào form.

### C. Cơ chế kiểm soát và Phản hồi (Validation & Feedback)
*   **Ngăn ngừa submit trùng**: Nút xác nhận được vô hiệu hóa chính xác khi `createTransaction.isPending` đang chạy, ngăn chặn hiệu quả lỗi double-click gửi trùng dữ liệu.
*   **Thông tin cảnh báo giá**: Tính năng cảnh báo chênh lệch đơn giá nhập (`hasLargePriceDelta` khi giá trị nhập lệch >30% so với giá gần nhất hoặc giá trung bình 30 ngày) hoạt động rất tốt, giúp thủ kho phát hiện ngay sai sót nhập liệu trước khi xác nhận.
*   **Thông báo lỗi**: Các lỗi như chưa chọn vị trí lưu kho (`missingInboundLocation`) được hiển thị rõ ràng bằng màu đỏ ngay trên form. Tuy nhiên, các thông báo lỗi từ backend (nếu có) chỉ được hiển thị qua toast chung chung chứ chưa được trỏ trực tiếp đến từng trường dữ liệu gặp lỗi.
