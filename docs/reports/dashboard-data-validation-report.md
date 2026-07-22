# Báo cáo Kiểm tra & Xác thực Dữ liệu (KPI Validation Matrix)

Date: 2026-07-22
Auditor: Antigravity AI
Status: **CERTIFIED & ALIGNED**

---

## 1. Mục tiêu (Objective)
Bảo đảm toàn bộ 8 chỉ số KPI điều hành hiển thị trên **Executive Dashboard** phản ánh chính xác 100% công thức nghiệp vụ và nguồn dữ liệu từ các phân hệ chức năng tương ứng, loại bỏ hoàn toàn tính toán độc lập hoặc dữ liệu sai lệch.

---

## 2. Ma trận Xác thực KPI (KPI Validation Matrix)

| Chỉ số KPI hiển thị | Phân hệ gốc | Nguồn API & Phương thức | Công thức nghiệp vụ & Điều kiện | Cách xác thực chéo |
| --- | --- | --- | --- | --- |
| **Giá trị tồn kho** | Inventory | `useInventoryOverview` | Tổng giá trị kho thực tế: `summary.totalValue` | Khớp 100% với KPI "Tổng giá trị tồn kho" tại trang /inventory. |
| **Vật tư sắp hết** | Inventory | `getInventoryItems` | Đếm số lượng mã vật tư có `quantity <= minQuantity` | Khớp với danh sách cảnh báo thiếu hụt tại trang /inventory. |
| **Lệnh SX đang chạy** | Production | `productionApi.orders` | Đếm số lệnh MO có status là `'RUNNING'` hoặc `'IN_PROGRESS'` | Khớp với số lượng MO đang sản xuất tại xưởng sản xuất. |
| **Dự án triển khai** | Projects | `getProjectsRuntime` | Số lượng công trình ở trạng thái `'ACTIVE'` hoặc tiến độ &lt; 100% | Khớp với danh sách dự án đang thi công tại trang /projects. |
| **Giao hàng hôm nay** | Logistics | `getDispatchOrders` | Số lượng lệnh xe có status `'LOADING'`, `'IN_TRANSIT'`, `'ARRIVED'`, hoặc `'PLANNED'` | Khớp với tổng lượt xe chạy tuyến trong ngày. |
| **Sự cố QC / NCR** | QC | `getQcCockpit` | Tổng số phiếu sự cố NCR mở: `metrics.openNcrs` | Khớp với bộ KPI "NCR mở" trên bảng điều khiển QC. |
| **Chờ điều phối / duyệt**| Planning | `getDispatchDashboard` & `productionApi.orders` | Số chuyến xe chờ điều phối + Lệnh MO bị nghẽn (`scrapCount > 0`) | Khớp với hàng đợi phê duyệt kế hoạch. |
| **Sức khỏe hệ thống** | Admin | `systemApi.workflow` | Tỷ lệ phần trăm các bước workflow ở trạng thái `'OK'` | Khớp với báo cáo sức khỏe dịch vụ hệ thống. |

---

## 3. Cam kết Toàn vẹn Dữ liệu (Data Integrity)
- Không nhân bản logic nghiệp vụ.
- Sử dụng trực tiếp các hooks read-model chung (`useInventoryOverview`, `getQcCockpit`, `getProjectsRuntime`).
- Trong trường hợp mất kết nối API hoặc không có dữ liệu, hiển thị `CockpitEmptyState` giải thích rõ lý do.
