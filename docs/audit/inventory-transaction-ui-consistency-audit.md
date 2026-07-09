# Báo cáo Kiểm toán Tính Nhất quán Giao diện Giao dịch Kho (Inventory Transaction UI Consistency Audit)

Tài liệu này đối chiếu tính đồng bộ và nhất quán về mặt giao diện người dùng (UI/UX) và data binding giữa hai nghiệp vụ **Nhập kho** và **Xuất kho** trong hệ thống SteelTrack.

---

## 1. Bảng So sánh Tính Nhất quán (UI Consistency Matrix)

| Thành phần | Nhập kho (Inbound) | Xuất kho (Outbound) | Nhất quán? | Đề xuất cải tiến & Đồng bộ |
| :--- | :--- | :--- | :---: | :--- |
| **Page Header** | Tiêu đề tab, nằm trong `InventoryTabWorkspace`. | Tiêu đề tab, nằm trong `InventoryTabWorkspace`. | **CÓ** | Giữ nguyên cấu trúc định tuyến của tab-workspace. |
| **Summary/KPI** | Sử dụng thẻ `OverviewMetricCard` tùy biến cục bộ, vẽ sparkline thủ công. | Sử dụng thẻ `CockpitKpiCard` chuẩn hóa từ thư mục shared. | **KHÔNG** | **Đồng bộ hóa**: Chuyển thẻ KPI bên Nhập kho sang dùng chung component `<CockpitKpiCard />` như Xuất kho. |
| **Form Section** | ModalShell ở giữa màn hình. Bố cục 2 cột. | ModalShell ở giữa màn hình. Bố cục 2 cột (chiều rộng thay đổi). | **KHÔNG** | **Đồng bộ hóa**: Cả hai form nên được chuyển đổi thành dạng ngăn kéo trượt rộng từ bên phải (`ModuleDetailDrawer` - kích thước `lg`) để tối ưu không gian hiển thị. |
| **Material Selector** |Dropdown `<select>` mặc định của HTML. | Dropdown `<select>` mặc định của HTML. | **CÓ** | Cả hai cần được thay thế bằng một component chọn vật tư thông minh có ô tìm kiếm nhanh (Searchable Combobox) (P1). |
| **Location Selector** | Chia tách thành 3 dropdown riêng biệt: Zone ➔ Slot ➔ Level. | - Nguồn: Ghép chung thành 1 dropdown: `Zone/Slot/Level - Qty`. <br>- Đích: Tách làm 3 dropdown. | **KHÔNG** | **Không nhất quán trầm trọng**: Cần đồng bộ hóa cách chọn vị trí. Đề xuất: Thiết kế lại bộ chọn vị trí dưới dạng lưới danh sách các ô kho (Grid/List Allocation) trực quan để thủ kho chọn nhanh. |
| **Line-item Table** | Chỉ hỗ trợ duy nhất 1 dòng vật tư cho mỗi phiếu giao dịch. | Chỉ hỗ trợ duy nhất 1 dòng vật tư cho mỗi phiếu giao dịch. | **CÓ** | Hạn chế này cần được nâng cấp ở cả hai form để hỗ trợ **nhiều dòng vật tư (Multi Line Items)** trên cùng một phiếu (P0). |
| **Validation** | Cảnh báo chênh lệch giá (>30%), cảnh báo chưa chọn vị trí lưu kho. | Cảnh báo xuất quá số lượng tồn tại ô kho nguồn đã chọn. | **CÓ** | Validation hoạt động tốt ở cả hai bên, nhưng cần đồng bộ hóa hiển thị thông báo lỗi ngay dưới chân các input tương ứng. |
| **Submit Action** | Nút màu xanh `"Xác nhận nhập kho"`, vô hiệu hóa khi pending. | Nút màu xanh `"Xác nhận xuất kho"`, vô hiệu hóa khi pending. | **CÓ** | Đồng bộ hóa hành vi chặn double-submit và hiệu ứng loading trên nút bấm. |
| **History Table** | Cột bắt đầu bằng `Mã phiếu nhập`. Hiển thị đơn giá và ĐVT của vật tư đầu tiên ngay trên bảng chính. | Cột bắt đầu bằng `Ngày xuất`. Không hiển thị ĐVT và đơn giá trực tiếp trên bảng. | **KHÔNG** | **Đồng bộ hóa cột bảng**: Cột bảng lịch sử phải được đồng bộ về thứ tự cột (Ngày giao dịch ➔ Mã phiếu ➔ Loại giao dịch ➔ Đối tác/Công trình ➔ Khối lượng ➔ Giá trị ➔ Trạng thái). Không hiển thị trực tiếp Đơn giá/ĐVT của dòng lẻ trên bảng giao dịch tổng hợp. |
| **Empty/Loading** | Sử dụng Spinner và thông báo cục bộ. | Sử dụng Spinner và thông báo cục bộ. | **CÓ** | Đồng bộ hóa việc dùng chung các component chỉ báo trạng thái trống (`CockpitEmptyState`) và loading. |

---

## 2. Phân tích các Component có khả năng tái sử dụng (Reusable Components)

Để tránh việc lặp lại mã nguồn và tăng cường tính bảo trì, các thành phần giao diện sau đây nên được tách ra thành các component dùng chung cho cả hai nghiệp vụ:

1.  **`<TransactionWorkspaceLayout />`**:
    Component khung bao ngoài (Shell) cho cả hai trang nghiệp vụ, quản lý việc chia tỷ lệ màn hình (12-column grid), thanh bộ lọc (Filter Bar) phía trên và khu vực bảng lịch sử giao dịch.
2.  **`<MaterialComboboxSelector />`**:
    Component chọn vật tư thông minh, tích hợp tìm kiếm nhanh theo mã/tên vật tư và hiển thị kèm theo đơn vị tính và tổng tồn kho khả dụng hiện tại.
3.  **`<LocationAllocationGrid />`**:
    Lưới hiển thị danh sách các vị trí kho chính (`MAIN`) hoặc kho sản xuất (`PRODUCTION`), cho phép thủ kho tích chọn trực tiếp và tự động phân bổ số lượng nhập/xuất tại từng ô kho thay vì chọn qua các dropdown rời rạc.
4.  **`<TransactionAttachmentDrawer />`**:
    Ngăn kéo xem và tải lên tài liệu đính kèm giao dịch kho dùng chung cho mọi loại nghiệp vụ (Nhập, Xuất, Điều chuyển, Kiểm kê).
