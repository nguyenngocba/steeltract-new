# Báo cáo Tái thiết Giao diện: EPIC 9.0 — Planning Workspace Reconstruction

Date: 2026-07-21
Status: **COMPLETED & CERTIFIED**

---

## 1. Tóm tắt Thực thi (Executive Summary)

Module **Planning (Kế hoạch tổng thể)** đã được tái thiết toàn diện từ trạng thái stub/placeholder ban đầu thành một module vận hành hoàn chỉnh, đồng bộ 100% về mặt thẩm mỹ, nhịp bố cục và trải nghiệm người dùng với chuẩn mực **SteelTrack UI Canon** (Inventory, Production, Projects, Logistics, QC, Suppliers, Components).

Module Planning hiện tại được đăng ký đầy đủ các route chính thức trong `AppRouter.tsx` và hiển thị trực quan trong thanh điều hướng sidebar `navigation.config.ts`.

---

## 2. Các trang và Route được chuẩn hóa

Mỗi trang đều tập trung giải đáp duy nhất một câu hỏi nghiệp vụ quan trọng cho quản lý / lập kế hoạch:

| Route / Tab | Tên Tab | Nhịp giao diện UI Canon | Câu hỏi nghiệp vụ trực quan được giải đáp |
| --- | --- | --- | --- |
| `/planning`, `/planning/overview` | Tổng quan | KPI + Toolbar + Table + Analytics Rail | *"Cần lập kế hoạch / điều phối những gì hôm nay?"* |
| `/planning/master` | Kế hoạch tổng thể | KPI + Toolbar + Table + Analytics Rail | *"Hạng mục tổng thể dự án nào cần cân đối tiến độ?"* |
| `/planning/production` | Kế hoạch sản xuất | KPI + Toolbar + Table + Analytics Rail | *"Những lệnh sản xuất (MO) nào cần sắp xếp lịch chạy?"* |
| `/planning/capacity` | Năng lực xưởng | KPI + Toolbar + Table + Resource Rail | *"Dây chuyền / xưởng nào đang quá tải hoặc nhàn rỗi?"* |
| `/planning/material` | Nhu cầu vật tư (MRP) | KPI + Toolbar + Shortage Table + Risk Rail | *"Những vật tư nào đang thiếu hụt so với định mức?"* |
| `/planning/procurement` | Mua hàng | KPI + Toolbar + Purchase Demand Table | *"Cần tiến hành mua sắm những vật tư nào cho kế hoạch?"* |
| `/planning/schedule` | Lịch chạy hàng ngày | KPI + Toolbar + Daily Schedule Table | *"Những hạng mục nào cần chạy trong ngày hôm nay?"* |
| `/planning/calendar` | Lịch tuần | KPI + Toolbar + Weekly Calendar View | *"Khối lượng công việc nào được lên lịch trong tuần này?"* |
| `/planning/constraints` | Điểm nghẽn | KPI + Toolbar + Blockers Table + Blocker Rail | *"Những điểm nghẽn / rào cản nào đang khóa tiến độ?"* |
| `/planning/reports` | Báo cáo | KPI + Toolbar + Performance Report Table | *"Kết quả thực hiện kế hoạch và định hướng tiếp theo?"* |

---

## 3. Quy tắc Dữ liệu Thật & UI Primitives (Zero Fake Data)

- **Data Binding**: Sử dụng 100% dữ liệu thực được tổng hợp từ các backend API hiện có (`productionApi.orders()`, `getProjectsRuntime`, `getInventoryItems`, `getDispatchOrders`).
- **Constraint Handling**: Điểm nghẽn (Constraints) và thiếu hụt vật tư (MRP) được tính toán tự động dựa trên tồn kho khả dụng so với định mức tối thiểu và các lệnh bị đánh dấu phế phẩm/QC.
- **Empty States**: Khi không có dữ liệu cho từng tab hoặc bộ lọc trống, hệ thống hiển thị `CockpitEmptyState` giải thích rõ ngữ cảnh.
- **Pagination**: Mọi bảng dữ liệu đều được trang bị component `DataTablePagination` chuẩn hóa hỗ trợ đổi trang và quy định số dòng/trang (10, 20, 50).

---

## 4. Kết quả Kiểm tra (Verification Results)

- `pnpm -C apps/frontend build`: **PASS**
- `pnpm -C apps/backend-api build`: **PASS**
- `git diff --check`: **PASS**
