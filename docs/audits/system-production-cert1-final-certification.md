# SYSTEM.PRODUCTION.CERT.1 - Final Production Certification

Date: 2026-08-14  
Baseline commit: `0c1e19f06b920bc6ad81b50fe7193bc5d258d5b4`  
Decision: **NO-GO**

## Executive Result

The login 404 is repaired at the canonical `/api` edge contract. Current
images build, scan, sign and verify by immutable digest; a verify-first deploy
entrypoint rejects mutable image tags. Encrypted backup round-trip, PostgreSQL
17 point-in-time recovery and the complete Prometheus -> Alertmanager -> test
receiver path pass in disposable certification environments.

Production promotion is still blocked. The restored runtime does not have a
matching approved admin credential, the object store used for certification is
on the same Docker host and continuous WAL off-host custody is not configured,
and the signing authority/registry are disposable local resources with the
transparency log disabled. The sprint requires an unconditional decision, so
these unresolved P0 controls produce **NO-GO**.

## 1. Login 404 Root Cause

The frontend API client intentionally defaults to same-origin `/api` and calls
`POST /auth/login`. Nginx production correctly rewrites `/api/auth/login` to
backend `/auth/login`, and the Nest controller is registered at `/auth/login`.

The failure was specific to the normal Vite runtime: `apps/frontend/vite.config.ts`
had no `/api` proxy, while `VITE_API_URL` was not loaded from the files outside
the frontend Vite root. Vite therefore handled the request as a static path and
returned an empty HTTP 404 before Nest was reached.

Before fix evidence:

```text
POST http://127.0.0.1:4173/api/auth/login -> 404
```

## 2. Login Fix

The Vite server now proxies `/api` to
`STEELTRACK_API_PROXY_TARGET` (default `http://127.0.0.1:3000`) and strips only
the `/api` edge prefix. `/socket.io` uses the same target with WebSocket proxy
enabled. This matches the existing production Nginx contract; no alternate
auth endpoint or backend route was introduced.

Runtime route evidence after the fix:

| Boundary | Request | Result |
| --- | --- | --- |
| Backend | `GET /health/live` | 200 |
| Backend | `POST /auth/login`, invalid/incomplete payload | 400/401, never 404 |
| Production edge | `GET /health/live` | 200 |
| Production edge | `POST /api/auth/login`, incomplete payload | 400, never 404 |
| Browser | `/login` | 200 |
| Browser network | `POST /api/auth/login` | 400, never 404 |

Headless Chromium captured the request URL, POST method and status. Its
temporary screenshot was securely removed with the disposable certification
secrets and restored data after evidence collection.

## 3. Login Runtime Evidence

The restored database contains an active `admin` account with one role and all
93 current permissions. The approved runtime credential file no longer matches
the restored password, so login returns 401. Authentication was not bypassed,
the hash was not changed directly, and no password was copied from historical
documentation.

The following mandatory success checks remain **NOT VERIFIED**:

- successful admin login and issued access/refresh tokens;
- `/auth/me` identity, role and permission response;
- refresh token rotation;
- authenticated logout and old-token rejection;
- authenticated browser redirect to the application;
- role-level 403 using the current production runtime identities.

Anonymous validation, malformed login validation and invalid credentials still
return controlled 400/401 responses. Browser Network no longer returns 404.

## 4. Image Signing Evidence

Current worktree images were rebuilt and scanned before signing.

| Image | Immutable digest | Critical / High | Signature |
| --- | --- | ---: | --- |
| Backend | `sha256:2e242f83bff46050bb83f4e2475530279d81b68434035bcae6de1574104eae2f` | 0 / 0 | verified |
| Migration | `sha256:97b957cfc2eea55eb359e7338d233e288290fae0bf55c7425e283e31355bbfc0` | one-shot image | verified |
| Frontend | `sha256:4a75329f97f114f679de64b63943afd26bf44f98c47785a5d49d28e95d391cdf` | 0 / 0 | verified |

Cosign `v2.5.3` was invoked from its pinned digest. The private key and password
were generated under `/tmp/steeltrack-cert1/cosign` with restrictive
permissions and were never added to the repository. `sign-images.sh` supports
a password file; `verify-images.sh` refuses non-digest references.

`deploy-verified.sh` requires all three digest references, verifies each
signature, and only then invokes Compose. A mutable `latest` input exits 2.
The disposable runtime was deployed through this gate; Docker reported the
same signed backend/frontend digests healthy and migration exited 0.

Certification used a local registry, a disposable key and
`--tlog-upload=false`. This proves the implementation, not production key
custody, registry durability or transparency-log trust.

## 5. Backup Evidence

The existing PostgreSQL custom backup was encrypted with GPG AES-256, uploaded
with its plaintext and encrypted SHA-256 manifests, downloaded and decrypted.

```text
encrypted object size: 1,268,008 bytes
restored dump size:    1,743,473 bytes
encrypted checksum:    PASS
decrypted byte parity: PASS
script restore parity: PASS
```

`encrypted-offhost-backup.sh` and
`restore-encrypted-offhost-backup.sh` use a pinned MinIO client digest and read
the passphrase from an external file. No key or credential value is logged.

The certification MinIO service is separate from PostgreSQL but runs on the
same physical Docker host. It does not satisfy site-loss/off-host custody.
Production object retention, immutable bucket policy and continuous encrypted
WAL upload are also not proven.

## 6. PITR Evidence

`certify-pitr.sh` created disposable PostgreSQL 17 source/recovery clusters,
enabled WAL archive, took `pg_basebackup`, wrote a recoverable row, selected a
target timestamp, wrote a post-target row, archived WAL and recovered from the
base backup.

```text
pitr=PASS
recovered_rows=1,2
excluded_row=3
wal_files=5
target_time=2026-08-14 06:08:53.140749+00
```

The recovery proves timestamp selection and WAL replay without touching the
application database. It does not prove off-host WAL availability after loss
of the production host.

## 7. Alertmanager Evidence

Configuration checks:

```text
promtool config:  PASS
promtool rules:   PASS, 7 rules
amtool config:    PASS, 1 receiver
Prometheus target backend: up
```

The backend certification container was stopped for longer than the real rule
duration. Evidence:

```text
Prometheus: SteelTrackApiUnavailable state=firing
Alertmanager: receiver=steeltrack-on-call state=active
Test receiver: alerts_received=[SteelTrackApiUnavailable]
Backend restart: healthy
```

Rules cover API, PostgreSQL, projection, snapshot and worker failures, high 5xx
rate and high average latency. Production Compose now requires
`STEELTRACK_ALERTMANAGER_CONFIG_FILE`; it no longer silently binds production
to the repository test receiver. Operations must provide the approved on-call
receiver config. The disposable receiver is certification-only.

## 8. Security Evidence

| Gate | Result |
| --- | --- |
| Production dependency audit | PASS, Critical 0 / High 0 |
| Tracked secret scan | PASS, 0 candidates |
| Docker context secret exclusions | PASS |
| Backend image Trivy | PASS, Critical 0 / High 0 |
| Frontend image Trivy | PASS, Critical 0 / High 0 |
| Backend/frontend SPDX SBOM | PASS |
| TLS edge health | PASS |
| Readiness database/storage | PASS |
| Mutable image deployment rejection | PASS |

Existing Release.1 evidence for HSTS/CSP/security headers and login rate
limiting remains valid; no authentication or business code changed here.

## 9. Full Regression Evidence

| Verification | Result |
| --- | --- |
| Backend tests | PASS, 98 suites / 334 tests |
| Frontend tests | PASS, 4 files / 12 tests |
| Backend typecheck | PASS |
| Frontend typecheck | PASS |
| Backend build | PASS |
| Frontend build | PASS; existing 964 KB Three.js warning |
| Frontend ESLint | PASS with 384 existing warnings |
| Backend ESLint | FAIL, 1,404 errors / 103 warnings (existing debt/config) |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migration status | PASS, 93 current |
| Docker production images | PASS |
| Signed-digest runtime health | PASS |
| `git diff --check` | PASS at final verification |
| Staged files / commit | none |

The first parallel pnpm attempt produced a package-manager state-file race.
All affected gates were rerun sequentially and passed; it was not an
application failure.

## 10. Remaining P0 / P1 / P2

### P0

1. Provide a valid approved admin secret and complete successful login,
   `/auth/me`, permission, refresh, logout, 401/403 and browser certification.
2. Send encrypted full backups and continuous WAL archives to an actual
   off-host failure domain; enforce retention/immutability and rerun restore/PITR
   from that destination.
3. Publish images to the approved durable registry and establish production
   Cosign trust using KMS/HSM or approved keyless OIDC/transparency-log policy;
   rerun verify-first deployment with that authority.

### P1

1. Repair backend ESLint project-service configuration and the legacy source
   findings until the non-mutating lint command passes.
2. Run the release workflow in hosted CI and retain SBOM, scan and signature
   evidence.
3. Execute a 24-hour staging soak and peak-load test.
4. Install and test the operations-owned Alertmanager receiver config in the
   target production environment.

### P2

1. Reduce the 964 KB React Three chunk and establish a frontend lint warning
   budget.
2. Extend centralized log shipping/retention and image provenance attestations.

## 11. Production Decision

**NO-GO**.

The login route defect is fixed and repository-controlled certification tools
are functional, but P0 is not zero. SteelTrack must not be promoted as
`RC1 PRODUCTION READY` until the three P0 items above have real target-environment
evidence. This is not a conditional GO.
