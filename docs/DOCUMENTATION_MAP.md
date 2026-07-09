# SteelTrack Documentation Map (Bản Đồ Thư Mục Tài Liệu)

Tài liệu này biểu diễn cấu trúc cây thư mục của [docs/](file:///opt/projects/steeltrack/docs) và giải thích chi tiết chức năng, nhiệm vụ của từng phân vùng tài nguyên để tối ưu hóa quá trình khai thác dữ liệu cho con người và hệ thống AI.

---

## 1. Cấu Trúc Cây Thư Mục docs/

Dưới đây là sơ đồ hình cây biểu diễn cấu trúc phân cấp hiện tại của thư mục tài liệu dự án SteelTrack:

```txt
docs/
├── README.md                                # Tài liệu giới thiệu tổng quan kho tri thức
├── MASTER_INDEX.md                          # Mục lục tối cao kết nối toàn bộ tệp tin
├── DOCUMENTATION_MAP.md                     # Bản đồ cấu trúc và hướng dẫn tìm kiếm (Tệp này)
├── AI_CONTEXT.md                            # Tổng quan bối cảnh, công nghệ dự án cho AI
├── AI_RULES.md                              # 14 bộ quy tắc phát triển cốt lõi cho AI
├── TREE_STRUCTURE.md                        # Sơ đồ tổ chức mã nguồn Frontend/Backend
├── ROADMAP.md                               # Lộ trình phát triển 6 giai đoạn của SteelTrack
├── KNOWN_ISSUES.md                          # Danh sách các vấn đề kỹ thuật đã ghi nhận
│
├── ai-state/                                # Theo dõi trạng thái phát triển (AI & Con người)
│   ├── AI_ROLES.md                          # Phạm vi và vai trò tác nhân AI
│   ├── CHANGELOG_AI.md                      # Nhật ký chi tiết các thay đổi của AI
│   ├── CODEX_WORKFLOW.md                    # Quy trình làm việc bắt buộc của AI
│   ├── CURRENT_MODULES.md                   # Trạng thái hiện tại của từng phân hệ
│   ├── CURRENT_STATE.md                     # Báo cáo kỹ thuật chi tiết trạng thái hệ thống
│   ├── NEXT_TASKS.md                        # Danh sách đầu việc tiếp theo theo thứ tự ưu tiên
│   ├── PROJECT_STATUS.md                    # Tiến độ hoàn thành (%) các phân hệ
│   ├── changelog.md                         # Nhật ký thay đổi chung của dự án
│   ├── roadmap.md                           # Lộ trình phân hệ AI-state
│   │
│   ├── audits/                              # Báo cáo kiểm toán tự động trạng thái AI
│   │   ├── bom-intelligence-audit.md
│   │   ├── business-data-cleanup-20260624.md
│   │   └── ... (các báo cáo kiểm toán tự động khác)
│   │
│   ├── decisions/                           # Nhật ký quyết định kỹ thuật cụ thể (ADR)
│   │   ├── architecture-decisions.md
│   │   ├── code-numbering-decisions.md
│   │   ├── inventory-decisions.md
│   │   └── production-decisions.md
│   │
│   ├── design/                              # Tài liệu thiết kế cấu trúc chi tiết
│   │   └── repo-structure.md                # Cấu trúc tổ chức repository
│   │
│   └── modules/                             # Nhật ký tính năng chi tiết của từng module
│       ├── inventory.md                     # Chi tiết phân hệ Kho vật tư
│       ├── projects.md                      # Chi tiết phân hệ Dự án
│       ├── production.md                    # Chi tiết phân hệ Sản xuất MES
│       └── ... (các tài liệu module khác)
│
├── architecture/                            # Bản thiết kế tĩnh & Tiêu chuẩn Quản trị
│   ├── ARCHITECTURE_FREEZE.md               # Tuyên bố đóng băng kiến trúc
│   ├── EVENT_NAMING.md                      # Chuẩn đặt tên sự kiện hệ thống
│   ├── INVENTORY_TRANSACTION_RULES.md       # Nguyên tắc giao dịch kho
│   │
│   ├── ...-blueprint.md                     # Bản thiết kế các phân hệ (production, projects, qc, yard, v.v.)
│   ├── ...-domain.md                        # Đặc tả domain và nghiệp vụ chi tiết
│   ├── ...-event-flow.md                    # Quy hoạch luồng sự kiện liên phân hệ
│   ├── ...-read-model.md                    # Thiết kế mô hình dữ liệu tối ưu đọc
│   ├── ...-snapshot.md                      # Thiết kế snapshot cơ sở dữ liệu
│   │
│   └── enterprise-...                       # Các tiêu chuẩn kỹ thuật & Tài liệu Quản trị
│       ├── enterprise-governance.md         # Khung quản trị kiến trúc
│       ├── enterprise-architecture-decision-records.md # 10 ADR cốt lõi của Core Platform
│       ├── enterprise-naming-conventions.md # Quy chuẩn đặt tên toàn dự án
│       ├── enterprise-api-contracts.md      # Quy chuẩn thiết kế API REST & Zod
│       ├── enterprise-development-standards.md # Bộ quy chuẩn lập trình
│       └── ... (các hướng dẫn chuẩn hóa khác)
│
├── setup/                                   # Hướng dẫn thiết lập môi trường (Trống)
├── database/                                # Thiết kế cơ sở dữ liệu chi tiết (Trống)
├── api/                                     # Đặc tả API Swagger/OpenAPI xuất bản (Trống)
├── inventory/                               # Kế hoạch dịch chuyển và cấu trúc vật tư đặc thù
│   └── inventory-phase1-migration-plan.md
│
├── runtime/                                 # Viễn trắc, Đo lường & Báo cáo Hiệu năng thực tế
│   ├── performance-baseline.md              # Điểm chuẩn hiệu năng cơ sở
│   ├── runtime-health-report.md             # Trạng thái sức khỏe runtime hệ thống
│   ├── runtime-metrics-report.md            # Các chỉ số đo lường HTTP/Database
│   ├── slow-query-report.md                 # Phân tích các câu lệnh SQL chậm
│   ├── ...-snapshot-report.md               # Báo cáo hiệu năng đọc ghi Snapshot thực tế
│   │
│   └── de1/                                 # Báo cáo phân tích EXPLAIN của Data Engine
│       └── ... (các phân tích SQL EXPLAIN cụ thể)
│
├── audit/                                   # Đánh giá sự tuân thủ & Nợ kỹ thuật
│   ├── core-platform-compliance-score.md    # Điểm tuân thủ Core Platform
│   ├── enterprise-architecture-audit.md     # Kết quả kiểm toán kiến trúc toàn hệ thống
│   ├── technical-debt-priority.md           # Danh sách nợ kỹ thuật và độ ưu tiên xử lý
│   └── ... (các báo cáo kiểm toán lâm sàng khác)
│
└── archive/                                 # Lưu trữ tài liệu cũ/nháp lịch sử
    ├── PROJECT_OVERVIEW.md                  # Tổng quan dự án ban đầu
    └── REFACTOR_MASTER_PLAN.md              # Kế hoạch tái cấu trúc ban đầu
```

---

## 2. Mô Tả Chi Tiết Nhiệm Vụ Của Từng Thư Mục

Để đảm bảo tài liệu được đặt đúng chỗ và dễ tìm kiếm, cấu trúc phân mục của chúng tôi được định nghĩa nhiệm vụ như sau:

### [ai-state/](file:///opt/projects/steeltrack/docs/ai-state) (Trạng Thái AI & Vòng Lặp Phản Hồi)
* **Nhiệm vụ:** Lưu trữ các tài liệu trạng thái phát triển phần mềm động, theo dõi tiến độ từng module theo tỷ lệ phần trăm, ghi nhận danh sách đầu việc tiếp theo và kiểm toán tự động.
* **Tần suất cập nhật:** Liên tục (sau mỗi task hoàn thành).
* **Đối tượng khai thác chính:** AI Agent dùng để đồng bộ context, Developer dùng để nhận nhiệm vụ.

### [architecture/](file:///opt/projects/steeltrack/docs/architecture) (Bản Thiết Kế Tĩnh & Domain Core)
* **Nhiệm vụ:** Chứa các bản thiết kế kiến trúc hệ thống (Blueprints) đã được phê duyệt, đặc tả chi tiết các thực thể nghiệp vụ (Domain models), luồng sự kiện truyền thông điệp (Event flows), thiết kế Snapshot và cấu trúc Read Model tối ưu.
* **Quy tắc sửa đổi:** Cực kỳ hạn chế. Bất kỳ thay đổi nào ở đây đều phải được phê duyệt bởi Architecture Review Board (ARB).

### Governance (Quản Trị Kiến Trúc - Khái niệm & Định hướng)
* **Nhiệm vụ:** Chuẩn hóa toàn bộ chất lượng đầu ra của mã nguồn, kiểm soát tính tuân thủ quy tắc đóng băng kiến trúc, thiết lập quy trình duyệt PR, kiểm thử khói trước khi phát hành và chiến lược rollback.
* **Vị trí lưu trữ thực tế:** Được gom vào thư mục [architecture/](file:///opt/projects/steeltrack/docs/architecture) với tiền tố `enterprise-*` (như [enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md) hay [enterprise-code-review-checklist.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-code-review-checklist.md)) để giữ tính tập trung trong quá trình quản trị.

### Guides (Tài Liệu Hướng Dẫn Phát Triển - Khái niệm & Khởi tạo)
* **Nhiệm vụ:** Hướng dẫn lập trình viên tích hợp mã nguồn đúng chuẩn, tuân thủ 14 quy tắc cốt lõi của AI và các bước thiết lập môi trường cục bộ để bắt đầu dự án.
* **Vị trí lưu trữ thực tế:** Nằm tại thư mục gốc của tài liệu như [AI_RULES.md](file:///opt/projects/steeltrack/docs/AI_RULES.md) (hướng dẫn lập trình an toàn cho AI), [AI_CONTEXT.md](file:///opt/projects/steeltrack/docs/AI_CONTEXT.md), và thư mục [setup/](file:///opt/projects/steeltrack/docs/setup) (chứa hướng dẫn cấu hình môi trường lập trình cụ thể).

### [runtime/](file:///opt/projects/steeltrack/docs/runtime) (Đo Lường Hiệu Năng & Trạng Thái Thực Tế)
* **Nhiệm vụ:** Chứa dữ liệu vận hành thực tế của hệ thống. Nó ghi nhận hiệu năng phản hồi API thực tế, tần suất và thời gian rebuild snapshot, tỷ lệ trúng/trượt cache, các câu lệnh truy vấn SQL chậm và các bản phân tích EXPLAIN của cơ sở dữ liệu PostgreSQL.
* **Tính chất:** Dữ liệu thực nghiệm lâm sàng, được tạo ra bằng các chương trình đo lường tự động (Instrumentation) tại runtime hoặc các phiên stress test.

### [audit/](file:///opt/projects/steeltrack/docs/audit) (Kiểm Toán Kiến Trúc & Chất Lượng)
* **Nhiệm vụ:** Đánh giá tính sẵn sàng triển khai của các nghiệp vụ, chấm điểm mức độ tuân thủ Core Platform của mã nguồn, xếp hạng nợ kỹ thuật và vạch ra lộ trình khắc phục các vấn đề kiến trúc.
* **Đặc điểm:** Mang tính chất đánh giá phản biện, chỉ ra các vùng mã nguồn chưa đạt tiêu chuẩn để đưa vào danh sách xử lý nợ kỹ thuật.

### [archive/](file:///opt/projects/steeltrack/docs/archive) (Lưu Trữ Lịch Sử)
* **Nhiệm vụ:** Cất giữ các tài liệu đã lỗi thời hoặc các kế hoạch ban đầu không còn giá trị áp dụng trực tiếp trong giai đoạn hiện tại nhưng cần lưu lại để tham chiếu lịch sử thiết kế.

---

## 3. Cách Tìm Kiếm Nhanh Tài Liệu

Khi kho tri thức có quy mô lớn, việc tìm kiếm nhanh tài liệu chính xác là điều cốt lõi. Hãy áp dụng các phương pháp sau:

### Phương pháp 1: Sử dụng Semble (Ưu tiên hàng đầu cho AI & Humans)
Công cụ `semble` hỗ trợ tìm kiếm ngữ nghĩa sâu (semantic search) trên toàn bộ kho tài liệu và mã nguồn:
```bash
semble search "inventory transaction rules" .
semble search "operations center cockpit guidelines" .
semble search "n NCR CAPA workflow" .
```
Semble sẽ tự động xác định các tài liệu kiến thức và đoạn mã liên quan nhất đến từ khóa ngữ nghĩa của bạn.

### Phương pháp 2: Sử dụng Ripgrep (Tìm chính xác chuỗi ký tự)
Khi cần tìm các tài liệu chứa một định nghĩa cụ thể (ví dụ: tên biến, mã lỗi, hoặc mã ADR):
```bash
grep -rnw "docs/architecture" -e "ADR005"
```
Lệnh này sẽ quét chính xác vị trí tài liệu định nghĩa quyết định kiến trúc số 5.

### Phương pháp 3: Khai thác Mục lục Tối cao
Sử dụng [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md) làm bản đồ định hướng chính. Nó liên kết trực tiếp tất cả các tệp tài liệu trong hệ thống được chia theo các nhóm rõ ràng. Mở tệp Master Index và sử dụng tính năng tìm kiếm của IDE (`Ctrl + F`) để tìm tiêu đề tài liệu bạn cần.
