# Patch Notes

## [2026-04-01] - BTC Queue Restored + Cycle Spiral Navigation

### New
- Add Cycle Spiral BTC
- Add and Restored `BTC Queue` in the live module registry so the module is available again from the dashboard.
- Added a `24H AVG` reference in `BTC Queue` for the active metric, making it easier to compare the current value against the day average.
- Added source-status details to `BTC Queue`, including live/stale feed state, source snapshot time, and last sync time.
- Improved the bottom metadata strip title for `BTC Queue` to show `Bitcoin Mempool Queue` more clearly.

### Improvements
- `Cycle Spiral` now supports smoother zoom with wheel/trackpad and drag-to-pan navigation.
- `Cycle Spiral` interaction was refined so dragging does not accidentally trigger point clicks, and reset behavior is more reliable.
- Timestamp labels across updated views are now shorter and easier to scan.

### Fixes
- Fixed a registry wiring issue that could prevent `BTC Queue` from loading correctly.
- Fixed a stability issue in `Mempool Gauge` caused by invalid internal references.

---

## [2026-03-16] - House Analytics + Faster Charts

### New
- Added `S17: House Analytics`, a live comparison between US median home price and Bitcoin purchasing power.
- Migrated key charts like `Price Chart` and `BTC vs Gold` to `lightweight-charts` for a faster, lighter experience.
- Added touch scrub on mobile for supported charts, so moving your finger across the chart updates the values in real time.

### Improvements
- Improved mobile responsiveness in chart modules with better touch targets, clearer text scaling, and more stable chart height.

### Fixes
- Fixed layout and precision issues in `House Analytics`.
- Fixed a blank-screen regression in `Lightning Nodes Map`.