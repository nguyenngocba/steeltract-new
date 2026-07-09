# Đề xuất Bố cục Giao diện Nhập/Xuất kho Mới (Layout Proposal)

Tài liệu này đề xuất thiết kế bố cục giao diện mới cho tính năng **Nhập kho** và **Xuất kho**, tối ưu hóa cho môi trường vận hành công nghiệp cường độ cao (High-Density Industrial UX) và tuân thủ chặt chẽ **Enterprise UI Guidelines**.

---

## 1. Nguyên tắc Thiết kế Chủ đạo (Design Principles)
1.  **Một màn hình không cuộn (Single Screen Cockpit)**: Dồn mật độ thông tin cao, giảm thiểu chiều cao các phần tử để hiển thị toàn bộ bảng lịch sử, biểu đồ phân bổ và bộ lọc trên một màn hình laptop tiêu chuẩn (1366x768).
2.  **Ngăn kéo trượt thay thế Modal (Slide-out Workspace Drawer)**: Toàn bộ form tạo phiếu nhập/xuất kho sẽ mở ra dạng Slide-out Drawer rộng từ bên phải màn hình (`ModuleDetailDrawer`, kích thước `lg` - rộng 85vw). Thiết kế này giúp thủ kho vừa nhập liệu vừa đối chiếu được bảng danh sách lịch sử giao dịch và dữ liệu thống kê bên trái.
3.  **Hỗ trợ nhiều dòng vật tư (Multi-Line Grid)**: Nâng cấp form từ nhập đơn lẻ 1 dòng vật tư thành một lưới bảng (Data Grid) cho phép nhập nhiều dòng vật tư cùng lúc trên một phiếu.

---

## 2. Mô tả Bố cục Giao diện Đề xuất

```
+--------------------------------------------------------------------------------------+
| TOPBAR: VẬT TƯ KHO > NHẬP KHO / XUẤT KHO                                [Nhập] [Xuất]|
+--------------------------------------------------------------------------------------+
| KPI STRIP: (5 CockpitKpiCards - h-[108px])                                           |
| [Tổng lượng tháng]  [Giá trị tháng]  [Giá trị hôm nay]  [Số phiếu]  [NCC/Chờ duyệt]  |
+--------------------------------------------------------------------------------------+
| MAIN WORKSPACE: (grid grid-cols-12 gap-1)                                            |
|                                                                                      |
|  LEFT PANEL: DANH SÁCH PHIẾU (col-span-9)      | RIGHT PANEL: THỐNG KÊ (col-span-3)   |
|  +-------------------------------------------+ | +----------------------------------+ |
|  | FILTER BAR (supplier, project, zone, date)| | | Phân bổ kho (Donut - h-[170px])  | |
|  +-------------------------------------------+ | +----------------------------------+ |
|  | TABLE (px-4 py-2.5 padding, hover cyan)   | | | Top vật tư (Bar - h-[170px])    | |
|  | [Ngày] [Mã phiếu] [Đơn vị] [Khối lượng].. | | +----------------------------------+ |
|  |                                           | | | Tiêu thụ dự án (h-[170px])       | |
|  +-------------------------------------------+ | +----------------------------------+ |
|  | PAGINATION (DataTablePagination)          | |                                    |
|  +-------------------------------------------+ |                                    |
+--------------------------------------------------------------------------------------+
```

### A. Ngăn kéo Tạo phiếu Giao dịch (Workspace Drawer Layout - 85vw Width)

Khi click nút **"Nhập kho"** hoặc **"Xuất kho"** trên Topbar, một Slide-out Drawer rộng `85vw` sẽ mở trượt từ bên phải với bố cục chi tiết:

#### 1. Header (Cố định phía trên - Sticky Header)
*   **Tiêu đề**: `"Tạo phiếu nhập kho vật tư"` / `"Tạo phiếu xuất kho vật tư"`.
*   **Thông tin mã phiếu**: Tự động sinh mã tạm thời theo định dạng (ví dụ: `NK-yymmdd-XXXX`).

#### 2. Thân ngăn kéo (Scrollable Body - chia làm 2 cột chính)
*   **Cột trái (Chi tiết phiếu - Form Fields)**:
    *   *Thông tin chung*: Ngày giao dịch (Datetime-local), Nhà cung cấp (Nhập kho) / Dự án (Xuất kho), Người giao/nhận, Ghi chú.
    *   *Lưới danh sách vật tư (Multi-Line Item Table)*: Bảng lưới hỗ trợ thêm mới dòng, xóa dòng. Mỗi dòng gồm:
        1.  Mã/Tên vật tư (Searchable Combobox).
        2.  Số lượng nhập/xuất.
        3.  Đơn giá & Thành tiền.
        4.  Vị trí phân bổ (Click mở Sơ đồ kho mini để gán Zone/Slot/Level).
*   **Cột phải (Trực quan & Gợi ý Vị trí - Analytics & Map)**:
    *   *Sơ đồ kho thông minh (WarehouseMiniMap)*: Hiển thị sơ đồ lưới 2D của vị trí kho đang chọn. Click trực tiếp vào ô kho trên bản đồ để tự động gán vào dòng vật tư đang chỉnh sửa ở cột trái.
    *   *Bảng chi tiết tồn kho khả dụng tại các ô*: (Dành riêng cho Xuất kho) hiển thị danh sách các ô kho hiện có tồn của vật tư được chọn để thủ kho chọn nhanh nguồn xuất.
    *   *Khung Gợi ý Vị trí & Đơn giá gần nhất* (Dành cho Nhập kho) giống như bản thiết kế hiện tại.

#### 3. Thanh hành động (Cố định phía dưới - Sticky Footer Actions)
*   Nằm cố định dưới chân ngăn kéo, hiển thị tổng tiền, tổng khối lượng và các nút bấm hành động:
    *   `[Hủy bỏ]`: Đóng drawer, cảnh báo nếu form có dữ liệu thay đổi chưa lưu.
    *   `[Làm mới]`: Xóa trắng form để nhập lại từ đầu.
    *   `[Xác nhận Nhập/Xuất kho]`: Gửi dữ liệu mutation lên backend. Hiển thị hiệu ứng Spinner ngay trên nút khi đang gửi.
