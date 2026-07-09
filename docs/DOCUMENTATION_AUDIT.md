# Báo Cáo Kiểm Toán Toàn Bộ Tài Liệu (Documentation Audit)

Tài liệu này chứa kết quả kiểm toán toàn bộ thư mục [docs/](file:///opt/projects/steeltrack/docs/) hiện tại của SteelTrack. Toàn bộ các tập tin markdown đã được rà soát, phân loại danh mục, đánh giá trạng thái sử dụng và lập phương án xử lý chi tiết nhằm tối ưu hóa ngữ cảnh làm việc cho các tác nhân AI và lập trình viên con người.

---

## 1. Khung Phân Loại Tài Liệu (Classification Framework)

Mọi tài liệu trong hệ thống tri thức của SteelTrack được phân loại vào một trong chín danh mục nghiệp vụ sau:

1. **Source of Truth (Nguồn Sự Thật)**: Các tập tin lưu trữ trạng thái chạy thực tế, phân rã công việc, tiến độ phân hệ và nhật ký thay đổi vận hành của hệ thống.
2. **Architecture (Kiến Trúc Cốt Lõi)**: Định nghĩa các quyết định kiến trúc lớn (ADRs), ranh giới phân lớp, cấu trúc Event Bus và hạ tầng xử lý ngầm (Background Job).
3. **Blueprint (Bản Thiết Kế Phân Hệ)**: Bản đặc tả thiết kế nghiệp vụ của từng module riêng biệt (Database models, API endpoints, workflow state machine).
4. **Standards (Tiêu Chuẩn Phát Triển)**: Các tài liệu checklist review mã nguồn, tiêu chuẩn đặt tên, tiêu chuẩn xây dựng giao diện UI/UX.
5. **Governance (Quản Trị Hệ Thống)**: Chính sách phát hành, phiên bản, bảo vệ ranh giới modular monolith và quy tắc đóng băng kiến trúc.
6. **Runtime (Vận Hành & Telemetry)**: Các báo cáo ghi nhận số liệu sức khỏe hệ thống, dung lượng bộ nhớ, hiệu quả của cache và hit-ratio của read models.
7. **Audit (Báo Cáo Kiểm Toán)**: Các đánh giá tĩnh về cấu trúc mã nguồn, độ bao phủ repository, nợ kỹ thuật và định biên truy vấn SQL.
8. **Verification (Xác Minh & Ghi Vết)**: Các báo cáo nghiệm thu lỗi (hotfixes), nhật ký kiểm chứng chạy thử (cutovers/parities) và kết quả gỡ lỗi tạm thời.
9. **Archive (Kho Lưu Trữ)**: Các tài liệu lịch sử đã lỗi thời nhưng cần lưu trữ phục vụ mục đích tra cứu đối chiếu.

---

## 2. Kết Quả Kiểm Toán Chi Tiết Theo Thư Mục

### 2.1. Thư mục Gốc `docs/`

Các tài liệu tại thư mục gốc đóng vai trò định hướng ban đầu nhưng hiện tại phần lớn đã bị trôi lệch thông tin so với các tài liệu chuẩn trong [docs/ai-state/](file:///opt/projects/steeltrack/docs/ai-state/).

| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [AI_CONTEXT.md](file:///opt/projects/steeltrack/docs/AI_CONTEXT.md) | Source of Truth | Stale | **Lưu trữ**: Gộp các quy tắc ranh giới và tầm nhìn dài hạn vào [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md) sau đó di chuyển vào [docs/archive/](file:///opt/projects/steeltrack/docs/archive/). |
| [AI_RULES.md](file:///opt/projects/steeltrack/docs/AI_RULES.md) | Standards | Stale | **Lưu trữ**: Di chuyển danh sách kiểm tra API delta sang [enterprise-development-standards.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-development-standards.md) và lưu trữ tệp tin này. |
| [KNOWN_ISSUES.md](file:///opt/projects/steeltrack/docs/KNOWN_ISSUES.md) | Audit | Stale | **Lưu trữ**: Đã gộp các nợ kỹ thuật vào báo cáo nợ tổng hợp trong `docs/ai-state/audits/technical-debt-audit.md`. Sẵn sàng lưu trữ. |
| [ROADMAP.md](file:///opt/projects/steeltrack/docs/ROADMAP.md) | Source of Truth | Stale | **Lưu trữ**: Bản đồ lộ trình ERP dài hạn. Đã được chuyển hóa thành các tasks cụ thể trong [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md). |
| [TREE_STRUCTURE.md](file:///opt/projects/steeltrack/docs/TREE_STRUCTURE.md) | Standards | Stale | **Lưu trữ**: Cấu trúc thư mục cũ. Đã được thay thế bởi hướng dẫn trong [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md). |

---

### 2.2. Thư mục `docs/ai-state/` (Quản Lý Trạng Thái AI)

Thư mục cốt lõi chứa các tài liệu Source of Truth dùng để điều phối hoạt động phát triển của AI Agents. Tất cả các tệp này ở trạng thái hoạt động tích cực.

| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [AI_ROLES.md](file:///opt/projects/steeltrack/docs/ai-state/AI_ROLES.md) | Governance | Current | **Giữ lại**: Đặc tả trách nhiệm của từng AI Subagent trong quá trình phát triển. |
| [CHANGELOG_AI.md](file:///opt/projects/steeltrack/docs/ai-state/CHANGELOG_AI.md) | Source of Truth | Current | **Giữ lại**: Nhật ký thay đổi vận hành chi tiết hàng ngày do AI thực hiện. |
| [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md) | Source of Truth | Current | **Giữ lại**: Cẩm nang nguyên tắc code, luồng công việc bắt buộc cho AI. |
| [CURRENT_MODULES.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_MODULES.md) | Source of Truth | Current | **Giữ lại**: Bảng theo dõi trạng thái hoàn thành (Started/In Progress/Finished) của các module. |
| [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md) | Source of Truth | Current | **Giữ lại**: Bản tóm tắt kiến trúc hiện tại của hệ thống. |
| [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md) | Source of Truth | Current | **Giữ lại**: Danh sách các tác vụ tiếp theo phân chia theo độ ưu tiên. |
| [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md) | Source of Truth | Current | **Giữ lại**: Phần trăm tiến độ hoàn thành thực tế của toàn dự án. |
| [changelog.md](file:///opt/projects/steeltrack/docs/ai-state/changelog.md) | Source of Truth | Current | **Giữ lại**: Changelog chung của dự án cho cả Humans và AI. |
| [roadmap.md](file:///opt/projects/steeltrack/docs/ai-state/roadmap.md) | Source of Truth | Current | **Giữ lại**: Lộ trình ngắn hạn và trung hạn của dự án. |

#### 2.2.1. Phân mục `docs/ai-state/decisions/` (Quyết định cục bộ)
| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [architecture-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/architecture-decisions.md) | Architecture | Current | **Giữ lại**: Các ghi nhận quyết định kiến trúc nhỏ trong quá trình dev phân hệ. |
| [code-numbering-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/code-numbering-decisions.md) | Architecture | Current | **Giữ lại**: Quyết định về định dạng sinh mã tự động cho cấu kiện, dự án. |
| [inventory-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/inventory-decisions.md) | Architecture | Current | **Giữ lại**: Các quyết định ràng buộc logic nghiệp vụ kho. |
| [production-decisions.md](file:///opt/projects/steeltrack/docs/ai-state/decisions/production-decisions.md) | Architecture | Current | **Giữ lại**: Quyết định thiết kế luồng lệnh sản xuất MES. |

#### 2.2.2. Phân mục `docs/ai-state/design/` (Thiết kế chi tiết)
| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [event-naming.md](file:///opt/projects/steeltrack/docs/ai-state/design/event-naming.md) | Standards | Current | **Giữ lại**: Chuẩn đặt tên Outbox events cục bộ. |
| [inventory-target-architecture.md](file:///opt/projects/steeltrack/docs/ai-state/design/inventory-target-architecture.md) | Blueprint | Current | **Giữ lại**: Thiết kế kiến trúc đích cho kho vật tư SteelTrack. |
| [production-phase-next.md](file:///opt/projects/steeltrack/docs/ai-state/design/production-phase-next.md) | Blueprint | Current | **Giữ lại**: Lộ trình nâng cấp tính năng MES của phân xưởng sản xuất. |
| [repo-structure.md](file:///opt/projects/steeltrack/docs/ai-state/design/repo-structure.md) | Standards | Current | **Giữ lại**: Sơ đồ tổ chức các thư mục mã nguồn Backend và Frontend. |
| [ui-standardization-foundation.md](file:///opt/projects/steeltrack/docs/ai-state/design/ui-standardization-foundation.md) | Standards | Current | **Giữ lại**: Tiêu chuẩn giao diện người dùng cho các dashboard điều hành. |

#### 2.2.3. Phân mục `docs/ai-state/modules/` (Đặc tả module hiện tại)
Các tài liệu này tóm tắt phạm vi, bảng cơ sở dữ liệu và danh sách API của từng module đang chạy thực tế.
*Tất cả 11 tập tin sau đều phân loại vào **Blueprint**, trạng thái **Current**, và phương án xử lý là **Giữ lại** tại vị trí hiện hành:*
1. [components.md](file:///opt/projects/steeltrack/docs/ai-state/modules/components.md) (Đặc tả module quản lý cấu kiện thép)
2. [dashboard.md](file:///opt/projects/steeltrack/docs/ai-state/modules/dashboard.md) (Đặc tả cockpit điều hành tổng hợp)
3. [inventory.md](file:///opt/projects/steeltrack/docs/ai-state/modules/inventory.md) (Đặc tả module quản lý kho vật tư)
4. [logistics.md](file:///opt/projects/steeltrack/docs/ai-state/modules/logistics.md) (Đặc tả module giao nhận vận tải)
5. [operations-center.md](file:///opt/projects/steeltrack/docs/ai-state/modules/operations-center.md) (Đặc tả trung tâm vận hành hạ tầng)
6. [production.md](file:///opt/projects/steeltrack/docs/ai-state/modules/production.md) (Đặc tả module điều hành sản xuất MES)
7. [projects.md](file:///opt/projects/steeltrack/docs/ai-state/modules/projects.md) (Đặc tả module quản lý dự án PMS)
8. [qc.md](file:///opt/projects/steeltrack/docs/ai-state/modules/qc.md) (Đặc tả module kiểm soát chất lượng)
9. [suppliers.md](file:///opt/projects/steeltrack/docs/ai-state/modules/suppliers.md) (Đặc tả module nhà cung cấp vật tư)
10. [system.md](file:///opt/projects/steeltrack/docs/ai-state/modules/system.md) (Đặc tả các cấu hình hệ thống cốt lõi)
11. [yard.md](file:///opt/projects/steeltrack/docs/ai-state/modules/yard.md) (Đặc tả bãi tập kết cấu kiện thành phẩm)

#### 2.2.4. Phân mục `docs/ai-state/audits/` (Báo cáo đánh giá của AI)
Các báo cáo này do AI tự động tổng hợp trong quá trình kiểm toán định kỳ.
*Tất cả 12 tập tin sau đều phân loại vào **Audit**, trạng thái **Current**, và phương án xử lý là **Giữ lại** để AI tự đối chiếu:*
1. [bom-intelligence-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/bom-intelligence-audit.md)
2. [business-data-cleanup-20260624.md](file:///opt/projects/steeltrack/docs/ai-state/audits/business-data-cleanup-20260624.md)
3. [clean-dataset-plan.md](file:///opt/projects/steeltrack/docs/ai-state/audits/clean-dataset-plan.md)
4. [documentation-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/documentation-audit.md)
5. [inventory-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/inventory-audit.md)
6. [legacy-docs-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/legacy-docs-audit.md)
7. [mes-data-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/mes-data-audit.md)
8. [module-coverage-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/module-coverage-audit.md)
9. [post-cleanup-summary.md](file:///opt/projects/steeltrack/docs/ai-state/audits/post-cleanup-summary.md)
10. [system-integrity-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/system-integrity-audit.md)
11. [technical-debt-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/technical-debt-audit.md)
12. [validation-cleanup-review.md](file:///opt/projects/steeltrack/docs/ai-state/audits/validation-cleanup-review.md)

---

### 2.3. Thư mục `docs/architecture/` (Kiến Trúc Doanh Nghiệp)

Thư mục chính lưu trữ đặc tả thiết kế, ranh giới module và các chuẩn lập trình cốt lõi của Core Platform. Tất cả các tài liệu ở trạng thái hoạt động tích cực.

| Nhóm Tập Tin | Phân Loại | Trạng Trạng Thái | Phương Án Xử Lý |
| --- | --- | --- | --- |
| **Quy định chung & ADRs**: <br>- [ARCHITECTURE_FREEZE.md](file:///opt/projects/steeltrack/docs/architecture/ARCHITECTURE_FREEZE.md)<br>- [enterprise-architecture-decision-records.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-architecture-decision-records.md) | Governance / Architecture | Current | **Giữ lại**: Tài liệu tối cao quy định trạng thái đóng băng và lịch sử các quyết định kiến trúc ADR001-ADR010. |
| **Bản thiết kế phân hệ (Blueprints)**: <br>- Các tệp `-blueprint.md` cho các module (ai, finance, hr, integration, logistics, projects, purchasing, qc, yard, production) | Blueprint | Current | **Giữ lại**: Đây là các đặc tả nghiệp vụ mức cao bắt buộc để phát triển các module. |
| **Tiêu chuẩn lập trình (Guidelines)**: <br>- Các tệp `enterprise-*-guidelines.md` và `*-standards.md` | Standards | Current | **Giữ lại**: Định hướng quy chuẩn phát triển (naming conventions, repository structure, UI guidelines) cho con người và AI. |
| **Hợp đồng & Ranh giới**: <br>- [enterprise-api-contracts.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-api-contracts.md)<br>- [enterprise-domain-boundaries.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-boundaries.md)<br>- [enterprise-module-dependency-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-module-dependency-map.md) | Architecture / Standards | Current | **Giữ lại**: Bản đồ phụ thuộc ranh giới và định nghĩa API endpoints chuẩn. |
| **Sự kiện & Danh mục**: <br>- [enterprise-event-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-event-catalog.md)<br>- [enterprise-read-model-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-read-model-catalog.md)<br>- [enterprise-snapshot-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-snapshot-catalog.md) | Architecture | Current | **Giữ lại**: Danh mục các sự kiện Outbox, các bản đọc cached và bảng snapshots. |
| **Công cụ ngầm & Cơ sở dữ liệu**: <br>- [background-engine.md](file:///opt/projects/steeltrack/docs/architecture/background-engine.md)<br>- [persisted-read-model-foundation.md](file:///opt/projects/steeltrack/docs/architecture/persisted-read-model-foundation.md)<br>- [persisted-snapshot-architecture.md](file:///opt/projects/steeltrack/docs/architecture/persisted-snapshot-architecture.md)<br>- [snapshot-update-engine.md](file:///opt/projects/steeltrack/docs/architecture/snapshot-update-engine.md)<br>- [event-bus-foundation.md](file:///opt/projects/steeltrack/docs/architecture/event-bus-foundation.md) | Architecture | Current | **Giữ lại**: Đặc tả các engine nền tảng phục vụ cho kiến trúc đọc nhanh ghi chậm (Snapshot-First). |

---

### 2.4. Thư mục `docs/archive/` (Kho Lưu Trữ Hiện Tại)
Chứa các tài liệu thiết kế lịch sử đã chính thức ngừng sử dụng.
*Tất cả tập tin ở đây đều phân loại vào **Archive**, trạng thái **Current (Đã lưu trữ)**, và phương án xử lý là **Giữ lại làm lịch sử**:*
1. [PROJECT_OVERVIEW.md](file:///opt/projects/steeltrack/docs/archive/PROJECT_OVERVIEW.md) (Tóm tắt tổng quan ban đầu, cấu trúc backend NestJS cũ)
2. [REFACTOR_MASTER_PLAN.md](file:///opt/projects/steeltrack/docs/archive/REFACTOR_MASTER_PLAN.md) (Kế hoạch tái cấu trúc 5 giai đoạn đã kết thúc)

---

### 2.5. Thư mục `docs/audit/` (Các Báo Cáo Kiểm Toán Tĩnh)
Chứa các đánh giá mã nguồn từ các sprint trước. Do các lỗi đã được sửa đổi và đưa vào quy chuẩn, toàn bộ các file này đều thuộc diện **Archive Candidate** cần chuyển vào [docs/archive/](file:///opt/projects/steeltrack/docs/archive/) để tránh nhiễu ngữ cảnh AI.

| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [inventory-workspace-audit.md](file:///opt/projects/steeltrack/docs/audit/inventory-workspace-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Kiểm toán workspace Inventory trước khi freeze. |
| [inventory-workspace-recovery-report.md](file:///opt/projects/steeltrack/docs/audit/inventory-workspace-recovery-report.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo phục hồi workspace Inventory đã hoàn tất xử lý. |
| [epic-100-repository-layer-audit.md](file:///opt/projects/steeltrack/docs/audit/epic-100-repository-layer-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Đã chuẩn hóa Repository Pattern cho toàn bộ backend. |
| [perf-foundation-report.md](file:///opt/projects/steeltrack/docs/audit/perf-foundation-report.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo cơ sở hiệu năng cũ của Sprint PERF. |
| [performance-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/performance-readiness-report.md) | Audit | Stale | **Chuyển lưu trữ**: Đã áp dụng các biện pháp tối ưu hiệu năng API. |
| [realtime-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/realtime-readiness-report.md) | Audit | Stale | **Chuyển lưu trữ**: Đã tích hợp Event Bus và Websockets vào core. |
| [workflow-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/workflow-readiness-report.md) | Audit | Stale | **Chuyển lưu trữ**: Quy trình nghiệp vụ cũ. |
| [import-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/import-readiness-report.md) | Audit | Stale | **Chuyển lưu trữ**: Khảo sát nhập dữ liệu cũ. |
| [costing-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/costing-readiness-report.md) | Audit | Stale | **Chuyển lưu trữ**: Kiểm toán tính toán giá thành nguyên vật liệu. |
| [dashboard-api-performance-audit.md](file:///opt/projects/steeltrack/docs/audit/dashboard-api-performance-audit.md) | Audit | Stale | **Chuyển lưu trữ**: API cũ của Dashboard đã đổi sang đọc snapshot. |
| [query-budget-audit.md](file:///opt/projects/steeltrack/docs/audit/query-budget-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Cảnh báo query budget thời kỳ đầu. |
| [query-segmentation-report.md](file:///opt/projects/steeltrack/docs/audit/query-segmentation-report.md) | Audit | Stale | **Chuyển lưu trữ**: Đã tối ưu hóa qua index composite migration. |
| [module-maturity-matrix.md](file:///opt/projects/steeltrack/docs/audit/module-maturity-matrix.md) | Audit | Stale | **Chuyển lưu trữ**: Sẽ có báo cáo đánh giá tự động trực tiếp trên Operations Center. |
| [next-roadmap-recommendations.md](file:///opt/projects/steeltrack/docs/audit/next-roadmap-recommendations.md) | Audit | Stale | **Chuyển lưu trữ**: Đề xuất roadmap lịch sử. |
| [technical-debt-report.md](file:///opt/projects/steeltrack/docs/audit/technical-debt-report.md) | Audit | Stale | **Chuyển lưu trữ**: Nhật ký nợ kỹ thuật từ tháng 06/2026. |
| [core-platform-compliance-score.md](file:///opt/projects/steeltrack/docs/audit/core-platform-compliance-score.md) | Audit | Stale | **Chuyển lưu trữ**: Điểm số tuân thủ nền tảng cũ. |
| [enterprise-architecture-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-architecture-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo kiểm toán kiến trúc mức cao. |
| [enterprise-index-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-index-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo quét và tối ưu chỉ mục database. |
| [enterprise-query-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-query-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo tối ưu các truy vấn N+1 và quan hệ SQL chéo. |
| [enterprise-scalability-foundation-report.md](file:///opt/projects/steeltrack/docs/audit/enterprise-scalability-foundation-report.md) | Audit | Stale | **Chuyển lưu trữ**: Báo cáo đánh giá khả năng mở rộng của Modular Monolith. |
| [inventory-core-platform-audit.md](file:///opt/projects/steeltrack/docs/audit/inventory-core-platform-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Kiểm toán mức độ tuân thủ Core Platform của module Inventory. |
| [inventory-refactor-roadmap.md](file:///opt/projects/steeltrack/docs/audit/inventory-refactor-roadmap.md) | Audit | Stale | **Chuyển lưu trữ**: Kế hoạch tái cấu trúc Inventory. |
| [production-core-platform-audit.md](file:///opt/projects/steeltrack/docs/audit/production-core-platform-audit.md) | Audit | Stale | **Chuyển lưu trữ**: Kiểm toán mức độ tuân thủ Core Platform của module Production. |
| [production-roadmap.md](file:///opt/projects/steeltrack/docs/audit/production-roadmap.md) | Audit | Stale | **Chuyển lưu trữ**: Lộ trình phát triển module Production cũ. |
| [technical-debt-priority.md](file:///opt/projects/steeltrack/docs/audit/technical-debt-priority.md) | Audit | Stale | **Chuyển lưu trữ**: Phân chia mức độ ưu tiên xử lý nợ cũ. |

---

### 2.6. Thư mục `docs/runtime/` (Báo Cáo Vận Hành & Đo Lường)

Chứa kết quả chạy thử các dịch vụ giám sát hiệu năng. Ngoại trừ các báo cáo cấu trúc hệ thống, phần lớn là dữ liệu snapshot tĩnh đã cũ.

| Tên File | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| [operations-center-system-health-report.md](file:///opt/projects/steeltrack/docs/runtime/operations-center-system-health-report.md) | Runtime | Current | **Giữ lại**: Đặc tả cấu trúc hiển thị sức khỏe của Operations Center. |
| [runtime-metrics-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-metrics-report.md) | Runtime | Stale | **Chuyển lưu trữ**: Báo cáo telemetry cũ. |
| [runtime-health-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-health-report.md) | Runtime | Stale | **Chuyển lưu trữ**: Báo cáo sức khỏe tiến trình node cũ. |
| [performance-baseline.md](file:///opt/projects/steeltrack/docs/runtime/performance-baseline.md) | Runtime | Current | **Giữ lại**: Mốc so sánh hiệu năng của toàn bộ hệ thống API. |
| [performance-score-report.md](file:///opt/projects/steeltrack/docs/runtime/performance-score-report.md) | Runtime | Stale | **Chuyển lưu trữ**: Điểm số hiệu năng cũ. |
| [architecture-score-report.md](file:///opt/projects/steeltrack/docs/runtime/architecture-score-report.md) | Runtime | Stale | **Chuyển lưu trữ**: Điểm số kiến trúc cũ. |
| [backend-build-layout.md](file:///opt/projects/steeltrack/docs/runtime/backend-build-layout.md) | Runtime | Current | **Giữ lại**: Cấu trúc các tệp tin build của backend sau webpack/rollup. |
| *Tất cả các tệp `-report.md` và `-validation.md` liên quan đến `inventory-` và `project-`* (40 tập tin) | Verification | Stale | **Chuyển lưu trữ**: Báo cáo kiểm định chạy thử các bộ đọc/ghi snapshot và read models của Inventory và Projects. Đã kết thúc thử nghiệm thực tế. |

---

### 2.7. Thư mục `docs/bugs/` (Báo Cáo Sự Cố)
*Tất cả 8 tập tin sau đều phân loại vào **Verification**, trạng thái **Stale**, và phương án xử lý là **Chuyển lưu trữ** vì các lỗi DI, 404, Return, và Cache Staleness đã được fix cứng vào code:*
1. [project-material-return-api-404-report.md](file:///opt/projects/steeltrack/docs/bugs/project-material-return-api-404-report.md)
2. [project-material-return-reconciliation-report.md](file:///opt/projects/steeltrack/docs/bugs/project-material-return-reconciliation-report.md)
3. [projects-rbac-di-hotfix-report.md](file:///opt/projects/steeltrack/docs/bugs/projects-rbac-di-hotfix-report.md)
4. [projects-runtime-recovery-report.md](file:///opt/projects/steeltrack/docs/bugs/projects-runtime-recovery-report.md)
5. [projects-template-api-report.md](file:///opt/projects/steeltrack/docs/bugs/projects-template-api-report.md)
6. [material-analytics-timeline-validation-report.md](file:///opt/projects/steeltrack/docs/bugs/material-analytics-timeline-validation-report.md)
7. [material-detail-analytics-staleness-report.md](file:///opt/projects/steeltrack/docs/bugs/material-detail-analytics-staleness-report.md)
8. [projects-migration-status-report.md](file:///opt/projects/steeltrack/docs/bugs/projects-migration-status-report.md)

---

### 2.8. Thư mục `docs/dev/` (Hỗ Trợ Phát Triển)
*Tất cả 2 tập tin sau đều phân loại vào **Verification**, trạng thái **Stale**, và phương án xử lý là **Chuyển lưu trữ** vì sự cố quá tải sự kiện file watcher đã được cấu hình loại trừ:*
1. [watchers-diagnostics-report.md](file:///opt/projects/steeltrack/docs/dev/watchers-diagnostics-report.md)
2. [watchers-remediation-plan.md](file:///opt/projects/steeltrack/docs/dev/watchers-remediation-plan.md)

---

### 2.9. Thư mục `docs/inventory/` (Lộ Trình Cũ Phân Hệ Kho)
*Tập tin duy nhất phân loại vào **Blueprint**, trạng thái **Stale**, và phương án xử lý là **Chuyển lưu trữ** vì kế hoạch đã được sáp nhập vào tài liệu quyết định:*
1. [inventory-phase1-migration-plan.md](file:///opt/projects/steeltrack/docs/inventory/inventory-phase1-migration-plan.md)

---

### 2.10. Thư mục `docs/ui/` (Báo Cáo UI/UX & Layout)

Thư mục lớn chứa toàn bộ tài liệu kiểm chứng giao diện của các đợt refactor. Ngoại trừ các bản kế hoạch di trú UI chung của Production và Components vẫn đang ở trạng thái Current, các file báo cáo polish card/drawer nhỏ đều là **Archive Candidates** cần dọn dẹp để AI tránh đọc nhầm thiết kế cũ.

| Nhóm Tập Tin | Phân Loại | Trạng Thái | Phương Án & Chi Tiết Xử Lý |
| --- | --- | --- | --- |
| **Kế hoạch di trú UI**: <br>- [production-ui-migration-plan.md](file:///opt/projects/steeltrack/docs/ui/production-ui-migration-plan.md)<br>- [components-ui-migration-plan.md](file:///opt/projects/steeltrack/docs/ui/components-ui-migration-plan.md) | Blueprint | Current | **Giữ lại**: Định hình cấu trúc layout các tab, drawer và routing cho frontend. |
| **Báo cáo chuẩn hóa điều hướng**: <br>- [drawer-standardization-report.md](file:///opt/projects/steeltrack/docs/ui/drawer-standardization-report.md)<br>- [navigation-audit-report.md](file:///opt/projects/steeltrack/docs/ui/navigation-audit-report.md)<br>- [navigation-completion-report.md](file:///opt/projects/steeltrack/docs/ui/navigation-completion-report.md)<br>- [navigation-yard-logistics-fix-report.md](file:///opt/projects/steeltrack/docs/ui/navigation-yard-logistics-fix-report.md) | Standards | Stale | **Chuyển lưu trữ**: Các báo cáo nghiệm thu menu điều hướng hệ thống. |
| **Nhật ký Polish UI/UX**: <br>- Tất cả các tệp `-report.md` dạng polish cho component, cockpit, và timeline (68 tập tin còn lại) | Verification | Stale | **Chuyển lưu trữ**: Lưu lại toàn bộ các báo cáo polish UI nhỏ của Components, Logistics, Yard, và Projects để giải phóng ngữ cảnh. |
