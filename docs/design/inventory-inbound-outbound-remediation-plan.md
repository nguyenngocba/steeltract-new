# Kế hoạch Khắc phục & Triển khai Giao diện Nhập/Xuất kho (Remediation Plan)

Tài liệu này chi tiết hóa kế hoạch triển khai, danh sách file dự kiến sửa đổi và lộ trình thực hiện nâng cấp giao diện **Nhập kho** và **Xuất kho**.

---

## 1. Đánh giá Mức độ Ưu tiên (Prioritized Tasks)

Các nhiệm vụ cải tiến được phân loại theo mức độ ảnh hưởng đến vận hành:

### Mức P0 (Ảnh hưởng đến độ chính xác dữ liệu & Năng suất vận hành cốt lõi)
*   **Hỗ trợ giao dịch nhiều dòng vật tư (Multi-Line Inbound/Outbound)**: Nâng cấp form cho phép nhập/xuất nhiều vật tư trong một lần tạo phiếu duy nhất để khớp hóa đơn/phiếu giao hàng thực tế.
*   **Giải pháp xuất kho chia tách vị trí (Outbound Split Location)**: Cho phép xuất một vật tư từ nhiều vị trí kho khác nhau nếu một vị trí đơn lẻ không đủ số lượng tồn yêu cầu.

### Mức P1 (Gây nhầm lẫn hoặc thao tác dư thừa cho thủ kho)
*   **Chuyển đổi Modal thành Slide-out Drawer**: Thay thế các hộp thoại Modal ở giữa màn hình bằng ngăn kéo trượt rộng bên phải (`ModuleDetailDrawer`, kích thước `lg`) theo chuẩn Enterprise UI Guidelines.
*   **Bộ chọn vật tư thông minh (Searchable Combobox)**: Thay thế thẻ `<select>` mặc định bằng bộ chọn vật tư có tính năng tìm kiếm nhanh theo mã/tên.
*   **Đồng bộ hóa bộ chọn vị trí**: Đồng bộ bộ chọn vị trí của cả hai form thành cấu trúc lưới ô kho trực quan, loại bỏ dropdown gộp chuỗi cồng kềnh bên Xuất kho.
*   **Cảnh báo rời trang khi có thay đổi chưa lưu (Unsaved Changes Guard)**: Thêm xác nhận cảnh báo khi thủ kho đóng ngăn kéo nhập liệu lúc đang nhập dở dang.

### Mức P2 (Tính nhất quán giao diện & Trải nghiệm Responsive)
*   **Đồng bộ cột bảng lịch sử giao dịch**: Sắp xếp lại các cột của bảng lịch sử phiếu nhập và phiếu xuất theo cùng một thứ tự logic.
*   **Sử dụng thẻ chỉ số chuẩn hóa**: Chuyển thẻ KPI bên trang Nhập kho sang dùng chung component `<CockpitKpiCard />`.
*   **Sử dụng component phân trang dùng chung**: Chuyển đổi sang `<DataTablePagination />` cho cả hai trang lịch sử.

### Mức P3 (Cải thiện thẩm mỹ & Trực quan)
*   Tối ưu hóa hiệu ứng hover neon cyan trên bảng lịch sử giao dịch.
*   Làm mờ sparkline trên thẻ KPI về mức opacity 3% theo đúng hướng dẫn thiết kế tối giản.

---

## 2. Danh sách các File dự kiến sửa đổi ở Sprint triển khai

| File cần sửa | Phạm vi | Lý do sửa đổi |
| :--- | :--- | :--- |
| `apps/frontend/src/app/shell/topbar/AppTopbar.tsx` | Frontend | Khai báo lại cơ chế trigger mở Slide-out Drawer thay vì trigger Modal. |
| `apps/frontend/src/modules/inventory/components/InventoryGlobalActionBar.tsx` | Frontend | Thay đổi logic click nút "Nhập kho"/"Xuất kho" để kích hoạt mở ngăn kéo Drawer tương ứng. |
| `apps/frontend/src/modules/inventory/pages/tabs/InventoryInboundPage.tsx` | Frontend | - Chuyển sang sử dụng `<CockpitKpiCard />` và `<DataTablePagination />`. <br>- Đồng bộ cột bảng lịch sử.<br>- Nhúng form tạo mới dạng Drawer. |
| `apps/frontend/src/modules/inventory/pages/tabs/InventoryOutboundPage.tsx` | Frontend | - Chuyển sang sử dụng `<DataTablePagination />`. <br>- Đồng bộ cột bảng lịch sử.<br>- Nhúng form tạo mới dạng Drawer. |
| `apps/frontend/src/modules/inventory/components/InventoryTransactionModals.tsx` | Frontend | Phân tách form nhập/xuất cũ khỏi Modal và cấu trúc lại thành các component form độc lập phục vụ cho Drawer (`InboundTransactionForm` và `OutboundTransactionForm`) hỗ trợ multi-line. |

*(Lưu ý: Không cần thay đổi bất kỳ file backend hay schema prisma nào vì cấu trúc API hiện tại đã hoàn toàn tương thích).*

---

## 3. Lộ trình triển khai khuyến nghị (Timeline Estimation)

Chúng tôi khuyến nghị chia việc thực hiện nâng cấp thành **2 Sprint** độc lập để kiểm soát rủi ro vận hành tốt nhất:

### Sprint 1: Chuẩn hóa Shared Components & Giao diện Nhập kho (WMS-Inbound)
*   **Thời gian**: 1 Sprint.
*   **Mục tiêu**:
    - Xây dựng component chọn vật tư thông minh (`SearchableMaterialSelector`) và bộ chọn vị trí kho tinh gọn.
    - Chuyển đổi trang Nhập kho sang sử dụng KPI chuẩn, Phân trang chuẩn và form tạo mới dạng Slide-out Drawer hỗ trợ nhiều dòng vật tư (Multi-Line).
    - Tiến hành kiểm thử khép kín luồng Nhập kho.

### Sprint 2: Hoàn thiện Giao diện Xuất kho & Kiểm thử liên thông (WMS-Outbound)
*   **Thời gian**: 1 Sprint.
*   **Mục tiêu**:
    - Chuyển đổi trang Xuất kho và form tạo mới dạng Slide-out Drawer hỗ trợ nhiều dòng vật tư.
    - Tích hợp tính năng xuất kho từ nhiều vị trí (Split Location Allocation).
    - Đồng bộ bảng lịch sử giao dịch.
    - Kiểm thử hiệu năng khi tải danh sách lớn và kiểm thử liên thông (Nhập ➔ Xuất ➔ Cập nhật Dashboard).
