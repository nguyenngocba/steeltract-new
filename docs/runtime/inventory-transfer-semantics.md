# Inventory Transfer Semantics

Date: 2026-07-14  
Contract impact: **NONE**

## Approved Foundation

For every distinct material in a transfer request:

1. Exactly one negative source line is required.
2. Exactly one positive destination line is required.
3. Absolute source quantity must equal destination quantity.
4. Source and destination bucket identities must differ.
5. Materials retain first-seen order; each pair is persisted source first,
   destination second.

The line location remains authoritative. Header warehouse/zone fields are not
used to reinterpret mixed-location lines.

## Duplicate and Ambiguous Input

- Duplicate non-transfer buckets are aggregated for stock validation and
  mutation while original lines remain in the ledger.
- A transfer containing two source lines or two destination lines for the same
  material is rejected. Automatically pairing by array position would create an
  undocumented business rule and unstable historical meaning.
- Multiple transfer pairs for one material require an explicit pair identifier
  or stable line number. RFC-001 identifies that as a separately approved
  additive extension; EPIC181 creates no schema or API change.

## Compatibility

Existing two-line transfer requests remain valid. A transfer may now carry many
materials as repeated, deterministic source/destination pairs. Snapshot,
Outbox, API response and workflow semantics remain unchanged.
