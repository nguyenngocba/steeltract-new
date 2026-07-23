# Next Tasks

- **Component Manufacturing Workflow Sprint B**: formalize Engineering BOM line
  payloads for raw material, plate, bolt, paint, consumables, waste,
  alternatives, revision and effective date using existing Component BOM
  definition storage where possible.
- **Component Manufacturing Workflow Sprint C-D**: connect Production Order
  creation to material reservation and issue gates. Reservation should reduce
  available quantity only; production start must require issued material.
- **Component Manufacturing Workflow Sprint E-H**: harden Production execution,
  QC disposition and Finished Goods gating so only QC-passed components enter
  Component Inventory.
- **Component Manufacturing Workflow Sprint I-J**: align Yard and Delivery
  movement gates for finished goods through Yard location, loading, delivery
  and installation.
- **Components UI polish Sprint 5**: refactor Create/Edit Component,
  Production Order, QC and Component Detail forms with shared Enterprise Form
  primitives. Keep backend/API/schema unchanged.
- **Component operational lifecycle schema decision**: decide whether the
  requested full operational states (`WAITING_BOM`, `READY_FOR_PRODUCTION`,
  `QC_FAILED`, `REWORK`, `FINISHED_GOODS`, `YARD`) should become a new enum or
  remain mapped through existing status plus lifecycle metadata.
- **QC defect analytics follow-up**: after real NCR defect metadata is used in
  operations, design read-model aggregation for top defect types, machines,
  workstations and shifts.
- **Executive Historical Dashboard browser QA**: open `/history` with an
  authenticated session and seeded snapshots. Verify every tab, filter,
  empty-state path, pagination control and snapshot-job status table against
  real Historical API responses.
- **Executive Historical Dashboard data coverage review**: identify which
  requested charts still render empty because the Historical API exposes only a
  single daily snapshot lookup rather than a daily range endpoint. Do not add
  synthetic trend data.
- **Historical Dashboard Read API staging QA**: call every `/history/*`
  endpoint with seeded snapshots and real JWT auth, verifying 404 behavior for
  missing dates, latest authoritative lookup, warehouse scope filtering,
  pagination and safe Decimal/BigInt JSON serialization.
- **Historical Dashboard frontend adoption planning**: after API staging QA,
  define the frontend date-filter integration plan. Do not wire Executive
  Dashboard historical mode until read API responses are validated against
  seeded production-like snapshots.
- **Historical Snapshot Engine staging hardening QA**: run two or more backend
  worker instances against PostgreSQL with seeded `SnapshotMetadata`, then
  verify advisory-lock scheduling, `snapshotType` job coexistence, failed-job
  retry backoff, expired lease recovery and forward-only metadata under real
  concurrency.
- **Historical Snapshot Engine historical correctness QA**: verify dashboards
  only treat current-day read-model snapshots as authoritative until true
  historical reconstruction is implemented. Historical snapshots generated
  from current read models must remain stale/non-authoritative.
- **Historical Snapshot Engine batch-size tuning**: tune
  `HISTORICAL_SNAPSHOT_BATCH_SIZE` in staging using real inventory volume and
  monitor query latency, lease renewal cadence and memory usage.
- **Historical Dashboard metadata seed/migration gate**: before enabling the
  engine in a real environment, deploy the reviewed schema migration and seed
  `SnapshotMetadata` rows for `dashboard_daily`,
  `inventory_balance_daily`, `monthly_rollup` and
  `inventory_monthly_rollup`.
- **Historical Dashboard engine integration QA**: run the worker against a
  staging database with seeded metadata and verify lease recovery, failed job
  retry, idempotent snapshot upserts and monthly rollup creation on a month
  boundary.
- **Historical Dashboard create-only migration**: generate a create-only Prisma
  migration from the hardened schema, then replace/review generated DDL for
  PostgreSQL partitioning before deployment. Preserve the new enum-backed
  fields and non-null inventory bucket keys.
- **Historical Dashboard raw SQL migration review**: generate the Prisma
  migration with `--create-only`, then add/review PostgreSQL partition DDL,
  CHECK constraints, partial indexes, covering indexes and GIN indexes from
  `docs/runtime/historical-dashboard-prisma-migration-plan.md` before any
  deployment.
- **Inventory Add Material date QA**: create a new material with a backdated
  `Ngày thêm` value and confirm Materials analytics use the persisted
  `createdAt` fallback when no transaction history exists.
- **Executive Dashboard data QA after hotfix**: verify with authenticated real
  data that `Giá trị nhập kho`, `Giá trị xuất kho` and `Sản xuất đang chạy`
  now render non-empty KPI/card trends when backend rows exist.
- **Executive Dashboard data screenshot QA**: verify the updated inventory
  value by material type, import/export trend, material group value donut, QC
  empty-state behavior, delivery empty-state behavior and risk table using an
  authenticated browser session with seeded/real backend data.
- **Executive Dashboard chart popup QA**: click all six main chart panels and
  the operational risk panel, then verify hover lift/glow, enlarged popup
  content, real-data detail tables and close/keyboard behavior.
- **Executive Dashboard date filter QA**: verify `Hôm nay`, `7 ngày`, `30 ngày`
  and `Chọn ngày` update the visible KPI/chart/table datasets that expose real
  date fields.
- **Executive Dashboard KPI modal QA**: verify the 8 KPI cards open smaller
  modal overlays rather than replacing the whole dashboard.
- **Executive Dashboard drill-down visual QA**: verify the calmer detail pages
  remain readable after color softening, Vietnamese status labels and rounded
  donut rendering.
- **Executive Dashboard KPI screenshot QA**: verify the 8-card KPI row against
  the latest provided card reference, especially icon/title alignment, compact
  value units, delta color and 30-day sparkline readability.
- **Executive Dashboard final screenshot QA**: capture authenticated desktop
  screenshots for the KPI row and domain analytics pages to confirm the final
  visual polish against `docs/ui-reference/kpi chinh.png`.
- **Executive Dashboard browser QA**: visually confirm KPI sparklines, trend
  fallback charts and medium-weight typography on the authenticated dashboard.
- **Executive BI V4.1 screenshot certification**: capture authenticated
  screenshots for `/` and every domain drill-down, then compare against
  `docs/ui-reference/kpi chinh.png` and `docs/ui-reference/chi tiet bang.png`.
- **Analytics framework reuse gate**: reuse `shared/ui/analytics` in one more
  module analytics surface before freezing it as the permanent enterprise BI
  primitive set.
- **Executive BI Portal visual certification**: capture authenticated
  before/after screenshots for `/` at the executive dashboard viewport and
  compare against `docs/ui-reference/kpi chinh.png` and
  `docs/ui-reference/chi tiet bang.png`.
- **Executive BI export contract**: define a real export workflow before
  restoring any `Xuất Excel` action in the Executive BI portal.
- **Executive BI shared framework decision**: after one more analytics module
  reuses the same primitives, decide whether `ExecutiveKpiCard`,
  `ExecutiveAnalyticsPortal`, chart helpers and data utilities should move from
  page-local implementation into shared dashboard components.

- **Executive Dashboard UI Redesign V3**: Completed. Integrated Gap Analysis report and updated DashboardPage.tsx to match `kpi chinh.png` and `chi tiet bang.png` specification images. Fixed all layouts to fit 1920x1080 resolution without vertical scrollbars, translated 100% text to Vietnamese, and connected all drill-downs to the 95vw/92vh analytics modal with left filter sidebar and right visual analytics layouts. All builds and git checks passed.
- **Executive Dashboard UI Redesign (Final Design)**: Completed. Redesigned the entire landing page to fit exactly 1920x1080 resolution with zero scrolling. Converted text-heavy panels (insights, matrices, text overviews) into high-density visual charts, progress bars, and minimal heatmaps. Translated all terms into Vietnamese. Upgraded the 8 KPI cards and 95vw/92vh drill-down popup layout containing left side filters and right analytics blocks. All builds and git checks passed.
- **Executive Dashboard & KPI Drill-down Redesign (Version 2.0)**: Completed. Redesigned the top KPI section into exactly 8 KPI cards containing icons, delta changes, sparklines, and status badges on a single 1920x1080 screen with zero scrolling. Reconstructed all drill-down actions to trigger a beautiful fullscreen modal (95vw, 92vh) featuring a left sidebar filter panel and 6 detailed right content analytics panels (Summary, 12-Month Trend, Rankings, Distribution, Comparisons, Detail Table, and Highlights). All builds and git checks passed.
- **Executive Analytics Fullscreen Popup UI Redesign**: Completed. Redesigned all Executive Dashboard KPI card actions to trigger an animated fullscreen (95vw, 92vh) modal analytics workspace. Preserves filter states and returns cleanly.
- **EPIC 12.5 Executive Business Analytics & Cross-Module Intelligence**: Completed. Reconstructed DashboardPage.tsx to incorporate Cross-Module Analytics (material shortages ➔ production risk, completed production ➔ logistics shipping delays, project progress ➔ production lag, shipments blocked on QC Holds), Risk Matrices, Dependency Pipeline diagrams, Operational Heatmaps, and required executive decision action triggers.
- **EPIC 12.4 Executive Dashboard Data Accuracy & Operational Analytics**: Completed. Audited all Executive KPIs to align with source modules, and reconstructed all AnalyticsPage.tsx charts to represent actual operational business answers while maintaining a diverse mix of visual representations and clear data source descriptions.
- **EPIC 12.3 Executive Command Center**: Completed. Upgraded DashboardPage.tsx from a monitoring interface into an active command center. Added Quick Action cards for Low Stock, Production Blocked, QC failure NCRs, and Logistics cancellations; added an Operational Work Queue; added Personal Task and Smart Recommendations panels; and integrated the Executive Calendar schedule view.
- **EPIC 12.2 Executive Drill-down Dashboards**: Completed. Enabled interactive drill-down navigation from all landing page widgets to a reconstructed, multi-tab detailed AnalyticsPage.tsx hosting 7 domain analytical views populated with real backend datasets.
- **EPIC 12.1 Executive Dashboard Analytics & Activity Center**: Completed. Enhanced DashboardPage.tsx with dedicated Operational Analytics panels (Production, Logistics, Project, QC), a grouped unified activity timeline (Today, Yesterday, Earlier) with click navigation targets, a priority-structured Notification Center (Critical, Warning, Information), and global Executive Filters (Time Range, Project, Warehouse).
- **EPIC 12.0 Executive Dashboard (Enterprise Command Center)**: Completed. Reconstructed system landing page (/ -> DashboardPage.tsx) into an Enterprise Command Center using 100% real backend contracts across all 8 modules (8 CockpitKpiCards, 6 Operational Overview cards, Trend Analytics, Quick Action navigation, Notifications Center, Unified Activity Feed, System Health status).
- **EPIC 10.0 Admin Workspace Standardization**: Completed. Standardized all visible Admin pages (Settings, Users, Roles, System Logs) to match the SteelTrack UI Canon using shared components, DataTablePagination, CockpitKpiCards, and real backend contracts.
- **EPIC 9.0 Planning Workspace Reconstruction**: Completed. Reconstructed all visible Planning pages and routes (/planning, /planning/overview, /planning/master, /planning/production, /planning/capacity, /planning/material, /planning/procurement, /planning/schedule, /planning/calendar, /planning/constraints, /planning/reports) to match the SteelTrack UI Canon using shared components, DataTablePagination, and real backend data mapping.
- **EPIC 8.0 Logistics UI Reconstruction**: Completed. Reconstructed all visible Logistics pages and routes (/logistics, /planning, /vehicles, /dispatch, /loading, /tracking, /deliveries, /documents, /reports) to match the SteelTrack UI Canon using shared components, DataTablePagination, and real backend contracts.
- **EPIC 7.0 global UI certification follow-up**: use
  `docs/ui/global-ui-consistency-report.md` and
  `docs/ui/global-design-debt.md` as the source of truth for the next UI
  remediation wave. Do not start broad refactors before the browser screenshot
  harness decision.
- **Global screenshot harness decision**: approve or provide an authenticated
  Playwright/Chromium workflow so Inventory, Components, Production, Projects,
  Suppliers, QC, Logistics, Planning and Admin can be certified at real
  viewport sizes.
- **Logistics/Planning P0 route decisions**: decide whether Logistics Vehicles
  and Planning routes should receive real workspaces or be removed/hidden until
  read contracts exist. Decide whether Planning should be registered as a
  visible module.

- **QC visual QA after EPIC 6.0**: capture authenticated screenshots for `/qc`,
  `/qc/dashboard`, `/qc/inbound`, `/qc/production`, `/qc/final`, `/qc/ncr`,
  `/qc/capa`, `/qc/logs` and `/qc/reports`. Confirm the paginated inspection
  table, right rail, bottom analytics and empty states match the Inventory,
  Components, Production, Projects and Suppliers rhythm.
- **QC route/read-contract follow-up**: decide whether Pending, Passed and
  Failed should become first-class route tabs. Define a calibration backend read
  contract before replacing the controlled empty calibration workspace.

- **Production visual QA after EPIC 3.2**: capture authenticated screenshots for
  `/production`, `/production/orders`, `/production/planning`,
  `/production/execution`, `/production/machines`, `/production/warehouse`,
  `/production/reservations`, `/production/material-ledger`,
  `/production/material-issues`, `/production/consumptions`,
  `/production/incidents`, `/production/logs` and `/production/reports`.
  Confirm the finalized operator workspaces remain visually complete with real
  data density.

- **Suppliers visual QA after EPIC 5.0**: capture authenticated screenshots for
  `/suppliers`, `/suppliers/list`, `/suppliers/quotes`,
  `/suppliers/purchase-orders`, `/suppliers/deliveries`,
  `/suppliers/quality`, `/suppliers/payables`, `/suppliers/logs` and
  `/suppliers/reports`. Confirm Supplier list, Quality and empty capability
  workspaces match the Inventory/Components/Production/Projects rhythm.
- **Supplier read-contract roadmap**: define backend read contracts before
  populating Quotes, Purchase Orders, Deliveries, Payables, Logs and Reports.
  Keep those workspaces as controlled empty states until authoritative data is
  available.

- **Projects visual QA after EPIC 4.0**: capture authenticated screenshots for
  `/projects`, `/projects/list`, `/projects/templates`, `/projects/progress`,
  `/projects/components`, `/projects/materials`, `/projects/costs`,
  `/projects/documents`, `/projects/logs` and `/projects/reports`. Confirm the
  hero table, right rail, lower analytics, empty states and drawer timeline
  visually match the Inventory/Components/Production rhythm.
- **Projects route decision follow-up**: decide whether Timeline, Resources and
  Milestones should become first-class sidebar routes. They were not added in
  EPIC 4.0 because the current router exposes Timeline only inside the project
  detail drawer and the sprint was UI-only/no-route-redesign.
- **Projects legacy mock-string cleanup**: review unused legacy source files in
  `apps/frontend/src/modules/projects/components` that still contain sample
  project names. They are not imported by active routes, but can be removed or
  converted in a dedicated dead-code cleanup sprint.

- **Production visual QA after EPIC 3.1**: capture authenticated screenshots for
  `/production`, `/production/orders`, `/production/planning`,
  `/production/execution`, `/production/machines`, `/production/warehouse`,
  `/production/reservations`, `/production/material-ledger`,
  `/production/material-issues`, `/production/consumptions`,
  `/production/incidents` and `/production/logs`. Confirm the queue table hero,
  right rails and bottom boards visually match the Inventory cockpit rhythm.

- **Production browser certification**: capture authenticated screenshots for
  `/production`, `/production/orders`, `/production/planning`,
  `/production/execution`, `/production/machines`, `/production/boms`,
  `/production/warehouse`, `/production/reservations`,
  `/production/material-ledger`, `/production/material-issues`,
  `/production/consumptions`, `/production/incidents`, `/production/logs` and
  `/production/reports`. EPIC 3 is source/build implemented, but final visual
  certification still depends on a browser harness.
- **Production P2 route/query decisions**: decide whether Running, Completed
  and Scrap should become first-class route tabs, and plan a separate Query API
  adoption pass for non-order legacy read hooks. These were intentionally out
  of P0/P1 scope.

- **Components browser certification**: capture authenticated screenshots for
  `/components`, `/components/list`, `/components/production`,
  `/components/stock`, `/components/material-stock`, `/components/transfers`,
  `/components/qc`, `/components/history` and `/components/reports` at the
  standard breakpoints. EPIC 2 is source/build implemented, but final visual
  certification still depends on a browser harness.
- **Components authoritative QC/read-model follow-up**: Internal QC currently
  renders lifecycle-derived component data because no authoritative Components
  QC result/NCR read contract exists. Define the backend contract before
  replacing those empty/derived states.

- **Components visual QA**: compare `/components` and `/components/list`
  against Inventory Overview and Inventory Materials at 1366px, 1600px and
  1920px with real data. Confirm the table remains the hero, right rails feel
  full and lower sections do not create large empty surfaces.

- **COMPOSITION001 breakpoint certification**: the 1440x1100 screenshot QA pass
  is complete. Run a later release-candidate sweep at 1366px, 1600px and 1920px
  with a live backend dataset to confirm the same table/feed/catalog/queue hero
  balance under real data density.
- **COMPOSITION001 remaining route review**: perform a second composition pass
  for Projects, Reports, Command Center, Analytics, Copilot, Marketplace,
  Workflow, Digital Twin, Kernel, Federation and Telemetry-like routes after
  screenshot review. Do not modify shared tokens or components unless a
  separate design-system EPIC approves it.

- **VISUAL001 browser composition certification**: capture authenticated
  screenshots for Production, Components, QC, Projects, Suppliers, Settings,
  Notifications, Reports, Command Center, Analytics, Copilot, Workflow,
  Marketplace, Digital Twin, Kernel, Federation and Telemetry-like active
  routes at 1366px, 1600px, 1920px and ultrawide. Confirm each route has one
  obvious focal point and table/queue/catalog surfaces occupy the majority of
  the workspace.
- **VISUAL001 primary workspace primitive**: consider an explicit
  `EnterpriseHeroWorkspace` or `primary` card prop after screenshot review.
  Current implementation uses shared height/card inference to avoid broad page
  rewrites.

- **PLATFORM002 browser certification**: capture authenticated screenshots for
  every active sidebar/menu route at 1366px, 1600px, 1920px and ultrawide.
  Confirm there are no visible unfinished/developer labels and that every empty
  state gives business context and next action.
- **PLATFORM002 enum-label review**: plan a dedicated display-label mapping
  sprint for backend enum values such as `DELIVERED`, `SHIPPED`, `READY`,
  `WO/MO` and similar domain abbreviations. Do not rewrite API enum values in
  UI code without a shared label contract.

- **PLATFORM001 visual QA**: validate `/settings`, `/notifications`,
  `/system-logs`, `/users`, `/roles`, `/operations-center` and Supplier
  secondary tabs in browser. Confirm every visible platform surface has KPI,
  toolbar/filter, table/list, right panel or useful empty-state guidance.
- **PLATFORM001 backend contract roadmap**: define read contracts before adding
  real data for MFA, sessions, API tokens, scheduler, webhooks, email queue,
  plants, factories, shifts and calendars.

- **FINAL001 release-candidate visual QA**: capture authenticated screenshots
  for Inventory, Production, Components and QC at 1366px, 1600px, 1920px and
  ultrawide. Confirm shell spacing, table width, right-panel balance, dialogs
  and drawer scroll ownership before freezing the design system.
- **FINAL001 shared primitive cleanup**: move QC dialog/detail shells and
  cross-module status badges onto shared Enterprise primitives in a focused
  follow-up, preserving behavior.

- **NAV001 visual certification**: with browser tooling, validate active
  Inventory, Production, Components, QC, Yard, Logistics, Projects, Suppliers,
  Users/Roles and Settings routes. Confirm content starts with operational
  data/action bars, sidebar remains the only route navigation and record-level
  tabs still work.

- **QC001 authenticated visual certification**: with browser tooling, validate
  `/qc`, `/qc/production` and `/qc/plan` using real authenticated data. Confirm
  Top N behavior, `Xem tất cả` navigation, quality alerts, queue actions,
  detail dialogs and responsive layout.
- **QC calibration contract decision**: keep calibration in a truthful empty
  state until a backend read contract exists for equipment, due dates and
  calibration status. Do not reintroduce static equipment rows.

- **BUSINESS001 operator review**: have a Production Director / Factory Manager
  validate whether Production and Components now answer steel fabrication
  decisions within five seconds. Pay special attention to QC/NCR gaps that need
  authoritative backend contracts before more UI claims are added.

- **UX Review Round 2 visual check**: with browser tooling, validate that
  Production answers running/delayed/blocked/attention questions within five
  seconds and Components answers production/QC/ready/project questions within
  five seconds.

- **UX Review Round 1 visual check**: once browser tooling is available, verify
  `Xem tất cả` navigation from Production Overview to `/production/orders` and
  Components Overview to `/components/list`, then confirm dashboard cards show
  Top N while full workspaces keep filter/pagination/drawer behavior.

- **UI005B visual certification**: capture authenticated screenshots for
  Inventory, Production and Components at standard breakpoints once a browser
  harness is available. Compare hierarchy and density, not pixel identity.
- **UI005B follow-up modules**: apply the same inferred design-language process
  to QC, Yard, Logistics and Projects after Production/Components are visually
  certified.

- **UI005A screenshot certification**: install or provide an approved browser
  harness, then capture before/after evidence for every active Production and
  Components page. Current code implementation is complete, but the EPIC must
  remain visually uncertified until screenshots exist.
- **UI005A legacy Components cleanup**: review non-routed legacy Components tab
  and panel stubs in a separate cleanup sprint. Active routes no longer depend
  on those placeholders, but the files still exist outside the active page tree.

- **UI006 shared component adoption**: when touching Inventory/Production pages,
  prefer direct imports from `shared/ui/enterprise-components` and
  `shared/forms`. Keep `InventoryVisuals` and `ProductionCockpitShared` as thin
  compatibility facades only; do not add new layout logic there.
- **UI006 legacy form cleanup**: migrate remaining Inventory page-local form
  fragments to `EnterpriseForm` primitives in a focused Inventory-only sprint,
  preserving behavior and layout.

- **UI005 authenticated visual certification**: validate Production at
  360x800, 768x1024, 1366x768, 1440x900 and 1920x1080 with real authenticated
  data. Exercise Manufacturing Order, BOM, Return, Consumption and Yard staging
  focus, keyboard, overflow and error paths.
- **Production table capability contracts**: add sorting or selection only when
  the corresponding read-model/API and bulk operator command are approved. Do
  not add inert table controls to satisfy visual parity.
- **Production Incidents/Reports**: retain truthful empty states until approved
  domain/query contracts exist; do not populate either route with mocks.

- **INV001 authenticated browser smoke**: with an approved browser harness,
  verify visible rows on Overview and Materials plus interactive search,
  filters, pagination, sticky headers and detail drawer. Runtime API/data-flow
  verification already passes; this is visual evidence only.

- **UI003A authenticated visual certification**: add or provide an approved
  browser harness, then capture Inventory at 360x800, 768x1024, 1366x768,
  1440x900 and 1920x1080 with real data. Validate overflow, chart labels,
  Materials table visibility, transaction split panes and all drawer/modal
  focus/scroll paths.
- **UI003 form markup follow-up**: replace placeholder-only labels in legacy
  Location forms and move remaining page-local report overlays onto the shared
  modal primitive without changing workflow or layout.
- **Frontend ESLint baseline**: exclude or repair archived/backup trees and
  address the existing 1,168 errors before treating project-wide lint as a
  release gate. UI003 targeted new primitives already pass.

- **RFC016 P0 authorization remediation**: establish deny-by-default route
  authentication/permission coverage, secure all Inventory, QC and Projects
  mutations, explicitly govern compatibility controllers and add anonymous plus
  role-matrix API tests.
- **RFC016 P0 claimed-work recovery**: add owner-checked heartbeats, lease expiry
  and safe reclaim for stale `RUNNING` Jobs and `DISPATCHING` Outbox records;
  prove no duplicate execution with crash and competing-worker tests.
- **RFC016 P0 migration certification**: test
  `20260717190000_enterprise_data_scalability_indexes` on a production-size
  clone and approve lock, blocked-write, WAL, duration and abort budgets before
  deployment.
- **RFC016 certification rerun**: after all P0 gates, run stable staging startup,
  readiness, `SIGTERM`, complete seven-context operator workflows, production-
  volume replay/load and archive/restore drills, then reassess certification.

- **RFC013 database certification**: Restore PostgreSQL runtime, deploy the
  pending indexes first to a production-size clone, then collect `EXPLAIN
(ANALYZE, BUFFERS)`, lock wait, WAL and write-amplification evidence.
- **RFC013 duplicate-index cleanup**: In a separately approved non-additive
  maintenance window, verify and remove the five redundant Dashboard Snapshot
  indexes already covered by identical unique indexes.
- **RFC013 FK index evidence**: Use `pg_stat_statements` and slow-query samples
  before indexing the 17 relation candidates without a leading index. Do not
  add every FK index mechanically.
- **RFC013 cursor rollout**: Add backward-compatible keyset contracts to the
  highest-volume legacy history APIs after consumer compatibility review; exact
  page/total APIs remain unchanged in this sprint.

- **RFC012 online index rollout**: Review the pending additive index migration
  against production-size clones with `EXPLAIN (ANALYZE, BUFFERS)`, lock-budget
  controls and rollback criteria before deployment.
- **RFC012 archive worker**: Implement export/checksum/restore verification and
  projection-watermark guards before deleting any hot Outbox, receipt, log or
  timeline row.
- **RFC012 scale certification**: Run controlled 10M/100M progression tests for
  keyset queries, replay throughput, WAL growth, autovacuum and projection lag.
  Do not claim billion-row readiness from the current small database.
- **Projection consumer adoption**: Move high-volume clients to opaque cursor
  pagination with `withTotal=false`; retain offset totals only where operators
  genuinely require exact counts.

- **RFC011 consumer cutover**: Migrate dashboard/analytics consumers to
  `/query-api/modules` incrementally after comparing projection payloads and
  lag against current contracts. Keep operator workspace reads live per ADR011.
- **RFC011 real replay certification**: Replay retained QC, Yard, Logistics and
  Projects canonical Outbox events in a controlled environment and compare
  projection document counts/entity keys before declaring historical coverage.

- **RFC010 operator certification**: Invoke all eleven use-cases against
  disposable real aggregates, replay each process ID, and compare owner
  timeline/Outbox counts before any public API rollout.
- **RFC010 API rollout decision**: Keep `EnterpriseOperatorService` internal
  until an additive authenticated command API defines permission, DTO and
  idempotency-header contracts. Do not redirect legacy routes implicitly.

- **RFC009 process operator certification**: Invoke each process with real
  disposable aggregates, then repeat the same process ID and verify exact owner
  command replay, no duplicate timeline/Outbox records and correlated audit
  receipts.
- **RFC009 unattended resume decision**: Add a durable process scheduler only
  through a separately approved additive persistence RFC. Current processes are
  safely resumable by caller re-submission and deliberately do not create a
  second business-state store.

- **UI001 visual certification**: Run Playwright screenshots at desktop and
  mobile sizes against authenticated real-data routes, checking long labels,
  table overflow, drawer focus and action wrapping. Pixel polish belongs to the
  later Gemini presentation phase; do not fork the shared foundation.
- **UI foundation adoption rule**: New module roots must use
  `EnterpriseWorkspace`, cockpit primitives and truthful shared states. Do not
  introduce module-specific shell, toolbar, KPI or pagination frameworks.

- **RFC003 operator execution certification**: On a designated disposable
  Production Order, verify Order start creates one run, pause/resume preserves
  versions and timestamps, completion blocks active runs, abort preserves its
  reason and a replacement run can continue the same Work Order.
- **Execution command API decision**: RFC003 intentionally exposes no route.
  Add execution endpoints only through a separately approved additive API
  rollout with `Idempotency-Key` and `expectedVersion`.
- **Projection runtime evidence**: Produce real `production.execution.*` facts
  through operator commands, then replay `ProductionExecution` and
  `ProductionTimeline` and compare persisted documents to aggregate rows.

- **EPIC188 operator API certification**: Exercise every
  `/production/commands` route with real disposable aggregates, including exact
  replay and stale-version Conflict; verify timeline, ActivityLog, Outbox,
  snapshots and Operations Center.
- **Production client migration**: In a separately approved frontend sprint,
  add aggregate version reads and stable idempotency keys, then migrate one
  operator workflow at a time without redesign.
- **Legacy Production API retirement gate**: Collect route usage and response
  parity before proposing deprecation. Do not silently redirect old requests
  because they lack canonical engineering/version inputs.

- **RFC002 operator certification**: On disposable data, run Create -> Release
  -> Ready -> Start -> Work Order/Completion -> Complete -> Close plus
  Issue/Consume/Return, Scrap and Rework; verify ledgers, receipts, Outbox,
  timeline, snapshots and Operations Center.
- **Canonical row adoption**: Approve an explicit policy before assigning
  aggregate versions/lifecycle states to legacy Production Orders or standalone
  Work Orders. Never infer canonical state from legacy strings.
- **RFC003 Components operator certification**: Exercise Create Component ->
  Create Revision -> replace/validate BOM -> submit review -> approve -> release
  -> deprecate -> archive on disposable data. Verify exact replay, stale-version
  Conflict, timeline, ActivityLog and Outbox before client adoption.
- **Components client migration**: Adopt `/components/commands` one workflow at
  a time after operators can read aggregate versions and generate stable
  idempotency keys. Do not redirect legacy requests silently.
- **Legacy Component adoption policy**: Define an operator-reviewed adoption
  command and mapping evidence before any existing row receives canonical
  `lifecycleState`; bulk automatic mapping is forbidden.
- **Engineering BOM graph validation**: Approve a bounded Components-owned graph
  query for cross-revision circular-reference validation before exposing BOM
  validation to operators.
- **ADS004 Cross-module Event Contract**: Completed as AD-019. Architecture
  decision gates AD-015 through AD-019 are closed; new implementation must use
  the canonical catalog and cannot add aliases without Architecture Review.
- **Component Aggregate Implementation**: Completed additively using AD-016/019;
  continue to treat legacy `ComponentStatus` as compatibility projection.
- **Production Aggregate Implementation RFC**: Plan additive Work Order,
  Execution, Completion, Scrap and linked Rework persistence using AD-017/019.
  Preserve AD-018 Inventory PostingReceipt semantics.
- **Canonical event rollout RFC**: Inventory current event publishers and
  consumers, define time-bounded adapters for legacy/internal names, and prove
  no dual business effect before retirement.
- **ADS003.5 Production-Inventory Interaction Contract**: Completed as AD-018.
  Preserve owner commands, PostingReceipt semantics and no-double-stock rules
  when defining ADS004 event contracts.
- **ADS002 Component State Machine**: Completed as AD-016. Do not implement or
  reinterpret legacy `ComponentStatus` values before ADS003/ADS004 and a
  dedicated additive Components implementation RFC.
- **ADS003 Production State Machine**: Completed as AD-017. Do not implement or
  reinterpret legacy WorkOrder/ProductionStage/Consumption Scrap records before
  ADS004 and a dedicated additive Production implementation RFC.
- **ADS004 Cross-module Event Contract (historical gate)**: Completed. Event
  consumers must never repeat an Inventory posting already represented by an
  AD-018 PostingReceipt.
- **Ownership remediation rule**: Do not implement new module business paths
  before ADS002-004. Existing direct foreign repository/table writes are
  compatibility debt and must be replaced by owner-exported command boundaries
  in focused sprints, not bulk refactors.
- **EPIC187A Components Domain Alignment (P0)**: Decide whether Component owns
  the full lifecycle or only identity/handoff state; separate Production stage,
  stock, QC and logistics semantics; approve revision/archive policy,
  cross-module command ownership and canonical events before implementation.
- **Components material boundary remediation (P0 after alignment)**: Replace
  the active Components Material Stock client-side Inventory/Production
  reconstruction and generic Inventory return posting with Production-owned
  bounded read and Return command contracts. Inventory remains stock owner.
- **EPIC187B-C Components backend completion**: After alignment, implement a
  state machine, transaction-aware internal Component command boundary,
  idempotency/optimistic concurrency, atomic event coverage and secondary live
  read models. Do not begin EPIC188 Cockpit UI before certification.
- **Production Domain Alignment (P0)**: Before EPIC186 implementation, approve
  `WorkOrder 1 -> N ProductionOrder`, typed Work Order lifecycle, quantity units
  and formulas for completed/rejected/scrap/remaining, QC ownership of rejected
  quantity, and the canonical Scrap command/event contract. Preserve
  PROD-011/014/015 and do not emit new legacy `production.started`-style events.
- **Production Work Order Foundation (after alignment)**: Implement the approved
  additive relation, repository transaction, atomic Outbox, bounded live read
  model and backward compatibility. Any schema migration requires explicit
  authorization.
- **Production Completion/WIP Foundation (after alignment)**: Add quantitative
  completion and stage/WIP projections at the approved aggregate level without
  replacing the canonical lifecycle or ADR011 read paths.
- **EPIC185 Transfer Multi-material Pending Items UX**: Completed. Refactored the Transfer creation modal to support local pending items batching, location duplicate merging, list review/edit/remove, transfer-specific available stock calculations, visual warning and addition blocking on stock exceedance, and double-minimap autofocus.
- **EPIC184 Outbound Multi-material Pending Items UX**: Completed. Refactored the Outbound creation modal to support local pending items batching, location duplicate merging, list review/edit/remove, outbound-specific available stock calculations, and visual warning on stock exceedance.
- **EPIC183 Inbound Multi-material Pending Items UX**: Completed. Refactored the creation modal to support local pending items batching, location duplicate merging, list review/edit/remove, and non-destructive API error recovery.
- **EPIC182 Multi-material Business Specification**: Completed. Pending Items
  behavior, duplicate merge, validation order, cancel/rollback and rollout gates
  are frozen in `docs/architecture/multi-material-*.md`.
- **Public idempotency decision**: Approve durable request-key storage before
  broad Outbound rollout or any mutation auto-retry. Do not use payload hashes
  or time-window deduplication as a substitute.
- **Transfer expansion decision**: Phase 1 allows one route per material. A pair
  ID/line-group contract requires separate approval before multiple routes for
  the same material are supported.
- **EPIC181 Multi-material Business Foundation**: Completed. Duplicate buckets
  are validated/mutated once, all ledger lines are retained, first-line report
  assumptions are removed, and stable-reference idempotency is active.
- **Multi-material decision gate**: Before public rollout, approve a durable
  public idempotency key/storage contract and decide whether transfers must
  support multiple source/destination pairs for the same material. Both require
  additive work; neither should be inferred from array order.
- **Adjustment/Stock Take/Return rollout gate**: Do not reuse generic Pending
  Items until each workflow's line-level reason, evidence and disposition rules
  are approved.
- **EPIC183 Inventory rollout (proposed)**: Certify multi-material Inbound and
  Outbound first with real operators, then retain the single-material contract
  during compatibility rollout.
- **EPIC184 workflow completion (proposed)**: Handle explicit transfer pairs,
  per-line Adjustment/Stock Take evidence, and multi-item Return semantics.
  Approve any additive migration separately.
- **EPIC185 cross-module certification (proposed)**: Make transaction reports,
  CSV, recent activity and first-line consumers line-aware; regression-test
  Production, Components, Projects, Suppliers, snapshots and runtime behavior.
- **Core Platform v1.0**: CERTIFIED on 2026-07-13 for Inventory, Components,
  Production, QC and Yard. New platform modules must inherit ADR011, shared
  Snapshot/Runtime/Background infrastructure and repository-atomic Outbox.
- **EPIC180 Logistics Audit**: May begin as an audit against the certified v1.0
  template. Do not implement Logistics foundation until audit gaps are ranked.
- **EPIC173 Dashboard Snapshot Cutover**: Completed. Components, QC and Yard
  dashboard widgets now use their existing snapshot readers with repository
  fallback; operator workspaces remain live.
- **EPIC174 Certification Parity**: Completed. Atomic Outbox and Runtime naming
  parity pass; Core Platform v1.0 is certified.
- **EPIC144 Components Runtime Metrics**: Add Components-specific snapshot hit/miss/age/lag, read-model hit/fallback and background queue telemetry by reusing the existing Performance Metrics framework.
- **EPIC145 Components Operations Center**: Expose Components repository/read-model/snapshot/event/background/feature-flag health in the existing Operations Center without creating a new UI language.
- **Components persistent event completion**: Atomically persist approved `component.created`, `component.updated` and delete/archive-policy events before claiming full automatic snapshot freshness. Revision/release/archive events remain blocked until their domains exist.
- **Components CORE.1 cross-module boundary follow-up**: Components repository completion is approved. In a separately authorized sprint, define a transaction-aware internal Component command boundary for Production, Projects, Yard, and QC; do not move those writes blindly or break atomic workflows.
- **Components CORE.2 remaining workspace read models**: List, Overview and History are complete. In a separate scope, cut Stock, Material Stock, Production and Transfers to bounded live read models; remove Inventory audit aggregation and client pagination without changing those UIs.
- **Components CORE.3 Snapshot/Event/Runtime**: After event/domain alignment, add atomic Component Outbox events, domain-level ComponentDashboardSnapshot/ComponentSnapshot, background routing, metrics, feature flag, parity and Operations Center health.
- **Components business data remediation**: Replace hardcoded QC and History/Reports arrays/KPIs with real backend data or honest empty states in a separate approved business/UI sprint.
- **EPIC137 Production certification gate**: Designate a disposable real Production Order/material/location, execute the full operator checklist, drain Outbox/jobs, compare Production and Inventory ledgers/snapshots, and capture Operations Center runtime evidence. No feature work is required.
- **EPIC137 Inventory dead-component validation**: Build a TypeScript/lazy-route import graph, add golden screenshot coverage for active Inventory tabs, then remove only confirmed orphan `features/`, `tabs/`, `tables/`, analytics, and map components in small batches.
- **Inventory typed status mapping**: Evaluate shared typed mappings for stock, transaction, aging, and return statuses; do not merge domain badges until semantics and rendered classes are identical.
- **EPIC-UI002 Inventory Inbound Workspace Redesign**: Redesign the Inbound ("Nhập kho") tab workspace to inherit Cockpit colors and layout styles. (Status: `COMPLETED`).
- **EPIC-UI003 WMS Tab UX Harmonization**: Implement slide-out creation drawers, searchable selectors, and keyboard shortcuts across Inbound, Transfer, and Adjustment workspaces in a dedicated UX sprint. (Status: `NOT STARTED`).
- **EPIC135B operator E2E gate**: Create or designate a real non-production test Production Order, run Create -> Close with Reserve/Issue/Consume/Return, drain Outbox/background jobs, and verify Inventory/Production ledgers, snapshots, Runtime Metrics, and Operations Center. Implementation and automated tests are complete; do not reuse the existing business record.
- **Inventory posting boundary tests**: Add transaction rollback integration coverage for Production issue and return with insufficient stock, occupied return destination, duplicate idempotency keys, and Inventory transaction numbering contention.
- **EPIC134 operator smoke validation**: On a real test Production Order, execute the complete canonical lifecycle, run the background worker, and verify canonical Outbox dispatch, Production snapshot refresh, runtime counters, and Operations Center health. Do not repurpose the existing completed production record.
- **Production legacy status policy**: Inventory real Production data currently contains no `PLANNED` or `DELAYED` row. Define a separate migration policy only if such rows appear in another environment; never silently map them to canonical states.
- **Production event expansion after EPIC134**: Standardize material reserved/issued/returned/consumed, stage completion, scrap, and rework contracts after the order lifecycle is stable.
- **EPIC135 Production Workspace Live Read Models**: Build explicit repository-backed live read-model methods and additive pagination metadata for Production Orders, BOMs, Reservations, Material Issues, Material Ledger, Consumptions, Warehouse, Execution Board, and Logs. Preserve ADR011: no snapshots for operator workspaces.
- **EPIC132 follow-up validation**: Apply migration `20260711130000_production_snapshot_foundation` in the target database, run a background worker tick after real `production.*` events, and confirm `production_dashboard_snapshots`, `production_order_snapshots`, and `work_center_snapshots` are populated.
- **EPIC131 Production Repository Boundary validation**: During the next Production business sprint, smoke test Production order start/stage completion, BOM CRUD, reservation reserve/release/expire, material issue/return, consumption, ledger reads, and WorkOrder create/release to confirm repository refactor preserved behavior.
- **EPIC130B Production Live Read Models**: Add explicit repository-backed live read models for Production Orders, BOMs, Reservations, Material Issues, Material Ledger, Consumptions, Warehouse, Execution Board, and Logs. Keep these workspaces off persisted snapshots per ADR011.
- **Production Operations Center validation**: After applying the EPIC132 migration and exercising Production snapshot jobs, verify `/operations-center/overview` reports healthy Production snapshot/read-model/event/job status.
- **EPIC120 Phase 1 Production rollout**: Keep Production workspaces on repository live read models and cut dashboard/cockpit analytics over to the EPIC132 Production snapshot foundation. Do not move Production Orders, Reservations, Material Issues, Ledger, Warehouse, or Execution Board to snapshots.
- **EPIC120 Phase 5 Projects compatibility**: Reclassify `GET /projects/:id/detail/:tab` tabs. Keep read-only summary/dashboard tabs snapshot-first, but move operator tabs such as materials, components, progress, command, and site toward repository live read models.
- **EPIC118.5.1 operator smoke test**: In an authenticated browser session, run inbound, outbound, transfer, adjustment, project return request, and return receive/reject with real test data. Confirm open Materials, Locations, Material Detail, and Material History update without F5 or tab switching; Overview remains snapshot-first eventual consistency.
- **Inventory final browser validation**: With an authenticated operator session, create inbound, outbound, transfer, adjustment, and project return flows; confirm history/material/location surfaces refresh without F5 and Overview catches the Background Engine snapshot refresh within the expected delay.
- **Inventory historical metrics follow-up**: After the next scheduled Background Engine snapshot writes a second `scopeKey = 'ALL'` row, verify all eight Inventory Overview KPI cards display adjacent persisted-snapshot deltas and no longer show `Chưa có dữ liệu lịch sử` for the newly persisted metrics.
- **Inventory inbound & outbound UI/UX remediation**: Implement the unified WMS Inbound and Outbound workspace proposed in [inventory-inbound-outbound-remediation-plan.md](file:///opt/projects/steeltrack/docs/design/inventory-inbound-outbound-remediation-plan.md) to support multi-line transactions, drawer-based layouts, and standardized selectors.
- **Inventory pagination threshold review**: Benchmark deep offset pages with a
  realistic high-write dataset before deciding whether material/history endpoints
  need cursor pagination.
- **Runtime Prisma profiler repair**: Investigate why request metrics report
  `prisma=0` for repository queries so future large-data validation can include SQL
  count and SQL time.
- **Inventory UI browser smoke test**: Validate Overview and Materials search,
  filters, page transitions, empty/error states, and Material Detail history with
  an authenticated operator session.
- **Automated broken link checker**: Phát triển hoặc tích hợp công cụ kiểm tra tự động các liên kết `file://` trong toàn bộ thư mục [docs/](file:///opt/projects/steeltrack/docs) trước khi thực hiện quy trình duyệt PR, nhằm đảm bảo không có liên kết hỏng.
- **Weekly AI state sync validation**: Thiết lập kịch bản tự động kiểm tra tính đồng bộ của trạng thái AI, bảo đảm mọi thay đổi trong [CHANGELOG_AI.md](file:///opt/projects/steeltrack/docs/ai-state/CHANGELOG_AI.md) được ánh xạ chính xác sang [CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md) và [PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md) trước khi đóng phiên làm việc.
- **Periodic Documentation Auditing Schedule**: Thiết lập chu kỳ kiểm toán định kỳ hàng tháng cho hệ thống tài liệu, trong đó Architecture Guardian cập nhật [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md) và di chuyển các báo cáo vận hành, báo cáo sửa lỗi cũ vào [docs/archive/](file:///opt/projects/steeltrack/docs/archive/).
- **Document Compliance Review for active modules**: Trước khi bắt đầu các Sprint liên quan đến Production, Yard, QC hay Logistics, thực hiện đánh giá tính tuân thủ tài liệu để bảo đảm các đặc tả trong `docs/ai-state/modules/` khớp hoàn toàn với các bản thiết kế tĩnh trong `docs/architecture/`.
- **Implement periodic archiving of stale documents**: Move the historical audit and runtime reports listed in [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md) and [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md) from `docs/audit/`, `docs/runtime/`, `docs/bugs/`, `docs/dev/`, and `docs/ui/` into [docs/archive/](file:///opt/projects/steeltrack/docs/archive/) during the next scheduled cleanup, ensuring all internal doc links are updated.
- **Documentation Integrity Check**: Định kỳ kiểm tra tính toàn vẹn và cập nhật các blueprint hoặc báo cáo mới tạo vào [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md) và [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md).
- **EPIC116 Projects Architecture Freeze validation**: Use `docs/runtime/project-architecture-freeze-v1.md` as the Projects architecture gate. Validate Project Detail snapshot parity with real operator activity across `overview`, `materials`, `components`, `progress`, `command`, `site`, `costs`, `documents`, and `logs`; then review Operations Center Project Detail snapshot hit/fallback/lag.
- **Architecture inheritance rule**: Treat Inventory and Projects as Architecture Freeze v1.0 reference modules. Future Production, Purchasing, QC, Maintenance, Yard, and Logistics implementation should inherit repository boundaries, snapshot-first reads, read-model fallback, outbox events, background snapshot writers, runtime metrics, and Operations Center health signals.
- **Architecture Audit - Performance, Versioning & Dependencies**: Verify that new business modules (Production, QC, Yard, Logistics, Finance) strictly adhere to response time SLAs, double-write migration protocols, and allowed/forbidden dependency paths as defined in [enterprise-performance-sla.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-performance-sla.md), [enterprise-versioning-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-versioning-policy.md), and [enterprise-module-dependency-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-module-dependency-map.md).

- **Architecture Audit & Review**: Schedule the first regular Architecture Review Board (ARB) session as outlined in [enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md) to audit codebases against the 10 core ADRs.

- **Sprint AI.1 (AI Engine Foundation)**: Establish database schema for AI execution context (`AiAgentContext`, `AiRecommendationAction`), and implement async inference dispatchers using Outbox events.
- **Sprint AI.2 (Shopfloor Assistant)**: Connect WebSockets with voice STT/TTS services for crane operators, welding operators, and QC inspectors.
- **Sprint AI.3 (Nesting Optimizer)**: Implement genetic algorithms for plate/profile nesting on CNC cutting machines to optimize scrap rate.
- **Sprint AI.4 (Demand Forecasting)**: Deploy time-series models for material demand and isolation forest models for anomaly detection during stock consumption.
- **Sprint AI.5 (Predictive Maintenance)**: Process IoT telemetry (temperature, vibrations) from machines and generate preventative maintenance tasks.
- **Sprint AI.6 (Computer Vision QC)**: Train and deploy image analysis pipelines for welding/coating defect detection at QC inspection stations.
- **Sprint AI.7 (3D Loading & Routing)**: Build 3D bin packing models for truck loading plans and routing optimizations for dispatch orders.
- **Sprint AI.8 (Operations Center AI)**: Bind model metrics (accuracy, drift, latency) and offline fallback triggers into the Operations Center.
- **Sprint INT.1 (Integration Framework & Outbox)**: Optimize outbox tables, indexes, and implement saga orchestrator for multi-module transaction consistency.
- **Sprint INT.2 (Inventory -> Production)**: Synchronize material issues, reservations, and consumption with WMS and MES ledgers.
- **Sprint INT.3 (Production -> QC)**: Connect production step completion to auto-generation of QC inspection sheets.
- **Sprint INT.4 (QC -> Yard)**: Automate Yard placement assignments when components pass QC.
- **Sprint INT.5 (Yard -> Logistics)**: Bind Yard loading tasks and QR scanning validation with Logistics dispatch schedules.
- **Sprint INT.6 (Logistics -> Projects)**: Synchronize delivery ETAs and receipt confirmations with PMS WBS tasks.
- **Sprint INT.7 (Projects -> Finance)**: Trigger project cost and ledger calculations on component install/acceptance.
- **Sprint INT.8 (End-to-End Stress Test)**: Connect integration health monitoring metrics to the Operations Center overview and test under load.
- **Sprint QC.1 (Domain & Validation Gates)**: Create `CapaAction` and `QualityLedgerEntry` in `schema.prisma`, write repository gates for CO/CQ and NCR status checks, and expose QC/NCR endpoints.
- **Sprint QC.2 (Events & Snapshots)**: Implement Outbox event handlers for `qc.inspection.completed`, schedule background jobs for Graph Traceability generation, and create `QcDashboardSnapshot` with cached reads.
- **Sprint QC.3 (Control Tower & AI)**: Build QC Control Tower, interactive Traceability 2D viewer, and integrate AI Root-Cause/CAPA and Scrap anomaly detection.
- **Sprint LOG.1 (Vehicles & Drivers)**: Create `Driver` and `Route` models, build dispatch planning, and implement `Max Payload Gate` validation.
- **Sprint LOG.2 (GPS & Driver Mobile)**: Build Driver Mobile Web View with loading checklist and geofencing background engine workers for GPS tracking.
- **Sprint LOG.3 (Dispatch Cockpit & POD)**: Build Dispatch Cockpit interactive map, integrate Proof of Delivery signature/photo uploads, and connect AI ETA predictor.
- **Sprint 1 (WorkOrder & Core Domain Setup)**: Implement `WorkOrder` model in `schema.prisma`, create `WorkOrderRepository`, write API endpoints `POST /production/work-orders` and `GET /production/work-orders`, and generate migrations.
- **Sprint 2 (Shopfloor Runtime & Downtime)**: Create `Shift` and `MachineDowntime` models in Prisma, write downtime logging services, integrate real-time Status Gateways, and implement OEE calculation background scheduler.
- **Sprint 3 (Scrap & Rework Workflows)**: Create `ProductionScrap` and `ProductionRework` models, wire validation gates for issued vs scrap quantities, and link NCR events from QC inspections to auto-generate Rework Orders.
- **Sprint 4 (Outbox Events & Event Consumer)**: Wire `production.*` domain events to write transactional `OutboxEvent` rows, harden the event dispatching loop, and implement event routing hooks to trigger rebuild jobs.
- **Sprint 5 (Persisted Snapshots)**: Create database tables for `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, and `WorkCenterSnapshot`, write rebuilder jobs with idempotency keys, and connect read endpoints to read snapshots first.
- **Sprint 6 (WMS & Costing Integration)**: Implement validation for issue and return quantities (`issued = consumed + scrap + returned + remaining`), and update ComponentCosting engine to recalculate real actual cost from consumption.
- **Sprint 7 (Shopfloor Dashboard & Cockpits)**: Build manager and operator screens using `<CockpitKpiCard />` and `<CockpitChartCard />`, add fluid 12-column grid layouts, and implement WebSocket listeners for live OEE gauges and status lights.
- **Sprint 8 (Operations Center & AI Optimizer)**: Connect production snapshot freshness and OEE job telemetry to the Operations Center overview, and implement an AI nesting optimizer and queue advisor.
- **EPIC201 - PMS Sprint 1 (Domain Setup & Outbox)**: Create `ProjectsRepository` extends, write `createTask`, `updateTask`, `deleteTask` transactions with transactional outbox events `projects.task.created`/`updated`/`deleted`, event schemas, and consumer routing setup.
- **EPIC201 - PMS Sprint 2 (Dynamic Scheduling & Allocations)**: Implement dynamic WBS scheduling (FS/SS/FF cascade recalculation, lag days), predecessor validation, and material/component allocation controls.
- **EPIC201 - PMS Sprint 3 (Persisted Snapshots & Read Model)**: Deploy database table `ProjectRuntimeSnapshot` (json payload), implement rebuilder background job with idempotency keys, and build tab-gated API boundary `GET /projects/:id/detail/:tab` with cache TTL and snapshot-first reading.
- **EPIC201 - PMS Sprint 4 (WBS Gantt & Site Mode UI)**: Build interactive WBS tree grid with keyboard shortcuts, SVG/Canvas Gantt chart with drag-drop connection lines, responsive Mobile Site Mode for progress slide updates, and geotagged verification photo uploads.
- **EPIC201 - PMS Sprint 5 (QC Inspection & Material Return)**: Connect `ProjectTaskInspection` QC check, handover documents, and link project pending returns with WMS `/inventory/returns` workspace.
- **EPIC204 - Yard Sprint 1 (Domain Setup)**: Add `YardZone`, `YardSlot`, `YardItemPlacement`, `YardCrane`, `YardReservation`, `YardMovement`, and `YardLoadUnloadTask` to `schema.prisma` and implement `YardRepository`.
- **EPIC204 - Yard Sprint 2 (Placements & Reservations)**: Write API endpoints for placements and reservations, with logic for slot occupancy check and reservation expiry.
- **EPIC204 - Yard Sprint 3 (Movements & Crane Telemetry)**: Implement internal movements and loading/unloading tasks for crane operators.
- **EPIC204 - Yard Sprint 4 (Snapshots & Operations Center)**: Implement background job `snapshot.yard.rebuild` and register telemetry metrics to Operations Center.
- **EPIC204 - Yard Sprint 5 (Cockpit UI & AI Optimizer)**: Build Yard Cockpit using standard `<CockpitKpiCard />` and `<CockpitChartCard />`, 2D/3D map, and connect AI smart stacking suggestions.
- **EPIC205 - Purchasing Sprint 1 (Budget & PR)**: Add `PurchaseRequest`, `PurchaseRequestItem`, `PurchaseBudget`, and `ApprovalStep` to `schema.prisma` and implement `PurchaseBudgetService`.
- **EPIC205 - Purchasing Sprint 2 (RFQ & quotations)**: Implement RFQ creation and supplier quotation submissions.
- **EPIC205 - Purchasing Sprint 3 (PO & Approvals)**: Build PO creation and multi-level approval workflows with real-time budget checking.
- **EPIC205 - Purchasing Sprint 4 (Goods Receipt & QC)**: Integrate Goods Receipt with WMS inbound and trigger Supplier Performance scoring.
- **EPIC205 - Purchasing Sprint 5 (Cockpit UI & AI Scorer)**: Build Purchasing Cockpit, implement background `snapshot.purchasing.rebuild`, and connect AI quotation anomaly detection.
- **EPIC206 - Finance Sprint 1 (Domain & Valuation Lots)**: Add `InventoryValuationLot`, `InventoryValuationLedger`, and `CostCenter` to `schema.prisma` and implement `ValuationLotRepository`.
- **EPIC206 - Finance Sprint 2 (Valuation Engine)**: Implement core FIFO and WAC valuation engines with asynchronous Outbox trigger.
- **EPIC206 - Finance Sprint 3 (WIP & Actual Cost)**: Integrate WIP accumulation and Actual Cost calculation from MES consumption/HR payroll.
- **EPIC206 - Finance Sprint 4 (Budget & Cost Center)**: Implement budget control checks and overhead allocation rules.
- **EPIC206 - Finance Sprint 5 (Financial Cockpit & AI)**: Build Financial Dashboard UI, implement background snapshot update, and integrate AI cashflow forecast.
- **EPIC207 - HR Sprint 1 (Personnel & Skill Matrix)**: Add `Employee`, `Skill`, `EmployeeSkill`, and `EmployeeCertification` to `schema.prisma` and implement `EmployeeRepository`.
- **EPIC207 - HR Sprint 2 (Attendance & Shift)**: Build shift scheduling and attendance reconciliation engine with hardware scanner buffer.
- **EPIC207 - HR Sprint 3 (Payroll & Piece Rate)**: Implement piece-rate calculations linked with QC-passed production components.
- **EPIC207 - HR Sprint 4 (HR Dashboard & AI)**: Build Skill Matrix Grid, HR Dashboard, and integrate AI smart shift/assignment suggestions.
- Validate EPIC112 INV.CORE.2 Inventory Architecture Freeze candidate with real operator flows: create inbound, outbound, transfer, adjustment, stocktake-style adjustment, Project return request/receive/reject, then run the background worker and confirm Material/Location snapshots refresh.
- Validate EPIC115 Project Architecture Freeze candidate with real operator flows: create project from template, create/update/move/delete WBS tasks, return a project component, submit Site Mode update, run `POST /jobs/worker/tick`, confirm `project_dashboard_snapshots` updates, confirm `outbox_events` contains `project.*` events, and confirm `/operations-center/overview` includes healthy `projects` status.
- Plan the final Project freeze sprint only if needed: add persisted Project detail-tab snapshots behind `GET /projects/:id/detail/:tab`, then validate parity against repository read models for overview, materials, components, progress, costs, documents, and logs.
- Compare Material Detail snapshot payload with repository fallback for at least 5 materials, including materials with multiple locations, attachments, returns, and project allocations.
- Compare Inventory Location snapshot rows with `inventory_location_stocks` for MAIN and PRODUCTION warehouses; confirm empty locations are marked `occupied=false` rather than deleted.
- Validate persistent Outbox with an integration scenario: publish a persistent event, run `POST /jobs/worker/tick`, confirm `outbox_events.status` becomes `DISPATCHED`, and confirm duplicate `idempotencyKey` does not create duplicate events.
- Implement the first background snapshot sprint only after reviewing `docs/architecture/background-engine.md`, `docs/architecture/snapshot-update-engine.md`, and `docs/runtime/snapshot-rebuild-report.md`.
- Validate persistent Outbox locking/retry/idempotency under concurrent workers before relying on event-driven snapshot updates in multi-instance deployments.
- Start background snapshot implementation with `snapshot.inventory.rebuild`, dry-run parity comparison, and runtime metrics for snapshot hit/miss/fallback before switching any Dashboard endpoint to snapshot-first behavior.
- Re-run EPIC104 DE.1 EXPLAIN plans after realistic data growth. Current plans are documented in `docs/runtime/de1/`; the active dataset is too small for reliable timing-improvement claims.
- Use `docs/runtime/data-engine-index-foundation-report.md` before adding any new composite index. Avoid indexes that do not map to a measured query path or runtime hot endpoint.
- Use `docs/runtime/inventory-architecture-freeze-report.md` as the architecture gate before starting Production/Purchasing/QC foundation work.
- Add dispatch composite indexes only after capturing before/after EXPLAIN baselines against populated dispatch tables.
- Capture EPIC103 runtime analytics after realistic operator traffic: compare `analytics.windows['24h'].endpointRanking`, `queryRanking`, `performanceScore`, `architectureScore`, and `recommendations` against the current reports.
- Plan persisted runtime metrics before claiming 7/30/90-day trend quality; current EPIC103 long-range trend fields intentionally report unavailable because memory-only data is insufficient.
- Review modules with low runtime architecture score and cross-check them against EPIC100 repository coverage, EPIC101 query/index audits, and RT.1 slow-query logs before choosing optimizations.
- Capture RT.1 runtime baselines by exercising `/dashboard/cockpit`, `/dashboard/executive-cockpit`, Inventory list/detail, `/projects/runtime`, Project Detail tabs, Logistics list/detail, then saving observed averages/peaks from `/performance/metrics` into `docs/runtime/performance-baseline.md`.
- Review `docs/runtime/slow-query.log` after realistic operator flows and compare repeated slow rows with `docs/audit/enterprise-index-audit.md` before adding indexes.
- Follow up RT.1 by exporting process-local runtime metrics to a central telemetry sink before multi-instance deployment; current metrics reset on restart.
- Investigate any `queries.nPlusOneWarnings` from `/performance/metrics` with Semble/static query audit before batching code paths.
- Apply EPIC 101 performance gate (`docs/audit/enterprise-performance-gate.md`) to every new Dashboard, Runtime, Detail, Lookup, and Search/List endpoint before implementation.
- Plan a schema-enabled index sprint from `docs/audit/enterprise-index-audit.md`, prioritizing Inventory transaction/material/date indexes, ProjectTask hierarchy/status/date indexes, ReturnRequest status/date indexes, ActivityLog module/entity/date indexes, and Dispatch event/date indexes.
- Use `docs/architecture/data-growth-5-year-plan.md` before historical import, realtime eventing, or persisted read-model work so partition/archive/snapshot decisions stay compatible with 100M+ record growth.
- Convert the next non-Inventory runtime performance sprint from process-local/live aggregation to persisted snapshots behind existing API contracts; use Inventory Material/Location snapshot design as the pattern.
- Add endpoint timing/query diagnostics before enforcing strict production SLOs; current EPIC 101 budgets are target gates, not measured production latency baselines.
- Validate EPIC 100 repository/query pass by comparing Project Detail tabs (`overview`, `materials`, `components`, `progress`, `costs`, `documents`, `logs`) before/after the tab-specific backend source queries.
- Follow up EPIC 100 by adding regression tests before moving Inventory Return Workflow, Project Template CRUD, and ProjectTask command mutations behind repository methods.
- Use `docs/architecture/persisted-read-model-foundation.md` to plan the first schema-backed snapshot migration only after operators confirm current cached read-model parity.
- Review `docs/audit/query-budget-audit.md` before adding new runtime/cockpit endpoints; any endpoint loading transaction/task/log tables should declare a budget and pagination/snapshot plan.
- Validate Epic PERF Foundation with real dashboard traffic: compare `/dashboard/cockpit`, `/dashboard/stats`, `/dashboard/low-stock`, `/dashboard/procurement`, and `/dashboard/executive-cockpit` responses before/after the Inventory read model, then monitor latency as Inventory transaction volume grows.
- Follow up PERF.2 by deciding whether Dashboard Inventory aggregation needs a persisted snapshot table once operators have enough transaction volume for meaningful benchmarks.
- Follow up PERF.3 by replacing the current `GET /projects/:id/detail/:tab` runtime-slicing implementation with native tab-specific backend queries if Project Detail remains heavy with real data.
- Follow up Inventory Detail performance by monitoring material snapshot hit ratio and snapshot age in Operations Center before considering tab-specific API splitting.
- Validate mini-sidebar flyout hotfix in browser: collapse the sidebar, click Inventory/Projects/Logistics/Yard/Settings icons, confirm each flyout opens, click outside closes it, and selecting a menu item navigates then closes the flyout.
- Validate Sprint UX.1 in browser: header should be around 50px tall, dashboard KPI/chart area should gain vertical space, collapsed sidebar should remain 64px wide with clickable module icons, hover tooltips, and flyout menus including Inventory advanced operations.
- Validate Dynamic Workspace Header in browser: Inventory routes should show only two topbar lines (`VẬT TƯ KHO` plus the active workspace) and should no longer show `SteelTrack ERP` or `Inventory > ...`.
- Validate Sprint INV.NAV.2 in browser: open Inventory, expand `Nghiệp vụ nâng cao`, visit Nhập kho, Xuất kho, Điều chuyển, Kiểm kê, Điều chỉnh, Cảnh báo, and Audit; refresh each route; verify the group auto-opens for active child routes and stays collapsed by default otherwise.
- Validate Sprint 40PROJ.10B drawer standardization in browser: Inventory Material Detail and Project Detail should use large right drawers; Inventory Return Request Detail and Project Pending Return Detail should use small right drawers with sticky headers and internal scroll.
- Validate Sprint 40PROJ.10A in browser: Project Detail should open as a right drawer, Return Request detail should be a 55vw side drawer, and Project Return receipts should show `Trả từ công trình` / `PROJECT RETURN` in Inventory history and Material Detail history.
- Validate Inventory Return Requests workspace with a real operator session: open `/inventory/returns`, filter Requested returns from a Project Pending Return link, receive one request, reject another request, and confirm ActivityLog rows `PROJECT_MATERIAL_RETURN_RECEIVED` / `PROJECT_MATERIAL_RETURN_REJECTED` are created.
- Validate Sprint BUG.4 Project Material Return reconciliation with real data: allocated 1000, used 850, request return 150 should show pending 150 and no stock increase; receiving the return should show allocated 850, used 850, returned 150, pending 0, and Inventory stock +150 with transaction type code `PROJECT_RETURN_RECEIVED`.
- Validate HOTFIX Project Material Return API 404: click `Trả vật tư`, confirm `POST /inventory/returns` returns `201 Created`, confirm `return_requests`, `return_request_items`, and `activity_logs` rows are created, and confirm the duplicate React key warning for `/settings` no longer appears in the console.
- Validate Sprint 40PROJ.10 with a real Admin/operator session: create or select a template with task rules, use `Tự đề xuất` in Task Create, generate Auto WBS by spans/axes/floors, bulk-update selected tasks, submit a `Công trường` site update, and confirm `PROJECT_SITE_UPDATE` appears in the project log.
- Follow-up Sprint 40PROJ.10 gaps: add a visual template rule editor, connect direct Site Mode photo upload to project attachments, formalize component return lifecycle/disposition records in Yard, and add guarded bulk delete approval before enabling destructive batch operations.
- Validate the Projects runtime hotfix with a real authenticated Admin session: open Projects, Templates, create a template-backed project, and confirm generated WBS rows load through `GET /projects/:id/wbs`. Migration status is clean as of 2026-07-01, but template APIs are auth/RBAC protected, so unauthenticated curl checks return `401` by design.
- Validate Sprint 40PROJ.9 with operators: open `/projects/templates`, edit a project from Project Detail, create WBS tasks in Simple Mode with parent/duration, return a project component, and confirm Projects `Chi phí`, `Tài liệu`, and `Nhật ký` show real read-model/Attachment/ActivityLog data or explicit empty states.
- Follow-up Projects workflow hardening: connect Component Return to a formal Yard receiving/disposition flow, add upload/manage UI for project documents/photos, and implement task-level Site Mode/Smart Return posting on top of the current project-level return request flow.
- Before future ProjectTask or Template work, run `pnpm --dir apps/backend-api exec prisma migrate status` and confirm `project_tasks` and `project_templates` exist in the target database.
- `pnpm -C apps/backend-api start:dev` compiled successfully during the 2026-07-01 hotfix verification, but port `3000` was already in use. Stop the existing backend process or use a different port before repeating start-mode validation.

Current dataset note:

- Sprint AUDIT.1 created `docs/audit/` enterprise architecture reports. The audit recommends the next three highest-value sprints should be: 1) Workflow Engine Binding P0, 2) Inventory Ledger & Historical Import Readiness, and 3) Component/Project Cost Traceability. Use `docs/audit/next-roadmap-recommendations.md` before starting new major workstreams.
- The real/demo business data was cleaned on 2026-06-24. Operators should recreate materials, suppliers, projects, components, BOMs, production orders, QC records, yard placements, and transport records manually before workflow validation. Reference/configuration data remains available; see `docs/ai-state/audits/business-data-cleanup-20260624.md`.
- Date-time inputs in active Inventory transaction forms, Component production material return, and Production MO creation now refresh to current local time when opened/focused. Continue watching other future transaction forms for ad-hoc UTC `datetime-local` formatting.
- Module navigation was synchronized on 2026-06-27 for Components, Production, Projects, Suppliers, and QC. Follow-up should manually validate sidebar click, refresh, direct URL, and browser Back/Forward behavior in both expanded and collapsed sidebars. Placeholder tabs now need real backend/UI phases where noted in `docs/ui/navigation-completion-report.md`.
- Yard and Logistics navigation was synchronized on 2026-06-27 with route-backed tabs. Follow-up should manually validate the required Yard and Logistics paths in expanded/collapsed sidebars and replace Logistics placeholders with real backend-backed workflows when the module foundation begins.
- Yard Advanced Workspace was expanded on 2026-06-27 with 2D/3D/locations/components/dispatch/tracking/heatmap/timeline/history tabs. Sprint 80YARD.1R restored the existing GLB/R3F Yard 3D implementation on 2026-06-28. Follow-up should validate runtime 3D and demo fallback with operators and decide whether backend should expose physical slot coordinates plus pending dispatch workflow records.
- Dashboard KPI Chính was rationalized on 2026-06-27 to avoid fake/static KPI values. Sprint 70EXEC.1 on 2026-06-29 added backend-backed Executive Intelligence tabs for Predictive Trends, Recent Activities, and System Notifications. Sprint 70EXEC.2 added Control Tower health score, 7-day summary, suggested actions, activity grouping, and notification center. Follow-up should validate prediction/notification/action thresholds with real operator data and add real Logistics/payables/late-delivery sources only after those backend foundations exist.
- Local dev `ENOSPC` watcher crashes are documented in `docs/dev/watchers-diagnostics-report.md` and `docs/dev/watchers-remediation-plan.md`. If the issue recurs, apply the sysctl recommendations manually and check for duplicate Vite/Nest/tsx watch processes before changing application code.
- Validate Sprint BUG.2 Material Detail analytics with real operator transactions. The `Phân tích` tab should show inbound/outbound/inventory charts left-to-right from past to present, include zero-activity days between real transaction dates, and show tooltip dates as `dd/MM/yyyy`.
- Validate Sprint BUG.1 Material Detail analytics with real operator transactions. After inbound/outbound/transfer/adjustment, the open `InventoryMaterialDetailModal` should refresh history rows, inventory value, average cost when materially changed, and movement/cost sparklines without a browser refresh.
- Validate Sprint 40PROJ.1 Projects cockpit/detail workspace with operators. Confirm sidebar expanded/collapsed behavior, direct URL, refresh, Back/Forward, row-to-drawer flow, and whether derived Tiến độ from component/material runtime data is sufficient until persisted milestones/tasks exist.
- Validate Sprint 40PROJ.3 Project Execution foundation with operators. Confirm WBS tree readability, material return request creation, Project Health rules, and financial KPI interpretation against real project data. Decide the schema for persisted ProjectTask, task material allocation, task component allocation, and component return before further workflow work.
- Validate Sprint 40PROJ.4 Project Execution Workspace with operators. Confirm WBS CRUD, parent changes, multi-level expand/collapse, task detail drawer, cost tab, timeline tab, and runtime dashboard analytics against the new ProjectTask-backed API responses.
- Validate Sprint 40PROJ.5 Project Execution Engine with operators. Specifically test creating Root -> Child -> Grandchild WBS, changing parent without circular hierarchy, predecessor warnings, task resource allocation rows, task cost traceability, and the Điều hành/Gantt workspace after migration to normalized ProjectTask tables.
- Validate Sprint 40PROJ.6 Project Scheduling with operators. Test FS/SS/FF cascade recalculation, baseline variance, worker/machine shortages, material/component missing quantities, inspection states, and three-pane progress workspace against normalized dependency/resource/inspection rows.
- Validate Sprint 40PROJ.7 Project domain persistence. Apply migration `20260630100000_project_task_domain` on a database with legacy WBS metadata, compare legacy `tasks.description` counts to `project_tasks`, then create/update/move/delete WBS tasks and verify `GET /projects/runtime` remains compatible.
- Validate Sprint 40PROJ.8 Project Template and Low Data Entry flow. Apply migration `20260630113000_project_template_library`, confirm default `TPL-NX-5N` template exists, create a project from template, verify generated ProjectTask hierarchy/dependencies/schedule/resource rows, and test Quick Update on a real task with field operators.
- Follow-up Projects low-data-entry backlog: visual WBS template builder, frontend import/export buttons, dedicated Project contract fields, full Site Mode tab, task-level Smart Return posting, and admin/user template permission refinement if `projects.write` is too broad.

Inventory foundation order locked after Material Master, Inventory Transactions, and Warehouse Locations:

1. Warehouse Structure Cleanup:
   normalize `warehouse_zones` into real storage locations, separate warehouse-like/demo records from usable locations, and keep CRUD behavior consistent before any map work.
2. Performance Sprint:
   reduce frontend polling, add required indexes, and replace location statistics with transaction-driven location balance or a persisted balance model.
   Use `docs/ai-state/audits/system-integrity-audit.md` before any balance backfill.
3. Warehouse 2D Map:
   next step is to turn the current read/select 2D slot-level map into a fuller warehouse workspace after row/column/level/capacity data and location balances are stable. Drag-drop and 3D remain out of scope.
4. Supplier:
   continue Supplier Phase S2 after Inventory location and balance foundation is stable.
5. Purchasing:
   start purchasing only after Supplier-Material mapping and Inventory receiving/location rules are stable.

Backlog after the locked order:

6. Replace the derived production-material warehouse view with a persisted balance/receipt ledger so returns, BOM reservations, and material issues are all auditable independently from main Inventory.
7. Add a persisted slot-level balance ledger so `zoneId + slotId + level` can be reconciled from transaction history instead of relying only on Material Master default location metadata.
8. Continue Inventory technical cleanup by extracting the remaining local modal/table helpers into shared Inventory visual components and replacing frontend-generated inventory document numbers with backend deterministic sequences.
8a. Complete Material Master non-photo document upload controls for datasheets, CO, CQ, and catalogs. Inventory Transaction attachments are now available for active transaction forms, transaction detail view, and dedicated Nhập/Xuất/Điều chuyển/Kiểm kê list drawers; Sprint 14B.5 keeps material-list UX clean and surfaces attachment context inside Material Detail.
8b. Monitor Inventory transaction valuation consistency after Sprint 15B backfill. New operational transaction items should persist `unitPrice` and `totalAmount`; future reconciliation work should focus on stock ledger rebuilding, not missing valuation fields.
8c. Continue Inventory Outbound UX refinement after Sprint 16A by validating operator feedback on the new detail drawer and value-based project/material analytics before extracting remaining local helpers.
8d. Continue Inventory Transfer UX refinement after Sprint 16B by validating route/source/destination analytics against real operator transfer patterns before extracting shared transaction-detail helpers.
8e. Continue Inventory Inbound UX refinement after Sprint 16C by validating supplier/value analytics and price-monitoring results against real purchase/receiving data before extracting shared transaction-detail helpers.
8f. Continue Inventory Outbound analytics review after Sprint 16D by validating project consumption, outbound purpose classification, and abnormal-consumption thresholds against real operational export patterns.
8g. Continue Inventory Stock Take review after Sprint 17A by validating whether adjustment transaction payloads expose real `SystemQty` / `ActualQty`; current UI uses existing fields when present and falls back to variance-only display when they are absent.
8h. Continue Inventory Locations review after Sprint 17B by validating slot occupancy/value analytics against real average-cost data and planning a formal slot-level value ledger if operators need auditable historical location valuation.
8i. Validate Sprint 17F main-warehouse stock status against real purchasing data. Stock alerts now use `MAIN` balances only; follow-up should ensure all active material rows expose reliable `locationBalances` with warehouse code/name metadata.
8j. Validate Sprint 19E adjustment workflow with operators. New adjustment creation uses exact Material Detail `locationBalances` and stores System Qty / Actual Qty audit context in transaction `note`; follow-up should decide whether these audit fields need first-class backend columns instead of metadata.
8j.1. Validate Sprint INVRET.1 Inventory Return Requests cockpit with operators. Confirm Requested/Received/Rejected/Pending Quantity metrics, 30-day trend, top returned materials, aging badges, and small drawer behavior match the Inventory Overview/Transactions visual standard.
8j.2. Validate Sprint INV.BUG.5 / INV.UGX.1 inbound location and suggestion workflow with operators. Test inbound without Zone/Slot/Level, inbound with exact location, last-location suggestion, last-price auto-fill, 30-day average price display, and >30% price-delta warning using real transaction history.
8k. Validate Sprint 20I.3G/H/P/Q/R/S category KPI card enhancements with operators, ensuring format `X (Y tấn)` with styled spans, equal height `h-[108px]`, and ton-based delta values in parentheses (`▲/▼ X% (+Y%)`) match expectations.
8l. Validate Sprint 20I.4F visual rhythm and parity updates of the 5 Inventory Materials dashboard cards and charts, ensuring that they match the Inventory Overview card layout, fixed header height (`h-[64px]`), 12-month historical snapshot engine synchronization (May 2026 snapshot ≈ 7.711.783.211 đ value / ~10.767 tons, June 2026 snapshot ≈ 14.168.720.116 đ value / ~15.542.5 tons), and that cards 1, 2, and 3 are styled at `h-[170px]` with scroll containers for the original chart dimensions without overlapping or clipping.
8m. Validate Sprint 20I.5A Inventory Locations Dashboard redesigned layout, ensuring the 5 chart rows match the specified heights, cockpit theme visual components, and that the slot transfer routes chart is successfully replaced with the zone capacity distribution chart.
8n. Validate Sprint 20I.5B Inventory Locations Dashboard layout polish, ensuring the primary location section occupies the left, right sidebar stacks three charts, horizontal bars are replaced by compact tables, gap/spacing is minimized to `gap-1`/`space-y-1`, and all labels are localized to Vietnamese.
8o. Validate Sprint 20I.5C Inventory Locations Dashboard usability polish, ensuring the Locations list has detailed columns, custom row heights and padding, and rounded status badges, the four analytics cards are enlarged, and the "Xem tất cả" header buttons trigger the full-table modal dialogs with Vietnamese transaction dates.
8p. Validate Sprint 20I.5D Inventory Locations Responsive Workspace, ensuring that all fixed width constraints, max-w-* limits, mx-auto centering wrappers, container classes, and hardcoded column/sidebar widths are removed, the root layout is set to w-full min-w-0 flex-1 space-y-1, the top section is structured as a 12-column grid with Danh sách vị trí kho occupying col-span-12 2xl:col-span-8 and the right sidebar occupying col-span-12 2xl:col-span-4, the bottom analytics section utilizes a 12-column grid with col-span-12 xl:col-span-6 layout for all four cards, and the dashboard dynamically resizes across expanded/collapsed sidebars, laptops, and ultrawide screens.
8q. Validate Sprint 20I.5E Inventory Locations Top 5 Preview, ensuring all 6 analytics cards render top 5 sorted rows in preview mode using dedicated sliced preview memos, while the "Xem tất cả" modals render the full unsliced source memos, with custom DESC/newest-first sorting applied to all.
8r. Validate Sprint 20I.5F Inventory Locations KPI Cockpit, ensuring the 5 cockpit cards display identical styles, WMS cockpit layout, 6-month historical trend sparklines, and dynamic delta notes with correct units and formats.
8s. Validate Sprint 20D.1 Executive Dashboard Implementation, ensuring the redesigned Inventory Overview Page successfully reuses the shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`), handles the 4-row layout fluidly across 1440px and ultrawide viewports, renders mock forecasts/donut segments/pulse metrics, and supports all performance gauge visualizations.
8t. Validate Sprint 20D.2C Executive KPI Redesign, ensuring the redesigned `DashboardPage.tsx` KPI strip renders the 5 KPI cards directly using the enhanced shared `CockpitKpiCard` component and correctly renders all custom states (loading, empty, normal, alert), tone classes, trend descriptions, status badges, and subtle background sparklines.
8u. Validate Sprint 20D.2F Dashboard Text Simplification & Localization, ensuring that the page header shows `"Tổng quan"` without descriptions, all 8 panel headers render in localized Vietnamese, the 5 KPI cards display Vietnamese titles and shortened trend texts (`+2,4 ngày`, `+1 chuyền`, `+12 nghìn tấn`), and status badges are simplified to `"LIVE"`, `"RUN"`, and `"WARN"`.
8v. Validate Sprint 20D.2G Dashboard Text Density Reduction, ensuring that status badges are replaced by colored glowing status dots, titles are shortened, and card primary values show only raw numbers (`42`, `18`, `256K`, `96,8%`, `7`) without units.
8w. Validate Sprint 20D.3 Executive Dashboard UX Redesign, ensuring that the page header has no title/description text and starts immediately with KPI cards, the status dots are static (no pulse animation), the layout follows the 5-row specification precisely, the forecast panel uses a grouped bar chart ("Biến động nhập - xuất - tồn kho") with top legends and bottom metrics, the alerts panel renders the top 4 alert items with subtle borders only, Yard occupancy displays full slot statistics, QC trend renders line-series lines, material replenishment shows bars on left and a top-5 table on right, the recent activity panel uses a compact timeline list, and the assumptions checklist uses checkmark boxes.
8x. Validate Sprint 20D.3B Executive Dashboard Final Polish, ensuring that KPI cards are formatted with `px-4 py-4` padding and `text-[44px] xl:text-[48px]` values, the movement chart container uses `h-[380px]` (body `h-[290px]`), alerts render under the header `Cảnh báo (N)` displaying alert title (`row.code`), localized description (`Tồn X · thiếu Y SET`), and relative time, and recent activity uses a compact bullet timeline format.
8y. Validate Sprint 20D.3C Dashboard Empty States & Density Optimization, ensuring that empty state screens with custom titles (e.g. `"Chưa có dữ liệu QC"`, `"Chưa có tiến độ cấu kiện"`, `"Chưa có dữ liệu bãi"`) are rendered when datasets are empty, cards scale to the exact height settings (260px, 220px, 160px), base text sizes are at least 13px/12px, activities clamp description content to 2 lines, and vertical whitespace is minimized to list more rows.
8z. Validate Sprint 20D.4A KPI Layout Unification, ensuring that DashboardPage KPI cards render in a vertical hierarchy (Label at 11px, Value at 38px/42px with inline units, Delta at 11px with standard leading symbols), while maintaining the h-[128px] executive heights, and that all large icons, status chips, pulse indicators, and duplicate labels are removed.
8aa. Validate Sprint 20D.4B KPI Typography Polish, ensuring that labels render using `text-[12px] font-medium text-slate-400` (no uppercase or letter-spacing tracking), values render using `font-bold tabular-nums text-[38px] xl:text-[42px] leading-none tracking-tight` (no font-mono), deltas use exact units (`▲ 2,4 ngày (+6,1%)`, `▲ 1 chuyền (+5,9%)`, `▲ 12K kiện (+4,8%)`, `▲ 0,6%`, `▼ 2 cảnh báo (-22%)`), and card shells implement `px-5 py-4` and `gap-y-2` spacing rules.
8ab. Validate Sprint 30Y.2 Yard Cockpit Unification, ensuring that roots enforce fluid `w-full min-w-0 flex-1 space-y-1` layout, grids use `gap-1` and `space-y-1` margins, all metric KPI cards use the standard `h-[108px]` `<CockpitKpiCard />` configuration, quick analytics widgets use `<CockpitChartCard />` (`h-[170px]` card heights, `h-[74px]` chart body viewports), tables are formatted with transparent shells (`border-b border-cyan-400/10` headers and row hovers), pagination uses `<DataTablePagination />`, and detail panels align to the `COCKPIT_SHELL` standard.
8ac. Validate Sprint 20C.9 & 20P.9A Cockpit Unification Phase 2, ensuring that Components and Production modules' layouts, grids (`gap-1`/`space-y-1`), KPI cards (`h-[108px]`), quick analytics (`h-[170px]` / `h-[74px]`), and tables (`px-4 py-2.5 text-xs` paddings, borderless shells, hover highlights) are unified, and that the drawer/sidebar widgets use generic `CockpitSidebarStats`, `CockpitRecentList`, `CockpitStatusList`, and `CockpitEmptyState` components.
9. Extend Production Material Issue and Consumption workflows with manual approval controls, issue/return document headers, adjust postings, and richer consumption entry UX. Sprint 10A fixed the active return reconciliation path; this backlog item is for approval/document UX, not the basic return balance equation.
9a. Review Sprint 18 Production UI with operators. Production Cockpit and the main Production tabs now match the Inventory theme more closely; remaining work should focus on extracting repeated local table/detail helpers only after the new presentation is accepted.
9b. Validate Components Theme Unification on 2026-06-27 (Sprint 20C.8) with operators, ensuring that `ComponentsListPage.tsx` matches the `InventoryMaterialsPage` design system (fluid root layout, gap-1, local `InventoryMetricCard` elements, local `ChartCard` containers, table styling, and creation modal).
9c. Review Sprint 18D Work Order Cockpit with operators. `READY TO RELEASE` is currently UI-only; follow-up should decide whether release workflow should be blocked below 100% readiness and whether Work Order APIs should expose true material value/unit cost.
9d. Review Sprint 18E Material Issue Dashboard with operators. Material Issue readiness is computed from existing BOM/Issue data in the frontend; follow-up should decide whether Material Issue APIs should expose unit cost/line value and whether issue/return documents need approval headers.
9e. Review Sprint 19A Production Warehouse Cockpit with operators. The cockpit uses existing Inventory location balances plus reservation/order data; follow-up should decide whether a persisted production warehouse ledger is needed for auditable receipt/reserve/issue/return history.
9f. Review Sprint 19B Production Execution Board with shopfloor operators. The board currently uses available stage/status data with UI fallback mapping; follow-up should decide whether backend should expose canonical work-center stage queues and TV-mode preferences.
9g. Sprint 19C MES Data Audit recommends Costing before deeper Shopfloor work. Shopfloor foundations exist, but immutable stage transition history, actual runtime/downtime, production-line queues, and labor/machine rate data are not canonical enough for the next major track.
10. Review Sprint 20A Costing Engine with seeded and real cost data. Sprint 20A.5 now provides a runnable `DEMO20A5-*` demo dataset with 20/20 component costing and 20/20 full-readiness work orders; use it for dashboard/costing QA, then validate against real operator data.
11. 20B Component Cost Analysis:
    - (Done) 20B.1: Audit existing Component module UI patterns.
    - 20B.2: Expose component-level estimated/actual/variance analysis UI with drill-down by BOM material, consumed/scrap quantity, issue transaction cost source, and persisted ComponentCosting comparison.
12. 20C Project Cost Control: roll component costing and project inventory transaction values into project-level cost control, budget variance, project material budgets, and project cost summaries.
13. Backfill or reconcile legacy Production Material Ledger gaps for issue rows that predate ledger automation or came from non-ledger issue paths.
14. Add formal Yard outbound/shipment, project receiving, and installation certificate documents on top of the current `SHIPPED -> DELIVERED -> INSTALLED` component status workflow and text-based install mapping.
15. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
16. Projects Phase S2: harden workflows on top of the Sprint 40PROJ.7 ProjectTask domain: persisted project contract fields, milestone/baseline version history, resource calendars, inspection/handover actions, project material budgets, schedule approval, formal component return workflow, and project document/photo attachments.
17. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
18. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, notification mark-read APIs, audit export, backup job execution, and configuration change approval.
19. Dashboard Phase S2: validate Sprint 70EXEC.1/70EXEC.2 Executive Intelligence and Control Tower outputs with live data, then add persisted dashboard preferences, deeper drill-through links, procurement request creation from replenishment recommendations, and formal notification/action mutation flows after System/Purchasing mutation APIs exist.
20. Build Organizations operational foundation.
21. Validate Sprint 50LOG.1 Logistics Dispatch MVP with operators:
    - Apply migration `20260701090000_dispatch_order_domain`.
    - Create dispatch from a project with real ProjectTask material/component allocations.
    - Verify auto suggestion, loading, depart, arrive, receive, complete, and cancel transitions.
    - Verify material receive creates Inventory export transaction and Project allocation issued/remaining reconciliation.
    - Add the follow-up Project Detail UI pass for per-material/per-component `Đang vận chuyển`, `Đã nhận`, and `Ngày nhận` columns.
    - Add exact yard/warehouse source location selection and loading photo/signature attachments before treating Logistics as complete.
22. Move remaining non-inventory frontend-suggested document numbers fully backend-side. Sprint 17E made Inventory transaction numbering backend-owned with `PREFIX-YYMMDD-00001`, max-suffix generation, and `P2002` retry; the follow-up is a formal backend sequence/locking API for other modules and review of historical Inventory `code <> transactionNo` rows.
23. Clean up legacy frontend auth/router files after confirming no imports remain, so future auth work only uses the active shared auth store and guarded router.
24. EPIC107 follow-up: validate SNAP.2 snapshot cutover under real traffic. Confirm Inventory/Projects snapshot hit rates, Logistics fallback until dispatch data exists, and parity-warning counts before disabling `SNAPSHOT_PARITY_CHECK`.
25. Resolve historical Prisma migration drift before relying on `prisma migrate dev` as a hard gate. Current drift is from modified migration `20260630100000_project_task_domain` and unmanaged table `inventory_location_stocks_backup`; do not reset production-like data.
26. Validate OPS.1 in browser with an Admin session: open `/operations-center`, switch every tab, verify sidebar/topbar titles, confirm `GET /operations-center/overview` returns real metrics, and confirm empty/missing storage or snapshot states do not show fake data.
27. OPS.2 Database Center: expand Operations Center database visibility with table growth trends, index health, bloat/scan risk, migration drift status, partition/archive readiness, and database backup health.
28. OPS.3 Runtime Explorer: add request/query drill-down over Runtime Metrics, endpoint budgets, slow query observations, duplicate query/N+1 warnings, and response-size/memory outliers.
29. OPS.4 Event Explorer: add read-only Outbox/Event Pipeline inspection, dead-letter grouping, replay readiness checks, and retry/idempotency diagnostics before enabling replay actions.
30. OPS.5 Backup Center: add backup job status, retention, storage capacity, restore-readiness checks, and runbook links.
31. Use EPIC108 validation services before and after major performance changes: run snapshot parity, benchmark runtime vs snapshot readers, inspect background recovery state, and execute controlled read-only stress harnesses on staging data.
32. Validate EPIC112 INV.CORE.2 with real operator flows: confirm Inventory outbox events persist, background snapshot jobs are queued, `POST /jobs/worker/tick` rebuilds material/location snapshots, Material Detail opens from snapshot on the second read, and `/operations-center/overview` reports material/location snapshot health.
33. After validation, mark Inventory Architecture Freeze v1.0 formally and use it as the required architecture template for Production, Purchasing, QC, Maintenance, and future enterprise modules.
34. Use EPIC111 audit reports before starting new Production work. Production next priority is ProductionOrder/WorkOrder domain clarification, repository coverage, canonical production events, Production snapshot foundations, and missing MES domain design for Shift, Operation, Production Line, Downtime, and OEE.
35. Apply and validate EPIC210 Enterprise Standards and Guidelines during implementation of the Production, Yard, QC, Logistics, and Purchasing modules.
36. Validate Projects Architecture Freeze v1.0 under real operator activity:
    - Confirm `GET /projects/:id/detail/:tab` records snapshot hits for `overview`, `materials`, `components`, `progress`, `command`, `site`, and `costs`.
    - Confirm `documents` and `logs` use repository fallback intentionally and do not queue unnecessary Project Detail snapshots.
    - Monitor Operations Center Project Detail snapshot parity, age, lag, hit ratio, and fallback counts.
37. Keep backend startup verification in release checklists:
    - `pnpm -C apps/backend-api build`
    - `pnpm -C apps/backend-api start`
    - `pnpm -C apps/backend-api start:dev`
    - `pnpm -C apps/backend-api start:prod`
    - Confirm the production build output contains `dist/main.js` and not `dist/src/main.js`.
38. EPIC117 P0 before Inventory Business Freeze:
    - Reconcile the 3 `InventoryMaterialSnapshot` mismatches found in `docs/runtime/inventory-data-consistency-report.md`.
    - Verify the approved background worker path refreshes affected material snapshots and re-run parity validation.
    - Attach formal transaction DTO validation to `POST /inventory/transactions` without changing the public API contract.
    - Extend `createTransactionSchema.items[]` to model existing line-level `warehouseId`, `zoneId`, `slotId`, `level`, `unitPrice`, and `totalAmount` fields.
    - Decide whether current adjustment-backed Stock Take is business-acceptable for Freeze or whether a first-class Stock Take session lifecycle is required.
39. EPIC117 P1 Inventory reporting backlog:
    - Nhập theo ngày.
    - Xuất theo ngày.
    - Tồn theo kho.
    - Tồn theo vị trí.
    - Giá trị tồn.
    - Tuổi tồn kho.
    - Hàng chậm luân chuyển.
    - Vật tư âm / exception report.
- Inventory Business Freeze v1.0 is approved. Treat transaction-first mutation,
  location stock authority, repository boundaries, persistent outbox, background
  snapshots, snapshot-first reads, and Operations Center metrics as frozen
  architectural constraints.
- Plan Stock Take Phase 2 only as a dedicated business sprint:
  `Session -> Count -> Recount -> Review -> Approval -> Adjustment -> Close`.
- Add a non-destructive historical data-quality task for the one pre-validation
  IMPORT line without slot/level metadata; do not rewrite the immutable
  transaction without an approved reconciliation procedure.
# EPIC144 Follow-up

- Run operator traffic against Components Overview and Detail to establish a
  non-zero snapshot hit/fallback baseline in Operations Center.
- Complete Components create/delete and revision/release/archive event contracts
  only when those domain workflows are formally approved.
- Move to QC Core Foundation; do not expand Components platform architecture
  unless runtime evidence identifies a defect.
# QC Core Platform Roadmap

1. EPIC154: add QC-specific Snapshot hit/miss/age/lag, fallback and live
   read-model metrics, then expose QC Platform Health in Operations Center.
2. Approve a QC lifecycle/event decision covering status transitions, NCR
   disposition and linked reinspection before workflow changes.
3. Add canonical create/approve/reject/NCR-update events atomically only after
   that decision; route them to the existing QC Snapshot writer.
4. Add UI pagination controls only in an approved presentation sprint; the
   workspace API already supports server-side pages.
# EPIC154 Follow-up

1. Run real QC operator traffic to establish snapshot hit ratio, age, lag, fallback, outbox, and background-job baselines.
2. Approve the QC lifecycle/event contract before adding missing create/approve/reject/NCR-update events.
3. Validate QC snapshot parity against populated inspection data; keep validation warning-only.
4. Do not extend QC Core Platform architecture unless runtime evidence identifies a defect.
# Yard Core Platform Roadmap

1. EPIC161 - complete Yard repository ownership and atomic Outbox; approve cross-module command and canonical event boundaries first.
2. EPIC162 - implement bounded repository live read models for layout, placements, movements and workspace summaries; cut active UI data binding without redesign.
3. EPIC163 - implement shared Yard domain snapshot foundation with background writer, safe fallback and warning-only parity.
4. EPIC164 - add Yard runtime metrics and Operations Center Platform Health.
5. Run a separate Yard business-completion sprint for QC receipt, reservation, hold/release, load tasks/plans and Logistics dispatch handoff.
6. Remove active 3D demo fallback and synthetic QC classification in an explicitly approved UI/data remediation sprint.
# Yard Roadmap After EPIC161

1. EPIC162 - bounded Yard Repository Live Read Models and ADR011 workspace cutover.
2. EPIC163 - Yard domain Snapshot Foundation with background writer, fallback and parity.
3. EPIC164 - Yard runtime metrics and Operations Center Platform Health.
4. Approve canonical Yard event naming before replacing existing `yard.item.*` compatibility events.
5. Complete QC receipt, reservation, hold/release, load task and Dispatch handoff only in a separate approved business sprint.
# Yard Roadmap After EPIC162

1. EPIC163 - Yard domain Snapshot Foundation for dashboard/analytics only; workspace remains live read model.
2. EPIC164 - Yard runtime metrics and Operations Center Platform Health.
3. Operator-test zone/viewport scoping for maps larger than the default 100-slot page before changing limits.
4. Approve canonical Yard event names and business workflows separately; do not mix them into Snapshot work.
5. Keep QC receipt, reservation, hold/release, loading and dispatch completion in a dedicated business sprint.
# Yard Roadmap After EPIC163

1. Deploy `20260713180000_yard_snapshot_foundation` through the approved migration process before runtime/operator validation.
2. Process real Yard events and worker ticks; verify Dashboard/Workspace snapshot rows and warning-only parity.
3. EPIC164 - add Yard-specific hit/miss/age/lag/fallback/read-model metrics and Operations Center Platform Health.
4. Do not switch Yard operator workspace to snapshots; ADR011 live read model remains authoritative.
5. Add reservation/loading/dispatch event routing only after those business workflows are approved.
# EPIC164 Follow-up

- Run real Yard placement/movement/removal traffic and verify snapshot hit ratio,
  age, lag, Outbox state and `snapshot.yard*` jobs in Operations Center.
- Complete Yard reservation, hold/release, truck loading and dispatch handoff as
  separate approved business sprints before claiming full event freshness.
- Keep Yard operator workspaces on the ADR011 repository live read model; use
  snapshots only for dashboard and analytics reads.
# EPIC170 Certification Gates

- P0: make Inventory Return, Components update/status and Production persistent
  legacy events atomic with their owning repository transactions.
- P0: move Inventory Materials to a repository live workspace read and replace
  Production Cockpit client business aggregation with bounded live read models.
- P1: cut active Components, QC and Yard dashboards over to their existing
  snapshot readers with repository fallback and dispatcher rebuild.
- P1: normalize Inventory module runtime metric naming while retaining granular
  material/location metrics.
- Rerun EPIC170 certification before implementing Logistics beyond audit scope.

# Enterprise Read Platform Follow-up

1. Deploy `20260717170000_enterprise_read_platform` through the approved database process.
2. Process retained Outbox events and verify projection checkpoint, lag, retry and dead-letter health with runtime data.
3. Complete canonical Inventory event payloads for quantity and location facts before certifying availability/balance projections.
4. Validate typed projection parity per module before any dashboard or cockpit cutover.
5. Cut consumers over module by module in a separate UI/API sprint; do not claim current UI is projection-only yet.
6. Define retention and archival policy for Outbox receipts before high-volume replay operations.

# RFC002A Follow-up

1. Add an explicit location-bucket projection identity in a separately approved Projection Engine version before certifying LocationBalance.
2. Define an Inventory aggregate sequence/ordering contract; timestamp-derived legacy versions are not strict optimistic-concurrency versions.
3. Add Production Execution publishers only with an approved execution workflow.
4. Add canonical QC defect/reason codes through a domain decision before certifying NCR projections.
5. Complete Yard movement source-location and loading workflows before Yard event certification.
6. Define Project and Logistics canonical publishers in their owning-domain implementation sprints.
7. Run new real operator commands to establish Production/Components canonical replay fixtures; current retained Outbox has none.
# After EPIC171

- EPIC172: completed. Production Overview/Orders/Planning now use the bounded
  repository live Cockpit read model.
- EPIC173: cut active Components, QC and Yard dashboards over to their existing
  snapshot readers.
- EPIC174: complete atomic Outbox parity and normalize Inventory runtime metric
  naming, then rerun Core Platform v1.0 certification.

# RFC014 Production Hardening Follow-up

1. Add owner-checked Background Job heartbeats and lease expiry before enabling
   automatic stale `RUNNING`/`DISPATCHING` recovery; prove no duplicate execution
   under worker pause and process-crash tests.
2. Replace full-dataset runtime integrity endpoints with bounded, resumable or
   offline validation jobs before production-scale use.
3. Approve a route-by-route authorization compatibility plan, then secure legacy
   business controllers consistently rather than applying an implicit global
   guard without client validation.
4. Run RFC012-014 replay, queue, lock-contention, shutdown and database timeout
   tests against representative PostgreSQL volume and connection-pool limits.

# RFC015 Deployment Release Gates

1. Run the built image against staging PostgreSQL; require `/health/live` and
   `/health/ready` HTTP 200, then send `SIGTERM` during an active worker tick and
   confirm clean drain within the 60-second grace period.
2. Validate and deploy `20260717190000_enterprise_data_scalability_indexes` on a
   production-size clone with lock, WAL and rollback budgets before release.
3. Integrate the image with the target platform secret manager, TLS ingress,
   centralized logs/metrics, immutable registry tags, image signing and SBOM.
4. Decide worker topology explicitly per environment. Keep replay disabled at
   startup and ensure at least one, but intentionally bounded, worker-enabled
   replica processes Outbox and Background Jobs.

# RFC017 Certification Rerun Gates

1. Execute the concurrent RFC013 index migration on a production-size clone;
   capture duration, write latency, lock waits, WAL volume, disk use and replica
   lag per index before approving production deploy.
2. Kill and pause competing worker processes during active Job and Outbox work;
   verify lease takeover, stale-owner rejection and idempotent side effects.
3. Run anonymous/authenticated/role API smoke tests and prove every mutation is
   rejected without a valid access token.
4. Run image startup, readiness and `SIGTERM` drain against stable staging
   PostgreSQL, then rerun RFC016 production certification.

# EPIC UI003B Follow-up

1. Add a CI static transport-boundary check that rejects new active
   `axios.create`, direct Axios verbs and authenticated `fetch` outside the
   approved client files.
2. Define `VITE_API_URL` in each deployment environment; the centralized client
   preserves the existing backend URL as its compatibility fallback.
3. Exercise token expiry and concurrent 401 refresh against staging to validate
   the existing single-flight refresh behavior under production latency.

# Components UI Follow-up

1. Run browser screenshot comparison for Components Overview/List against
   Inventory Inbound/Materials once a local browser runner is available.
2. Apply the same structural review to the remaining Components tabs before
   certifying the full Components UI surface.

# EPIC 0 UI Audit Follow-up

1. Resolve the P0 browser screenshot harness blocker before declaring visual
   certification for any non-Inventory module.
2. Use `docs/ui/full-ui-audit/MASTER_BACKLOG.md` as the sequencing source for
   the next UI remediation sprint.
3. Decide whether Planning should be registered as a visible route before
   investing in Planning UI polish.

# EPIC 0.5 Execution Plan Follow-up

1. Start Phase 1 Inventory Finish from
   `docs/ui/full-ui-audit/EXECUTION_PLAN.md` unless business priority overrides
   the documented sequence.
2. Treat P0 items in `MASTER_BACKLOG.md` as blockers before certifying any
   downstream module as visually production-ready.

# Sprint 5 Historical Dashboard QA Follow-up

1. Run authenticated live smoke against a seeded staging API for:
   `/history/dashboard`, `/history/dashboard/latest`,
   `/history/dashboard/monthly`, `/history/inventory`,
   `/history/inventory/monthly` and `/history/jobs`.
2. Capture browser runtime console/network traces for `/history` once staging
   snapshots exist, including 404/500/offline retry behavior.
3. Decide whether Historical tables need server-side sorting/sticky-header
   parity in a later UI/API sprint; Sprint 5 intentionally did not change API
   contracts.
4. Clean the project-wide frontend ESLint baseline separately, especially
   archived/legacy parse errors, so future sprint lint gates can run globally.

# Warehouse Realtime Follow-up

1. Add a dedicated realtime Inventory read endpoint only if staging shows the
   current three-endpoint polling path is too expensive.
2. Define and approve a lightweight WebSocket signal contract before replacing
   polling with push updates.
3. Add authoritative warehouse capacity and slot/zone utilization read models
   before certifying over-capacity alerts as operationally authoritative.
4. Continue reducing the remaining frontend lint warnings so legacy-debt rules
   can be promoted from warning back to error over time.
