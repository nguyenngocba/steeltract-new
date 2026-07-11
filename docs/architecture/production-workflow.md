# Production Workflows & Standard Operating Procedures (SOP)

Tài liệu này chi tiết hóa các quy trình nghiệp vụ sản xuất (Workflows), quy tắc kiểm soát và hướng dẫn từng bước (SOP) cho các vị trí vận hành hệ thống SteelTrack.

## 0. Production Order Lifecycle

The Production Order command lifecycle is:

| Command | From | To |
| --- | --- | --- |
| Create | none | `DRAFT` |
| Release | `DRAFT` | `RELEASED` |
| Mark ready | `RELEASED` | `READY` |
| Start | `READY` | `IN_PROGRESS` |
| Pause | `IN_PROGRESS` | `PAUSED` |
| Resume | `PAUSED` | `IN_PROGRESS` |
| Complete | `IN_PROGRESS` | `COMPLETED` |
| Close | `COMPLETED` | `CLOSED` |
| Cancel | `DRAFT` | `CANCELLED` |

`Update` may change editable order data but must not bypass this table by writing
`status` directly. `CLOSED` and `CANCELLED` reject every further lifecycle
transition. Readiness validation, material issue, stage execution, QC, and Yard
handoff remain governed by their existing workflow rules.

Every command must persist the order transition, activity/audit record, and
canonical Outbox event in one repository transaction. Snapshot work is not part
of the HTTP transaction.

---

## 1. Quy Trình Cấp Phát Vật Tư Sản Xuất (Material Reservation & Issue)

Quy trình này kiểm soát việc xuất thép từ Kho chính sang Kho vật tư sản xuất để cấp cho xưởng.

```text
PMS Lập Lệnh SX -> Tự động giữ hàng (Reserve) theo định mức BOM tại Kho SX
  |
  +---> Kho SX đủ hàng?
          |
          +---> CÓ: Chuyển lệnh sang trạng thái READY TO START
          |
          +---> KHÔNG: Tạo phiếu yêu cầu điều chuyển (Transfer Request) từ Kho chính -> Kho SX
```

### Các bước thực hiện:
1.  **Reserve**: Khi `ProductionOrder` được duyệt, hệ thống gọi API `POST /production/:id/reservations` để giữ vật tư tại Kho sản xuất (`PRODUCTION`) theo từng ô vị trí cụ thể (`zoneId + slotId + level`).
2.  **Issue**: Khi bắt đầu ca, tổ trưởng nhấn bắt đầu sản xuất. Hệ thống thực hiện trừ kho vị trí tương ứng (`inventory_location_stocks`), chuyển trạng thái dòng giữ hàng từ `RESERVED` sang `ISSUED`.
3.  **Ghi Ledger**: Tạo bản ghi `ProductionMaterialLedger` loại `ISSUE` chứa thông tin định danh vị trí xuất vật tư.

---

## 2. Quy Trình Sản Xuất & Chuyển Công Đoạn (Routing & Stage Transitions)

Mỗi lệnh sản xuất phải đi qua trình tự routing nghiêm ngặt:

```text
[CẮT THÉP] -> QC Đo đạc -> [GÁ LẮP] -> QC Mối gá -> [HÀN] -> QC Hàn siêu âm -> [SƠN] -> QC Độ dày sơn -> [STAGING YARD]
```

### Nguyên tắc vận hành:
*   Mỗi công đoạn kết thúc, công nhân chọn trạng thái công đoạn là `COMPLETED`.
*   Nếu công đoạn đó khai báo `qcRequired = true` trong BOMRoutingStep, hệ thống sẽ tự động chuyển trạng thái công đoạn tiếp theo sang `BLOCKED` và tự động gửi yêu cầu kiểm QC (`QcInspection`) sang phân hệ Chất lượng.
*   Công đoạn tiếp theo chỉ được phép chuyển sang trạng thái `READY` hoặc `IN_PROGRESS` khi kiểm tra QC công đoạn trước đạt trạng thái `PASSED`.

---

## 3. Quy Trình Kiểm Tra QC Handoff & Xếp Bãi (Staging to Yard)

Quy trình kết thúc chuỗi gia công nhà xưởng để chuyển cấu kiện ra bãi chứa thành phẩm trước khi xuất công trình.

### SOP Bàn giao ra bãi (Yard Staging):
1.  Công đoạn cuối cùng của sản xuất là công đoạn sơn hoặc lắp ghép phụ kiện hoàn tất.
2.  Giám sát QC tiến hành kiểm tra nghiệm thu tổng thể ngoại quan, độ phẳng, chiều dài và kích thước hình học cấu kiện. Ghi nhận phiếu kiểm tra đạt chất lượng (`QcInspection.status = APPROVED`).
3.  Hệ thống kích hoạt Outbox Event `production.component.completed`.
4.  Background Engine tạo một cấu kiện thành phẩm trong hệ thống với trạng thái `READY_TO_STAGE`.
5.  Thủ kho bãi quét mã vạch cấu kiện trên bến bàn giao. Hệ thống hiển thị sơ đồ 2D/3D khuyên dùng bãi chứa (`Yard Layout`) và đề xuất vị trí xếp bãi tối ưu (tránh quá tải khu vực hoặc cản lối di chuyển).
6.  Thủ kho đặt cấu kiện vào vị trí vật lý và xác nhận trên ứng dụng di động, kết thúc quy trình sản xuất chuyển sang quy trình lưu kho bãi.

---

## 4. Quy Trình Tiêu Hao & Trả Lại Vật Tư Thừa (Consumption & Return)

Quy trình này đối soát chéo lượng thép thực tế sử dụng so với định mức dự án để tính giá thành sản xuất.

```text
Vật tư cấp ra (IssuedQty) = Tiêu hao thực tế (ConsumedQty) + Phế liệu (ScrapQty) + Trả lại (ReturnedQty)
```

### SOP Bù trừ vật tư:
1.  Cuối ngày, tổ trưởng nhập lượng thép tiêu thụ thực tế của lệnh PO (`POST /production/:id/consume`) bao gồm thép đã tạo hình (`consumedQty`) và đầu mẩu thép dư hỏng (`scrapQty`).
2.  Vật tư thép thừa không dùng đến phải được lập phiếu trả lại (`POST /production/material-issues/:id/return`).
3.  **Quy tắc kiểm soát**: Hệ thống không cho phép lưu phiếu nếu tổng lượng thép tiêu thụ + phế liệu + trả lại vượt quá lượng thép đã cấp phát ban đầu (`issuedQty`).
4.  Sau khi kiểm kho và xác nhận trả lại, hệ thống tự động xuất Inventory transaction nhập lại lượng thép dư về **Kho chính (MAIN)** để phục vụ các dự án khác, đảm bảo xưởng sản xuất luôn sạch sẽ, không có vật tư trôi nổi không kiểm soát.

---

## 5. Quy Trình Xử Lý Dừng Máy & Phế Liệu (Downtime, Scrap & Exceptions)

### Xử lý sự cố máy (Machine Downtime SOP):
*   Khi có sự cố dừng máy ngoài kế hoạch (hỏng dao cắt, quá nhiệt máy hàn, mất điện), công nhân vận hành nhấn nút `Báo dừng ca` trên bảng Kanban.
*   Hệ thống chuyển trạng thái máy sang `DOWN` và ghi nhận một bản ghi `MachineDowntime` với trường `startedAt = now()`.
*   Màn hình của Quản đốc xưởng xuất hiện nhấp nháy đỏ cảnh báo.
*   Khi sửa chữa xong, công nhân nhấn `Khôi phục`. Hệ thống lưu thời điểm kết thúc `endedAt` và tự động ghi chú lý do sửa chữa, cập nhật chỉ số khả dụng của máy móc.

### Nghiệp vụ Rework (Làm lại):
*   NẾU QC đánh giá lỗi nghiêm trọng bắt buộc làm lại -> Tạo NCR gắn lỗi QC.
*   Lệnh sản xuất chuyển sang trạng thái `DELAYED`.
*   Hệ thống tự động kích hoạt tạo lệnh sản xuất phụ (Rework Order) cấp phát bù vật tư tự động từ Kho SX để gia công lại phần lỗi. Chỉ số OEE sẽ tự động giảm trừ phần chất lượng (Quality Index) tương ứng của công đoạn đó.
