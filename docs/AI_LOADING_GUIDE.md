# Hướng Dẫn Nạp Ngữ Cảnh Cho Các Tác Nhân AI (AI Context Loading Strategy)

Tài liệu này đặc tả chiến lược và quy trình nạp tài liệu ngữ cảnh (context loading) cho các tác nhân AI (AI Agents như Antigravity và các subagents). Mục tiêu tối cao là ngăn ngừa hiện tượng tràn cửa sổ ngữ cảnh (Context Window Overflow), giảm thiểu hao phí token, tránh làm nhiễu loạn suy luận của mô hình và bảo đảm tính tuân thủ tuyệt đối theo các quy chuẩn của SteelTrack Core Platform.

---

## 1. Nguyên Lý Tối Ưu Hóa Cửa Sổ Ngữ Cảnh (Context Budgeting)

Các mô hình ngôn ngữ lớn (LLMs) hoạt động hiệu quả nhất khi ngữ cảnh đầu vào tập trung và không chứa thông tin dư thừa. Việc nạp toàn bộ thư mục `docs/` là một phản mẫu (anti-pattern) nghiêm trọng gây ra hiện tượng "lãng quên thông tin ở giữa" (lost-in-the-middle).

### 1.1. Định Biên Ngữ Cảnh Cho Tài Liệu (Doc Context Budget)
* **Ngưỡng tối ưu**: Chỉ duy trì tối đa **10,000 - 15,000 tokens** tài liệu kiến trúc cho mỗi phiên làm việc nghiệp vụ.
* **Nguyên tắc kế thừa**: AI luôn nạp tài liệu từ tổng quan đến chi tiết theo cấu trúc hình cây.
* **Phát hiện trùng lặp**: Trước khi phân tích mã nguồn, AI Agent bắt buộc phải chạy lệnh Semble hoặc kiểm tra file [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md) để xác định xem tính năng đó đã được mô tả ở đâu.

---

## 2. Cấu Trúc Phân Lớp Kế Thừa Ngữ Cảnh (Context Inheritance Hierarchy)

Mọi tác vụ phát triển của AI bắt buộc phải tuân theo luồng nạp ngữ cảnh 5 lớp sau:

```
+-------------------------------------------------------------------+
| Lớp 1: Quy tắc toàn cục & Luồng làm việc (Global Rules & Workflow) |
| - docs/ai-state/CODEX_WORKFLOW.md                                 |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Lớp 2: Trạng thái vận hành dự án (Project Operational State)       |
| - CURRENT_STATE.md, PROJECT_STATUS.md, NEXT_TASKS.md              |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Lớp 3: Đặc tả phân hệ nghiệp vụ (Module Summary)                  |
| - docs/ai-state/modules/<module>.md                               |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Lớp 4: Bản thiết kế kiến trúc chi tiết (Domain Blueprint)         |
| - docs/architecture/<module>-blueprint.md                         |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| Lớp 5: Mã nguồn mục tiêu (Target Source Code)                     |
| - Controllers, Services, Repositories, schema.prisma              |
+-------------------------------------------------------------------+
```

---

## 3. Quy Trình Nạp Ngữ Cảnh Chi Tiết Cho Từng Phân Hệ (Module-by-Module Pipelines)

Dưới đây là đặc tả đường dẫn nạp tài liệu chi tiết cho 10 phân hệ nghiệp vụ và tích hợp của SteelTrack. AI chỉ được nạp đúng các file được liệt kê trong pipeline tương ứng:

### 3.1. Phân Hệ Quản Lý Kho & Vật Tư (Inventory)
Áp dụng cho các tác vụ thay đổi stock, dịch chuyển kho, kiểm kê, hoặc quản lý vị trí.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [inventory.md](file:///opt/projects/steeltrack/docs/ai-state/modules/inventory.md)
3. **Lớp 4 (Quy tắc & Blueprint)**:
   * [inventory-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/inventory-decisions.md) (Nguyên tắc giao dịch kho bất biến)
   * [INVENTORY_TRANSACTION_RULES.md](file:///opt/projects/steeltrack/docs/architecture/INVENTORY_TRANSACTION_RULES.md) (Quy chuẩn các loại hình giao dịch)
   * [inventory-target-architecture.md](file:///opt/projects/steeltrack/docs/ai-state/design/inventory-target-architecture.md)
   * [persisted-snapshot-architecture.md](file:///opt/projects/steeltrack/docs/architecture/persisted-snapshot-architecture.md)

### 3.2. Phân Hệ Quản Lý Dự Án (Projects)
Áp dụng cho các tác vụ cập nhật tiến độ WBS, phân bổ nguồn lực dự án, quản lý chi phí dự án.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [projects.md](file:///opt/projects/steeltrack/docs/ai-state/modules/projects.md)
3. **Lớp 4 (Quy tắc & Blueprint)**:
   * [code-numbering-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/code-numbering-decisions.md) (Quy tắc đánh mã WBS)
   * [projects-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/projects-blueprint.md) (Thiết kế tổng quan dự án)
   * [projects-domain.md](file:///opt/projects/steeltrack/docs/architecture/projects-domain.md) (Mô hình nghiệp vụ dự án)
   * [projects-workflow.md](file:///opt/projects/steeltrack/docs/architecture/projects-workflow.md) (Quy trình chuyển đổi trạng thái)

### 3.3. Phân Hệ Điều Hành Sản Xuất (Production - MES)
Áp dụng cho các tác vụ lập lệnh sản xuất (Work Orders), ghi nhận downtime máy, kiểm soát hao hụt (scrap).
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [production.md](file:///opt/projects/steeltrack/docs/ai-state/modules/production.md)
3. **Lớp 4 (Quy tắc & Blueprint)**:
   * [production-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/production-decisions.md) (Quy tắc xử lý BOM, MO, lệnh phụ thuộc)
   * [production-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/production-blueprint.md)
   * [production-domain.md](file:///opt/projects/steeltrack/docs/architecture/production-domain.md)
   * [production-workflow.md](file:///opt/projects/steeltrack/docs/architecture/production-workflow.md)

### 3.4. Phân Hệ Quản Lý Chất Lượng (QC)
Áp dụng cho các tác vụ kiểm thử vật tư đầu vào, kiểm tra cấu kiện hoàn thiện, NCR (Non-Conformance Report).
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [qc.md](file:///opt/projects/steeltrack/docs/ai-state/modules/qc.md)
3. **Lớp 4 (Blueprint)**:
   * [qc-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/qc-blueprint.md)

### 3.5. Phân Hệ Quản Lý Bãi Thép (Yard)
Áp dụng cho các tác vụ phân khu bãi (Yard Zones), quản lý vị trí cấu kiện, quét QR xếp dỡ cấu kiện bằng cẩu.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [yard.md](file:///opt/projects/steeltrack/docs/ai-state/modules/yard.md)
3. **Lớp 4 (Blueprint)**:
   * [yard-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/yard-blueprint.md)

### 3.6. Phân Hệ Logistics & Giao Nhận (Logistics)
Áp dụng cho các tác vụ lập lộ trình xe tải chở thép, Proof of Delivery (POD) cho công trường, tính toán tải trọng xe.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [logistics.md](file:///opt/projects/steeltrack/docs/ai-state/modules/logistics.md)
3. **Lớp 4 (Blueprint)**:
   * [logistics-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/logistics-blueprint.md)

### 3.7. Phân Hệ Mua Hàng & Nhà Cung Cấp (Purchasing / Suppliers)
Áp dụng cho các tác vụ quản lý đơn đề nghị mua hàng (PR), đơn mua hàng (PO), đấu thầu báo giá của nhà cung cấp.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [suppliers.md](file:///opt/projects/steeltrack/docs/ai-state/modules/suppliers.md)
3. **Lớp 4 (Blueprint)**:
   * [purchasing-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/purchasing-blueprint.md)

### 3.8. Phân Hệ Tài Chính (Finance)
Áp dụng cho các tác vụ hạch toán giá thành thực tế của cấu kiện, tính toán dòng tiền dự án, khấu hao máy móc.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [system.md](file:///opt/projects/steeltrack/docs/ai-state/modules/system.md) (Quản lý các tham số hệ thống)
3. **Lớp 4 (Blueprint)**:
   * [finance-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/finance-blueprint.md)

### 3.9. Phân Hệ Quản Trị Nhân Sự & Ca Kíp (HR)
Áp dụng cho các tác vụ xếp ca nhân công nhà máy, ghi nhận giờ công thợ hàn/thợ sơn, tính lương khoán sản phẩm.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 4 (Blueprint)**:
   * [hr-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/hr-blueprint.md)

### 3.10. Tích Hợp Hệ Thống & Tác Nhân AI (AI Integrations & Integration Framework)
Áp dụng cho các tác vụ cấu hình mô hình Nesting Optimizer, kết nối WebSocket telemetry, thiết lập hàng đợi Outbox, tích hợp AI Assistant vào Operations Center.
1. **Lớp 1 & 2 (Bắt buộc)**:
   * [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
   * [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
2. **Lớp 3 (Đặc tả module)**:
   * [system.md](file:///opt/projects/steeltrack/docs/ai-state/modules/system.md)
3. **Lớp 4 (Quy tắc & Blueprint)**:
   * [enterprise-ai-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ai-guidelines.md) (Tiêu chuẩn sử dụng AI của doanh nghiệp)
   * [ai-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/ai-blueprint.md) (Kiến trúc tích hợp tác nhân trí tuệ nhân tạo)
   * [integration-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/integration-blueprint.md) (Khung tích hợp liên kết ERP-MES)
   * [background-engine.md](file:///opt/projects/steeltrack/docs/architecture/background-engine.md) (Cơ chế xử lý Background Job)
   * [persisted-read-model-foundation.md](file:///opt/projects/steeltrack/docs/architecture/persisted-read-model-foundation.md)
