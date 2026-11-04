# ADR 0002: Database & Query Layer - PostgreSQL with Versioned Migrations

## Context
The legacy application utilized PostgreSQL 17 with 71 relational tables alongside an embedded SQLite / in-browser localStorage fallback. For an enterprise multi-tenant supply chain and garage billing system, strong ACID guarantees, foreign key constraints, and transactional consistency are mandatory.

## Decision
Retain **PostgreSQL** as the primary relational database.
- Use versioned migration scripts in `db/migrations/` and TypeORM/Prisma schema.
- Enforce strict `timestamptz` (UTC), foreign keys, check constraints, and indexed lookup fields.
- Provide automated DB diagnostics (`/api/health`, `/api/db-status`).

## Consequences
- **Positive:** Guaranteed zero data loss during schema evolution; full compatibility with existing 71 tables.
- **Negative:** Requires PostgreSQL instance running locally (Docker or native service).

