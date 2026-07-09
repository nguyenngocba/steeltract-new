# Kế hoạch Khắc phục Biểu đồ Lịch sử Kho Vật tư (Remediation Plan)

Tài liệu này vạch ra kiến trúc và giải pháp đề xuất để khôi phục và hiển thị đầy đủ, chính xác dữ liệu lịch sử cho toàn bộ các biểu đồ và thẻ KPI trên trang **Tổng quan kho**, tuân thủ nguyên tắc đóng băng nghiệp vụ phiên bản v1.0.

---

## 1. Phương án Kiến trúc Đề xuất

Chúng tôi áp dụng luồng truyền dẫn chuẩn hóa từ dưới lên (Bottom-Up) theo đúng chuẩn kiến trúc của hệ thống SteelTrack:

```
[Bảng Giao dịch Gốc] 
        │
        ▼ (Background Rebuild Job chạy hàng ngày/backfill lịch sử)
[Tính toán cuộn ngược số dư / Tổng hợp lịch sử trên Server]
        │
        ▼ (Lưu trữ lâu dài)
[Bảng inventory_dashboard_snapshots mở rộng]
        │
        ▼ (Query tối ưu theo ngày)
[InventoryOverview Read Model]
        │
        ▼ (GET /inventory/overview API)
[TanStack Query Hook & FE Binding]
```

### Đánh giá phương án tính toán (Evaluation):
* **Không tính toán lịch sử ở frontend**: Bỏ qua hoàn toàn việc tải danh sách giao dịch về trình duyệt để tự tính số dư lịch sử. Khi dữ liệu lên tới hàng triệu bản ghi, việc này sẽ gây sập trình duyệt.
* **Không tính toán trực tiếp realtime ở API**: Việc chạy các câu lệnh SQL tự tổng hợp phức tạp (như rollback) trực tiếp khi có request `GET /inventory/overview` sẽ vi phạm nghiêm trọng SLA về hiệu năng phản hồi (<100ms).
* **Giải pháp tối ưu**:
  - Lưu trữ dữ liệu lịch sử lâu dài trong bảng snapshot `inventory_dashboard_snapshots`.
  - Sử dụng **Background Engine Job** chạy định kỳ mỗi đêm để chốt số liệu snapshot của ngày hôm đó.
  - Cung cấp một script **Historical Backfill (Reconciliation)** chạy một lần duy nhất để dựng lại toàn bộ lịch sử 12 tháng trước đó bằng cách chạy thuật toán cuộn ngược số dư (rollback ledger) trên server và lưu trữ kết quả vào bảng snapshot.

---

## 2. Các bước triển khai chi tiết

### Bước 1: Mở rộng cơ sở dữ liệu (Database Schema)
Bổ sung các trường thông tin cần thiết vào model `InventoryDashboardSnapshot` trong [schema.prisma](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma):

```prisma
model InventoryDashboardSnapshot {
  // ... Các trường hiện tại ...
  
  // Bổ sung các trường mới phục vụ 12 tháng lịch sử của KPI:
  outOfStockCount Int   @default(0) // Số mã hết hàng
  primaryCount    Int   @default(0) // Số mã vật tư chính
  primaryStock    Float @default(0) // Tổng khối lượng vật tư chính
  secondaryCount  Int   @default(0) // Số mã vật tư phụ
  secondaryStock  Float @default(0) // Tổng khối lượng vật tư phụ
  consumableCount Int   @default(0) // Số mã vật tư tiêu hao
  consumableStock Float @default(0) // Tổng khối lượng vật tư tiêu hao
}
```
*(Lưu ý: Không tạo và chạy migration trong sprint hiện tại theo quy định đóng băng).*

### Bước 2: Nâng cấp Background Job & Snapshot Rebuilder
* Bổ sung logic tính toán vào `SnapshotRebuilder` ở backend để khi tính toán snapshot cho ngày `T`, hệ thống tự động:
  - Phân tích số lượng vật tư tồn kho thực tế của từng loại nghiệp vụ (`PRIMARY`, `SECONDARY`, `CONSUMABLE`).
  - Kiểm tra trạng thái tồn kho của từng vật tư tại kho `MAIN` so với định mức `minimumStock` để tính số lượng `lowStockCount` và `outOfStockCount`.
* Viết kịch bản backfill lịch sử: Chạy ngược dòng thời gian từ số dư hiện tại, lấy danh sách giao dịch để dựng lại số dư chính xác của ngày cuối cùng mỗi tháng trong 12 tháng gần đây và chèn vào bảng snapshot.

### Bước 3: Nâng cấp Backend Repository & Read Model
Cập nhật hàm `inventoryOverviewTransactionMetrics()` trong [inventory.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/inventory/inventory.repository.ts) để truy vấn toàn bộ các trường lịch sử mới:

```typescript
      this.prisma.inventoryDashboardSnapshot.groupBy({
        by: ['snapshotDate'],
        _sum: { 
          inventoryValue: true, 
          totalStock: true,
          totalMaterials: true,
          lowStockCount: true,
          outOfStockCount: true,
          primaryCount: true,
          primaryStock: true,
          secondaryCount: true,
          secondaryStock: true,
          consumableCount: true,
          consumableStock: true,
        },
        orderBy: { snapshotDate: 'asc' },
        take: 12,
      })
```

Cập nhật `InventoryReadModelService.overview()` để trả về các chuỗi xu hướng tương ứng cho frontend.

### Bước 4: Khôi phục Binding ở Frontend UI
1. Loại bỏ dòng lệnh early return cứng tại dòng 610 của [InventoryOverviewPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryOverviewPage.tsx).
2. Ánh xạ các mảng xu hướng lịch sử và tính toán delta note từ dữ liệu API trả về thay vì bypass bằng mảng rỗng và chuỗi `"Chưa có dữ liệu lịch sử"`.
3. Sửa đổi logic so sánh của `quantityDelta` để đảm bảo hệ thống thực hiện so sánh số liệu giữa hai tháng gần nhất trong chuỗi snapshot (Monthly) thay vì so sánh hai ngày sát nhau (Daily).

---

## 3. Đánh giá tính an toàn

* **Không ảnh hưởng tới luồng ghi**: Giao dịch kho nhập, xuất, điều chuyển hoàn toàn độc lập, đảm bảo an toàn tuyệt đối cho số dư kho realtime.
* **Không làm suy giảm hiệu năng**: Các truy vấn lịch sử trên UI Overview chỉ là các lệnh `SELECT` đơn giản từ bảng snapshot đã được lập chỉ mục (`INDEX` trên `snapshotDate`), tốc độ phản hồi đảm bảo duy trì dưới mức 50ms.
