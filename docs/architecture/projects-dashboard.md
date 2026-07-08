# Projects UI/UX Dashboard & Gantt Chart Design

Bản thiết kế này chi tiết hóa giao diện người dùng (UI/UX) cho phân hệ Quản lý Dự án (PMS), tập trung vào trải nghiệm tương tác hiệu năng cao với cây công việc WBS, biểu đồ Gantt tương tác và chế độ cập nhật hiện trường gọn nhẹ (Site Mode).

---

## 1. UI/UX Dashboard Components

Giao diện PMS Dashboard được tổ chức thành một "Trung tâm chỉ huy" (Command Center) trực quan, hiển thị các chỉ số cốt lõi và cung cấp đường dẫn nhanh đến các khu vực điều hành.

```text
+---------------------------------------------------------------------------------+
| [PROJ-2026-001] Nhà máy Thép Đông Anh - Giai đoạn 1                             |
| Trạng thái: ACTIVE | Tiến độ: [========65%========] | Sức khỏe: 92/100 (GOOD)   |
+---------------------------------------------------------------------------------+
| [ Overview ] [ WBS & Gantt ] [ Materials ] [ Components ] [ Costs ] [ Site ]    |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  +---------------------------+  +---------------------------+  +-------------+  |
|  | TIẾN ĐỘ THI CÔNG          |  | DÒNG TIỀN & CHI PHÍ       |  | CẢNH BÁO    |  |
|  | - WBS: 65.0%              |  | - Dự toán: 1.2 tỷ VND     |  | [!] Trễ cột |  |
|  | - Cấu kiện lắp: 58.2%     |  | - Thực tế: 850 triệu VND  |  |     trục A  |  |
|  | - Vật tư cấp phát: 82.0%  |  | - Vượt định mức: 2.1%    |  | [!] Thiếu   |  |
|  | - Vận chuyển: 70.5%       |  | - Dự báo: 1.15 tỷ VND     |  |     bulong  |  |
|  +---------------------------+  +---------------------------+  +-------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | BIỂU ĐỒ GANTT & CÂY CÔNG VIỆC WBS                                         |  |
|  |                                                                           |  |
|  | [Thêm Task] [Cân Bằng Lịch] [Auto WBS]                      Scale: [Tuần] |  |
|  | +------------------------------------+----------------------------------+ |  |
|  | | Task Name           | Progress | % | Jul 01 | Jul 05 | Jul 10 | Jul 15 | |  |
|  | +---------------------+----------+---+--------+--------+--------+--------+ |  |
|  | | - Cổ móng trục A    | [======] | 100| ======>|        |        |        | |  |
|  | |   - Lắp bulong neo  | [======] | 100| ======>|        |        |        | |  |
|  | |   - Rót vữa móng    | [==    ] | 30 |        |=======>|        |        | |  |
|  | | - Lắp dựng khung H  | [      ] | 0  |        |        |=======>|        | |  |
|  | +------------------------------------+----------------------------------+ |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```

### 1.1. Executive Health Panels (Bảng chỉ số sức khỏe)
Hiển thị ở đầu tab `overview`, cung cấp cái nhìn nhanh:
- **Project Progress**: Tiến độ WBS vs Tiến độ Lắp dựng thực tế (phát hiện lệch tiến độ báo cáo).
- **Material Readiness Indicator**: Tỷ lệ vật tư đã sẵn sàng tại kho công trình.
- **Cost Variance (CV) & Schedule Variance (SV)**: Các chỉ số quản trị dự án chuẩn (EVMS - Earned Value Management System).

---

## 2. WBS Tree Grid & Gantt Chart UI Design

Đây là cấu phần tương tác phức tạp nhất của PMS. Hệ thống sử dụng một thư viện Gantt hiệu năng cao (hoặc tự phát triển trên nền Canvas/SVG tối ưu hóa) để render hàng nghìn tasks.

### 2.1. WBS Tree Grid (Bên trái)
- Hỗ trợ cây thư mục vô cấp (Summary Task -> Leaf Task).
- Tích hợp phím tắt để thao tác nhanh: `Tab` để thụt lề (make child task), `Shift + Tab` để lùi lề (make parent task), `Enter` để thêm dòng mới.
- Hỗ trợ hai chế độ nhập liệu:
  - **Simple Mode**: Chỉ nhập tên task, duration và smart date suggestion (tự động gợi ý ngày dựa trên task trước).
  - **Advanced Mode**: Nhập đầy đủ thông tin định mức vật tư, cấu kiện, tài nguyên và dependencies trong một side drawer.

### 2.2. Interactive Gantt Chart (Bên phải)
- **Kéo thả thời gian (Drag & Drop)**: Người dùng có thể kéo toàn bộ thanh tiến độ để thay đổi ngày bắt đầu/kết thúc, hoặc kéo mép phải để thay đổi thời lượng (Duration).
- **Vẽ liên kết Dependency trực quan**: Người dùng click vào đầu/cuối của thanh tiến độ này và nối sang thanh tiến độ khác để tạo mối liên kết `FS`, `SS`, `FF`.
- **Baseline View (Đường cơ sở)**: Hiển thị một đường màu xám mờ bên dưới thanh tiến độ hiện tại để so sánh trực quan lịch trình thực tế đang chạy so với kế hoạch ban đầu (Baseline).

---

## 3. Site Mode (Giao diện Hiện trường/Công trường)

Chế độ Site Mode được tối ưu hóa đặc biệt cho thiết bị di động (Responsive mobile layout) để kỹ sư hiện trường cập nhật nhanh tiến độ:

- **Bộ lọc công việc thông minh**: Tự động lọc ra danh sách các công việc "Cần làm hôm nay" hoặc "Đang bị chậm tiến độ" tại khu vực kỹ sư được phân công.
- **Low-Friction Progress Slider**: Thanh trượt tiến độ đơn giản từ 0% đến 100%. Khi kéo trượt, hệ thống tự động tính toán và hiển thị số lượng cấu kiện đã lắp đặt tương ứng.
- **Photo Upload & Verification**: Cho phép kỹ sư chụp ảnh mối hàn hoặc cấu kiện đã lắp dựng trực tiếp từ camera điện thoại, tải lên hệ thống để làm bằng chứng nghiệm thu. Ảnh tải lên tự động được gắn thẻ GPS (Geotagging) để xác minh vị trí chụp ảnh khớp với công trường.

---

## 4. Phân Tích Rủi Ro Giao Diện (UI/UX Risks)

- **UI Lag on Gantt Scale**:
  - *Rủi ro*: Khi dự án có > 5,000 tasks, việc render đồng thời hàng nghìn phần tử DOM (HTML elements) cho các thanh Gantt gây treo trình duyệt.
  - *Giải pháp*: Sử dụng **Canvas-based Rendering** hoặc **Virtual Scrolling**. Chỉ render các dòng công việc và các thanh tiến độ đang nằm trong khung nhìn hiển thị của người dùng (Viewport). Khi người dùng cuộn trang, hệ thống tự động tái sử dụng các phần tử DOM cũ và cập nhật lại dữ liệu (DOM recycling).
- **Đồng bộ hai chiều bị lệch (Two-Way Sync Conflict)**:
  - *Rủi ro*: Người dùng vừa sửa tiến độ trên bảng WBS Grid vừa kéo thả trên biểu đồ Gantt cùng lúc gây xung đột dữ liệu trên giao diện.
  - *Giải pháp*: Áp dụng mô hình **Single Source of Truth** thông qua trạng thái chung (Zustand store). Mọi thao tác kéo thả trên Gantt hay nhập số trên Grid đều phát một action cập nhật vào Store. Store sẽ tính toán lại lịch trình và kích hoạt rerender đồng bộ cho cả hai cấu phần.

---

## 5. Chỉ Số Giám Sát Operations Center

- **`pms.ui.gantt_render_time_ms`**: Thời gian trình duyệt vẽ xong biểu đồ Gantt sau khi nhận dữ liệu. (Cảnh báo: > 500ms).
- **`pms.ui.site_upload_failures`**: Số ca kỹ sư hiện trường không tải được ảnh báo cáo tiến độ lên server. (Cảnh báo: > 5%).

---

## 6. Chỉ Số Hiệu Năng Runtime

- **WBS Load Time**: Thời gian tải và hiển thị trang WBS Grid dưới 1.2 giây cho dự án có 1,000 tasks.
- **Gantt Scroll Smoothness**: Tỷ lệ khung hình render (FPS) khi cuộn nhanh Gantt chart đạt tối thiểu 45 FPS (Mục tiêu: 60 FPS).

---

## 7. Cơ Hội Tích Hợp AI

- **AI Gantt Auto-Optimizer**: Khi dự án xảy ra trễ tiến độ lớn tại một mốc quan trọng, người dùng click nút "AI Optimize", AI sẽ chạy thuật toán tối ưu hóa tài nguyên thi công, tự động sắp xếp lại các mối quan hệ dependency không găng và đề xuất một lịch trình Gantt mới giúp dự án về đích đúng hạn với chi phí phát sinh thấp nhất.

---

## 8. Sprint Roadmap

- **Sprint 1**: Xây dựng UI WBS Tree Grid hỗ trợ phím tắt và kéo thả thụt lề cấp độ.
- **Sprint 2**: Tích hợp SVG/Canvas Gantt chart hiển thị lịch trình và các liên kết dependency trực quan.
- **Sprint 3**: Hoàn thiện Responsive Site Mode hỗ trợ chụp ảnh hiện trường và đồng bộ tiến độ thời gian thực.
