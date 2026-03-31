

## Plan: Fix Overlapping Calendar Cards

### Problem
The overlap detection in `calculateOverlapLayout` uses **real end times** (`endMinutes`) to determine if bookings overlap. But `calculateBookingPosition` enforces a **minimum visual height of 40px** (`Math.max(..., 40)`). So a 15-minute booking (30px real) gets rendered at 40px, visually overlapping the next booking even though the algorithm thinks they don't overlap.

### Solution
Use the **visual end time** (accounting for the minimum height) in the overlap detection, not just the real end time.

### Changes — 1 file

**`src/components/admin/LocalCalendarCRM.tsx`**

1. In `calculateBookingPosition` (line ~578), also return a `visualEndMinutes` that accounts for the minimum height:
   ```ts
   const visualHeight = Math.max(durationMinutes * PIXELS_PER_MINUTE, 40);
   const visualEndMinutes = startMinutesFromStart + (visualHeight / PIXELS_PER_MINUTE);
   return { top, height: visualHeight, startMinutes, endMinutes, visualEndMinutes };
   ```

2. In `calculateOverlapLayout` (lines ~602, 604, 625), use `visualEndMinutes` instead of `endMinutes` for group detection and column placement:
   - Line 602: `pos.startMinutes < groupEnd` stays the same
   - Line 604: `groupEnd = Math.max(groupEnd, pos.visualEndMinutes)`
   - Line 625: `pos.startMinutes >= lastPos.visualEndMinutes`

This ensures that if a short booking is visually stretched, subsequent bookings that would visually collide are correctly placed in separate columns.

