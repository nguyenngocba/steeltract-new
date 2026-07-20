# Production Review

Status: IMPLEMENTED

## Five-Second Questions

Production Overview now answers:

- What is running now?
- What is delayed?
- What is blocked by material?
- Which orders need attention today?
- Which work orders are pending in the top queue?

## Improvements

- Increased visual weight of progress/material distribution cards.
- Added `Cần chú ý hôm nay` using existing delayed, shortage and progress data.
- Kept the main order card as Top N with `Xem tất cả` to `/production/orders`.
- Moved recent activity into supporting context instead of making it the only
  right-side business signal.

No fake data or new backend source was introduced.

