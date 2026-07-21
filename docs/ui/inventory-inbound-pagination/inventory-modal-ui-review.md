# Inventory Modal UI Review

## Issue

The inbound full-list modal rendered every filtered transaction row at once. Large result sets could make the modal slower and harder to scan.

## Result

The modal now behaves like other cockpit lists:

- bounded visible rows;
- shared pagination footer;
- page-size selector;
- full-list count remains visible in the header;
- current filters and sorting remain unchanged.

## Non-Changes

- No backend changes.
- No API changes.
- No query changes.
- No business logic changes.
- No Inventory domain changes.
