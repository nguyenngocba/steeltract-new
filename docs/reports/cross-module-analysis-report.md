# Báo cáo Phân tích Liên Phân hệ (Cross-Module Analysis Report)

Date: 2026-07-22
Auditor: Antigravity AI
Status: **COMPLETED & ALIGNED**

---

## 1. Ma trận Tương tác Liên Phân hệ (Cross-Module Relationship Matrix)

| Chỉ số Phân tích | Phân hệ Tác động | Phân hệ Bị ảnh hưởng | Logic Nghiệp vụ & Cách quy đổi dữ liệu | Điểm Điều hướng Xử lý |
| --- | --- | --- | --- | --- |
| **Inventory ➔ Production** | Kho hàng & MRP | Xưởng Sản xuất | Quét danh sách vật tư thiếu hụt (`lowStockItems`) so với cấu kiện và tiêu đề của lệnh MO đang gia công. | Trang Gia công Sản xuất (`/production`) |
| **Production ➔ Logistics** | Xưởng Sản xuất | Giao vận điều phối | Tìm lệnh gia công có trạng thái `'COMPLETED'` nhưng chưa phát sinh chuyến vận chuyển tương ứng cho dự án. | Trang Điều phối Giao vận (`/logistics`) |
| **Projects ➔ Production** | Quản lý Công trình | Xưởng Sản xuất | So sánh tiến độ WBS công trình với tiến độ hoàn thành MO trung bình của dự án tương ứng. | Trang Tiến độ Dự án (`/projects`) |
| **QC ➔ Logistics** | Chất lượng QC | Giao vận điều phối | Chặn giao hàng đối với các chuyến xe đi công trình đang có sự cố NCR kiểm định chưa đóng. | Trang Biên bản QC (`/qc`) |

---

## 2. Cam kết Toàn vẹn Dữ liệu Nghiệp vụ
- **Không tự tạo dữ liệu xu hướng giả**: Các con số ảnh hưởng, số lượng lệnh gia công nghẽn, và số chuyến xe bị QC Hold đều lấy trực tiếp từ query cache thực tế (`productionOrders`, `dispatchOrders`, `qcCockpit`).
- **Phục vụ quyết định tức thì**: Các phân tích này trực tiếp kích hoạt trạng thái cho bộ quyết định Executive Decisions ở cuối trang chủ điều hành.
