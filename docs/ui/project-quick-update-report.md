# Project Quick Update Report

Sprint: 40PROJ.8
Date: 2026-06-30

## Objective

Add a Simple Mode foundation for the Projects `Tiến độ` workspace.

## UI

The Progress workspace now includes a Quick Update panel beside task actions.

Users update:

- installed component count
- used material quantity
- QC passed
- incident flag
- field note

The UI suggests:

- progress increase
- related task materials
- related task components
- returnable material quantity

## Derived Updates

Submitting Quick Update sends a normal Project WBS update payload and lets the existing ProjectTask API persist:

- progress
- status
- actual start/finish
- inspection status
- updated material used/remaining values
- installed component status
- field note in task description

## Simple vs Advanced

Implemented foundation:

- Simple Mode entry point: Quick Update panel.
- Advanced Mode still available through existing task edit/detail/actions.

## Limitations

- Smart Return currently shows an operator-facing message and does not execute a task-level return workflow.
- Component install count applies to the first suggested component rows; a dedicated picker should replace this in the next workflow sprint.
- Full Site Mode tab is not yet implemented.
