# Patch Notes

## New

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

## Fixes

- Fixed the footer play button so when you pause the music and press play again, it continues from where you left it instead of restarting the song from the beginning.
- Improved the logic for the bottom audio button so the bullish soundtrack is not triggered too early and now waits for a clearer bullish move.
- Hardened critical maps, charts, SVG, and canvas surfaces so external dark-mode tools, forced-color modes, and device-level recolor settings are less likely to distort the intended visual palette.
- Fixed heavy modules so they keep showing the last real payload while a refresh is happening, instead of clearing the UI and making users wait for a blank state.
- Fixed the price chart so changing ranges no longer wipes the chart before fresh real data arrives.
- Improved map-based modules so rankings and real summaries can appear before every geographic layer finishes loading.
- Reduced unnecessary no-store behavior on some live requests, improving reuse of already-fetched real data.
- Fixed the mempool usage label so it now reads more cleanly as `mempool usage` instead of `official mempool usage` in the gauge section.
- Fixed the mempool gauge responsive layout so the chart no longer crowds or overlaps the source buttons at intermediate zoom levels like 125%.

## Removed

- Nothing was removed in this update.
