# Component API Compatibility Report

Date: 2026-07-17  
Status: **PASS**

The existing controller remains mounted at `/components`; its create, update,
delivery, installation, costing, timeline and read-model contracts are
unchanged. RFC003 registers a separate `/components/commands` controller and
does not redirect legacy requests or infer canonical lifecycle fields from
legacy `ComponentStatus`.

Compatibility tests verify that legacy `POST /components` remains registered
while Revision Release is available only under the additive command namespace.
No frontend client was changed.

The two write paths are intentionally distinct during rollout:

- Legacy endpoints preserve current operator behavior and compatibility data.
- Command endpoints are the sole public entry point for new AD-016 aggregate
  lifecycle operations.

Legacy retirement requires route-usage evidence and an explicit adoption
policy. It is not part of RFC003.
