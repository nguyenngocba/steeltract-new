# SYSTEM.PRODUCTION.TRUST.1 - Production Trust Closure

Date: 2026-08-14  
Baseline commit: `0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4`  
Decision: **NO-GO**

## Executive Result

| Trust boundary | Result |
| --- | --- |
| P0-1 Authentication trust | **PASS** |
| P0-2 True off-host backup and PITR | **FAIL** |
| P0-3 Production signing authority | **FAIL** |
| RC1 trust closure | **NO-GO** |

Admin authentication is now certified through the canonical administration
service, REST and a real Playwright browser. PostgreSQL WAL replay and a
timestamp-targeted recovery also pass in a disposable environment.

The environment contains only one Docker node. It cannot prove survival of the
loss of that host, so encrypted same-host artifacts are not classified as
off-host. The repository now contains a GitHub OIDC/Sigstore keyless release
pipeline and an identity-bound deploy verification policy, but this local
environment cannot issue a hosted OIDC certificate or publish to an approved
production registry. Those two external trust controls remain P0.

No password, token, signing secret or private key is included in this report.

## P0-1 - Authentication Trust: PASS

### Canonical credential operation

The isolated production-like database was restored from the release backup.
The existing active `admin` user was updated by
`SystemUserAdminService.resetPassword()` through a Nest application context.
No password hash was edited directly. The service used its existing bcrypt,
refresh-token revocation and ActivityLog transaction.

Evidence after reset:

```text
admin status: ACTIVE
role: admin
effective permissions: 93
active refresh tokens before reset: 81
active refresh tokens after reset: 0
```

A restricted `warehouse_demo` account was prepared through the same service
for the 403 check. Credentials were generated under `/tmp` with restrictive
permissions and were never written to source or report output.

### REST evidence

| Check | Result |
| --- | --- |
| `POST /api/auth/login` with admin credential | 201 |
| `GET /api/auth/me` | 200, role `admin`, 93 permissions |
| Refresh token rotation | 201 |
| Reuse rotated refresh token | 401 |
| Authenticated logout | 201 |
| Refresh token after logout | 401 |
| Incorrect password | 401 |
| Anonymous protected endpoint | 401 |
| Restricted Warehouse role on admin endpoint | 403 |
| Admin on same endpoint | 200 |

Access JWTs are stateless and remain valid until their short expiry after
logout; the canonical logout contract revokes the refresh-token session. This
behavior is reported explicitly rather than claiming immediate access-token
revocation.

### Browser evidence and repair

Playwright used the HTTPS production-like edge, entered real credentials and
observed the actual network requests:

```text
login=201
authenticatedRoute=true
logout=201
refreshAfterLogout=401
localTokensCleared=true
pageErrors=0
```

The browser audit found one release blocker: `AppTopbar` previously removed
only local Zustand/token state and never called `POST /auth/logout`. The logout
button now calls the existing shared auth API with the refresh token and clears
local state in `finally`. No backend/auth contract was changed.

Evidence screenshots were stored only in the disposable certification folder
and are removed with its credentials after report completion.

## P0-2 - True Off-Host Backup and PITR: FAIL

### What passed

The existing backup tools provide AES-256 symmetric encryption, plaintext and
encrypted SHA-256 manifests, external passphrase-file input and object upload.
The prior encrypted round-trip preserved byte parity. The current WAL/PITR
drill was rerun against disposable PostgreSQL 17 source and recovery clusters:

```text
pitr=PASS
recovered_rows=1,2
excluded_row=3
wal_files=5
target_time=2026-08-14 07:22:22.014774+00
local drill duration=19 seconds
test archive_timeout=5 seconds
```

The post-target transaction was absent after recovery. This proves base backup,
WAL archive and timestamp replay mechanics without mutating the SteelTrack
database.

### Why the P0 remains open

Docker reports one node only:

```text
node name=localhost.localdomain
node id=abd88bf4-6897-4985-86bc-35203ae62f33
storage driver=overlayfs
docker root=/var/lib/docker
```

PostgreSQL, certification object artifacts and WAL drill artifacts all reside
on that physical host. A second container or Docker volume would preserve the
same failure domain and therefore was not used as false off-host evidence.

| Production recovery metric | Certified value |
| --- | --- |
| Off-host base backup | **NOT CERTIFIED** |
| Off-host continuous WAL | **NOT CERTIFIED** |
| Host-loss simulation | **NOT CERTIFIED** |
| Production RPO | **NOT CERTIFIED** |
| Production RTO | **NOT CERTIFIED** |
| Production backup frequency | **NOT CONFIGURED/CERTIFIED** |
| Production WAL archive interval | **NOT CONFIGURED/CERTIFIED** |
| Local disposable PITR duration | 19 seconds |

Closing this P0 requires an independently administered object store/site,
immutable retention and access policy, then a restore after making the source
host unavailable. Row/catalog parity and application read-only smoke must be
captured from that destination.

## P0-3 - Production Image Signing Authority: FAIL

### Architecture implemented

`.github/workflows/production-trust.yml` implements the production model:

```text
source test/typecheck/build/dependency gate
  -> immutable GHCR digests
  -> SPDX SBOM
  -> Critical/High vulnerability gate
  -> Sigstore keyless signing with GitHub OIDC
  -> identity/issuer verification
  -> deployment verification policy
```

The workflow has only `contents: read`, `packages: write` and `id-token: write`.
No private signing key exists in the repository. The certificate trust policy
is exact:

```text
identity: https://github.com/<owner>/<repo>/.github/workflows/production-trust.yml@refs/tags/<version>
issuer:   https://token.actions.githubusercontent.com
```

`verify-images.sh` supports this exact keyless identity/issuer pair while
retaining the existing operations-owned public-key mode for KMS/HSM use.
`deploy-verified.sh` verifies migration, backend and frontend signatures before
Compose and requires digest references.

### Negative policy tests

The hosted workflow contains mandatory rejection tests:

| Case | Required result |
| --- | --- |
| Unsigned frontend digest before signing | REJECT |
| Backend repository with migration digest | REJECT |
| Valid image with wrong workflow identity | REJECT |
| Mutable tag | REJECT |
| Three valid signed immutable digests | ACCEPT |

The local mutable-tag test exits 2 before registry access:

```text
Image must be an immutable digest reference
mutable_tag_rejected=true
```

### Why the P0 remains open

This machine has no GitHub hosted OIDC token, approved GHCR production package
or KMS/HSM authority. The workflow therefore has not produced a Fulcio
certificate/transparency record for these image digests, and its negative
registry tests have not executed in the production trust boundary. Repository
implementation is not substituted for authority evidence.

Current scanned local images are non-root but unsigned by the new authority:

| Image | Local image ID | User | Critical / High |
| --- | --- | --- | ---: |
| Backend | `sha256:2e242f83...` | `node` | 0 / 0 |
| Migration | `sha256:97b957cf...` | `node` | not rescanned separately |
| Frontend with logout repair | `sha256:1b28e3cf...` | `101` | 0 / 0 |

Backend and frontend SPDX SHA-256 values are respectively
`42d3e83e0433b802575c3cd5f22950f21174817e62866f4355ddf5c96f1632c7`
and
`760edcff5b3b617c00cf397c87583c7e7b8a570f275e42430b79b0687a820bcf`.

## Final Security Regression

| Gate | Result |
| --- | --- |
| Backend tests | PASS, 98 suites / 334 tests |
| Frontend tests | PASS, 4 files / 12 tests |
| Backend typecheck | PASS |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS; existing Three.js chunk warning |
| Prisma validate / generate | PASS |
| Migration status | PASS, 93 current |
| Production dependency audit | PASS, Critical 0 / High 0 |
| Tracked secret scan | PASS, 0 candidates |
| Backend/frontend image scan | PASS, Critical 0 / High 0 |
| SPDX SBOM | PASS |
| HTTPS live / ready / startup | 200 / 200 / 200 |
| Database/storage readiness | PASS |
| HSTS/CSP/nosniff/frame policy | PASS |
| Auth 201/200/refresh/logout/401/403 | PASS |
| Mutable image rejection | PASS |
| `git diff --check` | PASS |
| Staged files / commit | none |

Prometheus, seven alert rules and Alertmanager's disposable receiver were
certified in `SYSTEM.PRODUCTION.CERT.1`; no observability code changed in this
sprint. The operations-owned production receiver remains an environment gate.
Backend's 1,404 legacy lint errors were not expanded into an unrelated refactor,
as required by this sprint.

## Files Changed by This Sprint

- `apps/frontend/src/app/shell/topbar/AppTopbar.tsx`
- `.github/workflows/production-trust.yml`
- `scripts/release/verify-images.sh`
- `scripts/release/deploy-verified.sh`
- `deployment/.env.production.example`
- `docs/release/RC1_DEPLOYMENT_GUIDE.md`
- this report and mandatory AI-state documentation

No backend source, Prisma schema, migration or business workflow was changed.

## Remaining P0

1. Send encrypted base backup and continuous WAL to a physically independent,
   access-controlled immutable destination; perform host-loss restore/PITR and
   record production RPO/RTO.
2. Run the production trust workflow on an approved release tag/registry,
   retain Fulcio/Rekor evidence and prove all four positive/negative admission
   checks in the deployment environment.

## Decision

**RC1 TRUST CLOSURE = NO-GO.**

P0 is not zero. The phrase `PRODUCTION READY` must not be used for this build.
Do not open UI or ERP feature work; the next work is restricted to the two
external trust-environment certifications above.
