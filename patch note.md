# Patch Notes

## [2026-03-16] — Charts Performance + Maps Cleanup

### New
- Migrated S02 (Price Chart) from Recharts to `lightweight-charts` (Canvas renderer). Bundle size: 172 kB → 10.9 kB. Shared library chunk between S02 and S15 downloaded once by the browser.
- Migrated S15 (BTC vs Gold) from Recharts to `lightweight-charts` with two simultaneous AreaSeries. BTC orange `#F7931A`, Gold silver `rgba(214,214,214,0.92)`, transparent grid, dual crosshair markers.
- Added touch scrub to S02 and S15: sliding a finger across the chart updates the price/values in the header in real time, identical to mouse hover behavior.
- Added responsive improvements to S02 and S15: `min-h-[44px]` touch targets on all interactive controls, `clamp()` font sizes from 375px to 1440px, stat cards always in a horizontal row, chart minimum height of 140px so it never collapses in landscape mode.
- Added Rule 22 (Zero Dead Code) to `.claude/agent-runtime/AGENTS.md`: any discarded spike must have all associated files deleted in the same revert commit. No `// kept as reference` files in main.
- Added Web Worker failure postmortem and `worker-react-init-order` rule to `.claude/skills/vercel-react-best-practices/AGENTS.md`.

### Fixes
- Fixed S07 (Lightning Nodes Map) blank screen regression caused by a Web Worker spike. Reverted to original `useMemo` chain. Module fully operational.

### Removed
- Removed `src/features/modules/live/s07DataWorker.js` (discarded Web Worker spike, never active in production).
- Removed all `.tmp-*.log` diagnostic files from the project root.

### Pending (deferred by owner)
- `spike/s27-backend-trends` — extend Express for real Google Trends data in S27. Deferred.
- `spike/s24-s29-echarts` — blocked until S24 and S29 have real data.

---

## [2026-03-14]

### New
- Added Economy / Normal / Priority fee tiles row in S05 (Long-Term Mempool Trend) visible on all screen sizes with large decimal values.
- Added ℹ info icon button in the title bar of S06, S07, S08 map modules (mobile/tablet only) to toggle the data-info panel, replacing the old footer text button.

### Fixes
- Fixed S31 (Satoshi Whitepaper) not being scrollable on mobile/tablet by enabling `responsiveScroll` in the module registry.
- Fixed fullscreen/maximize button in ModulePage now hidden on mobile and tablet, shown only on desktop.
- Fixed S12 (Address Distribution) mobile cards not scrollable — added `overflow-y-auto` to the card list; src info moved inside the scroll area so it appears only when the user scrolls down.
- Fixed S13 (Wealth Pyramid) and S12 src info boxes that were floating in the header — moved both to a bottom strip matching the SharedMetaBottomStrip style.
- Fixed S14 (Global Assets Treemap) percentage grid cards inside StackedBar — removed the redundant duplicate grid below the bar.
- Fixed S05 fee header bar inline chips (ECO/30M/FAST) removed to avoid duplication with the new large fee tiles row.
- Fixed donate modal backdrop from `bg-black/70 backdrop-blur-sm` to solid `bg-black/90 z-[9999]` so the QR code no longer blends with map backgrounds.
- Fixed S05 fee tile values to display with 2 decimal places instead of rounded integers.

### Removed
- Removed inline ECO/30M/FAST fee indicator chips from S05 header bar (replaced by the full fee tiles row below).

---

## New

- Added a stronger shared knowledge-vault workflow under `.claude/` so project rules, skills, and maintenance notes are organized more clearly for future development.
- Added stronger security improvements across the project so the app behaves in a safer and more reliable way during normal use and deployment.
- Added local music to the play button in the bottom footer, so it now uses the project's own audio files instead of external YouTube links.
- Added automatic music mood switching based on Bitcoin 24h performance:
- Bullish music plays when Bitcoin is up **4% or more** in 24 hours.
- Bearish music plays when Bitcoin is down **2% or more** in 24 hours.
- Sideways music plays when the market stays between those two ranges.
- Added startup warm-up for key live-data modules so the first real dashboard data is prepared earlier instead of waiting for cold requests.
- Added shared composed-cache preparation for heavy live views like BTC vs Gold and U.S. National Debt to reduce first-load waiting time.
- Added scraper readiness checks and stronger snapshot reuse so real upstream data can be served faster after restarts.
- Added clearer decimal precision in per-capita rankings for node, Lightning, and business density maps so nearby countries no longer look falsely tied.
- Added a new skills-first technical workflow for the project so future maintenance, audits, and refactors follow the installed Vercel agent skills first and adapt the local rules around them.
- Added smarter module preloading so nearby modules and landing routes can start loading earlier when users hover or focus navigation controls.
- Added shared responsive hooks and shared map helpers so repeated viewport and geo-loading logic is more consistent across the dashboard.
- Added a dedicated runtime cache folder for backend snapshot files, making the project cleaner and reducing root-level noise.
- Added a cleaner Obsidian vault structure under `.claude/`, grouping indexes, welcome notes, templates, and agent knowledge in a more navigable layout.

## Fixes

- Improved mobile and tablet usability across the dashboard shell, SEO pages, and multiple live modules with safer spacing, better touch targets, and cleaner focus behavior.
- Fixed map side panels in the Bitcoin Nodes, Lightning Nodes, and Bitcoin Merchant modules so country lists scroll correctly on mobile/tablet and the `Data info` panel stays usable.
- Fixed the Multi-Currency Board responsive layout so the currency list scrolls properly and price/change values stay visually aligned on smaller screens.
- Fixed the footer play button so when you pause the music and press play again, it continues from where you left it instead of restarting the song from the beginning.
- Improved the logic for the bottom audio button so the bullish soundtrack is not triggered too early and now waits for a clearer bullish move.
- Hardened critical maps, charts, SVG, and canvas surfaces so external dark-mode tools, forced-color modes, and device-level recolor settings are less likely to distort the intended visual palette.
- Fixed heavy modules so they keep showing the last real payload while a refresh is happening, instead of clearing the UI and making users wait for a blank state.
- Fixed the price chart so changing ranges no longer wipes the chart before fresh real data arrives.
- Improved map-based modules so rankings and real summaries can appear before every geographic layer finishes loading.
- Reduced unnecessary no-store behavior on some live requests, improving reuse of already-fetched real data.
- Fixed the mempool usage label so it now reads more cleanly as `mempool usage` instead of `official mempool usage` in the gauge section.
- Fixed the mempool gauge responsive layout so the chart no longer crowds or overlaps the source buttons at intermediate zoom levels like 125%.
- Improved the initial dashboard shell so heavy optional player features such as donation UI and blocked-preview overlays are split more cleanly instead of inflating the first load unnecessarily.
- Fixed several active modules to use more direct icon imports and shared UI helpers, reducing repeated code and improving bundle efficiency.
- Improved the player metadata strip so its desktop, absolute, and mobile variants are now handled more clearly and consistently.
- Fixed duplicated BTC spot-price logic by centralizing shared fetching behavior for multiple preview modules.
- Improved responsive behavior across several modules by replacing repeated viewport listeners with shared hooks.
- Fixed documentation drift in internal project rules and maintenance docs so the current module structure, cache locations, and technical hierarchy are documented correctly.
- Fixed internal skill paths after the agent-folder cleanup so local Obsidian and agent references now resolve from `.claude/skills/` without broken links.
- Fixed the public README so the scraper backend is described as an internal API, uses an example base URL, and points maintainers to the reference scraper repository instead of exposing the previous provider details.

## Removed

- Removed root-level ownership of several internal agent docs by moving their canonical versions into `.claude/`, keeping legacy root files only as compatibility bridges.
- Removed the disconnected toast system that was mounted globally but had no active usage.
- Removed an unused local prefetch hook and other leftover local-only cleanup artifacts that were not part of the real product.
- Removed legacy public endpoints and generated SEO backup/report files that were no longer connected to the live app.
- Removed several unused dependencies to keep the project leaner and easier to maintain.
- Removed duplicate root agent folders by consolidating the active agent assets into `.claude/` and deleting the unused empty duplicate.
