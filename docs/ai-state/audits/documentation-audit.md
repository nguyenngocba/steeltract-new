# Documentation Audit

Audit date: 2026-06-11

## Missing Documentation

* Components module documentation is not part of the normalized module target list, but Components is an active module at 79% and should get `docs/ai-state/modules/components.md` in a later cleanup.
* Logistics module documentation is missing even though Logistics is listed as In Progress in `CURRENT_MODULES.md`.
* Settings documentation is missing as a dedicated module doc; System docs currently cover parts of Settings.
* Organizations documentation is missing because the module is not started.
* API endpoint lists for Yard and Projects are incomplete and should be filled from controller-level audit in a later pass.
* Dashboard does not yet have a separate decision file; current decisions are captured under architecture/system-level notes.

## Outdated Documentation

* `CODEX_WORKFLOW.md` still referenced root-level `MODULE_<MODULE>.md` files before this refactor.
* Some older changelog entries describe production warehouse stock as future work; newer entries clarify that production warehouse stock is now operational for BOM validation and MO auto-issue, but formal persisted production-material ledger remains future work.
* Inventory Sprint B notes originally said 2D warehouse map UI was out of scope; newer work added read/select 2D location views in operational modals. Historical notes should remain as history, but current module docs should describe the current 2D state.

## Duplicate Documentation

* Root-level `MODULE_PRODUCTION.md`, `MODULE_QC.md`, `MODULE_SUPPLIERS.md`, and `MODULE_SYSTEM.md` duplicated the intended normalized `modules/` structure. They have been moved into `docs/ai-state/modules/`.
* `CHANGELOG_AI.md` and `changelog.md` both track changes. Keep both for now: `CHANGELOG_AI.md` is the operational AI handoff log and `changelog.md` is the cleaner project changelog.
* System and Dashboard notes overlap because Dashboard cockpit data and notifications are served through System/Dashboard APIs. This is acceptable but should be kept cross-referenced.

## Recommended Cleanup

* Add `modules/components.md`, `modules/logistics.md`, `modules/settings.md`, and `modules/organizations.md` when the target structure expands beyond this requested refactor.
* Add API endpoint audits for Yard and Projects from backend controllers.
* Add a `decisions/qc-decisions.md` if QC Phase S2 introduces release certificates and NCR lifecycle decisions.
* Add a `decisions/system-decisions.md` when System mutation APIs and settings persistence are designed.
* Periodically reconcile `PROJECT_STATUS.md`, `CURRENT_STATE.md`, `CURRENT_MODULES.md`, and module docs after each major workflow change.
