# Rivera

An AI product-launch organization for technical founders.

**Current phase: 3. Tools, media, and evaluation.** After a run starts, Rivera searches public sources, scores specialist output, generates Higgsfield previews, and waits for human review before anything publishes.

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

Postgres is required for the app (`DATABASE_URL` and `RIVERA_STORE=postgres`). The first request migrates the schema automatically.

Unit tests use an in-memory store. Persistence tests talk to the real `rivera` database.

## Deploy

Vercel + a hosted Postgres (Neon, Supabase, or Vercel Postgres) is the default path.

1. Create a Clerk **production** application and add the deploy domain.
2. Create a Postgres database and copy the **pooled** connection string into `DATABASE_URL`. Use `sslmode=require` (Neon/Supabase already do).
3. Import the project in Vercel, set the env vars from `.env.example`, and deploy. `pnpm build` is the build command; `RIVERA_STORE=postgres` should stay set.
4. After the first deploy, set `APP_URL` (and optionally `HIGGSFIELD_WEBHOOK_URL`) to the production origin so Higgsfield callbacks reach `/api/webhooks/higgsfield`.
5. Hit `/api/health`. It should report `store: postgres` and `database: ok`.

Long Rivera runs need a **Vercel Pro** function limit (route `maxDuration` is 300s). Hobby plans will cut live LLM runs short; POST `/api/organizations/:id/runs` again to resume a non-terminal run.

Self-host with the included `Dockerfile` if you need the full 15-minute orchestrator window:

```bash
docker build -t rivera .
docker run --env-file .env -p 3000:3000 rivera
```

Do not commit `.env` or Clerk secret keys. Production must set `DATABASE_URL`; the in-memory store is rejected unless `ALLOW_MEMORY_STORE=true`.
