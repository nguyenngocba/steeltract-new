# Báo cáo Kiểm toán UI/UX Xuất kho (Inventory Outbound UI/UX Audit)

Tài liệu này đánh giá chi tiết giao diện người dùng, luồng thao tác và cơ chế liên kết dữ liệu (data binding) của tính năng **Xuất kho** trong phân hệ Quản lý kho WMS/Inventory của hệ thống SteelTrack.

---

## 1. Truy vết Luồng Nghiệp vụ Thực tế (Workflow Trace)

Luồng thao tác thực tế của người dùng khi thực hiện nghiệp vụ Xuất kho từ giao diện đến database được theo dõi như sau:

```
[Người dùng click Xuất kho trên Topbar]
             │
             ▼
[Mở Modal OutboundTransactionModal]
             │
             ▼
[Chọn Loại xuất: Công trình (PROJECT) HOẶC Sản xuất (COMPONENT_PRODUCTION)]
             │
             ▼
[Chọn Đơn vị nhận (Công trình) & Chọn Vật tư] ──► (Gọi API lấy chi tiết tồn tại các vị trí)
             │
             ▼
[Chọn Vị trí nguồn xuất phát] ──► (Dropdown kết hợp Zone/Slot/Level + Tồn khả dụng tại ô đó)
             │
             ▼
[Nhập Số lượng xuất] ──► (FE validate: so sánh với tồn của ô/tầng đã chọn)
             │
             ▼
[Nếu chọn Sản xuất: Chọn thêm Vị trí nhận tại Kho Sản xuất (Zone ➔ Slot ➔ Level)]
             │
             ▼
[Đính kèm tài liệu & Nhập ghi chú]
             │
             ▼
[Click "Xác nhận xuất kho"] ──► (Kiểm tra canSubmit)
             │
             ▼
[API: POST /inventory/transactions] ──► (Payload: OUTBOUND cho dự án; TRANSFER cho sản xuất)
             │
             ▼
[Repository: Giao dịch DB trừ tồn kho] ──► (Kiểm tra số dư trên DB; chặn nếu tồn âm)
             │
             ▼
[Event Store: Publish Outbox Event] ──► (Background Engine Rebuild Dashboard Snapshot)
             │
             ▼
[FE nhận Feedback: Toast Success] ──► (Invalidate & Refetch các Query cache liên quan)
```

---

## 2. Kết quả Đánh giá Chi tiết (UI/UX Review)

Qua kiểm toán giao diện `OutboundTransactionModal` tại [InventoryTransactionModals.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/components/InventoryTransactionModals.tsx#L654-L1118) và trang [InventoryOutboundPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryOutboundPage.tsx):

### A. Chọn Vị trí nguồn và Xem tồn khả dụng (Available Stock Visibility)
*   **Thiếu bảng chi tiết tồn tại chỗ**: Form không hiển thị một bảng tổng quan các vị trí đang có vật tư này cùng số lượng tồn tương ứng. Thủ kho buộc phải mở dropdown **"Chọn vị trí vật tư"** để xem và so sánh.
*   **Dropdown kết hợp cồng kềnh**: Bộ chọn vị trí nguồn được thiết kế dưới dạng một dropdown duy nhất gộp chung: `Mã Zone / Mã Slot / Tầng - Số lượng tồn` (ví dụ: `A01 / A01 / L1 - 5.000 tấn`). Việc gộp chuỗi này khiến giao diện dropdown rất dài, khó đọc và không nhất quán với bộ chọn Zone/Slot/Level tách biệt 3 trường của bên Nhập kho.
*   **Hạn chế chia tách lô hàng (No split location)**: Do form chỉ hỗ trợ 1 dòng vật tư và 1 vị trí nguồn duy nhất cho mỗi giao dịch, nếu thủ kho cần xuất 10 tấn vật tư X, nhưng vị trí A chỉ còn 6 tấn và vị trí B còn 8 tấn, thủ kho **không thể** chọn xuất từ cả hai vị trí trong cùng một phiếu. Họ bắt buộc phải tạo 2 phiếu xuất riêng biệt. Đây là một hạn chế vận hành nghiêm trọng (P0).

### B. Luồng Nghiệp vụ Xuất cho Sản xuất (Component Production Target)
*   **Phức tạp hóa luồng đi**: Khi chọn xuất cho sản xuất (`COMPONENT_PRODUCTION`), hệ thống thực chất sẽ chạy luồng **Điều chuyển (TRANSFER)** giữa Kho chính và Kho sản xuất. Giao diện lúc này sẽ mở thêm 3 dropdown chọn vị trí nhận tại kho sản xuất và sơ đồ kho thứ hai bên tay phải.
*   **Giao diện quá tải**: Việc hiển thị đồng thời cả vị trí nguồn (Kho chính) và vị trí đích (Kho sản xuất), cùng với 2 sơ đồ kho mini kế bên nhau khiến modal xuất kho bị quá tải thông tin, vượt ra ngoài kích thước màn hình laptop tiêu chuẩn (1366x768) và đòi hỏi người dùng phải cuộn ngang dọc liên tục để làm việc (P1).

### C. Cơ chế Kiểm soát Tồn kho (Inventory Validation)
*   **Validation 2 lớp chặt chẽ**:
    - **Frontend**: Form hiển thị cảnh báo đỏ ngay lập tức nếu số lượng nhập vượt quá số dư tồn của ô đã chọn (`quantity > sourceLocationQty`) và vô hiệu hóa nút Submit.
    - **Backend**: Service `inventory.service.ts` (dòng 677) thực hiện kiểm tra lại số dư trong Database một lần nữa trước khi commit transaction. Nếu số dư sau xuất âm, hệ thống sẽ rollback và trả lỗi `Insufficient stock...`. Điều này đảm bảo an toàn dữ liệu tuyệt đối.
*   **Hồ sơ tài liệu đính kèm**: Việc tích hợp `InventoryAttachmentPicker` cho phép đính kèm phiếu yêu cầu xuất kho hoặc biên bản giao nhận trực tiếp vào giao dịch rất tiện lợi cho hậu kiểm.
