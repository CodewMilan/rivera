# Rivera

An AI product-launch organization for technical founders.

**Current phase: 3 — Tools, media, and evaluation.** After a run starts, Rivera searches public sources, scores specialist output, generates Higgsfield previews, and waits for human review before anything publishes.

## Quick start

```bash
pnpm install
createdb rivera
cp .env.example .env
pnpm migrate
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), submit the demo goal, and watch the organization dashboard. Research evidence, scored tasks, and media previews appear as the run progresses.

Leave `LLM_API_KEY` empty to run in demo mode with labeled fixtures. Set it to use a live OpenAI-compatible model. Optional: `TAVILY_API_KEY`, `GITHUB_TOKEN`, and Higgsfield keys for live tools and media.

## Persistence

Postgres is required for the app (`DATABASE_URL` and `RIVERA_STORE=postgres`).

Unit tests use an in-memory store. Persistence tests talk to the real `rivera` database.
