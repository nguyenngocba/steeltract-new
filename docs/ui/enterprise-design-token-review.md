# Enterprise Design Token Review

UI001 retained the existing token sources:

- `COCKPIT_HEIGHTS` and cockpit shells for KPI/chart/table dimensions;
- `modulePanel`, `moduleInput`, `moduleMutedButton`, `modulePrimaryButton` for
  operational surfaces and controls;
- Inventory compatibility tokens only where an approved Inventory-derived page
  already consumes them;
- the established slate/cyan/blue workspace palette and compact typography.

No new palette, spacing scale, radius system, typography scale or shadow
language was introduced. `EnterpriseWorkspace` composes existing classes and
does not become a second token source.

Future changes must update tokens at their existing owner instead of adding
page-local copies.
