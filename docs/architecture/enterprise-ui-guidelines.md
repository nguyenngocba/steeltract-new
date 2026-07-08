# Enterprise UI & Cockpit Guidelines (EPIC210)

Hướng dẫn tiêu chuẩn phát triển giao diện người dùng tối giản (Minimalist Industrial Cockpit Theme) áp dụng đồng bộ trên toàn bộ ứng dụng SteelTrack Frontend. Thiết kế này lấy phân hệ quản lý kho WMS/Inventory làm tiêu chuẩn cốt lõi (Reference UI Standard).

---

## 1. Bố cục Cockpit Layout & Hệ lưới Grid Hệ thống

Để tối ưu hóa không gian hiển thị thông số kỹ thuật cho các kỹ sư và điều hành viên, giao diện phải đáp ứng các tiêu chuẩn bố cục sau:

1.  **Fluid Width (Không giới hạn chiều rộng)**:
    Tuyệt đối không sử dụng các class giới hạn chiều rộng tĩnh (`container`, `max-w-7xl`, `mx-auto` căn giữa). Root container của trang phải luôn đặt ở cấu hình:
    ```tsx
    <div className="w-full min-w-0 flex-1 space-y-1 p-2">
    ```
2.  **Khoảng cách cực nhỏ (High Density Spacing)**:
    Sử dụng khoảng cách siêu nhỏ `gap-1` và `space-y-1` để dồn mật độ thông tin lên mức cao nhất, giúp xem toàn bộ thông tin trên một màn hình không cần cuộn (Single Screen Experience).
3.  **Tỷ lệ chia lưới (12-Column Responsive Grid)**:
    Bố cục trang chia thành 12 cột động:
    ```tsx
    <div className="grid grid-cols-12 gap-1">
      <div className="col-span-12 2xl:col-span-8">Cột chính bên trái</div>
      <div className="col-span-12 2xl:col-span-4">Cột phụ bên phải</div>
    </div>
    ```

---

## 2. Thanh Sidebar & Tiêu đề Topbar

1.  **Chiều cao Topbar**: Khống chế cứng chiều cao Topbar ở mức `50px`. Loại bỏ các mô tả rườm rà. Tiêu đề Topbar chỉ hiển thị 2 dòng: Tên Module (chữ in hoa nhỏ) và Tên Workspace hoạt động hiện tại (ví dụ: `VẬT TƯ KHO` > `Thép tấm`).
2.  **Sidebar thu gọn (64px Mini Icon Rail)**:
    Khi thu gọn, sidebar chuyển thành dải icon rộng đúng `64px`. Khi click vào icon sẽ mở menu flyout hiển thị các phân mục con, tự động đóng khi click ra ngoài hoặc chọn xong tuyến.

---

## 3. Thẻ Chỉ số Hiệu năng (KPI Cards)

Mọi KPI Card phải sử dụng component chuẩn hóa `<CockpitKpiCard />` với cấu hình kỹ thuật:

*   **Chiều cao**: Cố định `h-[108px]`.
*   **Cấu trúc Typography dọc (Vertical Hierarchy)**:
    *   **Nhãn (Label)**: `text-[12px] font-medium text-slate-400` nằm ở trên cùng (không dùng chữ in hoa toàn bộ).
    *   **Giá trị chính (Primary Value)**: `font-bold tabular-nums text-[38px] xl:text-[42px] leading-none tracking-tight text-white` nằm ở trung tâm. Đơn vị phải viết liền kề (ví dụ: `42 ngày`, `15.970,5 tấn`, `18 chuyền`).
    *   **Chỉ số biến động (Delta Note)**: `text-[11px]` nằm dưới cùng. Định dạng chuẩn: `▲ 2,4 ngày (+6,1%)` hoặc `▼ 2 cảnh báo (-22%)`. Sử dụng màu xanh emerald (`text-emerald-400`) cho tăng trưởng tích cực, và màu đỏ (`text-red-400`) cho suy giảm tiêu cực.
*   **Trang trí nền**: Biểu đồ sparkline mờ ẩn phía sau với độ đục tối đa 3% (`opacity-[0.03]`). Không sử dụng icon lớn trang trí.

---

## 4. Biểu đồ Phân tích Nhanh (Quick Analytics Charts)

Sử dụng component `<CockpitChartCard />` với cấu hình:
*   Chiều cao thẻ: `h-[170px]`.
*   Chiều cao vùng biểu đồ thực tế (Viewport): `h-[74px]`.
*   Tích hợp thanh cuộn dọc tự động `overflow-y-auto` để đảm bảo nhãn và biểu đồ không bao giờ bị đè lấn hoặc mất góc.

---

## 5. Bảng Dữ liệu & Phân trang (Tables & Pagination)

Bảng dữ liệu phải được thiết kế với giao diện phẳng, trong suốt và tối giản:

1.  **Padding ô (Cell Padding)**: Khống chế ở mức `px-4 py-2.5 text-xs` để hiển thị được nhiều dòng dữ liệu nhất.
2.  **Hiệu ứng Hover Row**: Hover dòng phải có viền và nền chuyển sáng màu neon cyan đặc trưng (`hover:bg-cyan-500/5 transition-colors`).
3.  **Phân trang chuẩn hóa**: Sử dụng component `<DataTablePagination />` hiển thị:
    *   Số dòng hiển thị mỗi trang (Select Rows per page: 10, 20, 50).
    *   Số trang hiện tại dạng `Trang X trên Y`.
    *   Nút chuyển trang nhanh (`<<`, `<`, `>`, `>>`).

---

## 6. Ngăn kéo thông tin (Slide-out Drawers)

Sử dụng shared component `<ModuleDetailDrawer />` mở trượt từ bên phải thay vì sử dụng hộp thoại modal ở giữa màn hình:

*   **Standard Sizes (Kích thước Chuẩn)**:
    *   `lg` (85vw hoặc 1040px): Dành cho xem chi tiết thực thể phức tạp như [Projects Detail Drawer](file:///opt/projects/steeltrack/apps/backend-api/src/modules/projects/repositories/projects.repository.ts) hoặc Material Detail.
    *   `sm` (45vw hoặc 560px): Dành cho thao tác nhanh như xem lịch sử chỉnh sửa, thông tin đính kèm hoặc Return Request.
*   **Bố cục bên trong**: Sticky Header cố định phía trên chứa tiêu đề và nút đóng, vùng nội dung bên dưới có thanh cuộn độc lập (`overflow-y-auto`) và sticky Footer chứa các nút hành động lưu/duyệt.
