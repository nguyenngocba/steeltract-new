# Production Dashboard & Cockpit Design (Industrial MES Theme)

Giao diện người dùng (UI/UX) của phân hệ Sản xuất (MES) tuân thủ nghiêm ngặt **Hướng dẫn thiết kế Cockpit ERP** của SteelTrack (nền tối sang trọng, bo góc tròn 2xl, viền slate-800, màu nhấn cyan/emerald/amber mang hơi hướng công nghiệp hiện đại).

---

## 1. Các Chỉ Số KPI Cốt Lõi Trên Màn Hình Tổng Quan

Hàng KPI trên cùng có chiều cao cố định `h-[108px]` sử dụng component chung `<CockpitKpiCard />` bao gồm 5 thẻ thông tin:

1.  **Sản Lượng Hôm Nay (Output Today)** (Màu nhấn: Emerald)
    *   *Tiêu đề*: SẢN LƯỢNG HÔM NAY (TẤN)
    *   *Giá trị*: `28,4`
    *   *Mô tả*: `▲ 3,2 tấn (+12,7%) so với hôm qua`
2.  **Chỉ Số OEE Trung Bình (Factory OEE)** (Màu nhấn: Cyan)
    *   *Tiêu đề*: HIỆU SUẤT THIẾT BỊ (OEE)
    *   *Giá trị*: `82,4%`
    *   *Mô tả*: `▼ 0,8% so với mục tiêu ca`
3.  **Tỷ Lệ Đạt Chất Lượng (Quality Pass Rate)** (Màu nhấn: Indigo)
    *   *Tiêu đề*: ĐẠT CHẤT LƯỢNG QC
    *   *Giá trị*: `98,7%`
    *   *Mô tả*: `▲ 0,2% so với tháng trước`
4.  **Tỷ Lệ Hao Hụt (Scrap Rate)** (Màu nhấn: Amber)
    *   *Tiêu đề*: TỶ LỆ PHẾ LIỆU
    *   *Giá trị*: `2,1%`
    *   *Mô tả*: `Dưới định mức 0,4%`
5.  **Máy Dừng Hoạt Động (Active Downtimes)** (Màu nhấn: Red)
    *   *Tiêu đề*: CẢNH BÁO DỪNG MÁY
    *   *Giá trị*: `2`
    *   *Mô tả*: `1 sự cố máy cắt, 1 bảo trì`

---

## 2. Bố Cục Trang Quản Lý Sản Xuất (Shift Manager Cockpit Layout)

Trang Tổng quan sử dụng lưới bố cục linh hoạt (Fluid Responsive Grid) 12 cột, tối ưu cho màn hình Full HD và Ultrawide:

```text
+---------------------------------------------------------------------------------------+
|  KPI Card 1 (2.4 cols) | Card 2 (2.4 cols) | Card 3 (2.4 cols) | ... (5 Cards Total)  |
+----------------------------------------+----------------------------------------------+
|                                        |                                              |
|  Row 1 (col-span-8)                    |  Row 1 Sidebar (col-span-4)                  |
|  Biểu đồ "Biến động Sản lượng & OEE"   |  Bảng "Cảnh Báo & Dừng Máy"                  |
|  Chiều cao: h-[380px]                  |  Chiều cao: h-[380px]                        |
|                                        |                                              |
+----------------------------------------+----------------------------------------------+
|                                                                                       |
|  Row 2 (col-span-12)                                                                  |
|  Bảng hàng đợi "Danh sách lệnh đang gia công tại các Tổ Đội (Work Center Queue)"      |
|  Chiều cao: h-[420px]                                                                 |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

---

## 3. Giao Diện Cho Tổ Đội / Công Nhân Nhà Xưởng (Operator Screen)

Màn hình tại máy tính bảng (Tablet) hoặc màn hình TV treo phân xưởng được thiết kế đơn giản hóa tối đa để công nhân dễ dàng thao tác bằng găng tay bảo hộ hoặc quét mã vạch:

### 3.1. Chế Độ Bảng Điều Hành Công Việc (Execution Kanban Board)
*   **Cột 1: Chờ Vật Tư (Bị khóa)**: Hiển thị các lệnh sản xuất chưa đủ vật tư từ kho SX.
*   **Cột 2: Sẵn Sàng Chạy (Ready)**: Đã đủ vật tư, hiển thị màu xanh lá cây nhạt. Công nhân quét mã vạch để nhận việc.
*   **Cột 3: Đang Gia Công (Running)**: Hiển thị tên công nhân đang chạy máy, mã máy, nút nhấn dừng máy khẩn cấp (`Dừng ca / Báo sự cố`).
*   **Cột 4: Chờ QC Kiểm Tra (QC Gate)**: Tự động khóa cấu kiện để giám sát QC đến đo đạc kiểm tra.
*   **Cột 5: Đã Hoàn Thành (Done)**: Chờ xếp bãi bàn giao.

### 3.2. Form Ghi Nhận Sản Lượng Nhanh (Low Data-Entry Input Form)
*   Chỉ yêu cầu công nhân quét 2 mã QR:
    1.  Mã QR thẻ nhân viên (`workerCode`).
    2.  Mã QR dán trên bản vẽ chi tiết cấu kiện (`orderNo`).
*   Hệ thống tự động nhận diện công đoạn hiện tại, thời gian bắt đầu gá lắp/hàn, công nhân chỉ cần điền **Số lượng thực hiện** và **Số lượng phế liệu** (nếu có) bằng trường số thiết kế lớn.

---

## 4. Tích Hợp Truyền Dẫn Thời Gian Thực (Real-time Telemetry & Websockets)

Để màn hình OEE và Dừng máy cập nhật ngay lập tức mà không cần F5/tải lại trang:
*   **Backend-side**: Khi ghi nhận sự cố dừng máy (`MachineDowntime`), hệ thống emit một thông điệp nhỏ qua NestJS Gateway:
    ```json
    {
      "event": "machine.status.changed",
      "data": {
        "machineId": "MCH-CNC-01",
        "status": "DOWN",
        "downtimeCategory": "UNPLANNED_BREAKDOWN",
        "reason": "Kẹt phôi thép tấm"
      }
    }
    ```
*   **Frontend-side**: Lớp giao diện lắng nghe sự kiện qua WebSocket, tự động đổi màu trạng thái máy CNC-01 sang màu đỏ phát sáng (glowing red dot) và kích hoạt đếm giờ downtime tự động trên màn hình mà không cần gọi lại API danh sách toàn bộ máy.
*   **TanStack Query Refresh**: Tự động đánh dấu cache của dữ liệu hàng đợi là *stale* để tự động refetch ngầm khi công nhân đổi trạng thái trên bảng Kanban.
