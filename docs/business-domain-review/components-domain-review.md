# Components Domain Review

Status: IMPLEMENTED

## Overview

Current purpose: component lifecycle cockpit.

Business value: shows components in fabrication, storage, QC wait, ready to
ship and shipped states.

Decision supported: decide whether the bottleneck is fabrication, QC, yard
readiness or project distribution.

Data source used: existing Components overview/dashboard rows, status counts,
location, project and timeline actions.

Improvements applied:

- Replaced generic/placeholder QC failure metric with derived QC wait count.
- Added lifecycle language: fabrication, storage, ready to ship and shipped.
- Added project distribution and queue cards in the prior cockpit pass.

## Components List

Current purpose: full component lifecycle registry.

Business value: lists component code, profile, type, project, work order,
progress, material readiness, current location, status and weight.

Decision supported: locate a component, inspect its current lifecycle state and
open the drawer for dependencies.

Data source used: existing Components workspace read model.

Improvements applied:

- Renamed generic KPI labels into component lifecycle language.
- Kept filter, pagination and drawer behavior unchanged.

## Internal QC

Current purpose: component QC queue.

Business value: surfaces components that have passed, are currently being
checked or still lack a QC fact.

Decision supported: identify what can move to shipping and what remains in QC.

Data source used: existing component lifecycle status and location fields.

Improvements applied:

- Replaced hardcoded `0` NCR-style metric with ready-to-ship count derived from
  existing lifecycle states.
- Renamed the table to a QC queue rather than a generic list.

## Component Reports

Current purpose: component lifecycle reporting.

Business value: summarizes fabrication, stock, ready-to-ship, shipped and
recent lifecycle changes.

Decision supported: understand lifecycle distribution and recent movement.

Data source used: existing Components dashboard, overview and history queries.

Improvements applied:

- Replaced generic report labels with steel-fabrication lifecycle language.
- Added QC wait as a derived report statistic from existing rows.

