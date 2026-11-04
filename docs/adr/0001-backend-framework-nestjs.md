# ADR 0001: Backend Framework Selection - NestJS / Node.js

## Context
The legacy application utilized a custom HTTP routing layer in `server.js` (2,300+ lines). While lightweight, it lacked structured dependency injection, automated OpenAPI generation, request validation pipelines, and modular separation across Billing, Inventory, Procurement, and User Management.

## Decision
Adopt **NestJS** (with Express/Fastify HTTP adapter) as the target backend framework for `apps/api`.
- Controller -> Service -> Repository 3-tier modular architecture.
- Built-in validation pipeline via `class-validator` / `zod`.
- Native Swagger/OpenAPI documentation auto-generation at `/api/docs`.
- Compatibility layer with reverse-proxy strangler routing for incremental cutover from `legacy/server.js`.

## Consequences
- **Positive:** Type-safe DTOs shared with frontend via `packages/shared-types`. Clean unit testability with Jest.
- **Negative:** Build step required (TypeScript compilation).

