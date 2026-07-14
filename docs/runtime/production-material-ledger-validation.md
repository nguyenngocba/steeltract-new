# Production Material Ledger Validation

Date: 2026-07-11

## Ledger Semantics

| Event type | Quantity sign/meaning | Stock posting |
|---|---|---|
| `RESERVE` | Positive allocated quantity | None |
| `RELEASE` | Negative unissued reserved quantity | None |
| `ISSUE` | Positive issued quantity | Inventory outbound |
| `CONSUME` | Positive consumed quantity only | None |
| `RETURN` | Positive returned quantity | Inventory return |

Draft Reservation writes neither ledger nor Outbox. Manual Issue, Draft-to-Issued,
and Reservation Issue now all write `ISSUE`. Consumption excludes Scrap from its
ledger allocation. Return validation continues to enforce the existing equation:

```text
issued = consumed + scrap + returned + remaining
```

Focused automated validation passed for Draft semantics, atomic Issue, consumed-only
ledger, Inventory posting ownership, and lifecycle compatibility.

