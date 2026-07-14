# SteelTrack Master Index (Mục Lục Tối Cao)

Tài liệu này cung cấp mục lục toàn diện của toàn bộ hệ thống tài liệu trong dự án **SteelTrack**. Các tài liệu được phân chia theo nhóm logic để hỗ trợ tìm kiếm nhanh chóng cho cả con người và tác nhân AI.

---

## 1. Source of Truth (Nguồn Sự Thật Dự Án)

Các tài liệu cập nhật liên tục về trạng thái, nhiệm vụ, quy trình làm việc và cấu trúc phân hệ hiện tại của SteelTrack. Chúng nằm chủ yếu trong thư mục [ai-state/](file:///opt/projects/steeltrack/docs/ai-state).

### Tài liệu Trạng thái Hệ thống (Core State Files)
* [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md): Bản tóm tắt đầy đủ trạng thái kỹ thuật và kiến trúc hiện tại của dự án.
* [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md): Tiến độ hoàn thành (%) và các cột mốc đã đạt được của các phân hệ.
* [CURRENT_MODULES.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_MODULES.md): Danh sách trạng thái triển khai cụ thể của từng module (Hoàn thành, Đang triển khai, Chưa bắt đầu).
* [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md): Danh sách các đầu việc tiếp theo được sắp xếp theo độ ưu tiên giảm dần.
* [CHANGELOG_AI.md](file:///opt/projects/steeltrack/docs/ai-state/CHANGELOG_AI.md): Nhật ký chi tiết các thay đổi được thực hiện bởi tác nhân AI.
* [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md): Quy trình làm việc bắt buộc của AI, quy tắc kỹ thuật và chính sách cập nhật tài liệu.
* [AI_ROLES.md](file:///opt/projects/steeltrack/docs/ai-state/AI_ROLES.md): Định nghĩa các vai trò và phạm vi hoạt động của AI Agents.
* [changelog.md](file:///opt/projects/steeltrack/docs/ai-state/changelog.md): Nhật ký thay đổi chung của dự án.
* [roadmap.md](file:///opt/projects/steeltrack/docs/ai-state/roadmap.md): Định hướng lộ trình phát triển của phân hệ AI-state.

### Tài liệu Phân hệ Cụ thể (Module-Specific Docs)
Tài liệu chi tiết về phạm vi, chức năng đã cài đặt, các endpoint API, bảng cơ sở dữ liệu và công việc còn lại của từng module. Chúng nằm trong thư mục [modules/](file:///opt/projects/steeltrack/docs/ai-state/modules).
* [inventory.md](file:///opt/projects/steeltrack/docs/ai-state/modules/inventory.md): Phân hệ Quản lý Kho vật tư (WMS) - Reference Candidate Freeze v1.0.
* [projects.md](file:///opt/projects/steeltrack/docs/ai-state/modules/projects.md): Phân hệ Quản lý Dự án kết cấu thép (PMS) - Architecture Freeze v1.0.
* [production.md](file:///opt/projects/steeltrack/docs/ai-state/modules/production.md): Phân hệ Quản lý Sản xuất & Nhà xưởng (MES).
* [qc.md](file:///opt/projects/steeltrack/docs/ai-state/modules/qc.md): Phân hệ Quản lý Chất lượng (Incoming, In-process, Final QC).
* [logistics.md](file:///opt/projects/steeltrack/docs/ai-state/modules/logistics.md): Phân hệ Quản lý Vận chuyển & Giao nhận hàng hóa.
* [yard.md](file:///opt/projects/steeltrack/docs/ai-state/modules/yard.md): Phân hệ Quản lý Bãi chứa thép (Yard Management - YMS).
* [suppliers.md](file:///opt/projects/steeltrack/docs/ai-state/modules/suppliers.md): Phân hệ Quản lý Nhà cung cấp và chuỗi cung ứng.
* [components.md](file:///opt/projects/steeltrack/docs/ai-state/modules/components.md): Phân hệ Quản lý Cấu kiện / Bán thành phẩm gia công.
* [dashboard.md](file:///opt/projects/steeltrack/docs/ai-state/modules/dashboard.md): Phân hệ Bảng điều khiển tích hợp cho quản lý và vận hành.
* [operations-center.md](file:///opt/projects/steeltrack/docs/ai-state/modules/operations-center.md): Buồng lái giám sát kỹ thuật hệ thống (Operations Cockpit).
* [system.md](file:///opt/projects/steeltrack/docs/ai-state/modules/system.md): Phân hệ lõi cấu hình hệ thống, xác thực và phân quyền.

---

## 2. Core Architecture & Blueprints (Thiết Kế Kiến Trúc Lõi)

Bản thiết kế chi tiết (Blueprints) cho các phân hệ doanh nghiệp của SteelTrack cùng hạ tầng nền tảng. Hầu hết nằm trong thư mục [architecture/](file:///opt/projects/steeltrack/docs/architecture).

### Blueprints của các Phân hệ Doanh nghiệp
* [production-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/production-blueprint.md): Bản thiết kế chi tiết quy trình sản xuất MES, OEE, downtime.
* [production-domain.md](file:///opt/projects/steeltrack/docs/architecture/production-domain.md): Thiết kế domain, thực thể nghiệp vụ sản xuất.
* [production-event-flow.md](file:///opt/projects/steeltrack/docs/architecture/production-event-flow.md): Luồng sự kiện Outbox phục vụ tương tác sản xuất.
* [production-read-model.md](file:///opt/projects/steeltrack/docs/architecture/production-read-model.md): Mô hình Read Model cho các chỉ số OEE và giám sát nhà xưởng.
* [production-snapshot.md](file:///opt/projects/steeltrack/docs/architecture/production-snapshot.md): Đặc tả cấu trúc Snapshot lưu trữ dữ liệu sản xuất.
* [production-workflow.md](file:///opt/projects/steeltrack/docs/architecture/production-workflow.md): Luồng công việc phân công sản xuất và xử lý phế phẩm (Scrap/Rework).
* [production-dashboard.md](file:///opt/projects/steeltrack/docs/architecture/production-dashboard.md): Đặc tả màn hình điều khiển sản xuất của quản đốc và công nhân.
* [projects-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/projects-blueprint.md): Bản thiết kế chi tiết phân hệ quản lý dự án (PMS).
* [projects-domain.md](file:///opt/projects/steeltrack/docs/architecture/projects-domain.md): Cấu trúc domain WBS, phân bổ vật tư, kiểm soát tiến độ.
* [projects-event-flow.md](file:///opt/projects/steeltrack/docs/architecture/projects-event-flow.md): Luồng sự kiện thay đổi trạng thái tác vụ dự án.
* [projects-read-model.md](file:///opt/projects/steeltrack/docs/architecture/projects-read-model.md): Cấu trúc truy vấn tối ưu cho chi tiết dự án theo tab.
* [projects-snapshot.md](file:///opt/projects/steeltrack/docs/architecture/projects-snapshot.md): Đặc tả snapshot cho bảng điều khiển dự án và các tab chi tiết.
* [projects-workflow.md](file:///opt/projects/steeltrack/docs/architecture/projects-workflow.md): Luồng lập kế hoạch, nghiệm thu và yêu cầu trả vật tư từ công trường.
* [projects-dashboard.md](file:///opt/projects/steeltrack/docs/architecture/projects-dashboard.md): Đặc tả màn hình điều khiển tích hợp của dự án.
* [qc-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/qc-blueprint.md): Thiết kế phân hệ Quản lý Chất lượng, NCR, CAPA và biểu đồ truy xuất nguồn gốc.
* [logistics-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/logistics-blueprint.md): Thiết kế phân hệ Vận chuyển, lập kế hoạch xếp xe, định tuyến và chứng từ điện tử (POD).
* [yard-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/yard-blueprint.md): Thiết kế phân hệ Quản lý Bãi chứa thép tấm, thép hình và chỉ dẫn cẩu trục.
* [purchasing-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/purchasing-blueprint.md): Thiết kế quy trình mua hàng, duyệt yêu cầu mua sắm (PR) và đơn hàng (PO).
* [finance-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/finance-blueprint.md): Thiết kế phân hệ Tài chính, kế toán giá thành sản phẩm (FIFO, WAC) và giá thành dự án.
* [hr-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/hr-blueprint.md): Thiết kế phân hệ Nhân sự, chấm công, quản lý ca kíp và đơn giá tiền lương sản phẩm.
* [ai-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/ai-blueprint.md): Thiết kế hệ sinh thái trí tuệ nhân tạo (hỗ trợ giọng nói hiện trường, tối ưu hóa sắp xếp thép tấm).
* [integration-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/integration-blueprint.md): Bản thiết kế tích hợp toàn hệ thống, luồng trao đổi dữ liệu liên phân hệ.

### Hạ tầng Kỹ thuật & Subsystems (Infrastructure Foundations)
* [background-engine.md](file:///opt/projects/steeltrack/docs/architecture/background-engine.md): Kiến trúc Background Processing Engine xử lý tác vụ ngầm.
* [event-bus-foundation.md](file:///opt/projects/steeltrack/docs/architecture/event-bus-foundation.md): Nền tảng luồng sự kiện nội bộ và Transactional Outbox Pattern.
* [persisted-read-model-foundation.md](file:///opt/projects/steeltrack/docs/architecture/persisted-read-model-foundation.md): Cơ chế lưu trữ và làm tươi các mô hình Read Model.
* [persisted-snapshot-architecture.md](file:///opt/projects/steeltrack/docs/architecture/persisted-snapshot-architecture.md): Kiến trúc Snapshot cơ sở dữ liệu để tối ưu tốc độ đọc API.
* [snapshot-update-engine.md](file:///opt/projects/steeltrack/docs/architecture/snapshot-update-engine.md): Cơ chế cập nhật và đồng bộ hóa Snapshot qua Worker.
* [INVENTORY_TRANSACTION_RULES.md](file:///opt/projects/steeltrack/docs/architecture/INVENTORY_TRANSACTION_RULES.md): Quy tắc giao dịch vật tư bắt buộc (chỉ ghi nhận qua Ledger giao dịch).
* [inventory-phase1-migration-plan.md](file:///opt/projects/steeltrack/docs/inventory/inventory-phase1-migration-plan.md): Kế hoạch dịch chuyển dữ liệu kho giai đoạn 1.

---

## 3. Governance & Standards (Quản Trị & Tiêu Chuẩn)

Tất cả các tài liệu chuẩn hóa quy trình, thiết kế mã nguồn, cấu trúc dữ liệu và chính sách vận hành của doanh nghiệp. Nằm trong thư mục [architecture/](file:///opt/projects/steeltrack/docs/architecture) với tiền tố `enterprise-*`.

### Frontend Presentation Standards

* [DESIGN_SYSTEM.md](file:///opt/projects/steeltrack/docs/ui/DESIGN_SYSTEM.md): Canonical cockpit/module presentation layers and component ownership.
* [COMPONENT_GUIDELINES.md](file:///opt/projects/steeltrack/docs/ui/COMPONENT_GUIDELINES.md): Selection, composition, and review rules for shared frontend components.
* [inventory-component-audit.md](file:///opt/projects/steeltrack/docs/ui/inventory-component-audit.md): Active Inventory component coverage and duplicate analysis.
* [inventory-shared-component-roadmap.md](file:///opt/projects/steeltrack/docs/ui/inventory-shared-component-roadmap.md): Safe consolidation and dead-code roadmap.

* [enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md): Khung quản trị kiến trúc, vai trò của Architecture Guardian và quy trình phê duyệt của ARB.
* [enterprise-architecture-decision-records.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-architecture-decision-records.md): Hồ sơ Quyết định Kiến trúc (gồm 10 ADR từ ADR001 đến ADR010).
* [enterprise-development-standards.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-development-standards.md): Bộ quy tắc phát triển phần mềm chuẩn mực cho lập trình viên.
* [enterprise-naming-conventions.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-naming-conventions.md): Quy chuẩn đặt tên đối với cơ sở dữ liệu, Repository, Sự kiện, Snapshot và Phiên bản.
* [enterprise-domain-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-map.md): Bản đồ phân rã Domain và Bounded Context của hệ thống SteelTrack.
* [enterprise-domain-boundaries.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-boundaries.md): Ranh giới tương tác và ma trận phân quyền gọi chéo giữa các module.
* [enterprise-api-contracts.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-api-contracts.md): Quy chuẩn thiết kế API REST, phân trang, lọc dữ liệu và định dạng lỗi Zod.
* [enterprise-module-dependency-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-module-dependency-map.md): Bản đồ ràng buộc sự phụ thuộc giữa các module (Allowed/Forbidden).
* [enterprise-event-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-event-catalog.md): Danh mục định nghĩa cấu trúc payload các sự kiện hệ thống.
* [enterprise-read-model-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-read-model-catalog.md): Danh mục thiết kế các Read Model tối ưu hóa tốc độ truy vấn.
* [enterprise-snapshot-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-snapshot-catalog.md): Danh mục định nghĩa schema lưu trữ của các Snapshot thực thể.
* [enterprise-repository-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-repository-guidelines.md): Tiêu chuẩn thiết kế lớp Repository và ví dụ cụ thể về luồng nghiệp vụ.
* [enterprise-background-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-background-guidelines.md): Tiêu chuẩn xử lý tác vụ nền, Retry exponential backoff và xử lý Dead-Letter Queue (DLQ).
* [enterprise-runtime-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-runtime-guidelines.md): Tiêu chuẩn đo lường và giám sát viễn trắc (telemetry SLO) tại Runtime.
* [enterprise-operations-center-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-operations-center-guidelines.md): Tiêu chuẩn thiết kế Buồng lái Quản trị (Operations Center cockpit) và các ngưỡng cảnh báo.
* [enterprise-performance-sla.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-performance-sla.md): Cam kết mức chất lượng dịch vụ (SLA) về hiệu năng phản hồi API.
* [enterprise-code-review-checklist.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-code-review-checklist.md): Danh sách 9 tiêu chí bắt buộc kiểm tra khi Review Pull Request.
* [enterprise-release-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-release-policy.md): Chính sách phát hành phiên bản, kiểm tra khói (Smoke Test) và hạ cấp tính năng động.
* [enterprise-versioning-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-versioning-policy.md): Chính sách quản lý phiên bản SemVer, database migration không downtime (Expand-Contract).
* [enterprise-ai-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ai-guidelines.md): Tiêu chuẩn cộng tác an toàn giữa AI Agents và lập trình viên con người.
* [ARCHITECTURE_FREEZE.md](file:///opt/projects/steeltrack/docs/architecture/ARCHITECTURE_FREEZE.md): Tuyên bố đóng băng cấu trúc kiến trúc của dự án.
* [EVENT_NAMING.md](file:///opt/projects/steeltrack/docs/architecture/EVENT_NAMING.md): Định nghĩa chuẩn đặt tên sự kiện ngắn gọn.
* [data-growth-5-year-plan.md](file:///opt/projects/steeltrack/docs/architecture/data-growth-5-year-plan.md): Kế hoạch 5 năm quản lý tăng trưởng dữ liệu và lưu trữ lịch sử.

---

## 4. Runtime, Audit & Archive Files (Dữ Liệu Động, Kiểm Toán & Lưu Trữ)

Các tài liệu báo cáo đo lường thực tế tại runtime, kết quả đánh giá kỹ thuật lâm sàng và các tài liệu lưu trữ cũ.

### Báo cáo Runtime (Runtime Telemetry & Performance Reports)
Các tệp nằm tại thư mục [runtime/](file:///opt/projects/steeltrack/docs/runtime) ghi nhận tình trạng tải thực tế của hệ thống.
* [components-core-foundation-report.md](file:///opt/projects/steeltrack/docs/runtime/components-core-foundation-report.md): Components Core Platform compliance audit and score.
* [components-repository-boundary-report.md](file:///opt/projects/steeltrack/docs/runtime/components-repository-boundary-report.md): Components persistence and cross-module boundary audit.
* [components-read-model-report.md](file:///opt/projects/steeltrack/docs/runtime/components-read-model-report.md): ADR011 classification and live read-model readiness.
* [components-runtime-readiness.md](file:///opt/projects/steeltrack/docs/runtime/components-runtime-readiness.md): Snapshot, metrics, jobs and Operations Center readiness.
* [components-event-audit.md](file:///opt/projects/steeltrack/docs/runtime/components-event-audit.md): Existing and proposed Component event foundation.
* [production-operator-checklist.md](file:///opt/projects/steeltrack/docs/runtime/production-operator-checklist.md): Checklist vận hành Production Order và Material Flow.
* [production-smoke-test-guide.md](file:///opt/projects/steeltrack/docs/runtime/production-smoke-test-guide.md): Hướng dẫn thu thập bằng chứng smoke test Production.
* [production-runtime-certification.md](file:///opt/projects/steeltrack/docs/runtime/production-runtime-certification.md): Chứng nhận Runtime Production.
* [production-platform-certification.md](file:///opt/projects/steeltrack/docs/runtime/production-platform-certification.md): Scorecard và kết luận chứng nhận nền tảng Production.
* [production-event-certification.md](file:///opt/projects/steeltrack/docs/runtime/production-event-certification.md): Chứng nhận canonical/legacy event routing.
* [production-snapshot-certification.md](file:///opt/projects/steeltrack/docs/runtime/production-snapshot-certification.md): Chứng nhận persisted Production snapshots.
* [performance-baseline.md](file:///opt/projects/steeltrack/docs/runtime/performance-baseline.md): Điểm chuẩn hiệu năng cơ sở của hệ thống SteelTrack.
* [runtime-health-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-health-report.md): Báo cáo tổng quan sức khỏe hệ thống khi chạy thực tế.
* [runtime-metrics-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-metrics-report.md): Chi tiết các chỉ số đo lường hiệu năng HTTP/Database.
* [runtime-analytics-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-analytics-report.md): Phân tích xếp hạng API hot và truy vấn chậm định kỳ.
* [runtime-recommendation-report.md](file:///opt/projects/steeltrack/docs/runtime/runtime-recommendation-report.md): Khuyến nghị tự động tối ưu hóa tài nguyên dựa trên luật.
* [slow-query-report.md](file:///opt/projects/steeltrack/docs/runtime/slow-query-report.md): Nhật ký phân tích các câu lệnh SQL chậm vượt ngân sách.
* [query-profiler-report.md](file:///opt/projects/steeltrack/docs/runtime/query-profiler-report.md): Chi tiết đo lường các truy vấn phức tạp của Prisma.
* [read-model-effectiveness-report.md](file:///opt/projects/steeltrack/docs/runtime/read-model-effectiveness-report.md): Đo lường tỷ lệ trúng/trượt và hiệu quả của các mô hình Read Model.
* [architecture-score-report.md](file:///opt/projects/steeltrack/docs/runtime/architecture-score-report.md): Đánh giá điểm tuân thủ kiến trúc của các module.
* [performance-score-report.md](file:///opt/projects/steeltrack/docs/runtime/performance-score-report.md): Bảng điểm hiệu năng phân phối theo từng module.
* [operations-center-system-health-report.md](file:///opt/projects/steeltrack/docs/runtime/operations-center-system-health-report.md): Báo cáo hiện trạng kỹ thuật buồng lái quản trị.
* [stress-test-foundation.md](file:///opt/projects/steeltrack/docs/runtime/stress-test-foundation.md): Kịch bản và nền tảng chuẩn bị cho kiểm thử chịu tải.
* [backend-build-layout.md](file:///opt/projects/steeltrack/docs/runtime/backend-build-layout.md): Báo cáo cấu trúc build mã nguồn backend.
* [backend-startup-audit.md](file:///opt/projects/steeltrack/docs/runtime/backend-startup-audit.md): Báo cáo kiểm tra lỗi trong quá trình khởi động backend.
* [backend-startup-fix-report.md](file:///opt/projects/steeltrack/docs/runtime/backend-startup-fix-report.md): Báo cáo khắc phục lỗi khởi động hệ thống.
* [background-engine-implementation-report.md](file:///opt/projects/steeltrack/docs/runtime/background-engine-implementation-report.md): Báo cáo kỹ thuật hiện trạng công cụ tác vụ nền.
* [background-recovery-report.md](file:///opt/projects/steeltrack/docs/runtime/background-recovery-report.md): Báo cáo kiểm tra khôi phục tác vụ nền sau sự cố sập worker.
* [dashboard-reader-report.md](file:///opt/projects/steeltrack/docs/runtime/dashboard-reader-report.md): Đo lường hiệu năng truy xuất trang Dashboard tổng hợp.
* [data-engine-index-foundation-report.md](file:///opt/projects/steeltrack/docs/runtime/data-engine-index-foundation-report.md): Báo cáo hiệu quả của các composite index đã tạo.
* [performance-benchmark-report.md](file:///opt/projects/steeltrack/docs/runtime/performance-benchmark-report.md): Điểm benchmark so sánh hiệu năng các API.
* [query-profiler-report.md](file:///opt/projects/steeltrack/docs/runtime/query-profiler-report.md): Đo lường thời gian thực thi câu lệnh SQL cụ thể.
* [de1/](file:///opt/projects/steeltrack/docs/runtime/de1): Thư mục chứa các phân tích kế hoạch thực thi EXPLAIN cho phân hệ Data Engine.

#### Báo cáo Snapshot Runtime của Phân hệ Kho & Dự án (Inventory & Projects Snapshot reports)
* [inventory-architecture-freeze-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-architecture-freeze-report.md): Báo cáo đánh giá tiêu chuẩn đóng băng kiến trúc Inventory.
* [inventory-event-compliance-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-event-compliance-report.md): Báo cáo tuân thủ luồng sự kiện outbox kho.
* [inventory-location-snapshot-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-location-snapshot-report.md): Thống kê tình trạng hoạt động của Snapshot Vị trí kho vật tư.
* [inventory-material-snapshot-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-material-snapshot-report.md): Báo cáo đo lường hiệu năng của Snapshot Vật tư.
* [inventory-operations-center-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-operations-center-report.md): Sức khỏe tích hợp WMS vào Operations Center.
* [inventory-read-model-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-read-model-report.md): Đo lường hiệu quả cache của Read Model kho.
* [inventory-repository-coverage-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-repository-coverage-report.md): Tỷ lệ bao phủ nghiệp vụ qua InventoryRepository.
* [inventory-snapshot-cutover-report.md](file:///opt/projects/steeltrack/docs/runtime/inventory-snapshot-cutover-report.md): Báo cáo kết quả chuyển đổi (Cutover) sang đọc Snapshot kho.
* [project-architecture-freeze-v1.md](file:///opt/projects/steeltrack/docs/runtime/project-architecture-freeze-v1.md): Báo cáo đóng băng kiến trúc phân hệ quản lý dự án v1.0.
* [project-core-compliance-report.md](file:///opt/projects/steeltrack/docs/runtime/project-core-compliance-report.md): Đánh giá độ bao phủ repository và loại bỏ direct Prisma service tại Projects.
* [project-detail-cutover-report.md](file:///opt/projects/steeltrack/docs/runtime/project-detail-cutover-report.md): Báo cáo chuyển đổi tab chi tiết dự án sang đọc Snapshot.
* [project-detail-parity-report.md](file:///opt/projects/steeltrack/docs/runtime/project-detail-parity-report.md): Kết quả kiểm tra tính toàn vẹn (parity) giữa Snapshot và Realtime db cho chi tiết dự án.
* [project-detail-snapshot-report.md](file:///opt/projects/steeltrack/docs/runtime/project-detail-snapshot-report.md): Cấu hình và hiệu năng đọc tệp Snapshot chi tiết dự án.
* [project-read-model-report.md](file:///opt/projects/steeltrack/docs/runtime/project-read-model-report.md): Báo cáo hiệu quả của cache tab chi tiết dự án.
* [project-repository-report.md](file:///opt/projects/steeltrack/docs/runtime/project-repository-report.md): Độ phủ kiểm soát cơ sở dữ liệu thông qua ProjectsRepository.
* [project-runtime-report.md](file:///opt/projects/steeltrack/docs/runtime/project-runtime-report.md): Chỉ số hoạt động thực tế của phân hệ PMS.
* [project-snapshot-report.md](file:///opt/projects/steeltrack/docs/runtime/project-snapshot-report.md): Đo lường hiệu năng đọc Snapshot của dự án.
* [snapshot-confidence-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-confidence-report.md): Đo lường độ tin cậy và chính xác của snapshot.
* [snapshot-cutover-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-cutover-report.md): Báo cáo tổng thể quá trình cutover.
* [snapshot-engine-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-engine-report.md): Đo lường tính ổn định của Snapshot Engine.
* [snapshot-fallback-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-fallback-report.md): Thống kê tần suất và lý do hệ thống phải chuyển về truy vấn repository thay vì đọc snapshot.
* [snapshot-migration-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-migration-report.md): Nhật ký chuyển đổi dữ liệu snapshot.
* [snapshot-parity-validation.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-parity-validation.md): Công cụ và kết quả so sánh dữ liệu thực tế với snapshot.
* [snapshot-reader-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-reader-report.md): Hiệu năng đọc dữ liệu từ tệp snapshot.
* [snapshot-rebuild-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-rebuild-report.md): Đo lường tần suất, thời gian chạy và tài nguyên tiêu tốn khi build lại snapshot ngầm.
* [snapshot-validator-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-validator-report.md): Kết quả kiểm tra tính đúng đắn định kỳ của các snapshot.
* [snapshot-writer-report.md](file:///opt/projects/steeltrack/docs/runtime/snapshot-writer-report.md): Tốc độ và hiệu quả của tiến trình ghi snapshot ngầm qua outbox.

### Báo cáo Kiểm toán (Audit Reports)
Các tệp nằm tại thư mục [audit/](file:///opt/projects/steeltrack/docs/audit).
* [core-platform-compliance-score.md](file:///opt/projects/steeltrack/docs/audit/core-platform-compliance-score.md): Bảng điểm tuân thủ Core Platform tổng thể của dự án.
* [costing-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/costing-readiness-report.md): Báo cáo mức độ sẵn sàng triển khai tính giá thành tự động.
* [dashboard-api-performance-audit.md](file:///opt/projects/steeltrack/docs/audit/dashboard-api-performance-audit.md): Đánh giá kiến trúc và tốc độ API trang Dashboard.
* [enterprise-architecture-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-architecture-audit.md): Báo cáo kiểm toán kiến trúc toàn hệ thống SteelTrack.
* [enterprise-index-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-index-audit.md): Kiểm tra hiệu năng index trong cơ sở dữ liệu và khuyến nghị.
* [enterprise-performance-gate.md](file:///opt/projects/steeltrack/docs/audit/enterprise-performance-gate.md): Tiêu chuẩn kiểm soát chất lượng đầu vào PR về mặt hiệu năng.
* [enterprise-query-audit.md](file:///opt/projects/steeltrack/docs/audit/enterprise-query-audit.md): Kiểm toán các câu lệnh SQL sinh ra bởi Prisma.
* [enterprise-scalability-foundation-report.md](file:///opt/projects/steeltrack/docs/audit/enterprise-scalability-foundation-report.md): Báo cáo khả năng mở rộng quy mô dữ liệu doanh nghiệp.
* [epic-100-repository-layer-audit.md](file:///opt/projects/steeltrack/docs/audit/epic-100-repository-layer-audit.md): Đánh giá việc bao phủ mẫu Repository thay thế Prisma trực tiếp.
* [import-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/import-readiness-report.md): Đánh giá mức độ sẵn sàng nhập dữ liệu cũ của nhà máy.
* [inventory-core-platform-audit.md](file:///opt/projects/steeltrack/docs/audit/inventory-core-platform-audit.md): Báo cáo kiểm toán độ tuân thủ Core Platform của phân hệ Kho.
* [inventory-refactor-roadmap.md](file:///opt/projects/steeltrack/docs/audit/inventory-refactor-roadmap.md): Lộ trình cải tiến mã nguồn cho phân hệ Quản lý kho.
* [inventory-workspace-audit.md](file:///opt/projects/steeltrack/docs/audit/inventory-workspace-audit.md): Đánh giá tính cô lập không gian làm việc của module kho.
* [inventory-workspace-recovery-report.md](file:///opt/projects/steeltrack/docs/audit/inventory-workspace-recovery-report.md): Kết quả phục hồi hoạt động của phân hệ kho.
* [module-maturity-matrix.md](file:///opt/projects/steeltrack/docs/audit/module-maturity-matrix.md): Ma trận độ trưởng thành kỹ thuật của các phân hệ.
* [next-roadmap-recommendations.md](file:///opt/projects/steeltrack/docs/audit/next-roadmap-recommendations.md): Khuyến nghị lộ trình kỹ thuật tiếp theo cho hội đồng kiến trúc.
* [perf-foundation-report.md](file:///opt/projects/steeltrack/docs/audit/perf-foundation-report.md): Sơ thảo đánh giá hạ tầng cơ sở hiệu năng.
* [performance-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/performance-readiness-report.md): Đánh giá mức độ sẵn sàng trước khi chịu tải thực tế.
* [production-core-platform-audit.md](file:///opt/projects/steeltrack/docs/audit/production-core-platform-audit.md): Đánh giá độ sẵn sàng kỹ thuật của phân hệ sản xuất MES.
* [production-roadmap.md](file:///opt/projects/steeltrack/docs/audit/production-roadmap.md): Lộ trình cải tiến kỹ thuật phân hệ sản xuất.
* [query-budget-audit.md](file:///opt/projects/steeltrack/docs/audit/query-budget-audit.md): Kiểm toán ngân sách thời gian thực thi của các truy vấn.
* [query-segmentation-report.md](file:///opt/projects/steeltrack/docs/audit/query-segmentation-report.md): Báo cáo phân mảnh và phân đoạn dữ liệu truy vấn.
* [realtime-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/realtime-readiness-report.md): Đánh giá hạ tầng kết nối Socket.io.
* [technical-debt-priority.md](file:///opt/projects/steeltrack/docs/audit/technical-debt-priority.md): Danh mục nợ kỹ thuật xếp hạng theo mức độ ảnh hưởng đến hệ thống.
* [technical-debt-report.md](file:///opt/projects/steeltrack/docs/audit/technical-debt-report.md): Báo cáo chi tiết các vùng mã nguồn cần tái cấu trúc.
* [workflow-readiness-report.md](file:///opt/projects/steeltrack/docs/audit/workflow-readiness-report.md): Đánh giá mức độ khép kín của luồng công việc tích hợp ERP.

Các tệp nằm tại thư mục [ai-state/audits/](file:///opt/projects/steeltrack/docs/ai-state/audits) phục vụ cho rà soát tự động:
* [bom-intelligence-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/bom-intelligence-audit.md)
* [business-data-cleanup-20260624.md](file:///opt/projects/steeltrack/docs/ai-state/audits/business-data-cleanup-20260624.md)
* [clean-dataset-plan.md](file:///opt/projects/steeltrack/docs/ai-state/audits/clean-dataset-plan.md)
* [documentation-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/documentation-audit.md)
* [inventory-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/inventory-audit.md)
* [legacy-docs-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/legacy-docs-audit.md)
* [mes-data-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/mes-data-audit.md)
* [module-coverage-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/module-coverage-audit.md)
* [post-cleanup-summary.md](file:///opt/projects/steeltrack/docs/ai-state/audits/post-cleanup-summary.md)
* [system-integrity-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/system-integrity-audit.md)
* [technical-debt-audit.md](file:///opt/projects/steeltrack/docs/ai-state/audits/technical-debt-audit.md)
* [validation-cleanup-review.md](file:///opt/projects/steeltrack/docs/ai-state/audits/validation-cleanup-review.md)

### Tài liệu Lưu trữ (Archive Files)
Các tệp cũ không còn phản ánh trực tiếp trạng thái hiện tại nhưng có giá trị tham chiếu lịch sử. Chúng nằm trong thư mục [archive/](file:///opt/projects/steeltrack/docs/archive).
* [PROJECT_OVERVIEW.md](file:///opt/projects/steeltrack/docs/archive/PROJECT_OVERVIEW.md): Tài liệu mô tả dự án ban đầu.
* [REFACTOR_MASTER_PLAN.md](file:///opt/projects/steeltrack/docs/archive/REFACTOR_MASTER_PLAN.md): Bản kế hoạch tái cấu trúc ban đầu của hệ thống.

---

## 5. Root Documents (Tài Liệu Gốc Thư Mục docs/)

* [README.md](file:///opt/projects/steeltrack/docs/README.md): Tài liệu giới thiệu tổng quan kho tri thức và hướng dẫn sử dụng.
* [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md): Sơ đồ cây thư mục chi tiết của thư mục `docs/`.
* [AI_CONTEXT.md](file:///opt/projects/steeltrack/docs/AI_CONTEXT.md): Bối cảnh hoạt động, công nghệ và các phân hệ của SteelTrack dành cho AI.
* [AI_RULES.md](file:///opt/projects/steeltrack/docs/AI_RULES.md): Tập hợp 14 bộ quy tắc phát triển phần mềm chi tiết mà AI bắt buộc phải tuân theo.
* [TREE_STRUCTURE.md](file:///opt/projects/steeltrack/docs/TREE_STRUCTURE.md): Biểu diễn cấu trúc cây thư mục mã nguồn ứng dụng (Frontend, Backend).
* [ROADMAP.md](file:///opt/projects/steeltrack/docs/ROADMAP.md): Lộ trình 6 giai đoạn phát triển lớn từ nền tảng ERP đến Hệ sinh thái Smart Factory.
* [KNOWN_ISSUES.md](file:///opt/projects/steeltrack/docs/KNOWN_ISSUES.md): Danh sách các vấn đề và lỗi đã được ghi nhận trong hệ thống.
