# Drawer Standardization Report

Date: 2026-07-01

## Goal

Standardize SteelTrack detail popups around the Inventory Material Detail UX: right-side drawer, full-height desktop, sticky header, independently scrollable body, and mobile full-width behavior.

## Shared Component

Updated `ModuleDetailDrawer` with reusable sizes:

* `sm`: `45vw`, `minWidth 720px`, `maxWidth 820px`
* `md`: `58vw`, `minWidth 900px`, `maxWidth 1180px`
* `lg`: `62vw`, `minWidth 980px`, `maxWidth 1280px`

Mobile uses `100vw` via `w-screen`.

Existing `widthClass` remains supported for backward compatibility. New or migrated drawers should prefer `size`.

## Migrated Drawers

* Inventory Material Detail: `size="lg"`
* Project Detail: `size="lg"`
* Inventory Return Request Detail: `size="sm"`
* Project Pending Return Detail: `size="sm"`

## UX Rules

* Desktop drawers open from the right.
* Drawer header is sticky through the shared shell.
* Drawer body scrolls independently.
* No full-screen desktop detail drawer in the migrated flows.
* No fake data was introduced.

## Remaining Work

Some older module drawers still pass custom `widthClass`. They remain compatible but should be migrated gradually to `size="sm|md|lg"` during future UI cleanup.
