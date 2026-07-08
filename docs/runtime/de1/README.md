# DE.1 EXPLAIN Artifacts

This folder stores EPIC104 / Sprint DE.1 measurement files.

- `explain-before.txt`: baseline `EXPLAIN ANALYZE` captured before the index migration.
- `explain-after.txt`: normal planner `EXPLAIN ANALYZE` captured after the index migration.
- `explain-after-index-usage.txt`: forced-index usability check with `enable_seqscan = off`.
- `explain-bucket-exact-after.txt`: exact stock bucket validation for `inventory_location_stocks_item_bucket_idx`.

The active database is small, so normal planner output may prefer sequential scans. Forced-index checks are included only to prove the new indexes are valid planner paths for larger datasets.
