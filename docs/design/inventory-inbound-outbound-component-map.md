# Bản đồ Cấu trúc Thành phần Giao diện (Component Map)

Tài liệu này định nghĩa cấu trúc phân rã các component giao diện cho tính năng **Nhập kho** và **Xuất kho**, tối ưu hóa tính tái sử dụng và đồng bộ hóa trải nghiệm người dùng.

---

## 1. Bản đồ Component Tái sử dụng (Shared & Reusable Components)

Dưới đây là các thành phần giao diện dùng chung giữa Nhập kho, Xuất kho và các phân hệ khác của WMS:

```
[Phân hệ Inventory]
   ├── [Nhập kho Workspace]
   │      ├── <CockpitKpiCard /> (Shared)
   │      ├── <TransactionHistoryTable /> (Đồng bộ cấu trúc)
   │      ├── <DataTablePagination /> (Shared)
   │      └── <ModuleDetailDrawer /> (Shared) ➔ Chứa <InboundTransactionForm />
   │
   └── [Xuất kho Workspace]
          ├── <CockpitKpiCard /> (Shared)
          ├── <TransactionHistoryTable /> (Đồng bộ cấu trúc)
          ├── <DataTablePagination /> (Shared)
          └── <ModuleDetailDrawer /> (Shared) ➔ Chứa <OutboundTransactionForm />
```

### A. Các Component Shared có sẵn (Sử dụng lại trực tiếp)
*   **`<CockpitKpiCard />`** tại [shared/ui/cockpit](file:///opt/projects/steeltrack/apps/frontend/src/shared/ui/cockpit.tsx):
    Dùng để hiển thị 5 thẻ chỉ số hiệu năng trên đầu trang Nhập kho (hiện tại Nhập kho đang dùng thẻ tự viết tùy biến).
*   **`<DataTablePagination />`** tại [shared/ui/data-table](file:///opt/projects/steeltrack/apps/frontend/src/shared/ui/data-table.tsx):
    Dùng để phân trang bảng lịch sử giao dịch (thay thế cho `MaterialsPagination` tự viết trong trang Inbound/Outbound).
*   **`<ModuleDetailDrawer />`** tại [shared/ui/modules](file:///opt/projects/steeltrack/apps/frontend/src/shared/ui/modules.tsx):
    Khung ngăn kéo trượt mở rộng từ bên phải, dùng làm vỏ bọc ngoài cho cả form nhập/xuất kho mới.
*   **`<WarehouseMiniMap />`**:
    Bản đồ 2D trực quan hiển thị vị trí các ô kho và tầng lưu trữ.
*   **`<InventoryTransactionAttachmentButton />` & `<InventoryTransactionAttachmentDrawer />`**:
    Các nút bấm và drawer quản lý xem/tải lên hồ sơ đính kèm của phiếu giao dịch.

---

## 2. Các Component mới cần xây dựng (New Unified Components)

*   **`<SearchableMaterialSelector />`**:
    *   *Mô tả*: Hộp chọn vật tư tích hợp tìm kiếm nhanh theo mã/tên (Combobox).
    *   *Data Binding*: Kết nối với hook `useInventoryItems()` để tải danh mục vật tư. Hiển thị đơn vị tính và tổng tồn kho khả dụng hiện tại dưới dạng nhãn phụ.
*   **`<MultiLineTransactionGrid />`**:
    *   *Mô tả*: Bảng lưới cho phép thêm mới/xóa dòng vật tư trực tiếp trên giao diện tạo phiếu.
    *   *Logic*: Tự động tính toán tổng số lượng, thành tiền, tiền thuế VAT và tổng giá trị thanh toán của toàn bộ các dòng.
*   **`<LocationSelectorInline />`**:
    *   *Mô tả*: Bộ chọn vị trí kho tinh gọn, gộp 3 dropdown `Zone`, `Slot`, `Level` thành một cụm duy nhất có tích hợp hiển thị trạng thái đầy/trống của ô kho.

---

## 3. Khớp nối Dữ liệu Backend (Backend API Parity)

Bản thân API và Repository ở backend đã được thiết kế hỗ trợ giao dịch nhiều dòng vật tư thông qua quan hệ 1-N giữa `InventoryTransaction` và `InventoryTransactionItem`:
*   Schema Zod `createTransactionSchema` tại [inventory.dto.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/dto/inventory.dto.ts#L216) chấp nhận trường `items: z.array(transactionItemSchema).min(1)`.
*   Vì vậy, việc nâng cấp giao diện frontend hỗ trợ nhập nhiều dòng vật tư hoàn toàn tương thích và không cần chỉnh sửa bất kỳ logic API hay cơ sở dữ liệu nào ở backend.
