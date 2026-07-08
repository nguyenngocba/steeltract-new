# Snapshot Confidence Report

Date: 2026-07-08

## Rule

Snapshot confidence is rule-based.

Inputs:

- snapshot `updatedAt`
- configured max age seconds

Outputs:

- `100`: fresh snapshot
- `90..1`: aging snapshot
- `0`: missing or stale snapshot

## Formula

Fresh threshold:

```text
ageSeconds <= max(30, maxAgeSeconds * 0.1)
=> confidence = 100
```

Stale threshold:

```text
ageSeconds >= maxAgeSeconds
=> confidence = 0
```

Middle range:

```text
confidence = round(90 * (1 - ageSeconds / maxAgeSeconds))
```

## Runtime Metrics

The runtime metrics service records:

- individual snapshot ages
- individual confidence samples
- average age
- average confidence

These values are exposed through `/performance/metrics`.

