# Enterprise Design Principles Inferred From Inventory

Status: IMPLEMENTED

## Principle 1: Operational Content First

Every workspace should start with the state of the operation, not page
description. The application shell already provides location and navigation.
Module pages should show work.

## Principle 2: KPI Before Explanation

KPIs answer "what needs attention?" Charts then explain distribution, movement
or trend. This ordering lowers cognitive load.

## Principle 3: Filters Belong Near The Table

Filters are not decorative controls. They are part of table operation and must
stay close to the data they change.

## Principle 4: Table Is The Workspace Anchor

For ERP operators, the primary table is where decisions happen. Charts, summary
cards and quick actions support the table.

## Principle 5: Side Analytics Must Be Compact

Right-side charts should summarize status, risk and recent activity. They
should not push the table down or create a second dashboard inside the page.

## Principle 6: Drawers Preserve Context

Detail and mutation should avoid route changes where possible. Drawer/modal
patterns let operators inspect, act and return to the same table state.

## Principle 7: Density Is A Feature

Inventory works because it is compact but ordered. Production and Components
should reuse that density with their own domain facts instead of adding hero
copy or large cards.

## Principle 8: No False Data

Where a module lacks a field, the UI must show a truthful empty or limitation
state. Design maturity comes from honest data boundaries, not mock widgets.

