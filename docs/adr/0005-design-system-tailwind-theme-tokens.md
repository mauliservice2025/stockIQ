# ADR 0005: Design System & Styling Architecture - Tailwind CSS + CSS Variables

## Context
The legacy application utilized custom CSS with dark/light mode CSS variables (`css/variables.css`, `css/layout.css`, `css/components.css`). The goal is 100% visual parity with zero visual regression, preserving typography (Inter, JetBrains Mono), colors, borders, shadows, and layout geometry.

## Decision
Adopt **Tailwind CSS** configured with theme tokens mapping 1:1 to the legacy CSS custom properties:
- Map `--bg-app`, `--bg-card`, `--text-primary`, `--primary-500`, etc., directly into `tailwind.config.js`.
- Retain the immediate zero-flicker theme initialization (`[data-theme="dark"]` and `[data-theme="light"]`).
- Provide atomic utility styling combined with reusable UI presentational components (`shared/ui/`).
- Document all token mappings in `docs/design-tokens.md`.

## Consequences
- **Positive:** Zero visual deviation from the legacy UI; elimination of unused CSS; standard responsive utilities.
- **Negative:** Tailwind build step required during compilation.

