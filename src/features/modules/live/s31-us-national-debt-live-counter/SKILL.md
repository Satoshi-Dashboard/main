---
code: S30
title: U.S. National Debt
description: Real-time U.S. national debt live counter with projected total, debt per person, rate breakdowns, and interpolated per-second accumulation
category: live
status: published
providers:
  - US Treasury
refreshSeconds: 60
---

# U.S. National Debt (S30)

## Description

The U.S. National Debt module displays the real-time projected U.S. national debt. It shows:

- **Live Hero Figure:** Projected national debt counter updating every second via interpolation
- **Since-You-Opened Delta:** Running total of debt added/reduced since the page was opened
- **Rate Per Second:** How much debt is added every second
- **Debt Per Person:** Projected national debt divided by U.S. population
- **Debt Held by the Public:** Treasury obligations held externally
- **Intragovernmental Holdings:** Treasury securities held by federal trust funds
- **Rate of Increase Cards:** Six rate cards (per second, per minute, per hour, per day, per month, per year)

## Data Sources

### National Debt Payload
- **Source:** US Treasury Fiscal Data API
- **Endpoint:** `/api/s30/national-debt`
- **Refresh Rate:** 60 seconds
- **Response shape:** `{ data: { total_debt, rate_per_second, debt_per_person, debt_held_public, intragovernmental_holdings, population, official_record_date, interpolation_window_observations, projection_base_at }, updated_at, is_fallback, fallback_note }`

### Live Tick
- **Interval:** 1 second (`setInterval` at 1000ms)
- **Purpose:** Re-project debt total using `projectCurrencyValue(total_debt, rate_per_second, base_at, now)`

## Component Structure

### Main Component: S30_USNationalDebt()

Fetches payload on mount and every 60 seconds. Applies a 1-second local tick to animate the hero figure.

### Sub-Components

#### HeroFigure({ value, animate })
- Renders `<AnimatedMetric>` in USD variant with dynamic font size based on digit count
- Font: monospace, semibold, tabular-nums, tracking tight

#### StatCard({ label, value, variant, helper, accent, featured })
- Rounded card (24px border-radius) with label, animated metric, and optional helper text
- `featured` cards use bitcoin orange label color and larger font

#### RateCard({ label, value, toneColor, animate })
- Compact card for rate-of-increase metrics
- Color dot matches current debt pressure tone

#### LoadingState()
- Skeleton placeholders for all major sections

#### ErrorState({ message, onRetry })
- Centered error card with retry button

### Data Utilities (imported from `@/shared/utils/usNationalDebt.js`)
- `buildUsDebtRateCards(model)` — builds 6 rate cards array
- `projectCurrencyValue(total, rate, baseAt, nowMs)` — interpolates current debt value
- `projectSessionDelta(rate, openedAt, nowMs)` — delta since page open
- `getDebtPressureTone(ratePerSecond)` — returns 'pressure' | 'relief' | 'neutral'

### Pressure Tone System
- `pressure`: debt increasing → red accent
- `relief`: debt decreasing → green accent
- `neutral`: stable → default text color

## Styling

- Container: `bg-[var(--bg-primary)]`, full height
- Layout: centered max-w-[1720px], responsive padding
- Cards: `rounded-[24px] border border-white/10 bg-white/[0.03]`
- Rate cards: `rounded-[22px]`
- Accent: `var(--accent-bitcoin)` for featured labels
- Fallback warning: gold border/background tint
