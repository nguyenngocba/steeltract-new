# SYSTEM.PRODUCTION.TRUST.2 - True DR and Signing Certification

Date: 2026-08-14  
Baseline commit: `0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4`  
Decision: **RC1 TRUST = NO-GO**

## Final Result

| P0 | Result |
| --- | --- |
| P0-1 True off-host backup / PITR | **FAIL** |
| P0-2 Production OIDC signing | **FAIL** |

This sprint did not change application, business, schema, migration or UI
source. Both remaining controls require infrastructure outside the current
host/repository worktree. No local container, local key or same-host directory
was accepted as production evidence.

## P0-1 - True Off-Host DR: FAIL

### Environment audit

The runtime exposes no configured external storage failure domain:

- no NFS, NFS4, CIFS, Ceph, GlusterFS, S3FS or rclone mount;
- no AWS, S3, MinIO, Azure, GCS or rclone endpoint/credential environment;
- no configured `MC_HOST_offhost` or `OFFHOST_BACKUP_PATH` value;
- PostgreSQL WAL `archive_command` in production Compose copies WAL under the
  PostgreSQL data volume on the same host;
- the only available Docker node is `localhost.localdomain`.

The repository contains encrypted upload/download tooling, but configuration
inputs are absent. Executing those tools without an independent destination
would only repeat the already-certified same-host test.

### Mandatory evidence matrix

| Requirement | Evidence | Result |
| --- | --- | --- |
| Independent storage/host | No remote mount or external object endpoint exists | FAIL |
| Encrypted base backup off-host | No destination/credential available | NOT RUN |
| Continuous encrypted WAL off-host | WAL remains same-host | NOT RUN |
| Backup visible after DB-host loss | Source host cannot be separated from storage | NOT RUN |
| Restore from off-host base backup | No off-host source | NOT RUN |
| Transaction A before target survives | Local TRUST.1 drill only | NOT ACCEPTED FOR THIS P0 |
| Transaction B after target excluded | Local TRUST.1 drill only | NOT ACCEPTED FOR THIS P0 |
| Row/catalog/migration parity | No off-host recovery database | NOT RUN |
| Application read smoke | No off-host recovery database | NOT RUN |

### Recovery metrics

| Metric | Production-certified value |
| --- | --- |
| RPO | **NOT CERTIFIED** |
| RTO | **NOT CERTIFIED** |
| Base-backup duration | **NOT CERTIFIED** |
| Restore duration | **NOT CERTIFIED** |
| WAL archive lag | **NOT CERTIFIED** |

The local 19-second WAL replay from TRUST.1 remains useful mechanical evidence,
but it is explicitly not true off-host durability evidence.

### Closure requirement

Operations must provide an independently administered storage endpoint and
credential through the runtime secret boundary. Certification must then make
the PostgreSQL host unavailable, recover exclusively from that endpoint and
capture target-time, row/catalog/migration parity and read-only application
evidence. Until then this P0 cannot pass.

## P0-2 - Production OIDC Signing: FAIL

### Approved repository audit

Remote:

```text
https://github.com/nguyenngocba/steeltract-new.git
active local branch: feature/shared-cockpit-foundation
local/remote branch head: 0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4
```

Read-only GitHub API evidence at certification time:

```text
Actions workflows: 0
Actions workflow runs: 0
release tags: 0
```

The release workflows are untracked local files:

```text
?? .github/workflows/production-trust.yml
?? .github/workflows/release-gate.yml
```

Neither file exists in the remote branch or `main`. GitHub therefore cannot
load the workflow, grant its `id-token: write` job an OIDC token or issue a
Sigstore certificate. This sprint explicitly forbids commit and push, so no
attempt was made to circumvent that control.

No authenticated `gh` session, GitHub token, AWS/S3 credential or production
registry credential is available. No credential or token was printed.

### Mandatory signing evidence matrix

| Requirement | Result |
| --- | --- |
| Real GitHub Actions workflow run | FAIL, no remote workflow/run |
| OIDC certificate identity | NOT ISSUED |
| Certificate issuer | NOT OBSERVED |
| Production registry | NOT CONFIGURED/CERTIFIED |
| Production immutable digest | NOT PUBLISHED |
| SPDX SBOM attached to release | NOT PUBLISHED |
| Production image scan | NOT RUN IN HOSTED PIPELINE |
| Keyless Cosign signature | NOT CREATED |
| Transparency/Rekor evidence | NOT CREATED |
| Verify by identity + issuer + digest | NOT RUN |
| Verify-first production deployment | NOT RUN |

The intended policy already implemented locally is:

```text
identity = https://github.com/nguyenngocba/steeltract-new/.github/workflows/production-trust.yml@refs/tags/<version>
issuer   = https://token.actions.githubusercontent.com
registry = ghcr.io/nguyenngocba/steeltract-new/*
```

It is configuration, not evidence. Therefore no production image digest is
reported as signed.

### Negative tests

| Test | Production authority result |
| --- | --- |
| Valid signed digest | NOT RUN |
| Unsigned digest rejected | NOT RUN |
| Wrong digest rejected | NOT RUN |
| Tampered image rejected | NOT RUN |
| Wrong certificate identity rejected | NOT RUN |
| Wrong issuer rejected | NOT RUN |
| Mutable `latest` rejected | Local policy PASS; production admission NOT RUN |

The local deploy gate rejects mutable tags, but local policy behavior cannot
replace a real Fulcio/Rekor/registry verification path.

### Closure requirement

The workflow must first be reviewed and committed to the approved repository by
an authorized release owner. An approved semantic release tag must execute the
workflow. Operations must retain the GitHub run URL, GHCR digests, SBOM and scan
artifacts, Fulcio certificate identity/issuer, Rekor transparency entry and all
positive/negative verification results. Private signing keys are not required
and must not be added.

## Regression

| Gate | Result |
| --- | --- |
| Backend tests | PASS, 98 suites / 334 tests |
| Frontend tests | PASS, 4 files / 12 tests |
| Backend typecheck | PASS |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS; existing Three.js chunk warning |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Migration status first probe | PASS, 93 migrations current |
| Migration status repeat | FAIL, database became unavailable |
| Runtime startup/health/readiness | NOT VERIFIED; database unavailable |
| Login/me/refresh/logout | Not rerun; TRUST.1 remains last passing evidence |
| Dependency audit | PASS, Critical 0 / High 0 |
| Secret scan | PASS, 0 candidates |
| Backend image scan | PASS, Critical 0 / High 0 |
| Frontend image scan | PASS, Critical 0 / High 0 |
| Backend SPDX SHA-256 | `52a7423ffc3e299bd90222ead87d012f10f27db050ad952c8062ff339b63e79a` |
| Frontend SPDX SHA-256 | `434c82fd3cb6c7939231415198eb47f597f155782f822751b120f685700a2b31` |
| `git diff --check` | PASS |
| Staged files / commit | none |

The database availability change was recorded rather than hidden. No database
was reset, restored, deleted or migrated to make the runtime row appear green.
No application source changed in TRUST.2, so the passing TRUST.1 auth evidence
is not invalidated, but current runtime availability is not certified.

## Files Changed

- `docs/audits/system-production-trust2-final-closure.md`
- mandatory AI-state documentation only

## Decision

**RC1 TRUST = NO-GO.**

P0-1 and P0-2 both fail. `SYSTEM.FINAL.1` must not start. The next action is not
another code-hardening sprint: it is an operations/release-owner session with a
real off-host storage endpoint and authority to publish the approved GitHub
workflow/tag.
