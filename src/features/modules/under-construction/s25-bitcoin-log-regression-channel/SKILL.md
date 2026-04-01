# S25 — Log Regression Channel

## Overview
Interactive log-log regression chart showing Bitcoin's 4-year moving average price plotted against days since genesis (Jan 3, 2009). Uses a power-law model calibrated with R²=98.89%.

## Key Features
- SVG-based chart with 900x560 viewport (responsive via viewBox)
- Power-law model: log₁₀(P_4yr_ma) = 5.729 × log₁₀(days) − 17.05
- Oscillating curve around regression line modeling 4-year cycles
- Bitcoin halving markers (H1–H4) as dashed vertical lines
- Interactive hover: crosshair + tooltip showing date, days, log values, price, and deviation from model
- NOW marker showing current position
- Stats row: slope, intercept, R², days since genesis, model price

## Model Parameters
- A (slope): 5.729
- B (intercept): −17.05
- R²: 98.89%
- X axis: log₁₀(time in days), range 2.4–3.8
- Y axis: log₁₀(4yr MA price), range −4 to 5

## Status
- category: under-construction
- status: in-development
