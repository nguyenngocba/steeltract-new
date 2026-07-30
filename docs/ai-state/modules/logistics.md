# Logistics Module

## Current Canonicalization Gate

LOGISTICS.2 audit on 2026-07-30 found Dispatch/Delivery is still
definition-level for component lines. Current component dispatch uses
`DispatchItem.componentId`, `ProjectTaskComponentAllocation.componentId`,
`ShipmentLineInput.componentId`, and frontend payload `componentId`. Delivery
receive still updates legacy `Component.status = DELIVERED`.

Do not implement new component dispatch writes on this legacy identity. The
next approved gate must add `DispatchItem.componentInstanceId` and physical
`ComponentInstanceState` values for Yard/transit/delivery before Logistics can
operate on canonical physical component identity.

Audit:
`docs/audits/logistics2-component-instance-dispatch-delivery-report.md`.

## Architecture Design

Thiết kế chi tiết cho phân hệ Logistics được đặc tả tại [logistics-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/logistics-blueprint.md).

## Scope

Logistics Phase S1 (Sprint 50LOG.1) triển khai nền tảng điều vận (Dispatch) cơ bản liên kết giữa bãi trung chuyển (Yard) và công trường thi công (Project).

Included:
* Mô hình dữ liệu cơ bản cho Lệnh điều vận (`DispatchOrder`), Chi tiết hàng hóa vận chuyển (`DispatchItem`) và Sự kiện vận chuyển (`DispatchEvent`).
* Giao diện điều vận basic với các tab Tổng quan, Điều xe, Đang vận chuyển, Lịch sử.
* Đề xuất điều phối xe tự động từ danh sách allocations vật tư/cấu kiện của ProjectTask.
* Đồng bộ xuất kho vật tư và cập nhật tiến độ bàn giao cấu kiện của dự án.

Excluded in S1:
* Hồ sơ quản lý tài xế (`Driver`) và xe (`Vehicle`).
* Bản đồ số thời gian thực (Dispatch Cockpit).
* Quản lý bằng chứng bàn giao điện tử (Proof of Delivery - POD).
* Giám sát hành trình (GPS Tracking) và cảnh báo Geofencing.
* Thuật toán AI tối ưu xếp hàng (3D Load) và dự báo ETA trễ chuyến.

## Routes

* `/logistics`

## API

* `GET /logistics/dispatch-orders`
* `POST /logistics/dispatch-orders`
* `GET /logistics/dispatch-orders/:id`
* `PUT /logistics/dispatch-orders/:id`
* `POST /logistics/dispatch-orders/:id/depart`
* `POST /logistics/dispatch-orders/:id/receive`

## Implemented Features

* Bốn tab giao diện Logistics:
  * Tổng quan: Báo cáo số lượng xe đang bốc hàng, đang chạy, đã đến.
  * Điều xe: Lập lệnh điều vận, chọn dự án, gán xe/tài xế tạm thời.
  * Đang vận chuyển: Danh sách xe đang lăn bánh.
  * Lịch sử: Lưu trữ các chuyến đi đã hoàn thành.
* Đề xuất tự động cấu kiện cần giao dựa trên nhu cầu của WBS Project Task.
* Tự động giảm số lượng allocations tại công trường và tạo Inventory export transaction khi xe xuất kho.

## Remaining Features

* Quản lý danh mục xe và tài xế chính thức.
* Bản đồ tích hợp định vị GPS trực quan.
* Chụp ảnh và ký nhận POD trên Driver mobile view.
* Cảnh báo geofence tự động khi xe vào/ra nhà máy hoặc công trường.
* Tích hợp AI tối ưu hóa thùng hàng (Bin Packing) và ước lượng trễ giờ (ETA).

## Integration Points

* WMS / Inventory:
  Tự động tạo phiếu xuất kho khi xe chuyển sang trạng thái xuất phát (`IN_TRANSIT`).
* Yard Management (YMS):
  Yard Staging cung cấp danh sách cấu kiện sẵn sàng bốc dỡ lên xe.
* Projects (PMS):
  Logistics đồng bộ tiến độ nhận hàng của cấu kiện về WBS task của dự án (`SHIPPED` -> `DELIVERED`).
