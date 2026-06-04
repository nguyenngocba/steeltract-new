# Inventory Audit

Date: 2026-06-04

Scope:

- `apps/frontend/src/modules/inventory/pages/tabs/InventoryOverviewPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryMaterialsPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryMasterDataPage.tsx`
- `apps/frontend/src/modules/inventory/components/material-table/MaterialDrawer.tsx`
- `apps/backend-api/prisma/schema.prisma` `InventoryItem`
- Backend Inventory item create/update API behavior

## 1. Chức năng bị trùng lặp

### 1.1. Hai màn hình cùng hiển thị danh sách/tổng quan tồn kho

`InventoryOverviewPage` đang là route chính `/inventory` và tự dựng lại các KPI, bảng tồn kho, lọc kho, cảnh báo tồn kho, nhập/xuất gần đây.

`InventoryMaterialsPage` đang là route `/inventory/materials` và cũng dựng KPI, filter, bảng tồn kho, cảnh báo, phân bố vị trí, top giá trị tồn kho.

Trùng chức năng:

- Tổng giá trị tồn kho.
- Tổng số mã/chủng loại vật tư.
- Tồn hiện tại.
- Cảnh báo sắp hết/hết hàng.
- Bảng danh sách vật tư/tồn kho.
- Popup xem toàn bộ tồn kho.
- Click vật tư để xem chi tiết.

Nhận xét:

- `InventoryMaterialsPage` hiện là màn hình tồn kho mới, thống nhất giao diện hơn.
- `InventoryOverviewPage` vẫn giữ nhiều UI cũ và business flow cũ, nên đang tạo cảm giác có hai "Inventory cockpit" khác nhau.

Code reference:

- `InventoryOverviewPage`: quick actions và tồn kho bắt đầu quanh dòng 500.
- `InventoryMaterialsPage`: KPI/filter/table bắt đầu quanh dòng 132.

### 1.2. Hai luồng chi tiết vật tư

`InventoryOverviewPage` dùng modal `activeModal === 'material-detail'` với nhiều tab chi tiết: overview, inout, projects, suppliers, locations, analytics, files, logs.

`InventoryMaterialsPage` dùng popup chi tiết vật tư đơn giản, chỉ có các KPI cơ bản và nút sửa.

Trùng chức năng:

- Xem chi tiết vật tư.
- Xem tồn hiện tại.
- Xem giá trung bình/giá trị tồn.
- Xem vị trí.

Nhận xét:

- Luồng chi tiết trong `InventoryOverviewPage` giàu dữ liệu hơn nhưng style cũ và nằm lẫn trong overview.
- Luồng chi tiết trong `InventoryMaterialsPage` đúng style mới nhưng thiếu tabs nghiệp vụ.

### 1.3. Hai loại API/hook cùng gọi Material Master

Đường mới trong module inventory:

- `useCreateMaterial`
- `useUpdateMaterial`
- `useDeleteMaterial`
- `api/endpoints/inventory.endpoint.ts`
- API `/inventory/items`

Đường cũ/khác namespace vẫn tồn tại:

- `services/api/inventory.api.ts`
- `hooks/query/useInventoryQueries.ts`
- `context/useInventoryWorkspace.ts`
- `modules/inventory/store/inventory.store.ts`
- `modules/inventory/types/inventory.types.ts`

Nhận xét:

- Các đường cũ chưa chắc còn active trong route chính, nhưng vẫn tạo duplicate mental model: `InventoryItem`, `MaterialItem`, `Material`, `inventory-items`, `materials`.
- Query invalidation hiện phải invalidate cả `['materials']`, `['inventory-items']`, `['inventory-audit']`, cho thấy cache key chưa thống nhất.

### 1.4. Master Data và Material Master bị lẫn ranh giới

`InventoryMasterDataPage` quản lý:

- Categories.
- Material Types.
- Units.
- Zones.

`MaterialDrawer` cũng cần Categories, Material Types, Units.

Không trùng CRUD trực tiếp với vật tư, nhưng ranh giới UX chưa rõ:

- Master Data là danh mục cấu hình.
- Material Master là hồ sơ vật tư.
- Tồn kho là trạng thái số lượng theo giao dịch.

Hiện route và tên tab dễ làm người dùng hiểu "Tồn kho" là nơi tạo/sửa Material Master, còn "Master Data" là nơi tạo danh mục. Kiến trúc nên tách rõ hơn.

## 2. Form tạo vật tư bị trùng

### 2.1. Form tạo vật tư trong `InventoryOverviewPage`

State:

- `code`
- `name`
- `categoryId`
- `unit`
- `firstInboundQty`
- `unitPrice`
- `minimumStock`
- `note`

Submit:

- Gọi `createMaterialMutation` tạo `/inventory/items`.
- Nếu `firstInboundQty > 0`, tạo thêm transaction `INBOUND`.
- `unitPrice` gửi vào payload tạo item nhưng backend hiện không lưu vào `InventoryItem`.
- `unitPrice` chỉ có giá trị thực khi tạo transaction nhập đầu.

Code reference:

- State form: `InventoryOverviewPage.tsx` dòng 104-112.
- Submit create item + initial inbound: dòng 379-407.
- UI form: dòng 660-679.

### 2.2. Form tạo/sửa vật tư trong `MaterialDrawer`

State:

- `code`
- `name`
- `unit`
- `minimumStock`
- `description`
- `categoryId`
- `materialTypeId`

Submit:

- Gọi `createMaterialMutation` hoặc `updateMaterialMutation`.
- Không tạo transaction nhập đầu.
- Không có `unitPrice`, không có `firstInboundQty`.

Code reference:

- State form: `MaterialDrawer.tsx` dòng 18-24.
- Payload: dòng 70-78.
- UI form: dòng 107-136.

### 2.3. Kết luận form duplication

Hiện có hai form tạo vật tư với mục đích khác nhau nhưng cùng tên hành động:

- `InventoryOverviewPage`: "Thêm vật tư vào phiếu nhập" thực chất là create Material Master + optional initial inbound.
- `InventoryMaterialsPage`/`MaterialDrawer`: "Thêm vật tư mới" là create Material Master thuần.

Rủi ro:

- Người dùng tạo vật tư từ overview sẽ nghĩ đơn giá là thuộc master, nhưng backend không lưu đơn giá vào `InventoryItem`.
- Người dùng tạo vật tư từ drawer không nhập được số lượng đầu, gây cảm giác thiếu so với overview.
- Hai form có field không giống nhau nên dữ liệu master không nhất quán.
- `InventoryMaterialsPage.editMaterial()` không map `materialTypeId`, nên khi sửa từ tab tồn kho có thể làm drawer không giữ được loại vật tư hiện tại.

## 3. Field đang thiếu cho Material Master nhà máy kết cấu thép

Schema hiện tại của `InventoryItem` chỉ có:

- `code`
- `name`
- `description`
- `quantity`
- `minimumStock`
- `unit`
- `unitId`
- `categoryId`
- `materialTypeId`
- `zoneId`
- timestamps và relations cơ bản

Code reference:

- `InventoryItem`: `schema.prisma` dòng 701-730.
- DTO create/update hiện chỉ nhận `code`, `name`, `description`, `unit`, `unitId`, `categoryId`, `category`, `zoneId`, `minimumStock`: `inventory.dto.ts` dòng 18-40.
- Service create có xử lý `materialTypeId`, nhưng DTO hiện không khai báo field này nếu sau này bật Zod validation strict: `inventory.service.ts` dòng 425-452.

### 3.1. Nhóm định danh và phân loại

Thiếu:

- `materialCode` chuẩn nội bộ nếu cần tách khỏi `code` legacy.
- `materialNameVi` / `materialNameEn` nếu cần song ngữ.
- `shortName`.
- `materialGroup`: thép hình, thép tấm, thép hộp, tôn, bulong, sơn, vật tư phụ.
- `materialTypeId` cần được đưa vào DTO chính thức.
- `status`: active, inactive, blocked, obsolete.
- `isConsumable`: vật tư tiêu hao hay vật tư chính.
- `isTraceable`: có cần truy vết lô/heat/certificate hay không.

### 3.2. Nhóm quy cách kết cấu thép

Thiếu:

- `standard`: JIS, ASTM, EN, TCVN.
- `steelGrade`: SS400, Q235, Q345, A36, SM490...
- `profileShape`: H, I, U, V, L, pipe, box, plate, rebar, bolt, paint.
- `specification`: ví dụ H300x300x10x15, PL12, RHS100x50x4.
- `dimensionText`: chuỗi quy cách hiển thị.
- `lengthMm`.
- `widthMm`.
- `heightMm`.
- `thicknessMm`.
- `webThicknessMm`.
- `flangeThicknessMm`.
- `diameterMm`.
- `areaMm2` hoặc `sectionArea`.
- `weightPerMeterKg`.
- `weightPerPieceKg`.
- `densityKgM3` nếu cần tính từ thép/tôn.
- `surfaceCondition`: đen, mạ kẽm, sơn lót, sơn phủ, inox.
- `coatingSpec`: tiêu chuẩn mạ/sơn.

### 3.3. Nhóm đơn vị và quy đổi

Thiếu:

- `baseUnitId` bắt buộc thay vì dùng song song `unit` text và `unitId`.
- `purchaseUnitId`.
- `stockUnitId`.
- `issueUnitId`.
- `conversionFactor`.
- `pieceLengthMm` hoặc `standardLengthMm`.
- `piecesPerBundle`.
- `kgPerBundle`.

### 3.4. Nhóm tồn kho và hoạch định

Thiếu:

- `minStock`.
- `maxStock`.
- `reorderPoint`.
- `safetyStock`.
- `leadTimeDays`.
- `defaultWarehouseId`.
- `defaultZoneId`.
- `defaultSlotId`.
- `storageRule`: indoor, outdoor, dry, hazardous, paint-store.
- `stackingRule`: cho phép chồng, giới hạn tầng, yêu cầu kê gỗ.

Hiện có `minimumStock` và `zoneId`, nhưng chưa đủ để vận hành kho thép nhiều vị trí/lô.

### 3.5. Nhóm mua hàng và nhà cung cấp

Thiếu:

- `primarySupplierId`.
- `preferredSupplierIds` hoặc bảng map `SupplierMaterial` trong phase sau.
- `manufacturer`.
- `originCountry`.
- `brand`.
- `lastPurchasePrice`.
- `standardCost`.
- `currency`.
- `taxRate`.
- `moq`.
- `purchaseLeadTimeDays`.

Lưu ý:

- Không nên lưu giá nhập hiện hành vào Material Master như một giá trị tồn kho duy nhất. Giá thực tế nên nằm ở transaction/batch/lot, còn master chỉ nên có `standardCost` hoặc `lastPurchasePrice` nếu cần tham chiếu nhanh.

### 3.6. Nhóm truy vết chất lượng

Thiếu:

- `requiresCOCQ`.
- `requiresHeatNo`.
- `requiresMillCert`.
- `qcRequired`.
- `inspectionStandard`.
- `certificateTemplate`.
- `shelfLifeDays` cho sơn/hoá chất.
- `expiryRequired`.

### 3.7. Nhóm lô/batch/heat

Không nên nhét toàn bộ vào `InventoryItem`, nhưng hiện chưa có model con rõ ràng cho:

- `InventoryLot`.
- `heatNo`.
- `batchNo`.
- `millNo`.
- `certificateNo`.
- `manufactureDate`.
- `expiryDate`.
- `supplierLotNo`.
- `receivedDate`.

Với nhà máy kết cấu thép, đây là nhóm quan trọng để QC và xuất xưởng truy vết vật tư vào cấu kiện.

### 3.8. Nhóm file và tài liệu

Thiếu:

- Attachment/document mapping cho catalog, CO/CQ, mill certificate, MSDS, datasheet.
- `drawingRef` hoặc liên kết tiêu chuẩn/bản vẽ nếu vật tư đặc thù.

## 4. Đề xuất kiến trúc cuối cùng

### 4.1. Phân ranh giới module

Chốt 3 lớp rõ ràng:

1. Material Master
   - Hồ sơ vật tư tĩnh: mã, tên, nhóm, loại, quy cách, tiêu chuẩn, đơn vị, quy tắc tồn, QC requirements.
   - Không xử lý số lượng nhập/xuất trực tiếp.

2. Inventory Stock
   - Tồn hiện hành theo item + warehouse/zone/slot + lot/batch.
   - Dữ liệu tính từ transaction ledger hoặc persisted balance ledger.

3. Inventory Transactions
   - Nhập, xuất, điều chuyển, trả, kiểm kê, điều chỉnh.
   - Lưu đơn giá thực tế, supplier/project/reference, location, lot/heat/certificate.

### 4.2. Kiến trúc frontend nên chốt

Route đề xuất:

- `/inventory`: Inventory Overview cockpit chỉ hiển thị KPI, cảnh báo, recent inbound/outbound, stock health, quick links.
- `/inventory/materials`: Material Master + Stock list workspace.
- `/inventory/master-data`: chỉ danh mục cấu hình như categories, material types, units, warehouse zones.
- `/inventory/inbound`, `/inventory/outbound`, `/inventory/transfer`, `/inventory/stock-take`: transaction workflows.

Component đề xuất:

- Chỉ dùng một form Material Master duy nhất: `MaterialMasterDrawer` hoặc nâng cấp `MaterialDrawer`.
- Form nhập đầu không nằm trong Material Master drawer. Nếu cần tạo nhanh khi nhập kho, dùng flow:
  - Step 1: chọn vật tư có sẵn hoặc tạo nhanh Material Master bằng drawer thống nhất.
  - Step 2: nhập transaction inbound với supplier, zone, quantity, unit price, VAT, certificate.

Loại bỏ hoặc refactor:

- Xóa form `activeModal === 'create-material'` trong `InventoryOverviewPage`.
- `InventoryOverviewPage` không nên chứa logic tạo vật tư, nhập, xuất, điều chuyển trực tiếp trong cùng file.
- Detail vật tư nên dùng một workspace/detail drawer chung, không có hai modal chi tiết khác nhau.

### 4.3. Kiến trúc backend nên chốt

Ngắn hạn, không cần migration lớn ngay:

- Chuẩn hoá DTO create/update item để nhận đúng field hiện có, bao gồm `materialTypeId`.
- Bỏ `unitPrice` khỏi create item payload frontend nếu không lưu vào master.
- Nếu cần giá chuẩn, thêm `standardCost` trong phase migration riêng, không dùng `unitPrice` mập mờ.
- Không cho create Material Master tự tạo inbound trong cùng API `/inventory/items`; tạo inbound phải qua transaction API.

Trung hạn:

- Thêm `MaterialSpec` fields trực tiếp vào `InventoryItem` hoặc tách `MaterialSpecification`.
- Thêm `InventoryLot` để quản lý heat/batch/certificate.
- Thêm `InventoryBalance` theo item + warehouse/zone/slot + lot để không phải tính lại toàn bộ từ transaction mỗi lần.
- Thêm `SupplierMaterial` khi Supplier Phase S2 bắt đầu.

### 4.4. Material Master field set cuối cùng đề xuất

Minimum viable cho nhà máy kết cấu thép:

- Identity: `code`, `name`, `shortName`, `description`, `status`.
- Classification: `categoryId`, `materialTypeId`, `isConsumable`, `isTraceable`.
- Specification: `standard`, `steelGrade`, `profileShape`, `specification`, `dimensionText`.
- Dimensions: `lengthMm`, `widthMm`, `heightMm`, `thicknessMm`, `diameterMm`, `weightPerMeterKg`, `weightPerPieceKg`.
- Units: `baseUnitId`, `purchaseUnitId`, `stockUnitId`, `issueUnitId`, `conversionFactor`.
- Planning: `minimumStock`, `maximumStock`, `reorderPoint`, `safetyStock`, `leadTimeDays`.
- Storage: `defaultWarehouseId`, `defaultZoneId`, `storageRule`, `stackingRule`.
- Quality: `qcRequired`, `requiresCOCQ`, `requiresHeatNo`, `requiresMillCert`, `inspectionStandard`, `shelfLifeDays`.
- Cost reference: `standardCost`, `lastPurchasePrice`, `currency`, `taxRate`.
- Supplier reference: `primarySupplierId` now, `SupplierMaterial` later.

### 4.5. Quyết định đề xuất

Final direction:

- `InventoryMaterialsPage` nên trở thành nơi quản lý Material Master + Stock list chính.
- `MaterialDrawer` nên là form duy nhất cho tạo/sửa Material Master.
- `InventoryOverviewPage` nên bị rút gọn thành dashboard cockpit, không chứa form tạo vật tư và không chứa transaction forms lớn.
- `InventoryMasterDataPage` giữ đúng vai trò danh mục nền: Category, Material Type, Unit, Warehouse/Zone.
- Transaction forms phải sống ở các tab workflow riêng hoặc wizard riêng, không trộn với Material Master.

Ưu tiên xử lý tiếp theo:

1. Gỡ duplicate form tạo vật tư khỏi `InventoryOverviewPage`.
2. Nâng `MaterialDrawer` thành `MaterialMasterDrawer` với field set thép tối thiểu.
3. Chuẩn hoá DTO/API để `materialTypeId`, `unitId`, `zoneId` được lưu rõ ràng.
4. Tách inbound initial stock thành transaction flow.
5. Thống nhất một material detail workspace dùng lại cho Overview và Materials.
