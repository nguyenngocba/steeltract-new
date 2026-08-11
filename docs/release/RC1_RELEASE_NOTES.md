# SteelTrack V1 RC1 Release Notes

Status: **DRAFT - NOT APPROVED FOR TAG OR DEPLOYMENT**  
Candidate commit: `0094767e7b95bbb9f295359c3fd46eab4be5aaab`

## Candidate Scope

This candidate contains the SteelTrack V1 canonical operational workflow:

- Transaction-based material receipt and warehouse transfer.
- Project component requirements and released engineering BOM lineage.
- Production Order, work-order and physical instance execution.
- FINAL physical QC and Finished Goods eligibility.
- ComponentInstance Yard placement, dispatch, delivery and installation.
- Canonical reverse workflow foundations.
- Inventory, Production, QC, Yard, Logistics, Projects and Executive read
  models.
- Global JWT/RBAC enforcement, ActivityLog and idempotent command boundaries.
- Deployment liveness, readiness and startup probes.

## Runtime Certification

- 68 authenticated REST workflow steps: PASS.
- 13 Playwright workflow workspaces/screenshots: PASS.
- Database invariants: 15/15 PASS.
- Yard dashboard parity: 11/11 PASS.
- RBAC/authentication checks: 54/54 PASS.
- Backend tests: 94 suites / 313 tests PASS.
- Frontend tests: 2 files / 4 tests PASS.
- Prisma validation, migrations, builds and typecheck: PASS.

See `docs/audits/system-runtime2-final-runtime-closure.md`.

## Release Blockers

This candidate cannot be tagged or deployed while these gates remain open:

- Production dependency graph contains 1 critical and 10 high advisories.
- Backend lint fails with 4,010 errors; frontend retains 384 warnings.
- No valid production frontend image/static-server/reverse-proxy deployment.
- Server secrets are present in a local frontend env file; rotate and remove.
- Backup dump works, but clean restore/PITR and RTO/RPO are not certified.
- HTTPS/security headers/rate limiting and external monitoring/alert rules are
  not implemented or evidenced.

The authoritative decision is
`docs/audits/system-freeze1-release-candidate-freeze.md`.

## Compatibility Notes

- Database migrations remain forward-only and additive.
- Application rollback must use a previous compatible immutable image; do not
  reverse migrations automatically.
- Legacy component/production endpoints remain for compatibility, but
  `POST /production/:id/stage-to-yard` is intentionally gone and returns 410.
- Canonical logistics identity is `ComponentInstance`, not `Component`.
- Finished Goods requires authoritative FINAL QC PASS or USE-AS-IS eligibility.

## Known P1/P2 Debt

- Direct form-entry Playwright depth is incomplete for Receipt, BOM and QC.
- Background snapshot/query latency needs production-size attribution.
- Generated browser artifacts are currently committed and need a retention
  policy.
- Product READMEs and OpenAPI publication need release-quality replacement.

## Approval Record

| Role | Name | Decision | Timestamp | Evidence |
| --- | --- | --- | --- | --- |
| Engineering | Pending | NO-GO | - | Freeze audit |
| Security | Pending | NO-GO | - | Dependency remediation required |
| Database | Pending | NO-GO | - | Restore/PITR drill required |
| Operations | Pending | NO-GO | - | Deployment/monitoring required |
| Business owner | Pending | Pending | - | - |
