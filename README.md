# Rivera

An AI product-launch organization for technical founders.

**Current phase: 1 — Foundation.** A founder can submit a goal and see a saved organization. Agents, runs, and providers are not in this phase.

## Quick start

```bash
pnpm install
createdb rivera
cp .env.example .env
pnpm migrate
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), submit the demo goal, then refresh the organization page. The record must still be there.

## Persistence

Phase 1 uses Postgres. `DATABASE_URL` and `RIVERA_STORE=postgres` are required for the app.

Unit tests use an in-memory store. Phase 1 persistence tests talk to the real `rivera` database.
