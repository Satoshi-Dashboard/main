# Patch Notes

## New

- Added stronger security improvements across the project so the app behaves in a safer and more reliable way during normal use and deployment.
- Added local music to the play button in the bottom footer, so it now uses the project's own audio files instead of external YouTube links.
- Added automatic music mood switching based on Bitcoin 24h performance:
- Bullish music plays when Bitcoin is up **4% or more** in 24 hours.
- Bearish music plays when Bitcoin is down **2% or more** in 24 hours.
- Sideways music plays when the market stays between those two ranges.

## Fixes

- Fixed the footer play button so when you pause the music and press play again, it continues from where you left it instead of restarting the song from the beginning.
- Improved the logic for the bottom audio button so the bullish soundtrack is not triggered too early and now waits for a clearer bullish move.
- Hardened critical maps, charts, SVG, and canvas surfaces so external dark-mode tools, forced-color modes, and device-level recolor settings are less likely to distort the intended visual palette.

## Removed

- Nothing was removed in this update.
