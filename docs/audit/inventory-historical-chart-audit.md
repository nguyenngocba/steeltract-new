# Báo cáo Kiểm toán Dữ liệu Biểu đồ Lịch sử Kho Vật tư

Bản báo cáo này đánh giá trạng thái và tính toàn vẹn của dữ liệu lịch sử hiển thị trên giao diện trang **Tổng quan kho** (`InventoryOverviewPage`) sau khi triển khai phân hệ **EPIC118.1 – Inventory UI Data Binding Remediation**.

---

## PHẦN 1 – Xác định toàn bộ chart/widget bị trống hoặc thiếu dữ liệu lịch sử

Dựa trên việc kiểm tra mã nguồn thực tế của trang **Tổng quan kho** tại [InventoryOverviewPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryOverviewPage.tsx), dưới đây là các biểu đồ và thẻ KPI có khả năng hiển thị trạng thái trống hoặc thông báo `"Chưa có dữ liệu lịch sử"`:

| Widget/Chart | Component | Hook | API Endpoint | API Field | Khoảng thời gian yêu cầu | Trạng thái thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Thẻ KPI: Mã vật tư (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Thẻ KPI: Vật tư chính (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Thẻ KPI: Vật tư phụ (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Thẻ KPI: Vật tư tiêu hao (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Thẻ KPI: Sắp hết hàng (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Thẻ KPI: Hết hàng (Trend/Delta)** | `OverviewMetricCard` | `useInventoryOverview` (Bị bypass qua hardcode) | Không có (Bypass ở FE) | Không có (Bypass ở FE) | 12 tháng gần đây | **Hiển thị `"Chưa có dữ liệu lịch sử"`** |
| **Biểu đồ: Biến động tồn kho (Delta Note)** | `quantityDelta` (phần text phụ của Chart) | `useInventoryOverview` | `GET /inventory/overview` | `stockTrend` | So sánh 2 điểm gần nhất (Daily) | **Hiển thị sai lệch so với bản chất nhãn tháng** |
| **Biểu đồ: Biến động tồn kho (Sparkline)** | `StockTrendChart` | `useInventoryOverview` | `GET /inventory/overview` | `stockTrend` | 6 điểm snapshot gần nhất | **Hiển thị được 4 điểm** (Dữ liệu thật ngắn hạn) |

---

## PHẦN 2 – Truy vết nguồn dữ liệu (Data Lineage & Trace)

### 1. Luồng dữ liệu cho 2 Thẻ KPI chính hoạt động bình thường (Tổng giá trị, Tổng khối lượng) và Sparkline biến động tồn kho
* **React Component**: `OverviewMetricCard` (Sparkline & Delta Note)
* **React Query Hook**: `useInventoryOverview(query)` tại [useInventoryReadModels.ts](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/hooks/useInventoryReadModels.ts)
* **API Endpoint**: `GET /inventory/overview`
* **Controller**: `InventoryController.getOverview` tại [inventory.controller.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.controller.ts)
* **Service/Reader**: `InventoryService.getOverview` -> `InventoryReadModelService.overview` tại [inventory-read-model.service.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory-read-model.service.ts)
* **Snapshot/Read Model**: 
  - `InventoryDashboardSnapshot` qua `InventoryRepository.inventoryOverviewTransactionMetrics()`
  - Điểm dữ liệu hôm nay được sinh động thêm tự động từ `InventoryMaterialSnapshot` (tổng hợp thực tế ngày hiện tại).
* **Repository**: `InventoryRepository.inventoryOverviewTransactionMetrics()` tại [inventory.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.repository.ts)
* **Database Truth**: 
  - Bảng `inventory_dashboard_snapshots` (Chứa các hàng snapshot từ ngày 2026-07-06 đến 2026-07-08).

### 2. Luồng dữ liệu bị đứt gãy đối với 6 Thẻ KPI còn lại (Mã vật tư, Nhóm phân loại, Cảnh báo kho)
* **React Component**: `OverviewMetricCard`
* **React Query Hook**: `useInventoryOverview` được gọi nhưng giá trị xu hướng (`kpiTrend.low`, `kpiTrend.out`, v.v.) và delta (`kpiDeltas.low`, `kpiDeltas.out`, v.v.) bị bypass trực tiếp bằng việc gán mảng rỗng `[]` và chuỗi `"Chưa có dữ liệu lịch sử"`.
* **API Endpoint**: `GET /inventory/overview` không trả về chuỗi lịch sử cho các trường này.
* **Snapshot/Read Model**: Bảng `inventory_dashboard_snapshots` chỉ lưu trữ `totalMaterials` và `lowStockCount` nhưng API của Read Model và Repository `inventoryOverviewTransactionMetrics` chỉ thực hiện lấy tổng và gom nhóm (`groupBy`) theo `snapshotDate` cho hai trường `inventoryValue` và `totalStock`. Bảng này hoàn toàn thiếu cấu trúc lưu trữ cho:
  - Phân loại vật tư theo nghiệp vụ (`PRIMARY`, `SECONDARY`, `CONSUMABLE`).
  - Số lượng vật tư hết hàng (`outOfStockCount`).

---

## PHẦN 3 – Đối chiếu dữ liệu thật (Database Parity check)

Truy vấn trực tiếp ở database PostgreSQL thông qua công cụ phân tích kiểm toán read-only:

1. **Tổng số Inventory Transaction**: `78` giao dịch.
2. **Ngày giao dịch cũ nhất**: `2025-01-25` (`NK-260625-00023`).
3. **Ngày giao dịch mới nhất**: `2026-07-09` (Hôm nay).
4. **Phân bố giao dịch theo loại (Transaction Types)**:
   * `IMPORT` (Inbound): 52 giao dịch.
   * `EXPORT` (Outbound): 20 giao dịch.
   * `TRANSFER` (Điều chuyển): 4 giao dịch.
   * `RETURN` (Trả hàng): 1 giao dịch.
   * `ADJUSTMENT` (Điều chỉnh tồn kho): 1 giao dịch.
5. **Giao dịch theo khoảng thời gian**:
   * Hơn 12 tháng trước (Trước `2025-07-09`): Có `5` giao dịch phát sinh từ tháng 1 đến tháng 5 năm 2025.
   * Trong vòng 12 tháng qua (Từ `2025-07-09` đến nay): `73` giao dịch.
6. **Timezone & Nhóm ngày**:
   * Các bản ghi lưu trữ ngày giao dịch dưới dạng cột `transactionDate TIMESTAMP WITH TIME ZONE` hoặc `TIMESTAMP` chuyển đổi về UTC trên DB.
   * Backend đang thực hiện gom nhóm trên múi giờ Việt Nam (UTC+7) bằng cách sử dụng `new Date()` cục bộ của server và chạy raw SQL `date_trunc('month', t."transactionDate")` gom nhóm theo múi giờ UTC mặc định của PostgreSQL. Điều này gây lệch múi giờ nếu có giao dịch phát sinh vào biên ngày (từ 00:00 đến 07:00 sáng UTC+7).

---

## PHẦN 4 – Phân loại nguyên nhân (Root Cause Classification)

Mỗi biểu đồ/widget bị trống hoặc hiển thị `"Chưa có dữ liệu lịch sử"` được phân loại cụ thể như sau:

### 1. Biến động tồn kho (Sparkline) & Delta Note của Giá trị / Khối lượng tồn
* **Phân loại**: `EXPECTED_EMPTY`
* **Lý do**: Đây là hành vi đúng về mặt logic nghiệp vụ và dữ liệu. Do hệ thống vừa chạy dọn dẹp dữ liệu nghiệp vụ (Business Data Cleanup) vào ngày `2026-06-24`, lịch sử lưu trữ của bảng `inventory_dashboard_snapshots` chỉ mới bắt đầu được ghi nhận bởi Background Engine từ ngày `2026-07-06` đến `2026-07-08` (3 ngày gần nhất). Vì khoảng thời gian có dữ liệu thực sự quá ngắn, biểu đồ hiển thị 4 điểm (bao gồm cả điểm realtime hôm nay) thay vì 12 điểm đầy đủ là trạng thái phản ánh chính xác lịch sử thực tế của DB.

### 2. Thẻ KPI: Mã vật tư, Sắp hết hàng, Hết hàng, Vật tư chính / phụ / tiêu hao (Trend/Delta)
* **Phân loại**: `UI_BINDING_ERROR` kết hợp với `SNAPSHOT_PAYLOAD_MISSING`
* **Lý do**: 
  - Về phía UI (`UI_BINDING_ERROR`): Có một lệnh early return cứng tại dòng 610 của [InventoryOverviewPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryOverviewPage.tsx) chặn đứng toàn bộ logic tính toán lịch sử kế thừa từ EPIC118. FE đã gán trực tiếp nhãn `"Chưa có dữ liệu lịch sử"` và mảng rỗng `[]` cho các thẻ KPI này, đồng thời bỏ qua toàn bộ khối code tính toán cuộn ngược số dư (rollback ledger) bên dưới.
  - Về phía Schema (`SNAPSHOT_PAYLOAD_MISSING`): API backend `GET /inventory/overview` chỉ cung cấp chuỗi xu hướng lịch sử cho Giá trị và Khối lượng. Bản thân schema của `InventoryDashboardSnapshot` không hỗ trợ lưu trữ số liệu lịch sử cho các nhóm phân loại (`PRIMARY`, `SECONDARY`, `CONSUMABLE`) hay chỉ số Hết hàng (`outOfStockCount`). Do đó, việc FE hiển thị cảnh báo trống dữ liệu là hệ quả tất yếu của việc thiếu hụt trường thông tin từ API/Snapshot.

### 3. Delta Note của Biến động tồn kho (quantityDelta)
* **Phân loại**: `UI_BINDING_ERROR` (Logic Error)
* **Lý do**: Mã nguồn FE thực hiện so sánh giá trị chênh lệch giữa phần tử cuối cùng `trend[trend.length - 1]` và phần tử sát cuối `trend[trend.length - 2]` của chuỗi `stockTrend` để in ra delta note dạng `"▲ X tấn (+Y%)"`. Tuy nhiên, do `stockTrend` chứa các điểm dữ liệu theo ngày phát sinh (Daily) thay vì theo tháng (Monthly), delta note này đang phản ánh biến động ngày-qua-ngày thay vì biến động tháng-qua-tháng như nhãn chú thích hiển thị trên UI.

---

## PHẦN 5 – Kiểm tra tính tuân thủ của phân hệ EPIC118.1

Qua kiểm toán độc lập, chúng tôi xác nhận các quy tắc của **EPIC118.1** đã được thực thi chính xác và nghiêm ngặt:
1. **Loại bỏ xu hướng giả lập**: Không còn bất kỳ dữ liệu ngẫu nhiên (random), dữ liệu tự nội suy (interpolated), hay dữ liệu hardcode lịch sử nào xuất hiện trên biểu đồ.
2. **Ảnh hưởng KPI**: Các thẻ KPI hiển thị số lượng tồn kho realtime hiện tại chính xác tuyệt đối. Trạng thái trống dữ liệu chỉ xuất hiện ở delta note và sparkline của 6 thẻ KPI phụ và hoàn toàn không làm sai lệch chỉ số tồn kho hiện tại.
3. **Tính nhất quán dữ liệu (Parity)**: Số lượng tồn kho trên Material Detail, Location, và Snapshots khớp nhau hoàn hảo (23/23 vật tư khớp).

---

## KẾT LUẬN CUỐI CÙNG

**Inventory Historical Charts**

**REMEDIATION REQUIRED**

Database thực tế có dữ liệu giao dịch thật kéo dài từ năm 2025, tuy nhiên hệ thống hiển thị `"Chưa có dữ liệu lịch sử"` trên các thẻ KPI phụ là do sự kết hợp của việc **hardcode chặn hiển thị ở frontend (UI_BINDING_ERROR)** và **thiếu cấu trúc trường lưu trữ lịch sử trong Snapshot Schema ở backend (SNAPSHOT_PAYLOAD_MISSING)**. Dữ liệu lịch sử thật chưa được truyền đạt đầy đủ và chính xác lên giao diện người dùng. Kế hoạch khắc phục chi tiết được trình bày tại [inventory-historical-chart-remediation-plan.md](file:///opt/projects/steeltrack/docs/audit/inventory-historical-chart-remediation-plan.md).
