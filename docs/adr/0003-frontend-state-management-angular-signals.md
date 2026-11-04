# ADR 0003: Frontend Architecture & State Management - Angular Standalone & Signals

## Context
The legacy application was a vanilla JavaScript single-page application using hash routing (`window.location.hash`) and global `window.State` / `window.DB` event emitters with template literals. This resulted in large, monolithic JS files (e.g., `billing.js` > 1.4MB) with risk of DOM re-render flicker.

## Decision
Adopt **Angular** (latest stable) using:
- **Standalone components only** (zero NgModules).
- Modern control flow syntax (`@if`, `@for`, `@switch`).
- **Signals** (`signal()`, `computed()`, `effect()`) for granular, zero-overhead reactive state.
- `OnPush` change detection default across all components.
- Strict TypeScript templates.

## Consequences
- **Positive:** Compile-time type checking, elimination of full-page DOM re-renders, fast initial load with route lazy-loading.
- **Negative:** Requires disciplined component separation following the "rule of two" for shared components.

