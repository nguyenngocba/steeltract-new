# SteelTrack Knowledge Base (Kho Tri Thức)

Chào mừng bạn đến với kho tri thức kỹ thuật chính thức của **SteelTrack** – hệ thống ERP + MES + Yard Management tích hợp, được thiết kế chuyên biệt cho các nhà máy gia công kết cấu thép quy mô lớn. 

Tài liệu này đóng vai trò là điểm bắt đầu (Entry Point) cho bất kỳ ai tham gia phát triển, vận hành hoặc kiểm toán hệ thống SteelTrack, bao gồm cả lập trình viên con người (Human Developers) và các tác nhân trí tuệ nhân tạo (AI Agents/Subagents).

---

## 1. Mục Đích của Hệ Thống Tài Liệu

Hệ thống tài liệu tại thư mục [docs/](file:///opt/projects/steeltrack/docs) không chỉ đơn thuần là các tệp mô tả hướng dẫn sử dụng, mà là **Source of Truth (Nguồn Sự Thật Duy Nhất)** về mặt kiến trúc, thiết kế domain và trạng thái vận hành của dự án. Hệ thống được xây dựng nhằm đạt được các mục tiêu sau:

* **Bảo đảm tính nhất quán của kiến trúc đóng băng (Architecture Freeze):** Quy định rõ ràng ranh giới giữa các phân hệ (Module Boundaries), chuẩn hóa tầng Repository, mô hình Event-driven và Transactional Outbox để ngăn ngừa lỗi phát sinh từ việc thiết kế chắp vá.
* **Tăng tốc Onboarding:** Giúp lập trình viên nhanh chóng nắm bắt cấu trúc thư mục, quy tắc nghiệp vụ đặc thù của ngành thép (ví dụ: giao dịch vật tư theo Ledger, tính toán OEE, tối ưu hóa sắp xếp tôn tấm - nesting).
* **Định hướng hoạt động cho AI Agents:** Cung cấp cấu trúc context chuẩn hóa (đặc biệt là thư mục [ai-state/](file:///opt/projects/steeltrack/docs/ai-state)) để AI có thể tự động đọc, hiểu, tuân thủ các quy tắc cốt lõi mà không làm xáo trộn mã nguồn.
* **Lưu vết lịch sử quyết định kiến trúc (ADR):** Giúp theo dõi lý do đằng sau các quyết định kỹ thuật lớn (chẳng hạn như tại sao sử dụng Snapshot-First Read thay vì Live Aggregation).

---

## 2. Các Nguyên Tắc Tổ Chức Thư Mục docs/

Thư mục tài liệu của SteelTrack được phân chia nghiêm ngặt theo vòng đời và phân vùng domain của hệ thống. Chúng tôi tuân thủ các nguyên tắc tổ chức sau:

1. **Tính bất biến của tài liệu lịch sử:** Các quyết định kiến trúc (ADRs) và Blueprints của các module đã được phê duyệt (Freeze) sẽ không bị sửa đổi tùy tiện nếu không qua hội đồng kiến trúc (ARB).
2. **Cập nhật bắt buộc (Mandatory Update Policy):** Sau mỗi tác vụ phát triển hoặc thay đổi cấu trúc, AI và con người phải cập nhật các tệp trạng thái trong [ai-state/](file:///opt/projects/steeltrack/docs/ai-state) (gồm `CHANGELOG_AI.md`, `CURRENT_STATE.md`, `PROJECT_STATUS.md`, `NEXT_TASKS.md`).
3. **Phân cấp rõ ràng giữa Thiết kế (Architecture) và Vận hành (Runtime):** 
   * Thiết kế tĩnh (Blueprints, Standards, Boundaries) nằm trong [architecture/](file:///opt/projects/steeltrack/docs/architecture).
   * Dữ liệu động (Performance report, Benchmarks, EXPLAIN plans) nằm trong [runtime/](file:///opt/projects/steeltrack/docs/runtime) hoặc [audit/](file:///opt/projects/steeltrack/docs/audit).
4. **Không có liên kết hỏng (No Broken Links):** Mọi liên kết giữa các tài liệu phải sử dụng định dạng URL tuyệt đối với giao thức `file://` để đảm bảo trình soạn thảo và AI có thể truy cập trực tiếp ngay lập tức.

---

## 3. Hướng Dẫn Sử Dụng Tài Liệu

### Đối với Lập trình viên Con người (Humans)

* **Khi bắt đầu một ca làm việc (Shift) hoặc tính năng mới:**
  1. Đọc [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md) để biết tiến độ chung của các phân hệ.
  2. Đọc [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md) để nhận biết các đầu việc ưu tiên cao nhất.
  3. Tham khảo [enterprise-code-review-checklist.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-code-review-checklist.md) trước khi tạo Pull Request nhằm đảm bảo code đạt tiêu chuẩn chất lượng.
* **Khi thay đổi cơ sở dữ liệu hoặc API:**
  * Tham khảo [enterprise-versioning-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-versioning-policy.md) để áp dụng mô hình Expand-Contract (Double-write) khi thay đổi Schema, tránh làm gián đoạn hệ thống.
  * Đọc [enterprise-api-contracts.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-api-contracts.md) để thiết kế payload và xử lý lỗi đồng bộ.

### Đối với Các tác nhân Trí tuệ Nhân tạo (AI Agents)

* **Bắt buộc đọc khi khởi động phiên (Session Initializer):**
  AI Agent của SteelTrack phải tự động đọc các tệp tin sau ở đầu phiên trước khi thực hiện bất kỳ lệnh nào khác:
  1. [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md)
  2. [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md)
  3. [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md)
  4. [CURRENT_MODULES.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_MODULES.md)
  5. [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
* **Quy trình Phát hiện mã nguồn (Code Discovery):**
  * Sử dụng công cụ `semble search "<query>" .` trước khi dùng lệnh `grep`. Công cụ Semble giúp tìm kiếm ngữ nghĩa chính xác hơn các module, repository và trang giao diện.
  * Chỉ dùng `grep` khi cần tìm chuỗi ký tự khớp chính xác tuyệt đối (exact string matching).
* **Quy trình kết thúc tác vụ:**
  * Cập nhật nhật ký thay đổi của AI tại [CHANGELOG_AI.md](file:///opt/projects/steeltrack/docs/ai-state/CHANGELOG_AI.md).
  * Điều chỉnh phần trăm hoàn thành của phân hệ trong [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md).
  * Xóa các tác vụ đã xong và cập nhật các tác vụ mới phát sinh trong [NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md).

---

## 4. Tài Liệu Điều Hướng Nhanh

Để bắt đầu tra cứu toàn bộ kho tài liệu, vui lòng truy cập:
* [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md): Bản đồ liên kết toàn bộ tài liệu dự án.
* [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md): Sơ đồ hình cây chi tiết mô tả nhiệm vụ của từng thư mục.
