# Frontend Color UX/UI Rules (Strict)

These rules apply to any frontend change that introduces, modifies, or reviews color usage in modules, cards, charts, labels, badges, and titles.

Source basis: analysis of the first 11 active modules in `src/config/modules.js` order:
- S01 Bitcoin Overview
- S02 Price Chart
- S03 Multi-Currency
- S04 Mempool Gauge
- S05 Long-Term Trend
- S06 (code S06) Nodes Map (`S08_NodesMap.jsx`)
- S07 (code S07) Lightning Network (`S09_LightningNetwork.jsx`)
- S08 (code S08) Stablecoin Peg Health (`S09b_StablecoinPegHealth.jsx`)
- S09 (code S09) Fear & Greed (`S10_FearGreedIndex.jsx`)
- S10 (code S10) Address Distribution (`S11_AddressDistribution.jsx`)
- S11 (code S11) Wealth Pyramid (`S15_WealthPyramid.jsx`)

## Core principle

Color can be diverse by context, but semantic meaning must stay stable:
- same purpose -> same token family
- different purpose -> different color family

## Module index preflight (mandatory)

Before applying any frontend UX/UI change that references module numbers, slugs, titles, navigation order, or module-specific copy/labels:

1. Re-read `src/config/modules.js` and confirm the live `code <-> slug <-> title` mapping.
2. Do not rely on prior chat memory for module identity/order in multi-agent workflows.
3. Verify the targeted module slug/code still match the requested module before editing.
4. Re-check mapping after edits to ensure no unintended module index/slug drift occurred.

## Responsive-first policy (mandatory)

For any new module, new UI content, new element, or update to existing frontend elements:

1. Mobile + tablet support is required by default
   - Do not ship desktop-only layouts.
   - Include responsive behavior for narrow phones, standard phones, and tablet widths.

2. Fixed navigation controls must remain reachable
   - Primary navigation actions (top bar/footer controls) should remain visible without extra scrolling in responsive views.
   - Touch targets should be finger-friendly (avoid tiny controls).

3. Hierarchy must adapt per breakpoint
   - Preserve readable typography, spacing, and visual priority by device size.
   - Prevent clipping/overflow in cards, charts, labels, and controls.

4. Acceptance criteria
   - Any frontend change is incomplete if tablet/mobile behavior is not addressed.

## Responsive typography hierarchy (mandatory)

For responsive frontend work, typography must remain readable and hierarchical across desktop, tablet, and mobile.

1. Token hierarchy usage
   - Large key values: `--fs-display`, `--fs-hero`, `--fs-title`
   - Section/value headings: `--fs-subtitle`, `--fs-section`, `--fs-heading`
   - Body/labels/metadata: `--fs-body`, `--fs-label`, `--fs-caption`, `--fs-micro`, `--fs-tag`
   - Do not bypass this hierarchy with arbitrary tiny px values unless explicitly justified.

2. Mobile minimum readability
   - Interactive controls and nav labels should stay comfortably tappable/readable.
   - Avoid tiny text that becomes hard to read on phone screens.
   - As a baseline: keep micro/meta text around ~11px+ and standard labels/body around ~12px+ in mobile contexts.

3. Breakpoint behavior
   - Preserve rank order at every breakpoint (hero > title > heading > body > label > micro/tag).
   - Prevent overlap, clipping, or visual crowding when text wraps.

4. QA requirement
   - Validate touched screens in phone + tablet widths and confirm no critical text appears too small.

## Canonical palette (do not drift)

Use root tokens from `src/index.css` as source of truth:
- Brand/identity: `--accent-bitcoin` (`#F7931A`)
- Positive/up/growth: `--accent-green` (`#00D897`)
- Negative/down/risk: `--accent-red` (`#FF4757`)
- Warning/caution: `--accent-warning` (`#FFD700`)
- Base text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Base surfaces: `--bg-primary`, `--bg-card`, `--bg-elevated`

## Semantic mapping (mandatory)

1. Module main title (`h1` or equivalent primary heading)
   - Default color: `--accent-bitcoin`
   - Must not use status colors (green/red/yellow) as default title color.

2. Section headings and static labels
   - Use `--text-primary` or `--text-secondary`
   - Use `--accent-bitcoin` only when the label is a key identity anchor, not for every text node.

3. Status/state indicators (price delta, peg health, trend arrows, badges)
   - Positive/up/healthy: green family
   - Negative/down/unhealthy: red family
   - Caution/near-threshold: yellow family

4. Neutral/inactive/loading/supporting metadata
   - Use neutral grays (`--text-secondary`, `--text-tertiary`, white alpha on dark)
   - Do not use brand orange for disabled, placeholder, or skeleton states.

5. Chart palettes
   - Contextual scales are allowed (example: red->yellow->green in sentiment, warm orange ramp in BTC concentration maps).
   - Every multicolor chart must keep a deterministic semantic order and a visible legend or obvious labeling.

## Consistency rules for titles and repeated UI patterns

1. No semantic collisions
   - Do not assign two different colors to the same title purpose across modules without explicit owner approval.

2. No role mixing
   - Do not reuse the same strong color for conflicting meanings inside one view (example: orange cannot mean both "module title" and "error").

3. Stable title system
   - Main module title color is fixed (brand orange family).
   - Dynamic states must appear in chips/badges/values, not by recoloring the module title.

4. Token-first policy
   - Prefer CSS variables/tokens over raw hex in new changes.
   - If a new semantic color appears in 2+ modules, promote it to a token.

## Findings from first 11 modules (used as baseline)

1. Existing strong consistency to keep:
   - green = positive/up/healthy
   - red = negative/down/off-peg
   - orange = BTC brand emphasis and key labels

2. Existing diversity to keep:
   - fear/greed uses full sentiment spectrum
   - mempool/wealth/maps use contextual ramps
   - stablecoin health uses tri-state semantic colors

3. Inconsistency to prevent in future changes:
   - equivalent title roles drifting between orange and neutral white without semantic reason.

## Accessibility and readability (required)

1. Contrast minimums:
   - normal text: WCAG AA target (4.5:1)
   - large text: at least 3:1

2. Color is never the only cue:
   - pair color with icon, label, sign, or pattern for critical states.

3. Mobile + desktop parity:
   - semantic colors must preserve meaning in responsive states.

## Required verification for frontend color changes

After any color UX/UI modification:

1. Confirm title color semantics remain consistent with this file.
2. Confirm green/red/yellow semantics still map to positive/negative/warning.
3. Confirm charts with multiple colors include clear semantic interpretation.
4. Run `npm run build` and verify no visual regressions in touched modules.

## New module example rules (mandatory)

When creating any new frontend module, agents must follow the project example pattern used in active modules.

1. Reuse semantic color roles from this file (do not invent new meaning-color mappings).
2. Keep a consistent module information strip using subtle metadata styling for refresh/source hints.
3. Include loading skeleton states before data is available (no hardcoded fake final values).
4. Use token-first colors (`var(--...)`) for repeated UI roles; avoid raw hex unless strongly justified.
5. Preserve title/status hierarchy:
   - title uses brand role
   - status uses semantic colors (green/red/yellow)
   - metadata uses neutral gray role
6. New modules are non-compliant if they skip this example baseline.

## Frontend language rule (mandatory)

1. All new user-facing text added to frontend must be in English.
2. Do not introduce new Spanish (or other language) labels unless the owner explicitly requests multilingual/localized behavior.
3. If updating an existing mixed-language area, new copy must still default to English unless instructed otherwise.
